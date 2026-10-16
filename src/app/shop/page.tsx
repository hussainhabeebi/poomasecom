import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";
import { categories, getCategory, searchProducts, type SearchOptions } from "@/lib/store";
import { channelFor, getRole } from "@/lib/session";
import { ProductCard, inputCls } from "@/components/chrome";
import { AskAIButton } from "@/components/client-ui";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = typeof sp.category === "string" ? getCategory(sp.category) : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  return {
    title: cat ? `${cat.name} — shop online in the UAE` : q ? `Results for “${q}”` : "Shop all products",
    alternates: { canonical: cat ? `/shop?category=${cat.slug}` : "/shop" },
  };
}

const SORTS: [NonNullable<SearchOptions["sort"]>, string][] = [
  ["relevance", "Best match"],
  ["rating", "Top rated"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["new", "Newest"],
];

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const role = await getRole();
  const channel = channelFor(role);
  const q = get("q");
  const category = get("category");
  const sort = (get("sort") as SearchOptions["sort"]) ?? "relevance";
  const min = get("min") ? Number(get("min")) : undefined;
  const max = get("max") ? Number(get("max")) : undefined;
  const inStock = get("stock") === "1";
  const deals = get("deals") === "1";

  let results = searchProducts({ q, category, sort, min, max, inStock, channel });
  if (deals) results = results.filter((p) => p.compareAtPrice);
  const cat = category ? getCategory(category) : undefined;

  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, category, sort: sort === "relevance" ? undefined : sort, min: get("min"), max: get("max"), stock: get("stock"), deals: get("deals"), ...patch }))
      if (v) next.set(k, v);
    const s = next.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link>
            {cat && <> / {cat.name}</>}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {q ? <>Results for “{q}”</> : cat ? <>{cat.emoji} {cat.name}</> : deals ? "🔥 Today's deals" : "All products"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {results.length} {results.length === 1 ? "item" : "items"}
            {channel !== "retail" && <> · showing your <span className="font-medium text-brand">{channel}</span> prices</>}
          </p>
        </div>
        <AskAIButton
          prompt={q ? `Help me choose: ${q}` : cat ? `What's best in ${cat.name}?` : "What should I buy today?"}
          className="ai-ring inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-brand" /> Not sure? Ask AI to pick
        </AskAIButton>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Category</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
              <Link href={href({ category: undefined })} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm lg:rounded-xl ${!category ? "bg-ink text-white" : "bg-white hover:bg-zinc-100"}`}>
                All categories
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={href({ category: c.slug })}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm lg:rounded-xl ${category === c.slug ? "bg-ink text-white" : "bg-white hover:bg-zinc-100"}`}
                >
                  {c.emoji} {c.name}
                </Link>
              ))}
            </div>
          </div>
          <form action="/shop" className="space-y-3">
            {q && <input type="hidden" name="q" value={q} />}
            {category && <input type="hidden" name="category" value={category} />}
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Price (AED)</p>
            <div className="flex gap-2">
              <input name="min" type="number" min={0} defaultValue={get("min")} placeholder="Min" className={inputCls} aria-label="Minimum price" />
              <input name="max" type="number" min={0} defaultValue={get("max")} placeholder="Max" className={inputCls} aria-label="Maximum price" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="stock" value="1" defaultChecked={inStock} className="h-4 w-4 accent-brand" /> In stock only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="deals" value="1" defaultChecked={deals} className="h-4 w-4 accent-brand" /> On sale
            </label>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Sort by</p>
              <select name="sort" defaultValue={sort} className={inputCls} aria-label="Sort by">
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <button className="h-10 w-full rounded-full bg-ink text-sm font-medium text-white">Apply</button>
          </form>
        </aside>

        <div>
          {(q || min || max || inStock || deals) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {q && <Chip href={href({ q: undefined })}>“{q}”</Chip>}
              {min !== undefined && <Chip href={href({ min: undefined })}>Min AED {min}</Chip>}
              {max !== undefined && <Chip href={href({ max: undefined })}>Max AED {max}</Chip>}
              {inStock && <Chip href={href({ stock: undefined })}>In stock</Chip>}
              {deals && <Chip href={href({ deals: undefined })}>On sale</Chip>}
            </div>
          )}
          {results.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} p={p} channel={channel} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-12 text-center">
              <p className="text-5xl">🔎</p>
              <p className="mt-4 text-lg font-medium">No exact matches</p>
              <p className="mt-1 text-sm text-zinc-500">Try describing it differently — our AI understands occasions, budgets and needs.</p>
              <AskAIButton prompt={q} className="ai-gradient mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4" /> Ask POOMAS AI
              </AskAIButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm shadow-sm hover:bg-zinc-50">
      {children} <X className="h-3.5 w-3.5 text-zinc-400" />
    </Link>
  );
}
