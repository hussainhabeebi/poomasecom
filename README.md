# POOMAS MART

An AI-first commerce platform for the UAE. It combines **B2C retail, B2B wholesale, a multi-vendor marketplace, dropshipping/reselling and a creator/affiliate programme** in one website. All five share one catalogue, one stock ledger and one order pipeline, as the developer requirements brief asks.

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4. **POOMAS AI**, the shopping concierge, runs on Claude.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Use the account menu (top right) to switch between **Guest, Customer, Wholesale buyer, Marketplace seller, Dropshipper, Creator and Admin**. This demo switcher stands in for sign-in so every portal can be explored.

## What's included

| Area | Where | Highlights |
| --- | --- | --- |
| AI shopping | Hero prompt, header “Ask AI”, floating button, product & cart pages | Conversational search, product cards with add-to-bag, delivery Q&A. Uses Claude (`claude-opus-5-5`) with catalogue tools; falls back to built-in semantic search when no API key is set |
| B2C store | `/`, `/shop`, `/product/[slug]`, `/cart`, `/checkout`, `/order/[id]`, `/account` | Natural-language search (“gift under 300”), filters, VAT-inclusive pricing, promo and creator codes, emirate-based delivery fees, card or COD, order tracking, return requests |
| B2B wholesale | `/wholesale` | Application flow, ex-VAT tiered pricing, MOQ and carton checks, quick bulk order by SKU, RFQ and quote replies, order history |
| Marketplace | `/seller` | Seller hub: sales statement (gross, commission, pending, payable), fulfilment actions, price and stock updates, product submission that waits for moderation |
| Dropship / reseller | `/reseller` | Approved product feed with cost, recommended retail price and margin; orders checked out with the end customer's address |
| Creators | `/affiliate`, `/r/CODE` | Tracked links (attribution cookie), codes, click and order stats, commission lifecycle (pending, approved, paid, rejected), duplicate-order fraud check |
| Admin | `/admin` | KPIs by channel, low-stock alerts, order operations (advance, cancel, refund), moderation queue, inventory editing, wholesale, seller and creator approvals, payouts, RFQs, audit log, CSV export |
| SEO | `sitemap.xml`, `robots.txt`, metadata, Product JSON-LD | Clean URLs, canonical tags, private areas excluded from indexing |

## Architecture

```
src/
  lib/
    types.ts     Domain model shared by every channel
    seed.ts      Demo catalogue, sellers, creators, wholesale accounts
    store.ts     Source of truth: search, pricing, stock, orders, settlements, reports
    actions.ts   Server Actions (all writes) with role checks + audit logging
    session.ts   Demo role/identity (replace with real auth)
  app/           Pages and route handlers (api/assistant, api/quote, api/export, r/[code])
  components/    UI: header/footer/cards, AI assistant panel, cart & assistant providers
```

Key rules from the brief and where they live:

- **No overselling across channels.** `placeOrder` checks and decrements stock in one synchronous step. Cancellations and refunds put the stock back.
- **One product, many price lists.** Retail, wholesale tiers and reseller cost all live on the same record (`unitPrice`).
- **Server-side pricing.** The cart and checkout ask `/api/quote` for prices; the browser never sets them.
- **Order status and payment status are tracked separately.** Each order line records which seller fulfils it, plus its commission and VAT.
- **Inventory owner** is set per product (`poomas` or a seller id). Seller statements subtract commission and hold back amounts for orders not yet delivered.
- **Card data is never stored.** The card option is a sandbox stand-in for the gateway's hosted payment page.

## Production roadmap

This repository is a working foundation and demo. Before launch:

1. **Database.** Replace the in-memory `store.ts` with PostgreSQL (Prisma or Drizzle). The function signatures stay the same, and stock decrements become conditional `UPDATE … WHERE on_hand >= qty` statements inside a transaction.
2. **Authentication.** Replace the role cookie in `session.ts` with real accounts (Auth.js or a managed identity provider) and per-user ownership checks.
3. **Payments.** Integrate a UAE gateway (for example Network International, Checkout.com, Telr or Stripe UAE) through its hosted or tokenised flow, with webhooks updating `paymentStatus`.
4. **Shipping and notifications.** Courier APIs (Aramex, Quiq, Jeebly and others), plus email, SMS and WhatsApp Business notifications.
5. **Media.** Product image upload to object storage. `Product.image` is already supported in the UI.
6. **Compliance.** VAT invoice format, privacy notice and seller terms, all reviewed by UAE advisors (brief §11).
