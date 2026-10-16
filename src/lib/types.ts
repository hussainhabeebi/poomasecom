// Shared domain model for every POOMAS MART business model.
// One product record, one stock ledger, one order pipeline — channel-specific
// behaviour comes from price lists, eligibility flags and roles.

export type Role =
  | "guest"
  | "customer"
  | "wholesale"
  | "seller"
  | "reseller"
  | "affiliate"
  | "admin";

export type Channel = "retail" | "wholesale" | "reseller" | "marketplace";

export type Emirate =
  | "Abu Dhabi"
  | "Dubai"
  | "Sharjah"
  | "Ajman"
  | "Umm Al Quwain"
  | "Ras Al Khaimah"
  | "Fujairah";

export interface Category {
  slug: string;
  name: string;
  emoji: string;
  /** Default marketplace commission rate for this category (0–1). */
  commissionRate: number;
}

export interface PriceTier {
  minQty: number;
  unitPrice: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  highlights: string[];
  tags: string[];
  emoji: string;
  /** Tailwind gradient classes used for the product visual tile. */
  tint: string;
  /** Optional real photo URL; the tile is used when absent. */
  image?: string;
  /** Inventory owner: "poomas" or a seller id. */
  owner: string;
  status: "active" | "pending" | "rejected";
  retailPrice: number;
  compareAtPrice?: number;
  /** Wholesale price breaks; empty means not offered to wholesale. */
  wholesaleTiers: PriceTier[];
  moq: number;
  packSize: number;
  /** Reseller cost; undefined means not in the reseller feed. */
  resellerPrice?: number;
  rating: number;
  reviews: number;
  /** Per-product commission override for marketplace / affiliate. */
  commissionRate?: number;
  createdAt: string;
}

export interface StockRecord {
  productId: string;
  onHand: number;
  reserved: number;
  lowStockAt: number;
}

export interface Seller {
  id: string;
  name: string;
  status: "pending" | "approved" | "suspended";
  rating: number;
  joinedAt: string;
}

export interface Affiliate {
  id: string;
  code: string;
  name: string;
  status: "pending" | "approved";
  rate: number;
  clicks: number;
  /** Attribution window in days. */
  windowDays: number;
}

export interface WholesaleAccount {
  id: string;
  company: string;
  tradeLicence: string;
  contact: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Address {
  name: string;
  phone: string;
  email: string;
  emirate: Emirate;
  area: string;
  line1: string;
}

export interface OrderLine {
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unitPrice: number;
  /** Who fulfils this line: "poomas" or a seller id. */
  fulfilledBy: string;
  /** Marketplace commission retained by POOMAS on seller lines. */
  commission: number;
  vat: number;
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "cod_due" | "failed" | "refunded";

export interface Order {
  id: string;
  createdAt: string;
  channel: Channel;
  customerEmail: string;
  address: Address;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  vat: number;
  total: number;
  /** Order and payment status are tracked separately (brief §5). */
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "card" | "cod" | "terms";
  promoCode?: string;
  affiliateCode?: string;
  affiliateCommission?: number;
  affiliateStatus?: "pending" | "approved" | "rejected" | "paid";
  resellerId?: string;
  timeline: { at: string; status: OrderStatus; note?: string }[];
}

export interface QuoteRequest {
  id: string;
  company: string;
  email: string;
  items: string;
  status: "open" | "quoted" | "closed";
  response?: string;
  createdAt: string;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface CartItem {
  productId: string;
  qty: number;
}
