import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  EMIRATES,
  available,
  categories,
  deliveryEstimate,
  getProduct,
  relatedProducts,
  searchProducts,
  sellerName,
  shippingFee,
  unitPrice,
} from "@/lib/store";
import { channelFor, getRole } from "@/lib/session";
import type { Channel, Product } from "@/lib/types";

// POOMAS AI — a shopping concierge. With ANTHROPIC_API_KEY set it runs Claude
// with catalogue tools; without one it falls back to the built-in semantic
// search so the experience still works in development.

export interface AssistantProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  emoji: string;
  tint: string;
  rating: number;
  inStock: boolean;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const card = (p: Product, channel: Channel): AssistantProduct => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  price: unitPrice(p, channel, p.moq),
  compareAtPrice: channel === "retail" ? p.compareAtPrice : undefined,
  emoji: p.emoji,
  tint: p.tint,
  rating: p.rating,
  inStock: available(p.id) > 0,
});

const summary = (p: Product, channel: Channel) => ({
  product_id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price_aed: unitPrice(p, channel, channel === "wholesale" ? p.moq : 1),
  was_aed: p.compareAtPrice,
  rating: p.rating,
  reviews: p.reviews,
  in_stock: available(p.id),
  sold_by: sellerName(p.owner),
  highlights: p.highlights,
});

const SYSTEM = `You are POOMAS AI, the shopping concierge for POOMAS MART, a UAE online store (prices in AED, VAT-inclusive for shoppers).
Help people discover products, compare options, plan gifts and check delivery. Be warm, concise and practical — 2–4 short sentences or a tight list. Use the tools to look things up; never invent products, prices, stock or policies.
When you recommend products, call show_products with the ids (best first, max 4) so they appear as cards under your reply. Mention prices in AED. If nothing fits, say so and suggest the closest alternatives.
Store policies: free delivery on retail orders over AED 150; next-day delivery in Dubai, Sharjah and Ajman, 2–3 days elsewhere; cash on delivery and card accepted; 14-day returns on unused items.`;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { messages?: ChatTurn[] } | null;
  const messages = (body?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user")
    return Response.json({ error: "Send a user message." }, { status: 400 });

  const channel = channelFor(await getRole());

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json(localAssistant(messages[messages.length - 1].content, channel));
  }

  const shown: AssistantProduct[] = [];

  const searchTool = betaZodTool({
    name: "search_products",
    description:
      "Search the live POOMAS MART catalogue. Accepts natural language (e.g. 'gift for coffee lover under 300'). Returns up to 8 matching products with price, rating and stock.",
    inputSchema: z.object({
      query: z.string().describe("What the shopper is looking for"),
      category: z.enum(categories.map((c) => c.slug) as [string, ...string[]]).optional(),
      max_price: z.number().optional().describe("Maximum price in AED"),
      min_price: z.number().optional().describe("Minimum price in AED"),
    }),
    run: async ({ query, category, max_price, min_price }) => {
      let res = searchProducts({ q: query, category, max: max_price, min: min_price, channel });
      if (!res.length) res = searchProducts({ category, max: max_price, min: min_price, channel, sort: "rating" });
      return JSON.stringify(res.slice(0, 8).map((p) => summary(p, channel)));
    },
  });

  const detailsTool = betaZodTool({
    name: "get_product_details",
    description: "Full details for one product: description, highlights, stock, seller and similar items.",
    inputSchema: z.object({ product_id: z.string() }),
    run: async ({ product_id }) => {
      const p = getProduct(product_id);
      if (!p || p.status !== "active") return "Product not found.";
      return JSON.stringify({
        ...summary(p, channel),
        description: p.description,
        wholesale_tiers: channel === "wholesale" ? p.wholesaleTiers : undefined,
        similar: relatedProducts(p, 3).map((r) => ({ product_id: r.id, name: r.name, price_aed: unitPrice(r, channel) })),
      });
    },
  });

  const deliveryTool = betaZodTool({
    name: "check_delivery",
    description: "Delivery estimate and fee for an emirate and a basket subtotal in AED.",
    inputSchema: z.object({
      emirate: z.enum(EMIRATES as [string, ...string[]]),
      subtotal_aed: z.number(),
    }),
    run: async ({ emirate, subtotal_aed }) =>
      JSON.stringify({
        estimate: deliveryEstimate(emirate as (typeof EMIRATES)[number]),
        fee_aed: shippingFee(channel, emirate as (typeof EMIRATES)[number], subtotal_aed),
      }),
  });

  const showTool = betaZodTool({
    name: "show_products",
    description: "Display product cards to the shopper under your reply. Call once with your final picks, best first.",
    inputSchema: z.object({ product_ids: z.array(z.string()).max(4) }),
    run: async ({ product_ids }) => {
      shown.length = 0;
      for (const id of product_ids) {
        const p = getProduct(id);
        if (p && p.status === "active") shown.push(card(p, channel));
      }
      return `Showing ${shown.length} product cards.`;
    },
  });

  const client = new Anthropic();
  try {
    const final = await client.beta.messages.toolRunner({
      model: "claude-opus-5-5",
      max_tokens: 4096,
      max_iterations: 6,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM + `\nThe shopper is browsing the ${channel} price list.`,
      tools: [searchTool, detailsTool, deliveryTool, showTool],
      messages,
    });
    if (final.stop_reason === "refusal")
      return Response.json({ reply: "Sorry, I can't help with that one — ask me about products, gifts or delivery.", products: [] });
    const reply = final.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return Response.json({ reply: reply || "Here's what I found.", products: shown });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError)
      return Response.json({ ...localAssistant(messages[messages.length - 1].content, channel), notice: "busy" });
    if (err instanceof Anthropic.APIError) {
      console.error("assistant: API error", err.status, err.message);
      return Response.json(localAssistant(messages[messages.length - 1].content, channel));
    }
    throw err;
  }
}

/** Offline concierge built on the store's semantic search. */
function localAssistant(text: string, channel: Channel) {
  const q = text.toLowerCase();
  if (/deliver|shipping|when.*arrive/.test(q)) {
    return {
      reply:
        "We deliver next day across Dubai, Sharjah and Ajman, and in 2–3 days to the other emirates. Retail orders over AED 150 ship free; otherwise it's AED 15–20. Card and cash on delivery are both accepted.",
      products: [],
    };
  }
  if (/return|refund|exchange/.test(q)) {
    return {
      reply: "Unused items can be returned within 14 days. Open your order from Account → Orders and tap “Request return”; refunds go back to the original payment method.",
      products: [],
    };
  }
  let results = searchProducts({ q: text, channel });
  const fallback = !results.length;
  if (fallback) results = searchProducts({ channel, sort: "rating" });
  const picks = results.slice(0, 4);
  const top = picks[0];
  const reply = fallback
    ? "I couldn't find an exact match, so here are some of our most-loved picks right now."
    : picks.length === 1
      ? `${top.name} looks like a great fit — rated ${top.rating}★ by ${top.reviews.toLocaleString()} shoppers.`
      : `Here are ${picks.length} picks. My top choice is ${top.name} (${top.rating}★) — ${top.highlights.slice(0, 2).join(", ").toLowerCase()}.`;
  return { reply, products: picks.map((p) => card(p, channel)) };
}
