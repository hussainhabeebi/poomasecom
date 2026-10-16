import Link from "next/link";
import { Star } from "lucide-react";
import { categories } from "@/lib/store";
import { ROLES, getRole } from "@/lib/session";
import { aed } from "@/lib/format";
import type { Channel, Product } from "@/lib/types";
import { AddToCartButton, CartButton, SearchBar } from "./client-ui";
import { RoleSwitcher } from "./role-switcher";
import { ProductVisual } from "./product-visual";
import { available, unitPrice } from "@/lib/store";

const PORTAL: Record<string, { href: string; label: string }> = {
  wholesale: { href: "/wholesale", label: "Wholesale portal" },
  seller: { href: "/seller", label: "Seller hub" },
  reseller: { href: "/reseller", label: "Reseller hub" },
  affiliate: { href: "/affiliate", label: "Creator hub" },
  admin: { href: "/admin", label: "Dashboard" },
  customer: { href: "/account", label: "My orders" },
};

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="POOMAS MART home">
      <span className="ai-gradient flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black text-white shadow-md shadow-accent/20">
        P
      </span>
      <span className="text-lg font-bold tracking-tight">
        POOMAS<span className="font-light text-zinc-500"> MART</span>
      </span>
    </Link>
  );
}

export async function Header() {
  const role = await getRole();
  const portal = PORTAL[role];
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl">
      <div className="ai-gradient py-1.5 text-center text-xs font-medium text-white">
        Free next-day delivery in Dubai, Sharjah & Ajman on orders over AED 150 · Cash on delivery available
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Logo />
        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {portal && (
            <Link
              href={portal.href}
              className="hidden rounded-full bg-brand-soft px-3.5 py-2 text-sm font-medium text-brand hover:bg-violet-200/60 sm:inline-flex"
            >
              {portal.label}
            </Link>
          )}
          <RoleSwitcher current={role} roles={ROLES} />
          <CartButton />
        </nav>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>
      <div className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
        <Link href="/shop" className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium hover:bg-zinc-100">
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/shop?category=${c.slug}`}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-ink"
          >
            {c.emoji} {c.name}
          </Link>
        ))}
        <Link href="/shop?sort=price-asc&deals=1" className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:bg-pink-50">
          🔥 Deals
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  const cols = [
    { title: "Shop", links: [["All products", "/shop"], ["Deals", "/shop?deals=1"], ["Track order", "/account"], ["Bag", "/cart"]] },
    { title: "Business", links: [["Wholesale (B2B)", "/wholesale"], ["Sell on POOMAS", "/seller"], ["Dropship & resell", "/reseller"], ["Creator programme", "/affiliate"]] },
    { title: "Help", links: [["Delivery & returns", "/help"], ["Privacy", "/help#privacy"], ["Terms", "/help#terms"], ["Contact", "/help#contact"]] },
  ];
  return (
    <footer className="mt-24 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-zinc-500">
            One marketplace for UAE shoppers, retailers, sellers and creators — retail, wholesale, marketplace, dropshipping and affiliate in one place.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              {c.links.map(([l, h]) => (
                <li key={l}>
                  <Link href={h} className="hover:text-ink">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-100 py-5 text-center text-xs text-zinc-400">
        © 2026 POOMAS MART · United Arab Emirates · Prices in AED incl. 5% VAT for retail
      </div>
    </footer>
  );
}

export function ProductCard({ p, channel = "retail" }: { p: Product; channel?: Channel }) {
  const price = unitPrice(p, channel, channel === "wholesale" ? p.moq : 1);
  const stock = available(p.id);
  const off = channel === "retail" && p.compareAtPrice ? Math.round((1 - p.retailPrice / p.compareAtPrice) * 100) : 0;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-200/60">
      <Link href={`/product/${p.slug}`} className="absolute inset-0 z-10" aria-label={p.name} />
      <div className="relative">
        <ProductVisual emoji={p.emoji} tint={p.tint} image={p.image} name={p.name} className="aspect-square transition duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {off > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">-{off}%</span>}
          {p.owner !== "poomas" && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-zinc-600 backdrop-blur">Marketplace</span>
          )}
        </div>
        {stock > 0 && stock <= 10 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-orange-600 backdrop-blur">
            Only {stock} left
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500">{p.brand}</p>
        <p className="line-clamp-2 font-medium leading-snug">{p.name}</p>
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <Star className="h-3.5 w-3.5 fill-sun text-sun" />
          {p.rating || "New"} {p.reviews > 0 && <span>({p.reviews.toLocaleString()})</span>}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-lg font-semibold">{aed(price)}</p>
            {off > 0 && <p className="text-xs text-zinc-400 line-through">{aed(p.compareAtPrice!)}</p>}
            {channel === "wholesale" && <p className="text-[11px] text-zinc-500">ex-VAT · MOQ {p.moq}</p>}
            {channel === "reseller" && <p className="text-[11px] text-emerald-600">RRP {aed(p.retailPrice)}</p>}
          </div>
          <div className="relative z-20">
            <AddToCartButton productId={p.id} qty={channel === "wholesale" ? p.moq : 1} disabled={stock < (channel === "wholesale" ? p.moq : 1)} size="sm" label="Add" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="text-sm font-medium text-brand">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-zinc-500">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export function Badge({ tone = "zinc", children }: { tone?: "zinc" | "green" | "amber" | "red" | "violet" | "blue"; children: React.ReactNode }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-brand-soft text-brand",
    blue: "bg-sky-50 text-sky-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function toneFor(status: string): "zinc" | "green" | "amber" | "red" | "violet" | "blue" {
  if (["delivered", "paid", "approved", "active"].includes(status)) return "green";
  if (["cancelled", "refunded", "rejected", "failed", "suspended"].includes(status)) return "red";
  if (["pending", "cod_due", "return_requested", "open"].includes(status)) return "amber";
  if (["shipped", "packed", "quoted"].includes(status)) return "blue";
  return "violet";
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export const inputCls =
  "h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
export const btnCls =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[.98] disabled:opacity-50";
export const btnGhost =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-sm font-medium transition hover:bg-zinc-50";
