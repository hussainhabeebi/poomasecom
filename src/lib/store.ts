// In-memory data store — the single source of truth for products, stock,
// prices and orders across every channel. Swap these functions for a real
// database (PostgreSQL + Prisma/Drizzle) without touching the UI: every page
// and route goes through this module.

import { affiliates, buildSeed, categories, sellers, wholesaleAccounts } from "./seed";
import type {
  Address,
  Affiliate,
  AuditEntry,
  CartItem,
  Channel,
  Emirate,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  QuoteRequest,
  Seller,
  StockRecord,
  WholesaleAccount,
} from "./types";

export const VAT_RATE = 0.05;
export const RETAIL_FREE_SHIPPING_OVER = 150;
export const WHOLESALE_MIN_ORDER = 500;

export const EMIRATES: Emirate[] = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
];

const NEAR_ZONE: Emirate[] = ["Dubai", "Sharjah", "Ajman"];

interface DB {
  products: Product[];
  stock: Map<string, StockRecord>;
  sellers: Seller[];
  affiliates: Affiliate[];
  wholesale: WholesaleAccount[];
  orders: Order[];
  quotes: QuoteRequest[];
  audit: AuditEntry[];
  seq: number;
}

function createDB(): DB {
  const { products, stock } = buildSeed();
  const db: DB = {
    products,
    stock: new Map(stock.map((s) => [s.productId, s])),
    sellers: structuredClone(sellers),
    affiliates: structuredClone(affiliates),
    wholesale: structuredClone(wholesaleAccounts),
    orders: [],
    quotes: [],
    audit: [],
    seq: 10240,
  };
  seedOrders(db);
  return db;
}

const g = globalThis as unknown as { __poomasDB?: DB };
export const db: DB = g.__poomasDB ?? (g.__poomasDB = createDB());

export { categories };

// ---------------------------------------------------------------- audit

export function audit(actor: string, action: string, detail: string) {
  db.audit.unshift({ at: new Date().toISOString(), actor, action, detail });
  if (db.audit.length > 500) db.audit.length = 500;
}

// ---------------------------------------------------------------- catalogue

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function activeProducts() {
  return db.products.filter((p) => p.status === "active");
}

export function getProduct(idOrSlug: string) {
  return db.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug || p.sku === idOrSlug);
}

export function available(productId: string) {
  const s = db.stock.get(productId);
  return s ? Math.max(0, s.onHand - s.reserved) : 0;
}

export function stockOf(productId: string) {
  return db.stock.get(productId);
}

export function sellerName(owner: string) {
  if (owner === "poomas") return "POOMAS MART";
  return db.sellers.find((s) => s.id === owner)?.name ?? owner;
}

const SYNONYMS: Record<string, string[]> = {
  gift: ["gift", "present", "eid", "birthday"],
  coffee: ["coffee", "espresso", "latte", "karak", "beans"],
  kids: ["kids", "child", "children", "son", "daughter", "toys", "baby"],
  summer: ["summer", "heat", "hot", "cooling", "sun", "beach"],
  fitness: ["fitness", "gym", "workout", "running", "yoga", "sport"],
  ramadan: ["ramadan", "iftar", "eid", "suhoor"],
  travel: ["travel", "trip", "flight", "commute", "holiday"],
  cooking: ["cooking", "kitchen", "cook", "chef", "recipe"],
  men: ["men", "man", "dad", "father", "husband", "brother", "him"],
  women: ["women", "woman", "mum", "mom", "mother", "wife", "sister", "her"],
};

export interface SearchOptions {
  q?: string;
  category?: string;
  min?: number;
  max?: number;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating" | "new";
  inStock?: boolean;
  channel?: Channel;
}

/** Parses natural phrases like "under 300", "below aed 200", "over 100". */
export function parseBudget(q: string) {
  const out: { min?: number; max?: number; rest: string } = { rest: q };
  const under = q.match(/(?:under|below|less than|max|upto|up to|<)\s*(?:aed|dhs|dh)?\s*(\d+)/i);
  const over = q.match(/(?:over|above|more than|min|>)\s*(?:aed|dhs|dh)?\s*(\d+)/i);
  if (under) {
    out.max = Number(under[1]);
    out.rest = out.rest.replace(under[0], " ");
  }
  if (over) {
    out.min = Number(over[1]);
    out.rest = out.rest.replace(over[0], " ");
  }
  return out;
}

