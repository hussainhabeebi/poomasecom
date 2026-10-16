import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-zinc-500">It may have moved, or the product is no longer available.</p>
      <Link href="/shop" className="mt-8 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-white">
        Back to the store
      </Link>
    </div>
  );
}
