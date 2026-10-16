"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

// ---------------------------------------------------------------- cart

interface CartCtx {
  items: CartItem[];
  count: number;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  lastAdded: string | null;
}

const Cart = createContext<CartCtx | null>(null);
const KEY = "pm_cart_v1";

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.productId === "string" && i.qty > 0) : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const c = useContext(Cart);
  if (!c) throw new Error("useCart outside provider");
  return c;
}

// ---------------------------------------------------------------- assistant

interface AssistantCtx {
  open: boolean;
  seed: { text: string; nonce: number } | null;
  ask: (text?: string) => void;
  close: () => void;
}

const Assistant = createContext<AssistantCtx | null>(null);

export function useAssistant() {
  const c = useContext(Assistant);
  if (!c) throw new Error("useAssistant outside provider");
  return c;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage once
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — cart stays in memory */
    }
  }, [items, hydrated]);

  const add = useCallback((productId: string, qty = 1) => {
    setItems((cur) => {
      const found = cur.find((i) => i.productId === productId);
      return found
        ? cur.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i))
        : [...cur, { productId, qty }];
    });
    setLastAdded(productId);
    setTimeout(() => setLastAdded((v) => (v === productId ? null : v)), 2200);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((cur) =>
      qty <= 0 ? cur.filter((i) => i.productId !== productId) : cur.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    );
  }, []);

  const remove = useCallback((productId: string) => setItems((cur) => cur.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const cart = useMemo<CartCtx>(
    () => ({ items, count: items.reduce((s, i) => s + i.qty, 0), add, setQty, remove, clear, lastAdded }),
    [items, add, setQty, remove, clear, lastAdded],
  );

  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<AssistantCtx["seed"]>(null);
  const assistant = useMemo<AssistantCtx>(
    () => ({
      open,
      seed,
      ask: (text?: string) => {
        setOpen(true);
        if (text?.trim()) setSeed({ text: text.trim(), nonce: Date.now() });
      },
      close: () => setOpen(false),
    }),
    [open, seed],
  );

  return (
    <Cart.Provider value={cart}>
      <Assistant.Provider value={assistant}>{children}</Assistant.Provider>
    </Cart.Provider>
  );
}
