import type { Metadata } from "next";
import Link from "next/link";
import { Download, Lock } from "lucide-react";
import { affiliateStats, dashboardStats, db, sellerName, sellerStatement } from "@/lib/store";
import {
  adjustStock,
  answerQuote,
  decideAffiliate,
  decideSeller,
  decideWholesale,
  moderateProduct,
  payAffiliate,
  setOrderStatus,
} from "@/lib/actions";
import { getRole } from "@/lib/session";
import { aed, date, dateTime, statusLabel } from "@/lib/format";
import { Badge, PageTitle, Panel, Stat, btnGhost, inputCls, toneFor } from "@/components/chrome";
import { ProductVisual } from "@/components/product-visual";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const TABS = ["overview", "orders", "catalogue", "partners", "audit"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if ((await getRole()) !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <Lock className="mx-auto h-10 w-10 text-zinc-300" />
        <h1 className="mt-4 text-2xl font-semibold">Staff only</h1>
        <p className="mt-2 text-sm text-zinc-500">Switch to “Admin” in the account menu to open the operations console (demo).</p>
      </div>
    );
  }
  const tab: Tab = TABS.includes((await searchParams).tab as Tab) ? ((await searchParams).tab as Tab) : "overview";
  const s = dashboardStats();
  const maxRev = Math.max(...s.byChannel.map((c) => c.revenue), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageTitle eyebrow="Operations console" title="POOMAS MART Admin" />

      <nav className="no-scrollbar -mt-4 mb-8 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm sm:w-fit">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin?tab=${t}`}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium capitalize ${tab === t ? "bg-ink text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
          >
            {t}
            {t === "catalogue" && s.pendingProducts.length > 0 && <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[10px] text-white">{s.pendingProducts.length}</span>}
            {t === "partners" && s.pendingWholesale.length + s.pendingSellers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[10px] text-white">{s.pendingWholesale.length + s.pendingSellers.length}</span>
            )}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Revenue (all channels)" value={aed(s.revenue)} />
            <Stat label="Orders" value={String(s.orders)} hint={`AOV ${aed(s.aov)}`} />
            <Stat label="Marketplace GMV" value={aed(s.marketplaceGmv)} hint="Third-party seller lines" />
            <Stat label="Open returns" value={String(s.openReturns.length)} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Revenue by channel">
              <div className="space-y-3">
                {s.byChannel.map((c) => (
                  <div key={c.channel}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{c.channel}</span>
                      <span className="text-zinc-500">
                        {aed(c.revenue)} · {c.orders} {c.orders === 1 ? "order" : "orders"}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-zinc-100">
                      <div className="ai-gradient h-full rounded-full" style={{ width: `${(c.revenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Low stock alerts">
              {s.lowStock.length ? (
                <ul className="divide-y divide-zinc-100">
                  {s.lowStock.map(({ p, s: st }) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <span className="text-xl">{p.emoji}</span>
                      <span className="flex-1">
                        {p.name}
                        <span className="block text-xs text-zinc-400">{sellerName(p.owner)}</span>
                      </span>
                      <Badge tone={st.onHand === 0 ? "red" : "amber"}>{st.onHand} left</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">All products are healthy.</p>
              )}
            </Panel>
          </div>
          <Panel title="Needs attention">
            <ul className="grid gap-3 text-sm sm:grid-cols-4">
              <Todo n={s.pendingProducts.length} label="Products to moderate" href="/admin?tab=catalogue" />
              <Todo n={s.pendingWholesale.length} label="Wholesale applications" href="/admin?tab=partners" />
              <Todo n={s.pendingSellers.length} label="Seller verifications" href="/admin?tab=partners" />
              <Todo n={db.quotes.filter((q) => q.status === "open").length} label="Open RFQs" href="/admin?tab=partners" />
            </ul>
          </Panel>
        </div>
      )}

      {tab === "orders" && (
        <Panel
          title="All orders"
          action={
            <a href="/api/export" className={btnGhost}>
              <Download className="h-4 w-4" /> Export CSV
            </a>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-left text-xs text-zinc-500">
                <tr>
                  <th className="py-2">Order</th>
                  <th>Channel</th>
                  <th>Customer</th>
                  <th>Fulfilled by</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {db.orders.map((o) => (
                  <tr key={o.id} className="border-t border-zinc-100">
                    <td className="py-3">
                      <Link href={`/order/${o.id}`} className="font-medium hover:underline">{o.id}</Link>
                      <span className="block text-xs text-zinc-400">{dateTime(o.createdAt)}</span>
                    </td>
                    <td className="capitalize">{o.channel}</td>
                    <td>
                      {o.address.name}
                      <span className="block text-xs text-zinc-400">{o.address.emirate}</span>
                    </td>
                    <td className="text-xs">{[...new Set(o.lines.map((l) => sellerName(l.fulfilledBy)))].join(", ")}</td>
                    <td><Badge tone={toneFor(o.paymentStatus)}>{statusLabel[o.paymentStatus]}</Badge></td>
                    <td><Badge tone={toneFor(o.status)}>{statusLabel[o.status]}</Badge></td>
                    <td className="text-right font-medium">{aed(o.total)}</td>
                    <td className="pl-3">
                      <div className="flex justify-end gap-1">
                        {["placed", "confirmed", "packed", "shipped"].includes(o.status) && (
                          <form action={setOrderStatus}>
                            <input type="hidden" name="id" value={o.id} />
                            <button className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">Advance</button>
                          </form>
                        )}
                        {["placed", "confirmed"].includes(o.status) && (
                          <form action={setOrderStatus}>
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="to" value="cancelled" />
                            <button className="rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Cancel</button>
                          </form>
                        )}
                        {o.status === "return_requested" && (
                          <form action={setOrderStatus}>
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="to" value="refunded" />
                            <button className="rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">Refund</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "catalogue" && (
        <div className="space-y-6">
          <Panel title="Moderation queue">
            {s.pendingProducts.length ? (
              <ul className="divide-y divide-zinc-100">
                {s.pendingProducts.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                    <ProductVisual emoji={p.emoji} tint={p.tint} name={p.name} size="sm" className="h-12 w-12 rounded-xl" emojiClassName="text-2xl" />
                    <div className="min-w-48 flex-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-zinc-500">
                        {sellerName(p.owner)} · {aed(p.retailPrice)} · {p.category}
                      </p>
                    </div>
                    <form action={moderateProduct} className="flex gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <button name="decision" value="approve" className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white">Approve</button>
                      <button name="decision" value="reject" className="rounded-full px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Reject</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Nothing waiting for review.</p>
            )}
          </Panel>
          <Panel title="Inventory">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-left text-xs text-zinc-500">
                  <tr>
                    <th className="py-2">SKU</th>
                    <th>Product</th>
                    <th>Owner</th>
                    <th>Retail</th>
                    <th>Wholesale from</th>
                    <th>Reseller</th>
                    <th>Status</th>
                    <th>On hand</th>
                  </tr>
                </thead>
                <tbody>
                  {db.products.map((p) => (
                    <tr key={p.id} className="border-t border-zinc-100">
                      <td className="py-2.5 font-mono text-xs">{p.sku}</td>
                      <td>{p.emoji} {p.name}</td>
                      <td className="text-xs">{sellerName(p.owner)}</td>
                      <td>{aed(p.retailPrice)}</td>
                      <td>{p.wholesaleTiers.length ? aed(Math.min(...p.wholesaleTiers.map((t) => t.unitPrice))) : "—"}</td>
                      <td>{p.resellerPrice ? aed(p.resellerPrice) : "—"}</td>
                      <td><Badge tone={toneFor(p.status)}>{statusLabel[p.status] ?? p.status}</Badge></td>
                      <td>
                        <form action={adjustStock} className="flex gap-1">
                          <input type="hidden" name="id" value={p.id} />
                          <input name="onHand" type="number" min={0} defaultValue={db.stock.get(p.id)?.onHand} className="h-8 w-20 rounded-lg border border-zinc-200 px-2" aria-label={`Stock for ${p.name}`} />
                          <button className="text-xs font-medium text-brand">Save</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === "partners" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Wholesale accounts">
            <ul className="divide-y divide-zinc-100 text-sm">
              {db.wholesale.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex-1">
                    <span className="font-medium">{w.company}</span>
                    <span className="block text-xs text-zinc-500">{w.tradeLicence} · {w.contact} · {date(w.createdAt)}</span>
                  </span>
                  {w.status === "pending" ? (
                    <form action={decideWholesale} className="flex gap-1">
                      <input type="hidden" name="id" value={w.id} />
                      <button name="decision" value="approve" className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">Approve</button>
                      <button name="decision" value="reject" className="rounded-full px-3 py-1 text-xs text-red-600">Reject</button>
                    </form>
                  ) : (
                    <Badge tone={toneFor(w.status)}>{statusLabel[w.status]}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Marketplace sellers & settlements">
            <ul className="divide-y divide-zinc-100 text-sm">
              {db.sellers.map((sl) => {
                const st = sellerStatement(sl.id);
                return (
                  <li key={sl.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="flex-1">
                      <span className="font-medium">{sl.name}</span>
                      <span className="block text-xs text-zinc-500">
                        Gross {aed(st.gross)} · commission {aed(st.commission)} · payable {aed(st.payable)}
                      </span>
                    </span>
                    {sl.status === "pending" ? (
                      <form action={decideSeller} className="flex gap-1">
                        <input type="hidden" name="id" value={sl.id} />
                        <button name="decision" value="approve" className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">Verify</button>
                        <button name="decision" value="suspend" className="rounded-full px-3 py-1 text-xs text-red-600">Decline</button>
                      </form>
                    ) : (
                      <Badge tone={toneFor(sl.status)}>{sl.status}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Creators & commissions">
            <ul className="divide-y divide-zinc-100 text-sm">
              {db.affiliates.map((a) => {
                const st = affiliateStats(a.code);
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="flex-1">
                      <span className="font-medium">{a.name}</span> <span className="font-mono text-xs text-zinc-400">{a.code}</span>
                      <span className="block text-xs text-zinc-500">
                        {a.clicks} clicks · pending {aed(st.pending)} · approved {aed(st.approved)} · paid {aed(st.paid)}
                      </span>
                    </span>
                    {a.status === "pending" ? (
                      <form action={decideAffiliate}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">Approve</button>
                      </form>
                    ) : st.approved > 0 ? (
                      <form action={payAffiliate}>
                        <input type="hidden" name="code" value={a.code} />
                        <button className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">Mark {aed(st.approved)} paid</button>
                      </form>
                    ) : (
                      <Badge tone="green">Up to date</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Quotation requests (RFQ)">
            {db.quotes.length ? (
              <ul className="space-y-3 text-sm">
                {db.quotes.map((q) => (
                  <li key={q.id} className="rounded-2xl bg-zinc-50 p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{q.id} · {q.company}</span>
                      <Badge tone={toneFor(q.status)}>{q.status}</Badge>
                    </div>
                    <p className="mt-1 text-zinc-600">{q.items}</p>
                    {q.status === "open" ? (
                      <form action={answerQuote} className="mt-2 flex gap-2">
                        <input type="hidden" name="id" value={q.id} />
                        <input name="response" required placeholder="e.g. AED 41/unit, delivery in 3 days" className={`${inputCls} h-9`} />
                        <button className="rounded-full bg-ink px-3 text-xs font-medium text-white">Send</button>
                      </form>
                    ) : (
                      <p className="mt-1 text-emerald-700">↳ {q.response}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No quotation requests yet.</p>
            )}
          </Panel>
        </div>
      )}

      {tab === "audit" && (
        <Panel title="Audit log">
          {db.audit.length ? (
            <ul className="divide-y divide-zinc-100 font-mono text-xs">
              {db.audit.map((a, i) => (
                <li key={i} className="flex flex-wrap gap-3 py-2">
                  <span className="text-zinc-400">{dateTime(a.at)}</span>
                  <span className="w-20 text-brand">{a.actor}</span>
                  <span className="w-36 font-semibold">{a.action}</span>
                  <span className="flex-1 text-zinc-600">{a.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No admin actions recorded yet in this session.</p>
          )}
        </Panel>
      )}
    </div>
  );
}

function Todo({ n, label, href }: { n: number; label: string; href: string }) {
  return (
    <li>
      <Link href={href} className={`block rounded-2xl p-4 ${n ? "bg-amber-50" : "bg-zinc-50"}`}>
        <p className="text-2xl font-semibold">{n}</p>
        <p className="text-zinc-600">{label}</p>
      </Link>
    </li>
  );
}
