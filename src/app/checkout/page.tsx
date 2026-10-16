"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CreditCard, Banknote, FileText, Lock, Loader2 } from "lucide-react";
import { checkout, type CheckoutState } from "@/lib/actions";
import { useCart } from "@/components/providers";
import { ProductVisual } from "@/components/product-visual";
import { fmt, useQuote } from "@/components/use-quote";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

const field =
  "h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function CheckoutPage() {
  const { items } = useCart();
  const [emirate, setEmirate] = useState("Dubai");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [payment, setPayment] = useState("card");
  const { quote, loading } = useQuote(items, emirate, applied);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkout, { errors: [] });

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Nothing to check out</h1>
        <Link href="/shop" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  const payments = [
    { id: "card", label: "Card", desc: "Visa, Mastercard, Apple Pay", icon: CreditCard },
    { id: "cod", label: "Cash on delivery", desc: "Pay the courier in cash or card", icon: Banknote },
    ...(quote?.channel === "wholesale" ? [{ id: "terms", label: "Account terms", desc: "Only if approved by POOMAS", icon: FileText }] : []),
  ];

  return (
    <form action={action} className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_400px]">
      <input type="hidden" name="cart" value={JSON.stringify(items)} />
      <input type="hidden" name="code" value={applied} />
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Checkout</h1>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">1 · Delivery details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input name="name" required placeholder="Full name" autoComplete="name" className={field} />
            <input name="phone" required placeholder="Mobile (+971…)" autoComplete="tel" inputMode="tel" className={field} />
            <input name="email" required type="email" placeholder="Email for receipt & tracking" autoComplete="email" className={`${field} sm:col-span-2`} />
            <select name="emirate" value={emirate} onChange={(e) => setEmirate(e.target.value)} className={field} aria-label="Emirate">
              {EMIRATES.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
            <input name="area" required placeholder="Area (e.g. JLT, Al Nahda)" className={field} />
            <input name="line1" required placeholder="Building, flat / villa number, street" autoComplete="street-address" className={`${field} sm:col-span-2`} />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Estimated delivery: <span className="font-medium text-ink">{["Dubai", "Sharjah", "Ajman"].includes(emirate) ? "Tomorrow" : "In 2–3 days"}</span>
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">2 · Payment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {payments.map((p) => (
              <label
                key={p.id}
                className={`cursor-pointer rounded-2xl border p-4 transition ${payment === p.id ? "border-brand bg-brand-soft/40 ring-4 ring-brand/10" : "border-zinc-200 hover:bg-zinc-50"}`}
              >
                <input type="radio" name="payment" value={p.id} checked={payment === p.id} onChange={() => setPayment(p.id)} className="sr-only" />
                <p.icon className="h-5 w-5 text-brand" />
                <p className="mt-2 text-sm font-medium">{p.label}</p>
                <p className="text-xs text-zinc-500">{p.desc}</p>
              </label>
            ))}
          </div>
          {payment === "card" && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
              <Lock className="h-4 w-4 shrink-0" />
              Card details are entered on the payment provider&apos;s secure page — POOMAS MART never stores card numbers. (Sandbox: payments are simulated.)
            </p>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-40">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {quote?.lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3">
                <div className="relative">
                  <ProductVisual emoji={l.emoji} tint={l.tint} name={l.name} size="sm" className="h-14 w-14 rounded-xl" emojiClassName="text-2xl" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] text-white">{l.qty}</span>
                </div>
                <p className="line-clamp-2 flex-1 text-sm">{l.name}</p>
                <p className="text-sm font-medium">{fmt(l.unitPrice * l.qty)}</p>
              </li>
            ))}
          </ul>

          {quote?.channel === "retail" && (
            <div className="mt-5 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Promo or creator code"
                aria-label="Promo code"
                className="h-11 flex-1 rounded-full border border-zinc-200 px-4 text-sm uppercase outline-none focus:border-brand"
              />
              <button type="button" onClick={() => setApplied(code)} className="h-11 rounded-full border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50">
                Apply
              </button>
            </div>
          )}

          {quote && (
            <dl className={`mt-5 space-y-2 border-t border-zinc-100 pt-4 text-sm ${loading ? "opacity-60" : ""}`}>
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{fmt(quote.subtotal)}</dd>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <dt>{quote.discountLabel}</dt>
                  <dd>−{fmt(quote.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery to {emirate}</dt>
                <dd>{quote.shipping ? fmt(quote.shipping) : "Free"}</dd>
              </div>
              <div className={`flex justify-between ${quote.channel === "wholesale" ? "" : "text-zinc-400"}`}>
                <dt>{quote.channel === "wholesale" ? "VAT 5%" : "Includes VAT 5%"}</dt>
                <dd>{fmt(quote.vat)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-3 text-lg font-semibold">
                <dt>Total</dt>
                <dd>{fmt(quote.total)}</dd>
              </div>
            </dl>
          )}

          {[...(quote?.errors ?? []), ...state.errors].length > 0 && (
            <ul className="mt-4 space-y-1 rounded-2xl bg-red-50 p-3 text-xs text-red-700" role="alert">
              {[...new Set([...(quote?.errors ?? []), ...state.errors])].map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          <button
            disabled={pending || !quote || quote.errors.length > 0}
            className="ai-gradient mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {payment === "cod" ? "Place order" : `Pay ${quote ? fmt(quote.total) : ""}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-zinc-400">
            By placing your order you agree to our <Link href="/help#terms" className="underline">terms</Link> and <Link href="/help#privacy" className="underline">privacy notice</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}
