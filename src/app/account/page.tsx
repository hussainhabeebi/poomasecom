import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { db } from "@/lib/store";
import { DEMO, getRole } from "@/lib/session";
import { aed, date, statusLabel } from "@/lib/format";
import { Badge, PageTitle, Panel, btnCls, inputCls, toneFor } from "@/components/chrome";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

async function track(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "").trim().toUpperCase();
  if (id) redirect(`/order/${encodeURIComponent(id)}`);
}

export default async function AccountPage() {
  const role = await getRole();
  const mine =
    role === "customer"
      ? db.orders.filter((o) => o.channel === "retail" && [DEMO.customerEmail, "demo@poomasmart.ae"].includes(o.customerEmail))
      : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageTitle eyebrow="Account" title={role === "customer" ? "Welcome back, Aisha" : "Track an order"}>
        {role === "customer" ? "Your orders, returns and refunds in one place." : "Enter your order number from your confirmation email or WhatsApp message."}
      </PageTitle>

      <Panel title="Track an order">
        <form action={track} className="flex flex-col gap-2 sm:flex-row">
          <input name="id" placeholder="e.g. PM-10248" className={inputCls} aria-label="Order number" />
          <button className={btnCls}>Track</button>
        </form>
      </Panel>

      {role === "customer" && (
        <Panel title="Order history" className="mt-6">
          {mine.length ? (
            <ul className="divide-y divide-zinc-100">
              {mine.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.id}`} className="flex items-center gap-4 py-4 hover:bg-zinc-50/50">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100">
                      <Package className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{o.id}</p>
                      <p className="text-xs text-zinc-500">
                        {date(o.createdAt)} · {o.lines.length} item{o.lines.length > 1 && "s"}
                      </p>
                    </div>
                    <Badge tone={toneFor(o.status)}>{statusLabel[o.status]}</Badge>
                    <span className="w-24 text-right text-sm font-medium">{aed(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No orders yet.</p>
          )}
        </Panel>
      )}
    </div>
  );
}