export function searchProducts(opts: SearchOptions) {
  let list = activeProducts();
  if (opts.channel === "wholesale") list = list.filter((p) => p.wholesaleTiers.length > 0);
  if (opts.channel === "reseller") list = list.filter((p) => p.resellerPrice !== undefined);
  if (opts.category) list = list.filter((p) => p.category === opts.category);

  let { min, max } = opts;
  let terms: string[] = [];
  if (opts.q?.trim()) {
    const budget = parseBudget(opts.q);
    min ??= budget.min;
    max ??= budget.max;
    const stop = new Set(["a", "an", "the", "for", "my", "to", "and", "with", "of", "in", "aed", "i", "need", "want", "something", "some", "me", "show", "find", "looking", "is", "that", "good"]);
    terms = budget.rest
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !stop.has(t));
  }
  if (min !== undefined) list = list.filter((p) => p.retailPrice >= min!);
  if (max !== undefined) list = list.filter((p) => p.retailPrice <= max!);
  if (opts.inStock) list = list.filter((p) => available(p.id) > 0);

  const scored = list.map((p) => {
    if (!terms.length) return { p, score: 1 };
    const hay = {
      name: p.name.toLowerCase(),
      brand: p.brand.toLowerCase(),
      tags: p.tags.join(" ").toLowerCase(),
      cat: (getCategory(p.category)?.name ?? "").toLowerCase(),
      desc: p.description.toLowerCase(),
    };
    let score = 0;
    for (const t of terms) {
      const variants = new Set([t, t.replace(/s$/, "")]);
      for (const [, group] of Object.entries(SYNONYMS)) if (group.includes(t)) group.forEach((g) => variants.add(g));
      for (const v of variants) {
        if (hay.name.includes(v)) score += 6;
        if (hay.tags.includes(v)) score += 4;
        if (hay.brand.includes(v)) score += 3;
        if (hay.cat.includes(v)) score += 3;
        if (hay.desc.includes(v)) score += 1;
      }
    }
    return { p, score };
  });

  let results = scored.filter((s) => s.score > 0);
  switch (opts.sort) {
    case "price-asc":
      results.sort((a, b) => a.p.retailPrice - b.p.retailPrice);
      break;
    case "price-desc":
      results.sort((a, b) => b.p.retailPrice - a.p.retailPrice);
      break;
    case "rating":
      results.sort((a, b) => b.p.rating - a.p.rating);
      break;
    case "new":
      results.sort((a, b) => b.p.createdAt.localeCompare(a.p.createdAt));
      break;
    default:
      results = results.sort((a, b) => b.score - a.score || b.p.reviews - a.p.reviews);
  }
  return results.map((r) => r.p);
}

