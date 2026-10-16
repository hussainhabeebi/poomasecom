import type { Metadata } from "next";
import { Building2, FileText, Layers, Truck, CheckCircle2 } from "lucide-react";
import { db, searchProducts, WHOLESALE_MIN_ORDER } from "@/lib/store";
import { applyWholesale, requestQuote } from "@/lib/actions";
import { DEMO, getRole } from "@/lib/session";
import { aed, date, statusLabel } from "@/lib/format";
import { Badge, PageTitle, Panel, ProductCard, btnCls, inputCls, toneFor } from "@/components/chrome";
import { BulkOrder } from "./bulk-order";

export const metadata: Metadata = {
  title: "Wholesale for UAE businesses",
  description: "Bulk pricing, quantity breaks, MOQ and quotations for registered UAE retailers, cafés and resellers.",
};

export default async function WholesalePage({ searchParams }: { searchParams: Promise<{ applied?: string; rfq?: string }> }) {
  const sp = await searchParams;
  const role = await getRole();
  const account = db.wholesale.find((w) => w.id === DEMO.wholesaleId)!;

  if (role !== "wholesale") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <PageTitle eyebrow="POOMAS Wholesale" title="Buy in bulk. Pay less per unit.">
          Approved UAE businesses get tiered pricing, carton quantities, quotations and reorders — from the same live stock as our retail store.
        </PageTitle>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            [Layers, "Quantity breaks", "Lower unit prices as you scale"],
            [FileText, "Quotes & invoices", "RFQs answered by our team"],
            [Truck, "Free delivery", `On orders over AED 2,000`],
            [Building2, "Credit terms", "For approved accounts only"],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Layers;
            return (
              <div key={t as string} className="rounded-3xl bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-brand" />
                <p className="mt-3 font-medium">{t as string}</p>
                <p className="text-sm text-zinc-500">{d as string}</p>
              </div>
            );
          })}
        </div>
        <Panel title="Apply for a wholesale account" className="mt-8">
          {sp.applied ? (
            <p className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" /> Application received. Our team will verify your trade licence within 1–2 working days.
            </p>
          ) : (
            <form action={applyWholesale} className="grid gap-3 sm:grid-cols-3">
              <input name="company" required placeholder="Company name" className={inputCls} />
              <input name="licence" required placeholder="Trade licence number" className={inputCls} />
              <input name="contact" required type="email" placeholder="Business email" className={inputCls} />
              <p className="text-xs text-zinc-500 sm:col-span-2">
                We&apos;ll ask for your trade licence and TRN during verification. Wholesale prices are shown ex-VAT; minimum order AED {WHOLESALE_MIN_ORDER}.
              </p>
              <button className={btnCls}>Submit application</button>
            </form>
          )}
        </Panel>
        <p className="mt-6 text-center text-sm text-zinc-500">Demo tip: switch to “Wholesale buyer” in the account menu to see the buyer portal.</p>
      </div>
    );
  }

  const products = searchProducts({ channel: "wholesale", sort: "rating" });
  const orders = db.orders.filter((o) => o.channel === "wholesale");
  const quotes = db.quotes;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageTitle eyebrow="Wholesale portal" title={account.company}>
        Approved account · Licence {account.tradeLicence} · Prices ex-VAT · Minimum order AED {WHOLESALE_MIN_ORDER}
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel title="Quick bulk order" action={<span className="text-xs text-zinc-500">Enter SKU and quantity</span>}>
          <BulkOrder products={products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, moq: p.moq, pack: p.packSize, tiers: p.wholesaleTiers }))} />
        </Panel>

        <Panel title="Request a quotation">
          {sp.rfq && <p className="mb-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">Quote request sent — we usually reply within 4 working hours.</p>}
          <form action={requestQuote} className="space-y-3">
            <input type="hidden" name="company" value={account.company} />
            <input type="hidden" name="email" value={account.contact} />
            <textarea name="items" required rows={4} placeholder="e.g. 500 × Medjool Dates 1kg, delivered to Al Quoz monthly" className={`${inputCls} h-auto py-3`} />
            <button className={`${btnCls} w-full`}>Send RFQ</button>
          </form>
          {quotes.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {quotes.slice(0, 4).map((q) => (
                <li key={q.id} className="rounded-2xl bg-zinc-50 p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{q.id}</span>
                    <Badge tone={toneFor(q.status)}>{q.status}</Badge>
                  </div>
                  <p className="mt-1 text-zinc-500">{q.items}</p>
                  {q.response && <p className="mt-1 text-emerald-700">↳ {q.response}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Order history & reorder" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2">Order</th>
                <th>Date</th>
                <th>Items</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-100">
                  <td className="py-3 font-medium">{o.id}</td>
                  <td>{date(o.createdAt)}</td>
                  <td className="max-w-xs truncate">{o.lines.map((l) => `${l.qty}× ${l.sku}`).join(", ")}</td>
                  <td><Badge tone={toneFor(o.status)}>{statusLabel[o.status]}</Badge></td>
                  <td className="text-right">{aed(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <h2 className="mt-12 text-2xl font-semibold tracking-tight">Wholesale catalogue</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} channel="wholesale" />
        ))}
      </div>
    </div>
  );
}
