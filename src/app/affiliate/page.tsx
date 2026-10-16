import type { Metadata } from "next";
import { CheckCircle2, Link2, MousePointerClick, ShoppingCart, Wallet } from "lucide-react";
import { affiliateStats, db, getProduct } from "@/lib/store";
import { applyCreator } from "@/lib/actions";
import { DEMO, getRole } from "@/lib/session";
import { aed, date, statusLabel } from "@/lib/format";
import { Badge, PageTitle, Panel, Stat, btnCls, inputCls, toneFor } from "@/components/chrome";
import { CopyField } from "./copy-field";

export const metadata: Metadata = {
  title: "Creator & affiliate programme",
  description: "Bloggers and creators earn commission on every order from their POOMAS MART link or code.",
};

export default async function AffiliatePage({ searchParams }: { searchParams: Promise<{ applied?: string; error?: string }> }) {
  const sp = await searchParams;
  const role = await getRole();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (role !== "affiliate") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageTitle eyebrow="POOMAS Creators" title="Turn your recommendations into income">
          Share a personal link or discount code. Your followers save 5%, you earn up to 6% on every attributed order.
        </PageTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [Link2, "Share", "Links & codes for any product"],
            [ShoppingCart, "They shop", "30-day attribution window"],
            [Wallet, "You earn", "Paid monthly after the returns window"],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Link2;
            return (
              <div key={t as string} className="rounded-3xl bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-brand" />
                <p className="mt-4 font-semibold">{t as string}</p>
                <p className="text-sm text-zinc-500">{d as string}</p>
              </div>
            );
          })}
        </div>
        <Panel title="Apply to join" className="mt-8">
          {sp.applied ? (
            <p className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" /> Thanks! We review applications within 3 working days.
            </p>
          ) : (
            <form action={applyCreator} className="grid gap-3 sm:grid-cols-3">
              <input name="name" required placeholder="Your name or channel" className={inputCls} />
              <input name="code" required minLength={4} placeholder="Preferred code, e.g. SARAEATS" className={`${inputCls} uppercase`} />
              <button className={btnCls}>Apply</button>
              {sp.error && <p className="text-sm text-red-600 sm:col-span-3">That code is taken or too short — try another.</p>}
            </form>
          )}
        </Panel>
        <p className="mt-6 text-center text-sm text-zinc-500">Demo tip: switch to “Creator / affiliate” in the account menu to open the creator hub.</p>
      </div>
    );
  }

  const me = db.affiliates.find((a) => a.code === DEMO.affiliateCode)!;
  const s = affiliateStats(me.code);
  const conv = me.clicks ? ((s.orders.length / me.clicks) * 100).toFixed(1) : "0";
  const featured = ["p-007", "p-005", "p-015", "p-016"].map((id) => getProduct(id)!).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageTitle eyebrow="Creator hub" title={me.name}>
        Code <span className="font-mono font-semibold text-ink">{me.code}</span> · {Math.round(me.rate * 100)}% commission · {me.windowDays}-day attribution
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Link clicks" value={me.clicks.toLocaleString()} hint={`${conv}% conversion`} />
        <Stat label="Pending" value={aed(s.pending)} hint="Awaiting delivery" />
        <Stat label="Approved" value={aed(s.approved)} hint="Next payout" />
        <Stat label="Paid to date" value={aed(s.paid)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Your links">
          <div className="space-y-3">
            <CopyField label="Store link" value={`${base}/r/${me.code}`} />
            {featured.map((p) => (
              <CopyField key={p.id} label={p.name} value={`${base}/r/${me.code}?to=/product/${p.slug}`} />
            ))}
          </div>
        </Panel>
        <Panel title="Attributed orders">
          {s.orders.length ? (
            <ul className="divide-y divide-zinc-100 text-sm">
              {s.orders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-3">
                  <MousePointerClick className="h-4 w-4 text-zinc-400" />
                  <span className="flex-1">
                    {o.id} <span className="text-zinc-400">· {date(o.createdAt)}</span>
                  </span>
                  <Badge tone={toneFor(o.affiliateStatus ?? "pending")}>{statusLabel[o.affiliateStatus ?? "pending"]}</Badge>
                  <span className="w-20 text-right font-medium">{aed(o.affiliateCommission ?? 0)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No orders yet — share your link to get started.</p>
          )}
          <p className="mt-4 text-xs text-zinc-500">
            Commission becomes approved once an order is delivered; cancelled, refunded or self-referred orders are rejected automatically.
          </p>
        </Panel>
      </div>
    </div>
  );
}
