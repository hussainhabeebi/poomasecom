"use client";

import Link from "next/link";
import { Minus, Plus, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { useAssistant, useCart } from "@/components/providers";
import { ProductVisual } from "@/components/product-visual";
import { fmt, useQuote } from "@/components/use-quote";

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const { ask } = useAssistant();
  const { quote, loading } = useQuote(items);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-6xl">🛍️</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Your bag is empty</h1>
        <p className="mt-2 text-zinc-500">Not sure where to start? Tell our AI what you need.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/shop" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white">
            Browse the store
          </Link>
          <button onClick={() => ask()} className="ai-ring inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-brand" /> Ask AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your bag</h1>
      {quote && quote.channel !== "retail" && (
        <p className="mt-1 text-sm text-brand">Priced on your {quote.channel} price list</p>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-3">
          {(quote?.lines ?? []).map((l) => (
            <li key={l.productId} className="flex gap-4 rounded-3xl bg-white p-3 shadow-sm sm:p-4">
              <Link href={`/product/${l.slug}`} className="shrink-0">
                <ProductVisual emoji={l.emoji} tint={l.tint} name={l.name} size="sm" className="h-24 w-24 rounded-2xl sm:h-28 sm:w-28" emojiClassName="text-5xl" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-xs text-zinc-500">{l.brand}</p>
                <Link href={`/product/${l.slug}`} className="line-clamp-2 font-medium leading-snug hover:underline">
                  {l.name}
                </Link>
                <p className="mt-0.5 text-sm text-zinc-500">{fmt(l.unitPrice)} each</p>
                {l.qty > l.available && <p className="text-xs font-medium text-red-600">Only {l.available} available</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-zinc-200">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQty(l.productId, l.qty - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{l.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQty(l.productId, l.qty + 1)}
                      disabled={l.qty >= l.available}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{fmt(l.unitPrice * l.qty)}</span>
                    <button aria-label="Remove" onClick={() => remove(l.productId)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {loading && !quote && <li className="h-32 animate-pulse rounded-3xl bg-white" />}
        </ul>

        <aside className="h-fit space-y-4 lg:sticky lg:top-40">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Summary</h2>
            {quote && (
              <dl className={`mt-4 space-y-2 text-sm transition ${loading ? "opacity-60" : ""}`}>
                <Row k="Subtotal" v={fmt(quote.subtotal)} />
                <Row k="Delivery (Dubai)" v={quote.shipping ? fmt(quote.shipping) : "Free"} />
                <Row k={quote.channel === "wholesale" ? "VAT 5%" : "Includes VAT"} v={fmt(quote.vat)} muted={quote.channel !== "wholesale"} />
                <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{fmt(quote.total)}</dd>
                </div>
              </dl>
            )}
            {quote?.channel === "retail" && quote.subtotal < 150 && (
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div className="ai-gradient h-full" style={{ width: `${Math.min(100, (quote.subtotal / 150) * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">Add {fmt(150 - quote.subtotal)} more for free delivery</p>
              </div>
            )}
            {!!quote?.errors.length && (
              <ul className="mt-4 space-y-1 rounded-2xl bg-red-50 p-3 text-xs text-red-700">
                {quote.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <Link
              href="/checkout"
              aria-disabled={!quote || quote.errors.length > 0}
              className={`mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-medium text-white ${!quote || quote.errors.length ? "pointer-events-none opacity-40" : ""}`}
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <button
            onClick={() => ask(`I have ${quote?.lines.map((l) => l.name).join(", ")} in my bag. What goes well with these?`)}
            className="ai-ring flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left text-sm"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-brand" />
            <span>
              <span className="block font-medium">Complete the look</span>
              <span className="text-zinc-500">Ask AI what pairs well with your bag</span>
            </span>
          </button>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-zinc-400" : ""}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
