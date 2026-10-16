import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Store, BadgeCheck, Wallet, ShieldCheck } from "lucide-react";
import { categories, commissionRateFor, db, sellerStatement, stockOf } from "@/lib/store";
import { adjustStock, sellerSubmitProduct, sellerUpdatePrice, setOrderStatus } from "@/lib/actions";
import { DEMO, getRole } from "@/lib/session";
import { aed, date, statusLabel } from "@/lib/format";
import { Badge, PageTitle, Panel, Stat, btnCls, btnGhost, inputCls, toneFor } from "@/components/chrome";
import { ProductVisual } from "@/components/product-visual";

export const metadata: Metadata = {
  title: "Sell on POOMAS MART",
  description: "Reach UAE shoppers. List products, manage stock and orders, and get transparent settlement statements.",
};

export default async function SellerPage() {
  const role = await getRole();

  if (role !== "seller") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageTitle eyebrow="POOMAS Marketplace" title="Sell to the whole UAE from one dashboard">
          Verified sellers list products, keep stock in sync and fulfil orders — we handle payments, the storefront and AI-powered discovery.
        </PageTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [BadgeCheck, "1 · Verify your business", "Trade licence & seller agreement"],
            [Store, "2 · List your catalogue", "Moderated before going live"],
            [Wallet, "3 · Get settled", "Clear statements, commission by category"],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Store;
            return (
              <div key={t as string} className="rounded-3xl bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-brand" />
                <p className="mt-4 font-semibold">{t as string}</p>
                <p className="text-sm text-zinc-500">{d as string}</p>
              </div>
            );
          })}
        </div>
        <Panel title="Commission by category" className="mt-8">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categories.map((c) => (
              <div key={c.slug} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                {c.emoji} {c.name}
                <p className="font-semibold">{Math.round(c.commissionRate * 100)}%</p>
              </div>
            ))}
          </div>
        </Panel>
        <p className="mt-6 text-center text-sm text-zinc-500">Demo tip: switch to “Marketplace seller” in the account menu to open the seller hub.</p>
      </div>
    );
  }

  const seller = db.sellers.find((s) => s.id === DEMO.sellerId)!;
  const products = db.products.filter((p) => p.owner === seller.id);
  const st = sellerStatement(seller.id);
  const orders = [...new Map(st.lines.map((l) => [l.order.id, l.order])).values()];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageTitle eyebrow="Seller hub" title={seller.name}>
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <ShieldCheck className="h-4 w-4" /> Verified seller
        </span>{" "}
        · Rating {seller.rating}★ · Since {date(seller.joinedAt)}
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Gross sales" value={aed(st.gross)} />
        <Stat label="Commission" value={aed(st.commission)} hint="Deducted per category rate" />
        <Stat label="Pending (undelivered)" value={aed(st.pending)} />
        <Stat label="Available to settle" value={aed(st.payable)} hint="After delivery & returns window" />
      </div>

      <Panel title="Orders to fulfil" className="mt-6">
        {orders.length ? (
          <ul className="divide-y divide-zinc-100">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-40 flex-1">
                  <p className="font-medium">{o.id}</p>
                  <p className="text-xs text-zinc-500">
                    {o.lines.filter((l) => l.fulfilledBy === seller.id).map((l) => `${l.qty}× ${l.name}`).join(", ")} · {o.address.emirate}
                  </p>
                </div>
                <Badge tone={toneFor(o.status)}>{statusLabel[o.status]}</Badge>
                {["placed", "confirmed", "packed"].includes(o.status) && (
                  <form action={setOrderStatus}>
                    <input type="hidden" name="id" value={o.id} />
                    <button className={btnGhost}>Mark {statusLabel[o.status === "placed" ? "confirmed" : o.status === "confirmed" ? "packed" : "shipped"].toLowerCase()}</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No orders yet.</p>
        )}
      </Panel>

      <Panel title="Your products" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2">Product</th>
                <th>Status</th>
                <th>Commission</th>
                <th>Price (AED)</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 align-middle">
                  <td className="py-3">
                    <Link href={p.status === "active" ? `/product/${p.slug}` : "#"} className="flex items-center gap-3">
                      <ProductVisual emoji={p.emoji} tint={p.tint} name={p.name} size="sm" className="h-11 w-11 shrink-0 rounded-xl" emojiClassName="text-xl" />
                      <span>
                        <span className="block font-medium">{p.name}</span>
                        <span className="text-xs text-zinc-400">{p.sku}</span>
                      </span>
                    </Link>
                  </td>
                  <td><Badge tone={toneFor(p.status)}>{statusLabel[p.status] ?? p.status}</Badge></td>
                  <td>{Math.round(commissionRateFor(p) * 100)}%</td>
                  <td>
                    <form action={sellerUpdatePrice} className="flex gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input name="price" type="number" min={1} step="0.01" defaultValue={p.retailPrice} className="h-9 w-24 rounded-xl border border-zinc-200 px-2" aria-label={`Price for ${p.name}`} />
                      <button className="rounded-xl px-2 text-xs font-medium text-brand">Save</button>
                    </form>
                  </td>
                  <td>
                    <form action={adjustStock} className="flex gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input name="onHand" type="number" min={0} defaultValue={stockOf(p.id)?.onHand} className="h-9 w-20 rounded-xl border border-zinc-200 px-2" aria-label={`Stock for ${p.name}`} />
                      <button className="rounded-xl px-2 text-xs font-medium text-brand">Update</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Submit a new product" className="mt-6">
        <form action={sellerSubmitProduct} className="grid gap-3 sm:grid-cols-3">
          <input name="name" required placeholder="Product name" className={`${inputCls} sm:col-span-2`} />
          <select name="category" required className={inputCls} aria-label="Category">
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <input name="sku" placeholder="SKU (optional)" className={inputCls} />
          <input name="price" type="number" min={1} step="0.01" required placeholder="Retail price (AED, incl. VAT)" className={inputCls} />
          <input name="stock" type="number" min={0} required placeholder="Stock on hand" className={inputCls} />
          <textarea name="description" rows={3} placeholder="Description" className={`${inputCls} h-auto py-3 sm:col-span-2`} />
          <div className="flex flex-col gap-3">
            <input name="emoji" placeholder="Icon (emoji) until photos upload" className={inputCls} />
            <button className={btnCls}>
              <CheckCircle2 className="h-4 w-4" /> Submit for review
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-zinc-500">New listings are reviewed by POOMAS before they go live.</p>
      </Panel>
    </div>
  );
}
