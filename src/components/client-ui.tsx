"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ShoppingBag, Sparkles, Search, ArrowUp } from "lucide-react";
import { useAssistant, useCart } from "./providers";

export function AddToCartButton({
  productId,
  qty = 1,
  disabled,
  label = "Add to bag",
  size = "md",
}: {
  productId: string;
  qty?: number;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
}) {
  const { add, lastAdded } = useCart();
  const done = lastAdded === productId;
  const base =
    size === "sm"
      ? "h-9 px-3 text-sm rounded-full"
      : "h-12 px-6 text-base rounded-full w-full sm:w-auto";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        add(productId, qty);
      }}
      className={`${base} inline-flex items-center justify-center gap-2 font-medium transition active:scale-[.97] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${
        done ? "bg-emerald-600 text-white" : "bg-ink text-white hover:bg-zinc-800"
      }`}
    >
      {done ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {disabled ? "Out of stock" : done ? "Added" : label}
    </button>
  );
}

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Bag, ${count} items`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-zinc-100"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export function AskAIButton({
  prompt,
  children,
  className = "",
}: {
  prompt?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { ask } = useAssistant();
  return (
    <button type="button" onClick={() => ask(prompt)} className={className}>
      {children}
    </button>
  );
}

/** Header search: a regular search that can hand the query to the AI. */
export function SearchBar({ initial = "" }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const router = useRouter();
  const { ask } = useAssistant();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="group flex h-11 w-full items-center gap-2 rounded-full border border-zinc-200 bg-white pl-4 pr-1.5 shadow-sm transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"
    >
      <Search className="h-4 w-4 shrink-0 text-zinc-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search or describe what you need…"
        aria-label="Search products"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
      />
      <button
        type="button"
        onClick={() => ask(q || undefined)}
        className="ai-gradient inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white shadow-sm"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>
    </form>
  );
}

/** Large hero prompt that opens the assistant. */
export function HeroPrompt() {
  const [q, setQ] = useState("");
  const { ask } = useAssistant();
  const suggestions = [
    "Eid gift for my dad under AED 400",
    "Set up a home coffee corner",
    "Keep cool this summer",
    "Camping weekend at Al Qudra",
  ];
  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q || "What's trending this week?");
          setQ("");
        }}
        className="ai-ring flex items-center gap-2 rounded-3xl bg-white p-2 pl-5 shadow-xl shadow-brand/10"
      >
        <Sparkles className="h-5 w-5 shrink-0 text-brand" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tell POOMAS AI what you're shopping for…"
          aria-label="Ask POOMAS AI"
          className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-zinc-400 sm:text-lg"
        />
        <button
          aria-label="Ask"
          className="ai-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition hover:scale-105"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            className="rounded-full border border-white/60 bg-white/70 px-3.5 py-1.5 text-sm text-zinc-700 backdrop-blur transition hover:border-brand/30 hover:bg-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
