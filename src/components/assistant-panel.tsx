"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, Star, X, RotateCcw } from "lucide-react";
import type { AssistantProduct } from "@/app/api/assistant/route";
import { useAssistant, useCart } from "./providers";
import { ProductVisual } from "./product-visual";

interface Msg {
  role: "user" | "assistant";
  content: string;
  products?: AssistantProduct[];
}

const STARTERS = [
  "What are today's best deals?",
  "Gift ideas for a 10-year-old who loves science",
  "Compare your headphones and smartwatch",
  "How fast is delivery to Abu Dhabi?",
];

export function AssistantPanel() {
  const { open, close, seed, ask } = useAssistant();
  const { add, lastAdded } = useCart();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handled = useRef<number | null>(null);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong.", products: data.products ?? [] },
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "I couldn't connect just now — please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (seed && handled.current !== seed.nonce) {
      handled.current = seed.nonce;
      void send(seed.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per seed
  }, [seed]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      {!open && (
        <button
          onClick={() => ask()}
          className="ai-gradient fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full pl-4 pr-5 font-semibold text-white shadow-2xl shadow-accent/30 transition hover:scale-105"
        >
          <Sparkles className="h-5 w-5" />
          Ask POOMAS AI
        </button>
      )}

      <div
        aria-hidden={!open}
        onClick={close}
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-label="POOMAS AI shopping assistant"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 sm:rounded-l-3xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="ai-gradient flex h-10 w-10 items-center justify-center rounded-2xl text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold leading-tight">POOMAS AI</p>
            <p className="text-xs text-zinc-500">Your personal shopping concierge</p>
          </div>
          {msgs.length > 0 && (
            <button onClick={() => setMsgs([])} aria-label="New chat" className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button onClick={close} aria-label="Close assistant" className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {msgs.length === 0 && (
            <div className="rise">
              <h2 className="text-2xl font-semibold tracking-tight">
                Marhaba! <span className="ai-text">What can I find for you?</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Describe an occasion, a budget or a problem — I’ll search the whole store, compare options and check delivery.
              </p>
              <div className="mt-5 grid gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm transition hover:border-brand/40 hover:bg-brand-soft/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="rise flex justify-end">
                <p className="max-w-[85%] rounded-3xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-white">{m.content}</p>
              </div>
            ) : (
              <div key={i} className="rise space-y-3">
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-800">{m.content}</p>
                {!!m.products?.length && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {m.products.map((p) => (
                      <div key={p.id} className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
                        <Link href={`/product/${p.slug}`} onClick={close}>
                          <ProductVisual emoji={p.emoji} tint={p.tint} name={p.name} size="sm" className="aspect-[4/3]" emojiClassName="text-5xl" />
                          <div className="px-3 pt-2">
                            <p className="line-clamp-2 text-xs font-medium leading-snug">{p.name}</p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
                              <Star className="h-3 w-3 fill-sun text-sun" /> {p.rating}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center justify-between px-3 pb-3 pt-1.5">
                          <span className="text-sm font-semibold">AED {p.price}</span>
                          <button
                            disabled={!p.inStock}
                            onClick={() => add(p.id)}
                            className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white disabled:bg-zinc-200 disabled:text-zinc-500"
                          >
                            {!p.inStock ? "Sold out" : lastAdded === p.id ? "Added ✓" : "Add"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}

          {busy && (
            <div className="flex items-center gap-1.5 text-brand" aria-live="polite" aria-label="Thinking">
              <span className="dot h-2 w-2 rounded-full bg-current" />
              <span className="dot h-2 w-2 rounded-full bg-current" />
              <span className="dot h-2 w-2 rounded-full bg-current" />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-zinc-100 p-4"
        >
          <div className="ai-ring flex items-end gap-2 rounded-3xl bg-zinc-50 p-2 pl-4">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask anything about products…"
              aria-label="Message POOMAS AI"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
            />
            <button
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="ai-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-400">AI suggestions can be imperfect — check details before buying.</p>
        </form>
      </aside>
    </>
  );
}
