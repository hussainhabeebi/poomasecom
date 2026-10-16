"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  advanceOrder,
  audit,
  db,
  getOrder,
  getProduct,
  placeOrder,
  requestReturn,
} from "./store";
import { DEMO, ROLES, channelFor, getRole } from "./session";
import type { CartItem, Emirate, OrderStatus, Role } from "./types";

async function requireRole(...allowed: Role[]) {
  const role = await getRole();
  if (!allowed.includes(role)) throw new Error(`Not permitted for role ${role}`);
  return role;
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(f.get(k) ?? 0);

// ------------------------------------------------------------ identity

export async function switchRole(formData: FormData) {
  const role = str(formData, "role") as Role;
  if (!ROLES.some((r) => r.role === role)) return;
  (await cookies()).set("pm_role", role, { path: "/", sameSite: "lax", httpOnly: true });
  const homes: Partial<Record<Role, string>> = {
    wholesale: "/wholesale",
    seller: "/seller",
    reseller: "/reseller",
    affiliate: "/affiliate",
    admin: "/admin",
    customer: "/account",
  };
  const from = str(formData, "redirect");
  const portals = ["/wholesale", "/seller", "/reseller", "/affiliate", "/admin", "/account"];
  revalidatePath("/", "layout");
  redirect(homes[role] ?? (from.startsWith("/") && !portals.includes(from) ? from : "/"));
}

// ------------------------------------------------------------ checkout

export interface CheckoutState {
  errors: string[];
}

export async function checkout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const role = await getRole();
  let items: CartItem[] = [];
  try {
    items = JSON.parse(str(formData, "cart"));
  } catch {
    return { errors: ["Could not read your cart."] };
  }
  const address = {
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    emirate: str(formData, "emirate") as Emirate,
    area: str(formData, "area"),
    line1: str(formData, "line1"),
  };
  const missing = Object.entries(address).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { errors: [`Please fill in: ${missing.join(", ")}.`] };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address.email)) return { errors: ["Please enter a valid email."] };

  const channel = channelFor(role);
  const { order, errors } = placeOrder({
    items,
    channel,
    address,
    paymentMethod: (str(formData, "payment") || "card") as "card" | "cod" | "terms",
    code: str(formData, "code") || undefined,
    affiliateCookie: (await cookies()).get("pm_ref")?.value,
    resellerId: role === "reseller" ? DEMO.resellerId : undefined,
    actor: role,
  });
  if (!order) return { errors };
  revalidatePath("/", "layout");
  redirect(`/order/${order.id}?new=1`);
}

export async function customerReturn(formData: FormData) {
  await requireRole("customer", "guest", "admin");
  requestReturn(str(formData, "id"), str(formData, "reason") || "Changed my mind", "customer");
  revalidatePath(`/order/${str(formData, "id")}`);
}

// ------------------------------------------------------------ admin / operations

export async function setOrderStatus(formData: FormData) {
  const role = await requireRole("admin", "seller");
  const id = str(formData, "id");
  const to = (str(formData, "to") || undefined) as OrderStatus | undefined;
  const o = getOrder(id);
  if (role === "seller" && !o?.lines.some((l) => l.fulfilledBy === DEMO.sellerId)) return;
  if (role === "seller" && to && !["confirmed", "packed", "shipped"].includes(to)) return;
  advanceOrder(id, role, to);
  revalidatePath("/", "layout");
}

export async function moderateProduct(formData: FormData) {
  await requireRole("admin");
  const p = getProduct(str(formData, "id"));
  if (!p) return;
  p.status = str(formData, "decision") === "approve" ? "active" : "rejected";
  audit("admin", "product.moderate", `${p.sku} → ${p.status}`);
  revalidatePath("/", "layout");
}

export async function decideWholesale(formData: FormData) {
  await requireRole("admin");
  const w = db.wholesale.find((x) => x.id === str(formData, "id"));
  if (!w) return;
  w.status = str(formData, "decision") === "approve" ? "approved" : "rejected";
  audit("admin", "wholesale.decide", `${w.company} → ${w.status}`);
  revalidatePath("/admin");
}

export async function decideSeller(formData: FormData) {
  await requireRole("admin");
  const s = db.sellers.find((x) => x.id === str(formData, "id"));
  if (!s) return;
  s.status = str(formData, "decision") === "approve" ? "approved" : "suspended";
  audit("admin", "seller.decide", `${s.name} → ${s.status}`);
  revalidatePath("/admin");
}

