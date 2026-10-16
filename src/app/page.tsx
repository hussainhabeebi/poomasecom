import Link from "next/link";
import { ArrowRight, Building2, Store, Truck, Megaphone, ShieldCheck, Zap, Wallet } from "lucide-react";
import { activeProducts, categories, searchProducts } from "@/lib/store";
import { channelFor, getRole } from "@/lib/session";
import { ProductCard } from "@/components/chrome";
import { AskAIButton, HeroPrompt } from "@/components/client-ui";

const COLLECTIONS = [
  { title: "The Eid gifting edit", prompt: "Eid gift ideas for family", q: "gift eid", emoji: "🎁", tint: "from-amber-200 to-rose-200" },
  { title: "Beat the heat", prompt: "Help me stay cool this summer", q: "summer", emoji: "🌞", tint: "from-sky-200 to-cyan-100" },
  { title: "Home barista", prompt: "Build me a home coffee setup", q: "coffee", emoji: "☕", tint: "from-orange-200 to-stone-200" },
  { title: "Weekend in the desert", prompt: "What do I need for a desert camping weekend?", q: "camping outdoor", emoji: "🏜️", tint: "from-orange-200 to-lime-100" },
];

export default async function Home() {
  const channel = channelFor(await getRole());
  const all = activeProducts();
  const trending = [...all].sort((a, b) => b.reviews - a.reviews).slice(0, 8);
  const deals = all
    .filter((p) => p.compareAtPrice)
    .sort((a, b) => b.compareAtPrice! / b.retailPrice - a.compareAtPrice! / a.retailPrice)
    .slice(0, 4);
  const gifts = searchProducts({ q: "gift", sort: "rating" }).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_15%_10%,#ede9fe_0%,transparent_60%),radial-gradient(50%_70%_at_90%_20%,#fce7f3_0%,transparent_60%),radial-gradient(60%_60%_at_60%_100%,#fef3c7_0%,transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div className="rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white/70 px-3 py-1 text-xs font-medium text-brand backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> New · Shop by conversation
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Just say what you need.
              <br />
              <span className="ai-text">We&apos;ll find it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-600">
              POOMAS AI searches the whole store, compares options and checks delivery to your emirate — so you can skip the scrolling.
            </p>
            <div className="mt-8 max-w-xl">
              <HeroPrompt />
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {trending.slice(0, 4).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className={`rise rounded-[2rem] bg-gradient-to-br ${p.tint} p-6 shadow-xl shadow-zinc-200/60 transition hover:-translate-y-1 ${i % 2 ? "mt-10" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="block text-7xl drop-shadow-lg">{p.emoji}</span>
                  <p className="mt-6 line-clamp-1 text-sm font-medium">{p.name}</p>
                  <p className="text-sm text-zinc-600">AED {p.retailPrice}</p>
                </Link>
              ))}
            </div>
            <div className="absolute -left-8 bottom-10 max-w-60 rounded-3xl bg-white/90 p-4 text-sm shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold text-brand">POOMAS AI</p>
              <p className="mt-1 text-zinc-700">“The Aura ANC headphones are 22% off and arrive tomorrow in Dubai.”</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 md:grid-cols-4">
        {[
          [Truck, "Next-day delivery", "Dubai, Sharjah & Ajman"],
          [Wallet, "Cash on delivery", "or secure card payment"],
          [ShieldCheck, "Verified sellers", "Every listing moderated"],
          [Zap, "14-day returns", "Hassle-free refunds"],
        ].map(([Icon, t, s]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={t as string} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <I className="h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-medium">{t as string}</p>
                <p className="text-xs text-zinc-500">{s as string}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Categories */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Shop by category</h2>
        <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-2">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="flex min-w-32 flex-col items-center gap-2 rounded-3xl bg-white px-5 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-4xl">{c.emoji}</span>
              <span className="whitespace-nowrap text-sm font-medium">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* AI collections */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand">Curated by POOMAS AI</p>
            <h2 className="text-2xl font-semibold tracking-tight">Shop by moment, not by aisle</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTIONS.map((c) => (
            <div key={c.title} className={`flex flex-col rounded-[2rem] bg-gradient-to-br ${c.tint} p-6`}>
              <span className="text-5xl">{c.emoji}</span>
              <p className="mt-8 text-lg font-semibold">{c.title}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/shop?q=${encodeURIComponent(c.q)}`} className="rounded-full bg-white px-3.5 py-1.5 text-sm font-medium shadow-sm">
                  Browse
                </Link>
                <AskAIButton prompt={c.prompt} className="rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-white">
                  ✨ Ask AI
                </AskAIButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Trending in the UAE</h2>
          <Link href="/shop?sort=rating" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {trending.map((p) => (
            <ProductCard key={p.id} p={p} channel={channel} />
          ))}
        </div>
      </section>

      {/* Deals */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2.5rem] bg-ink p-6 text-white sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-pink-300">Limited time</p>
              <h2 className="text-3xl font-semibold tracking-tight">Deals worth the hype</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Use <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-white">WELCOME10</span> for 10% off your first order
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-ink sm:gap-5 lg:grid-cols-4">
            {deals.map((p) => (
              <ProductCard key={p.id} p={p} channel={channel} />
            ))}
          </div>
        </div>
      </section>

      {/* Gifts */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Top-rated gifts</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {gifts.map((p) => (
            <ProductCard key={p.id} p={p} channel={channel} />
          ))}
        </div>
      </section>

      {/* Business models */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-brand">One platform, every way to trade</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Grow with POOMAS MART</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Building2, "Wholesale (B2B)", "Bulk pricing, MOQ, quotes and reorders for registered UAE businesses.", "/wholesale", "Apply for wholesale"],
            [Store, "Sell on POOMAS", "List your catalogue, manage stock and orders, and get clear settlement statements.", "/seller", "Become a seller"],
            [Truck, "Dropship & resell", "Sell our catalogue at your margin — we pick, pack and deliver for you.", "/reseller", "Start reselling"],
            [Megaphone, "Creators & bloggers", "Share your link or code, earn commission on every attributed order.", "/affiliate", "Join the programme"],
          ].map(([Icon, t, d, h, cta]) => {
            const I = Icon as typeof Store;
            return (
              <Link key={t as string} href={h as string} className="group rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <I className="h-5 w-5" />
                </span>
                <p className="mt-5 font-semibold">{t as string}</p>
                <p className="mt-1.5 text-sm text-zinc-500">{d as string}</p>
                <p className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand">
                  {cta as string} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
