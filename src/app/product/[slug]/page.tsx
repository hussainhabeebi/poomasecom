import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Package, RotateCcw, Sparkles, Star, Truck } from "lucide-react";
import {
  EMIRATES,
  available,
  deliveryEstimate,
  getCategory,
  getProduct,
  relatedProducts,
  sellerName,
  unitPrice,
} from "@/lib/store";
import { channelFor, getRole } from "@/lib/session";
import { aed } from "@/lib/format";
import { ProductCard } from "@/components/chrome";
import { ProductVisual } from "@/components/product-visual";
import { AddToCartButton, AskAIButton } from "@/components/client-ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return { title: "Not found" };
  return {
    title: `${p.name} — ${aed(p.retailPrice)}`,
    description: p.description,
    alternates: { canonical: `/product/${p.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p || p.status !== "active") notFound();
  const role = await getRole();
  const channel = channelFor(role);
  const stock = available(p.id);
  const cat = getCategory(p.category);
  const minQty = channel === "wholesale" ? p.moq : 1;
  const price = unitPrice(p, channel, minQty);
  const off = channel === "retail" && p.compareAtPrice ? Math.round((1 - p.retailPrice / p.compareAtPrice) * 100) : 0;
  const related = relatedProducts(p);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    brand: { "@type": "Brand", name: p.brand },
    description: p.description,
    aggregateRating: p.reviews ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "AED",
      price: p.retailPrice,
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <p className="text-sm text-zinc-500">
        <Link href="/shop" className="hover:text-ink">Shop</Link> /{" "}
        <Link href={`/shop?category=${p.category}`} className="hover:text-ink">{cat?.name}</Link>
      </p>

      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-40 lg:self-start">
          <ProductVisual emoji={p.emoji} tint={p.tint} image={p.image} name={p.name} size="lg" className="aspect-square rounded-[2.5rem]" />
        </div>

        <div>
          <p className="text-sm font-medium text-brand">{p.brand}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-sun text-sun" />
              <span className="font-medium text-ink">{p.rating || "New"}</span>
              {p.reviews > 0 && <>({p.reviews.toLocaleString()} reviews)</>}
            </span>
            <span>·</span>
            <span>SKU {p.sku}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <BadgeCheck className="h-4 w-4 text-emerald-600" /> Sold by {sellerName(p.owner)}
            </span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-semibold tracking-tight">{aed(price)}</span>
            {off > 0 && (
              <>
                <span className="pb-1 text-lg text-zinc-400 line-through">{aed(p.compareAtPrice!)}</span>
                <span className="mb-1.5 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">Save {off}%</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {channel === "wholesale" ? "Wholesale unit price, excl. 5% VAT" : "Inclusive of 5% VAT"}
            {channel === "reseller" && <> · Recommended retail {aed(p.retailPrice)} · your margin {aed(p.retailPrice - price)}</>}
          </p>

          {channel === "wholesale" && p.wholesaleTiers.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="grid grid-cols-3 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-500">
                <span>Quantity</span>
                <span>Unit price</span>
                <span>Pack</span>
              </div>
              {p.wholesaleTiers.map((t) => (
                <div key={t.minQty} className="grid grid-cols-3 border-t border-zinc-100 px-4 py-2.5 text-sm">
                  <span>{t.minQty}+ units</span>
                  <span className="font-medium">{aed(t.unitPrice)}</span>
                  <span className="text-zinc-500">{p.packSize}/carton</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 leading-relaxed text-zinc-700">{p.description}</p>
          <ul className="mt-5 grid grid-cols-2 gap-2">
            {p.highlights.map((h) => (
              <li key={h} className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton productId={p.id} qty={minQty} disabled={stock < minQty} label={minQty > 1 ? `Add ${minQty} to bag` : "Add to bag"} />
            <AskAIButton
              prompt={`Tell me about the ${p.name} — is it right for me, and what are the alternatives?`}
              className="ai-ring inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-medium"
            >
              <Sparkles className="h-4 w-4 text-brand" /> Ask AI about this
            </AskAIButton>
          </div>
          <p className={`mt-3 text-sm font-medium ${stock === 0 ? "text-red-600" : stock <= 10 ? "text-orange-600" : "text-emerald-600"}`}>
            {stock === 0 ? "Out of stock — ask AI for alternatives" : stock <= 10 ? `Hurry, only ${stock} left` : "In stock, ready to ship"}
          </p>

          <div className="mt-8 divide-y divide-zinc-100 rounded-3xl bg-white shadow-sm">
            <div className="flex gap-4 p-5">
              <Truck className="h-5 w-5 shrink-0 text-brand" />
              <div className="text-sm">
                <p className="font-medium">Delivery across the UAE</p>
                <div className="mt-2 grid gap-x-10 gap-y-1 text-zinc-500 sm:grid-cols-2">
                  {EMIRATES.map((e) => (
                    <span key={e} className="flex justify-between gap-2">
                      {e} <span className="text-ink">{deliveryEstimate(e)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 p-5 text-sm">
              <RotateCcw className="h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="font-medium">14-day returns</p>
                <p className="text-zinc-500">Unused items in original packaging. Refunds to your original payment method.</p>
              </div>
            </div>
            <div className="flex gap-4 p-5 text-sm">
              <Package className="h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="font-medium">Cash on delivery or card</p>
                <p className="text-zinc-500">Pay securely online or when your order arrives.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">You might also like</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} channel={channel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
