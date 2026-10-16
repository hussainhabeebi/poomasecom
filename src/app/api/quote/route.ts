import { EMIRATES, quoteCart } from "@/lib/store";
import { channelFor, getRole } from "@/lib/session";
import type { CartItem, Emirate } from "@/lib/types";

/** Server-side cart pricing: the browser never decides prices. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { items?: CartItem[]; emirate?: string; code?: string };
  const items = Array.isArray(body.items) ? body.items.filter((i) => typeof i?.productId === "string" && Number(i.qty) > 0) : [];
  const emirate = (EMIRATES as string[]).includes(body.emirate ?? "") ? (body.emirate as Emirate) : "Dubai";
  const role = await getRole();
  const channel = channelFor(role);
  const q = quoteCart(items, channel, emirate, body.code);
  return Response.json({
    channel,
    role,
    subtotal: q.subtotal,
    discount: q.discount,
    discountLabel: q.discountLabel,
    shipping: q.shipping,
    vat: q.vat,
    total: q.total,
    errors: q.errors,
    lines: q.lines.map((l) => ({
      productId: l.productId,
      slug: l.product.slug,
      name: l.name,
      brand: l.product.brand,
      emoji: l.product.emoji,
      tint: l.product.tint,
      qty: l.qty,
      unitPrice: l.unitPrice,
      available: l.available,
      moq: channel === "wholesale" ? l.product.moq : 1,
      seller: l.fulfilledBy,
    })),
  });
}
