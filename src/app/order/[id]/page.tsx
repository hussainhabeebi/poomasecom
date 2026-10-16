import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { getOrder, getProduct } from "@/lib/store";
import { customerReturn } from "@/lib/actions";
import { aed, dateTime, statusLabel } from "@/lib/format";
import { Badge, toneFor } from "@/components/chrome";
import { ProductVisual } from "@/components/product-visual";
import { ClearCart } from "./clear-cart";
import { getRole } from "@/lib/session";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const STEPS = ["placed", "confirmed", "packed", "shipped", "delivered"] as const;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const isNew = (await searchParams).new === "1";
  const o = getOrder(id);
  if (!o) notFound();
  const role = await getRole();
  // Order links can be shared, so personal details only show to the buyer flow and staff.
  const showPersonal = isNew || role === "admin" || role === "customer";
  const reached = STEPS.indexOf(o.status as (typeof STEPS)[number]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {isNew && <ClearCart />}
      {isNew && (
        <div className="rise mb-8 rounded-[2rem] bg-gradient-to-br from-emerald-100 via-teal-50 to-white p-8 text-center">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Shukran! Your order is in.</h1>
          <p className="mt-2 text-zinc-600">A confirmation has been sent to {o.customerEmail}. We&apos;ll message you on WhatsApp when it&apos;s on the way.</p>
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500">Order</p>
            <p className="text-xl font-semibold">{o.id}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={toneFor(o.status)}>{statusLabel[o.status]}</Badge>
            <Badge tone={toneFor(o.paymentStatus)}>Payment: {statusLabel[o.paymentStatus]}</Badge>
          </div>
        </div>

        {reached >= 0 && (
          <ol className="mt-8 grid grid-cols-5 gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-col items-center text-center">
                <div className="flex w-full items-center">
                  <div className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : i <= reached ? "bg-brand" : "bg-zinc-200"}`} />
                  {i <= reached ? <CheckCircle2 className="h-6 w-6 text-brand" /> : <Circle className="h-6 w-6 text-zinc-300" />}
                  <div className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "opacity-0" : i < reached ? "bg-brand" : "bg-zinc-200"}`} />
                </div>
                <span className={`mt-2 text-[11px] sm:text-xs ${i <= reached ? "font-medium" : "text-zinc-400"}`}>{statusLabel[s]}</span>
              </li>
            ))}
          </ol>
        )}

        <ul className="mt-8 divide-y divide-zinc-100">
          {o.lines.map((l) => {
            const p = getProduct(l.productId);
            return (
              <li key={l.productId} className="flex items-center gap-4 py-3">
                {p && <ProductVisual emoji={p.emoji} tint={p.tint} name={p.name} size="sm" className="h-14 w-14 shrink-0 rounded-xl" emojiClassName="text-2xl" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-zinc-500">
                    {l.qty} × {aed(l.unitPrice)} {l.fulfilledBy !== "poomas" && "· ships from marketplace seller"}
                  </p>
                </div>
                <p className="text-sm font-medium">{aed(l.unitPrice * l.qty)}</p>
              </li>
            );
          })}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-zinc-100 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{aed(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount {o.promoCode && `(${o.promoCode})`}</dt><dd>−{aed(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{o.shipping ? aed(o.shipping) : "Free"}</dd></div>
          <div className="flex justify-between text-zinc-400"><dt>VAT</dt><dd>{aed(o.vat)}</dd></div>
          <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total</dt><dd>{aed(o.total)}</dd></div>
        </dl>

        <div className="mt-6 grid gap-4 rounded-2xl bg-zinc-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">Delivering to</p>
            <p className="text-zinc-600">
              {showPersonal ? (
                <>
                  {o.address.name} · {o.address.phone}
                  <br />
                  {o.address.line1}, {o.address.area}, {o.address.emirate}
                </>
              ) : (
                <>{o.address.area}, {o.address.emirate}</>
              )}
            </p>
          </div>
          <div>
            <p className="font-medium">Timeline</p>
            <ul className="text-zinc-600">
              {o.timeline.map((t, i) => (
                <li key={i}>{dateTime(t.at)} — {statusLabel[t.status]}{t.note && `: ${t.note}`}</li>
              ))}
            </ul>
          </div>
        </div>

        {o.status === "delivered" && (
          <form action={customerReturn} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="id" value={o.id} />
            <select name="reason" className="h-11 flex-1 rounded-full border border-zinc-200 bg-white px-4 text-sm" aria-label="Return reason">
              <option>Changed my mind</option>
              <option>Item damaged</option>
              <option>Wrong item received</option>
              <option>Not as described</option>
            </select>
            <button className="h-11 rounded-full border border-zinc-200 px-5 text-sm font-medium hover:bg-zinc-50">Request return</button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/shop" className="text-sm font-medium text-brand">Continue shopping →</Link>
      </div>
    </div>
  );
}
