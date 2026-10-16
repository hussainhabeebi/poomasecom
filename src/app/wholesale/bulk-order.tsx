"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/providers";
import type { PriceTier } from "@/lib/types";

interface Row {
  sku: string;
  qty: number;
}

interface P {
  id: string;
  sku: string;
  name: string;
  moq: number;
  pack: number;
  tiers: PriceTier[];
}

export function BulkOrder({ products }: { products: P[] }) {
  const [rows, setRows] = useState<Row[]>([{ sku: products[0]?.sku ?? "", qty: products[0]?.moq ?? 1 }]);
  const { add } = useCart();
  const router = useRouter();
  const bySku = new Map(products.map((p) => [p.sku, p]));

  const price = (p: P, qty: number) =>
    [...p.tiers].sort((a, b) => b.minQty - a.minQty).find((t) => qty >= t.minQty)?.unitPrice ?? p.tiers[0]?.unitPrice ?? 0;

  const total = rows.reduce((s, r) => {
    const p = bySku.get(r.sku);
    return p ? s + price(p, r.qty) * r.qty : s;
  }, 0);

  return (
    <div>
      <datalist id="wholesale-skus">
        {products.map((p) => (
          <option key={p.sku} value={p.sku}>
            {p.name}
          </option>
        ))}
      </datalist>
      <div className="space-y-2">
        {rows.map((r, i) => {
          const p = bySku.get(r.sku);
          const bad = p && (r.qty < p.moq || r.qty % p.pack !== 0);
          return (
            <div key={i} className="grid grid-cols-[1fr_90px_auto] items-center gap-2 sm:grid-cols-[160px_1fr_90px_110px_auto]">
              <input
                list="wholesale-skus"
                value={r.sku}
                onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, sku: e.target.value.toUpperCase() } : x)))}
                className="h-10 rounded-xl border border-zinc-200 px-3 font-mono text-sm"
                aria-label="SKU"
              />
              <span className="hidden truncate text-sm text-zinc-600 sm:block">
                {p ? p.name : <span className="text-red-600">Unknown SKU</span>}
                {p && <span className="block text-xs text-zinc-400">MOQ {p.moq} · carton {p.pack}</span>}
              </span>
              <input
                type="number"
                min={1}
                value={r.qty}
                onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))}
                className={`h-10 rounded-xl border px-3 text-sm ${bad ? "border-amber-400" : "border-zinc-200"}`}
                aria-label="Quantity"
              />
              <span className="hidden text-right text-sm font-medium sm:block">{p ? `AED ${(price(p, r.qty) * r.qty).toLocaleString()}` : "—"}</span>
              <button onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove row" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setRows([...rows, { sku: "", qty: 1 }])} className="inline-flex items-center gap-1 text-sm font-medium text-brand">
          <Plus className="h-4 w-4" /> Add line
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Est. <span className="font-semibold">AED {total.toLocaleString()}</span> <span className="text-zinc-400">ex-VAT</span>
          </span>
          <button
            onClick={() => {
              for (const r of rows) {
                const p = bySku.get(r.sku);
                if (p && r.qty > 0) add(p.id, r.qty);
              }
              router.push("/cart");
            }}
            className="h-10 rounded-full bg-ink px-5 text-sm font-medium text-white"
          >
            Add all to bag
          </button>
        </div>
      </div>
    </div>
  );
}
