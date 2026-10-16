import { db } from "@/lib/store";
import { getRole } from "@/lib/session";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  // Quote, and neutralise spreadsheet formula injection.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** CSV export of orders (one row per line) for finance and operations. */
export async function GET(req: Request) {
  if ((await getRole()) !== "admin") return new Response("Forbidden", { status: 403 });
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel");
  const header = ["order_id", "created_at", "channel", "status", "payment_status", "payment_method", "emirate", "sku", "product", "qty", "unit_price", "fulfilled_by", "commission", "line_vat", "order_total", "affiliate_code", "affiliate_commission"];
  const rows = db.orders
    .filter((o) => !channel || o.channel === channel)
    .flatMap((o) =>
      o.lines.map((l) => [o.id, o.createdAt, o.channel, o.status, o.paymentStatus, o.paymentMethod, o.address.emirate, l.sku, l.name, l.qty, l.unitPrice, l.fulfilledBy, l.commission, l.vat, o.total, o.affiliateCode ?? "", o.affiliateCommission ?? ""]),
    );
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="poomas-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