export function relatedProducts(p: Product, n = 4) {
  return activeProducts()
    .filter((x) => x.id !== p.id)
    .map((x) => ({
      x,
      s: (x.category === p.category ? 3 : 0) + x.tags.filter((t) => p.tags.includes(t)).length,
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((r) => r.x);
}

// ---------------------------------------------------------------- pricing

/** Unit price for a product on a channel. Wholesale uses quantity breaks. */
export function unitPrice(p: Product, channel: Channel, qty = 1) {
  if (channel === "wholesale" && p.wholesaleTiers.length) {
    const tier = [...p.wholesaleTiers].sort((a, b) => b.minQty - a.minQty).find((t) => qty >= t.minQty);
    return tier?.unitPrice ?? p.wholesaleTiers[0].unitPrice;
  }
  if (channel === "reseller" && p.resellerPrice !== undefined) return p.resellerPrice;
  return p.retailPrice;
}

export function commissionRateFor(p: Product) {
  return p.commissionRate ?? getCategory(p.category)?.commissionRate ?? 0.1;
}

export function shippingFee(channel: Channel, emirate: Emirate, subtotal: number) {
  const near = NEAR_ZONE.includes(emirate);
  if (channel === "wholesale") return subtotal >= 2000 ? 0 : near ? 50 : 75;
  if (channel === "reseller") return near ? 12 : 18;
  if (subtotal >= RETAIL_FREE_SHIPPING_OVER) return 0;
  return near ? 15 : 20;
}

export function deliveryEstimate(emirate: Emirate) {
  return NEAR_ZONE.includes(emirate) ? "Tomorrow" : "In 2–3 days";
}

const PROMOS: Record<string, { type: "pct" | "flat"; value: number; minSubtotal?: number; label: string }> = {
  WELCOME10: { type: "pct", value: 0.1, label: "10% off your first order" },
  EID25: { type: "flat", value: 25, minSubtotal: 200, label: "AED 25 off orders over AED 200" },
};

export interface Quote {
  lines: (OrderLine & { product: Product; available: number })[];
  subtotal: number;
  discount: number;
  discountLabel?: string;
  shipping: number;
  vat: number;
  total: number;
  errors: string[];
  affiliate?: Affiliate;
}

/**
 * Prices a cart server-side. Retail and reseller prices are VAT-inclusive
 * (as shown to UAE consumers); wholesale prices are quoted ex-VAT.
 */
export function quoteCart(
  items: CartItem[],
  channel: Channel,
  emirate: Emirate = "Dubai",
  code?: string,
): Quote {
  const errors: string[] = [];
  const lines: Quote["lines"] = [];
  for (const item of items) {
    const p = getProduct(item.productId);
    if (!p || p.status !== "active") {
      errors.push(`An item is no longer available.`);
      continue;
    }
    const qty = Math.max(1, Math.floor(item.qty));
    const avail = available(p.id);
    if (qty > avail) errors.push(`Only ${avail} × ${p.name} left in stock.`);
    if (channel === "wholesale") {
      if (!p.wholesaleTiers.length) errors.push(`${p.name} is not offered wholesale.`);
      else if (qty < p.moq) errors.push(`${p.name}: minimum order quantity is ${p.moq}.`);
    }
    const price = unitPrice(p, channel, qty);
    const gross = price * qty;
    const vat = channel === "wholesale" ? gross * VAT_RATE : gross - gross / (1 + VAT_RATE);
    lines.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      qty,
      unitPrice: price,
      fulfilledBy: p.owner,
      commission: p.owner === "poomas" ? 0 : round(gross * commissionRateFor(p)),
      vat: round(vat),
      product: p,
      available: avail,
    });
  }
  const subtotal = round(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
  if (channel === "wholesale" && subtotal > 0 && subtotal < WHOLESALE_MIN_ORDER)
    errors.push(`Wholesale minimum order value is AED ${WHOLESALE_MIN_ORDER}.`);

  let discount = 0;
  let discountLabel: string | undefined;
  let affiliate: Affiliate | undefined;
  const c = code?.trim().toUpperCase();
  if (c && channel === "retail") {
    const promo = PROMOS[c];
    affiliate = db.affiliates.find((a) => a.code === c && a.status === "approved");
    if (promo && (!promo.minSubtotal || subtotal >= promo.minSubtotal)) {
      discount = promo.type === "pct" ? subtotal * promo.value : promo.value;
      discountLabel = promo.label;
    } else if (promo) {
      errors.push(`${c} needs a subtotal of AED ${promo.minSubtotal}.`);
    } else if (affiliate) {
      discount = subtotal * 0.05;
      discountLabel = `5% creator code from ${affiliate.name}`;
    } else {
      errors.push(`Code ${c} is not valid.`);
    }
  }
  discount = round(Math.min(discount, subtotal));
  const emirateFee = shippingFee(channel, emirate, subtotal - discount);
  const vatLines = lines.reduce((s, l) => s + l.vat, 0);
  const vat = round(channel === "wholesale" ? (subtotal - discount + emirateFee) * VAT_RATE : vatLines * ((subtotal - discount) / (subtotal || 1)));
  const total = round(channel === "wholesale" ? subtotal - discount + emirateFee + vat : subtotal - discount + emirateFee);
  return { lines, subtotal, discount, discountLabel, shipping: emirateFee, vat, total, errors, affiliate };
}

// ---------------------------------------------------------------- orders

export interface PlaceOrderInput {
  items: CartItem[];
  channel: Channel;
  address: Address;
  paymentMethod: Order["paymentMethod"];
  code?: string;
  affiliateCookie?: string;
  resellerId?: string;
  actor: string;
}

/**
 * Places an order. Stock check and decrement happen in one synchronous block,
 * so concurrent checkouts on any channel can never oversell (brief §4).
 */
export function placeOrder(input: PlaceOrderInput): { order?: Order; errors: string[] } {
  const quote = quoteCart(input.items, input.channel, input.address.emirate, input.code);
  if (!quote.lines.length) return { errors: ["Your cart is empty."] };
  if (quote.errors.length) return { errors: quote.errors };
  if (input.channel === "retail" && input.paymentMethod === "terms")
    return { errors: ["Credit terms are only available to approved wholesale accounts."] };

  // Atomic reserve-and-commit.
  for (const l of quote.lines) if (available(l.productId) < l.qty) return { errors: [`${l.name} just sold out.`] };
  for (const l of quote.lines) db.stock.get(l.productId)!.onHand -= l.qty;

  const affiliate =
    quote.affiliate ??
    db.affiliates.find((a) => a.code === input.affiliateCookie?.toUpperCase() && a.status === "approved");

  const now = new Date().toISOString();
  const id = `PM-${++db.seq}`;
  const net = quote.subtotal - quote.discount;
  const order: Order = {
    id,
    createdAt: now,
    channel: input.channel,
    customerEmail: input.address.email,
    address: input.address,
    lines: quote.lines.map((l) => ({
      productId: l.productId,
      sku: l.sku,
      name: l.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      fulfilledBy: l.fulfilledBy,
      commission: l.commission,
      vat: l.vat,
    })),
    subtotal: quote.subtotal,
    discount: quote.discount,
    shipping: quote.shipping,
    vat: quote.vat,
    total: quote.total,
    status: "placed",
    paymentStatus: input.paymentMethod === "card" ? "paid" : input.paymentMethod === "cod" ? "cod_due" : "pending",
    paymentMethod: input.paymentMethod,
    promoCode: input.code?.toUpperCase() || undefined,
    resellerId: input.resellerId,
    timeline: [{ at: now, status: "placed" }],
  };
  if (affiliate && input.channel === "retail") {
    const suspicious = db.orders.some(
      (o) => o.customerEmail === order.customerEmail && o.affiliateCode === affiliate.code && Date.now() - Date.parse(o.createdAt) < 10 * 60_000,
    );
    order.affiliateCode = affiliate.code;
    order.affiliateCommission = round(net * affiliate.rate);
    order.affiliateStatus = suspicious ? "rejected" : "pending";
    if (suspicious) audit("system", "fraud-check", `${id}: duplicate order within 10 min for ${affiliate.code}`);
  }
  db.orders.unshift(order);
  audit(input.actor, "order.placed", `${id} · ${input.channel} · AED ${order.total}`);
  for (const l of order.lines) {
    const s = db.stock.get(l.productId)!;
    if (s.onHand <= s.lowStockAt) audit("system", "stock.low", `${l.sku} at ${s.onHand}`);
  }
  return { order, errors: [] };
}

export function getOrder(id: string) {
  return db.orders.find((o) => o.id === id);
}

const FLOW: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "delivered"];

export function advanceOrder(id: string, actor: string, to?: OrderStatus) {
  const o = getOrder(id);
  if (!o) return;
  const next = to ?? FLOW[FLOW.indexOf(o.status) + 1];
  if (!next) return;
  if (next === "cancelled" || next === "refunded") {
    // Return stock and void affiliate commission consistently.
    if (o.status !== "cancelled" && o.status !== "refunded")
      for (const l of o.lines) db.stock.get(l.productId)!.onHand += l.qty;
    if (o.affiliateStatus && o.affiliateStatus !== "paid") o.affiliateStatus = "rejected";
    if (o.paymentStatus === "paid") o.paymentStatus = "refunded";
  }
  if (next === "delivered") {
    if (o.paymentStatus === "cod_due") o.paymentStatus = "paid";
    if (o.affiliateStatus === "pending") o.affiliateStatus = "approved";
  }
  o.status = next;
  o.timeline.push({ at: new Date().toISOString(), status: next });
  audit(actor, "order.status", `${id} → ${next}`);
}

export function requestReturn(id: string, reason: string, actor: string) {
  const o = getOrder(id);
  if (!o || o.status !== "delivered") return false;
  o.status = "return_requested";
  o.timeline.push({ at: new Date().toISOString(), status: "return_requested", note: reason });
  audit(actor, "order.return", `${id}: ${reason}`);
  return true;
}

// ---------------------------------------------------------------- sellers

export function sellerStatement(sellerId: string) {
  let gross = 0,
    commission = 0,
    refunds = 0,
    pending = 0;
  const lines: { order: Order; line: OrderLine }[] = [];
  for (const o of db.orders)
    for (const l of o.lines)
      if (l.fulfilledBy === sellerId) {
        lines.push({ order: o, line: l });
        const amt = l.unitPrice * l.qty;
        if (o.status === "cancelled") continue;
        if (o.status === "refunded") {
          refunds += amt;
          continue;
        }
        gross += amt;
        commission += l.commission;
        if (o.status !== "delivered") pending += amt - l.commission;
      }
  const net = gross - commission;
  return {
    lines,
    gross: round(gross),
    commission: round(commission),
    refunds: round(refunds),
    pending: round(pending),
    payable: round(net - pending),
  };
}

// ---------------------------------------------------------------- partners

export function affiliateStats(code: string) {
  const orders = db.orders.filter((o) => o.affiliateCode === code);
  const sum = (s: Order["affiliateStatus"]) =>
    round(orders.filter((o) => o.affiliateStatus === s).reduce((a, o) => a + (o.affiliateCommission ?? 0), 0));
  return { orders, pending: sum("pending"), approved: sum("approved"), paid: sum("paid"), rejected: sum("rejected") };
}

export function trackClick(code: string) {
  const a = db.affiliates.find((x) => x.code === code.toUpperCase() && x.status === "approved");
  if (a) a.clicks++;
  return a;
}

// ---------------------------------------------------------------- reports

export function dashboardStats() {
  const live = db.orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const byChannel = (["retail", "wholesale", "reseller"] as Channel[]).map((c) => ({
    channel: c,
    revenue: round(live.filter((o) => o.channel === c).reduce((s, o) => s + o.total, 0)),
    orders: live.filter((o) => o.channel === c).length,
  }));
  const marketplaceGmv = round(
    live.flatMap((o) => o.lines).filter((l) => l.fulfilledBy !== "poomas").reduce((s, l) => s + l.unitPrice * l.qty, 0),
  );
  const lowStock = db.products
    .map((p) => ({ p, s: db.stock.get(p.id)! }))
    .filter(({ s }) => s.onHand <= s.lowStockAt)
    .sort((a, b) => a.s.onHand - b.s.onHand);
  return {
    revenue: round(live.reduce((s, o) => s + o.total, 0)),
    orders: live.length,
    aov: live.length ? round(live.reduce((s, o) => s + o.total, 0) / live.length) : 0,
    byChannel,
    marketplaceGmv,
    lowStock,
    pendingProducts: db.products.filter((p) => p.status === "pending"),
    pendingWholesale: db.wholesale.filter((w) => w.status === "pending"),
    pendingSellers: db.sellers.filter((s) => s.status === "pending"),
    openReturns: db.orders.filter((o) => o.status === "return_requested"),
  };
}

export function round(n: number) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------- demo data

function seedOrders(d: DB) {
  const mk = (
    daysAgo: number,
    channel: Channel,
    items: [string, number][],
    status: OrderStatus,
    extra: Partial<Order> = {},
  ) => {
    const lines: OrderLine[] = items.map(([pid, qty]) => {
      const p = d.products.find((x) => x.id === pid)!;
      const price = unitPrice(p, channel, qty);
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        qty,
        unitPrice: price,
        fulfilledBy: p.owner,
        commission: p.owner === "poomas" ? 0 : round(price * qty * commissionRateFor(p)),
        vat: round(channel === "wholesale" ? price * qty * VAT_RATE : price * qty - (price * qty) / 1.05),
      };
    });
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const at = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    const vat = channel === "wholesale" ? round(subtotal * VAT_RATE) : round(lines.reduce((s, l) => s + l.vat, 0));
    const o: Order = {
      id: `PM-${++d.seq}`,
      createdAt: at,
      channel,
      customerEmail: "demo@poomasmart.ae",
      address: { name: "Demo Customer", phone: "+971 50 123 4567", email: "demo@poomasmart.ae", emirate: "Dubai", area: "JLT", line1: "Cluster D, Tower 2" },
      lines,
      subtotal: round(subtotal),
      discount: 0,
      shipping: 0,
      vat,
      total: round(channel === "wholesale" ? subtotal + vat : subtotal),
      status,
      paymentStatus: status === "delivered" ? "paid" : "cod_due",
      paymentMethod: "cod",
      timeline: [{ at, status: "placed" }, ...(status !== "placed" ? [{ at, status }] : [])],
      ...extra,
    };
    const aff = d.affiliates.find((a) => a.code === o.affiliateCode);
    if (aff) o.affiliateCommission = round(o.subtotal * aff.rate);
    d.orders.unshift(o);
  };
  mk(9, "retail", [["p-001", 1], ["p-015", 2]], "delivered", { affiliateCode: "TECHWITHRAJ", affiliateStatus: "approved" });
  mk(7, "wholesale", [["p-013", 48], ["p-015", 40]], "delivered", { customerEmail: "buyer@marinaminimart.ae" });
  mk(5, "retail", [["p-004", 1], ["p-021", 1]], "delivered");
  mk(4, "retail", [["p-007", 2]], "shipped", { affiliateCode: "SARAEATS", affiliateStatus: "pending" });
  mk(3, "reseller", [["p-006", 1]], "packed", { resellerId: "r-1" });
  mk(2, "retail", [["p-010", 1], ["p-023", 2]], "confirmed");
  mk(1, "retail", [["p-012", 1]], "placed", { paymentStatus: "paid", paymentMethod: "card" });
}