export async function adjustStock(formData: FormData) {
  const role = await requireRole("admin", "seller");
  const p = getProduct(str(formData, "id"));
  const rec = p && db.stock.get(p.id);
  if (!p || !rec) return;
  if (role === "seller" && p.owner !== DEMO.sellerId) return;
  const next = Math.max(0, Math.floor(num(formData, "onHand")));
  audit(role, "stock.adjust", `${p.sku}: ${rec.onHand} → ${next}`);
  rec.onHand = next;
  revalidatePath("/", "layout");
}

export async function payAffiliate(formData: FormData) {
  await requireRole("admin");
  const code = str(formData, "code");
  let n = 0;
  for (const o of db.orders)
    if (o.affiliateCode === code && o.affiliateStatus === "approved") {
      o.affiliateStatus = "paid";
      n++;
    }
  audit("admin", "affiliate.payout", `${code}: ${n} commissions marked paid`);
  revalidatePath("/admin");
}

export async function answerQuote(formData: FormData) {
  await requireRole("admin");
  const q = db.quotes.find((x) => x.id === str(formData, "id"));
  if (!q) return;
  q.response = str(formData, "response");
  q.status = "quoted";
  audit("admin", "quote.respond", q.id);
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------ marketplace seller

export async function sellerSubmitProduct(formData: FormData) {
  await requireRole("seller");
  const name = str(formData, "name");
  const price = num(formData, "price");
  const category = str(formData, "category");
  if (!name || !(price > 0) || !category) return;
  const id = `p-${String(db.products.length + 1).padStart(3, "0")}`;
  db.products.push({
    id,
    sku: str(formData, "sku") || `AN-${Date.now().toString(36).toUpperCase()}`,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`,
    name,
    brand: db.sellers.find((s) => s.id === DEMO.sellerId)!.name,
    category,
    description: str(formData, "description") || name,
    highlights: [],
    tags: name.toLowerCase().split(/\s+/),
    emoji: str(formData, "emoji") || "📦",
    tint: "from-slate-200 via-zinc-100 to-stone-100",
    owner: DEMO.sellerId,
    status: "pending",
    retailPrice: price,
    wholesaleTiers: [],
    moq: 1,
    packSize: 1,
    rating: 0,
    reviews: 0,
    createdAt: new Date().toISOString(),
  });
  db.stock.set(id, { productId: id, onHand: Math.max(0, Math.floor(num(formData, "stock"))), reserved: 0, lowStockAt: 5 });
  audit("seller", "product.submit", `${name} awaiting moderation`);
  revalidatePath("/seller");
}

export async function sellerUpdatePrice(formData: FormData) {
  await requireRole("seller");
  const p = getProduct(str(formData, "id"));
  const price = num(formData, "price");
  if (!p || p.owner !== DEMO.sellerId || !(price > 0)) return;
  audit("seller", "price.change", `${p.sku}: ${p.retailPrice} → ${price}`);
  p.retailPrice = price;
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------ wholesale

export async function applyWholesale(formData: FormData) {
  const company = str(formData, "company");
  const licence = str(formData, "licence");
  const contact = str(formData, "contact");
  if (!company || !licence || !contact) return;
  db.wholesale.push({
    id: `w-${db.wholesale.length + 1}`,
    company,
    tradeLicence: licence,
    contact,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  audit("public", "wholesale.apply", company);
  redirect("/wholesale?applied=1");
}

export async function requestQuote(formData: FormData) {
  const items = str(formData, "items");
  if (!items) return;
  db.quotes.unshift({
    id: `RFQ-${1000 + db.quotes.length + 1}`,
    company: str(formData, "company") || "Marina Mini Mart",
    email: str(formData, "email") || "buyer@marinaminimart.ae",
    items,
    status: "open",
    createdAt: new Date().toISOString(),
  });
  audit("wholesale", "quote.request", items.slice(0, 60));
  redirect("/wholesale?rfq=1");
}

// ------------------------------------------------------------ affiliate

export async function applyCreator(formData: FormData) {
  const name = str(formData, "name");
  const code = str(formData, "code").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!name || code.length < 4 || db.affiliates.some((a) => a.code === code)) redirect("/affiliate?error=1");
  db.affiliates.push({ id: `a-${db.affiliates.length + 1}`, code, name, status: "pending", rate: 0.05, clicks: 0, windowDays: 30 });
  audit("public", "affiliate.apply", `${name} (${code})`);
  redirect("/affiliate?applied=1");
}

export async function decideAffiliate(formData: FormData) {
  await requireRole("admin");
  const a = db.affiliates.find((x) => x.id === str(formData, "id"));
  if (!a) return;
  a.status = "approved";
  audit("admin", "affiliate.approve", a.code);
  revalidatePath("/admin");
}
