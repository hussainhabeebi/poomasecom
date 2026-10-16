import type { Metadata } from "next";
import { PackageCheck, Percent, Truck } from "lucide-react";
import { available, db, searchProducts } from "@/lib/store";
import { DEMO, getRole } from "@/lib/session";
import { aed, date, statusLabel } from "@/lib/format";
import { Badge, PageTitle, Panel, Stat, toneFor } from "@/components/chrome";
import { ProductVisual } from "@/components/product-visual";
import { AddToCartButton } from "@/components/client-ui";

export const metadata: Metadata = {
  title: "Dropship & resell",
  description: "Sell POOMAS MART products at your own margin. We pick, pack and deliver to your customers across the UAE.",
};

export default async function ResellerPage() {
  const role = await getRole();

  if (role !== "reseller") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageTitle eyebrow="POOMAS Reseller" title="Run a store without holding stock">
          Pick from our approved catalogue at reseller cost, sell at your price, and submit orders for your customers. We fulfil in neutral packaging.
        </PageTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [Percent, "Reseller pricing", "Margins of 15–30% on approved items"],
            [Truck, "We deliver", "Next-day in Dubai, Sharjah & Ajman"],
            [PackageCheck, "Live stock", "Never sell what isn't available"],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Truck;
            return (
              <div key={t as string} className="rounded-3xl bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-brand" />
                <p className="mt-4 font-semibold">{t as string}</p>
                <p className="text-sm text-zinc-500">{d as string}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-zinc-500">Demo tip: switch to “Dropshipper” in the account menu to open the reseller hub.</p>
      </div>
    );
  }

  const feed = searchProducts({ channel: "reseller", sort: "rating" });
  const orders = db.orders.filter((o) => o.resellerId === DEMO.resellerId);
  const margin = orders.reduce(
    (s, o) => s + o.lines.reduce((a, l) => a + ((db.products.find((p) => p.id === l.productId)?.retailPrice ?? l.unitPrice) - l.unitPrice) * l.qty, 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageTitle eyebrow="Reseller hub" title="ShopNow Reseller">
        Add items to your bag and check out with your customer&apos;s delivery address — we ship under neutral branding.
      </PageTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Products in your feed" value={String(feed.length)} />
        <Stat label="Orders submitted" value={String(orders.length)} />
        <Stat label="Est. margin earned" value={aed(margin)} hint="vs. recommended retail" />
        <Stat label="In fulfilment" value={String(orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status)).length)} />
      </div>

      <Panel title="Approved product feed" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2">Product</th>
                <th>Your cost</th>
                <th>RRP</th>
                <th>Margin</th>
                <th>Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {feed.map((p) => {
                const m = p.retailPrice - p.resellerPrice!;
                const stock = available(p.id);
                return (
                  <tr key={p.id} className="border-t border-zinc-100">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <ProductVisual emoji={p.emoji} tint={p.tint} name={p.name} size="sm" className="h-11 w-11 shrink-0 rounded-xl" emojiClassName="text-xl" />
                        <span>
                          <span className="block font-medium">{p.name}</span>
                          <span className="text-xs text-zinc-400">{p.sku}</span>
                        </span>
                      </div>
                    </td>
                    <td className="font-medium">{aed(p.resellerPrice!)}</td>
                    <td className="text-zinc-500">{aed(p.retailPrice)}</td>
                    <td className="text-emerald-700">
                      {aed(m)} <span className="text-xs">({Math.round((m / p.retailPrice) * 100)}%)</span>
                    </td>
                    <td className={stock ? "" : "text-red-600"}>{stock || "Out"}</td>
                    <td className="text-right">
                      <AddToCartButton productId={p.id} disabled={!stock} size="sm" label="Add" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Submitted orders" className="mt-6">
        {orders.length ? (
          <ul className="divide-y divide-zinc-100 text-sm">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-28 font-medium">{o.id}</span>
                <span className="flex-1 text-zinc-500">
                  {date(o.createdAt)} · {o.address.name}, {o.address.emirate}
                </span>
                <Badge tone={toneFor(o.status)}>{statusLabel[o.status]}</Badge>
                <span className="w-24 text-right">{aed(o.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No orders yet.</p>
        )}
      </Panel>
      <p className="mt-4 text-xs text-zinc-500">
        Customer service, returns and failed deliveries for reseller orders follow the reseller agreement. Live supplier API integrations are added per supplier once access is confirmed.
      </p>
    </div>
  );
}
