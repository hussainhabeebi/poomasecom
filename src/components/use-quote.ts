"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

export interface QuoteLine {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  emoji: string;
  tint: string;
  qty: number;
  unitPrice: number;
  available: number;
  moq: number;
  seller: string;
}

export interface QuoteResponse {
  channel: "retail" | "wholesale" | "reseller";
  role: string;
  subtotal: number;
  discount: number;
  discountLabel?: string;
  shipping: number;
  vat: number;
  total: number;
  errors: string[];
  lines: QuoteLine[];
}

/** Fetches authoritative pricing for the current cart from the server. */
export function useQuote(items: CartItem[], emirate = "Dubai", code = "") {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify([items, emirate, code]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items, emirate, code }),
          signal: ctrl.signal,
        });
        setQuote(await res.json());
      } catch {
        /* aborted or offline — keep the last quote */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures items/emirate/code
  }, [key]);

  return { quote, loading };
}

export const fmt = (n: number) =>
  `AED ${n.toLocaleString("en-AE", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
