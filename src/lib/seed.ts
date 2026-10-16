import type { Affiliate, Category, Product, Seller, StockRecord, WholesaleAccount } from "./types";

export const categories: Category[] = [
  { slug: "electronics", name: "Electronics", emoji: "🎧", commissionRate: 0.08 },
  { slug: "home-kitchen", name: "Home & Kitchen", emoji: "🍳", commissionRate: 0.12 },
  { slug: "fashion", name: "Fashion", emoji: "👟", commissionRate: 0.15 },
  { slug: "beauty", name: "Beauty & Care", emoji: "🧴", commissionRate: 0.15 },
  { slug: "grocery", name: "Grocery", emoji: "🥜", commissionRate: 0.06 },
  { slug: "baby-kids", name: "Baby & Kids", emoji: "🧸", commissionRate: 0.1 },
  { slug: "sports", name: "Sports & Outdoor", emoji: "⛺", commissionRate: 0.1 },
];

export const sellers: Seller[] = [
  { id: "s-alnoor", name: "Al Noor Trading LLC", status: "approved", rating: 4.7, joinedAt: "2026-03-02" },
  { id: "s-desertgear", name: "Desert Gear Outfitters", status: "approved", rating: 4.5, joinedAt: "2026-05-18" },
  { id: "s-oudhouse", name: "Oud House Perfumes", status: "pending", rating: 0, joinedAt: "2026-10-10" },
];

export const affiliates: Affiliate[] = [
  { id: "a-1", code: "SARAEATS", name: "Sara Eats Dubai", status: "approved", rate: 0.06, clicks: 1284, windowDays: 30 },
  { id: "a-2", code: "TECHWITHRAJ", name: "Tech with Raj", status: "approved", rate: 0.04, clicks: 932, windowDays: 14 },
];

export const wholesaleAccounts: WholesaleAccount[] = [
  {
    id: "w-1",
    company: "Marina Mini Mart",
    tradeLicence: "DED-882731",
    contact: "buyer@marinaminimart.ae",
    status: "approved",
    createdAt: "2026-06-11",
  },
  {
    id: "w-2",
    company: "Corniche Café Supplies",
    tradeLicence: "ADDED-55102",
    contact: "ops@cornichecafe.ae",
    status: "pending",
    createdAt: "2026-10-14",
  },
];

type Seed = Omit<Product, "id" | "slug" | "createdAt" | "status" | "owner"> & {
  owner?: string;
  status?: Product["status"];
  stock: number;
};

const raw: Seed[] = [
  {
    sku: "PM-EL-001", name: "Aura ANC Wireless Headphones", brand: "Aura", category: "electronics",
    description: "Over-ear headphones with adaptive noise cancelling, 40-hour battery and fast USB‑C charging. Tuned for clear calls on busy Dubai Metro commutes.",
    highlights: ["Adaptive ANC", "40h battery", "Multipoint Bluetooth 5.3", "Foldable travel case"],
    tags: ["headphones", "audio", "music", "travel", "commute", "gift", "noise cancelling", "wireless"],
    emoji: "🎧", tint: "from-violet-200 via-fuchsia-100 to-sky-100",
    retailPrice: 349, compareAtPrice: 449, wholesaleTiers: [{ minQty: 5, unitPrice: 289 }, { minQty: 20, unitPrice: 259 }],
    moq: 5, packSize: 5, resellerPrice: 275, rating: 4.7, reviews: 812, stock: 64,
  },
  {
    sku: "PM-EL-002", name: "Pulse Smartwatch S2", brand: "Pulse", category: "electronics",
    description: "AMOLED smartwatch with GPS, heart-rate, sleep tracking and prayer-time reminders. 7‑day battery and 5ATM water resistance.",
    highlights: ["1.43\" AMOLED", "Built-in GPS", "Prayer-time reminders", "5ATM"],
    tags: ["watch", "fitness", "health", "running", "gift", "wearable"],
    emoji: "⌚", tint: "from-emerald-200 via-teal-100 to-cyan-100",
    retailPrice: 229, compareAtPrice: 299, wholesaleTiers: [{ minQty: 10, unitPrice: 185 }, { minQty: 50, unitPrice: 169 }],
    moq: 10, packSize: 10, resellerPrice: 179, rating: 4.5, reviews: 455, stock: 120,
  },
  {
    sku: "PM-EL-003", name: "VoltGo 20,000mAh Power Bank", brand: "VoltGo", category: "electronics",
    description: "65W PD power bank that charges a laptop, phone and earbuds together. Airline-safe capacity.",
    highlights: ["65W USB‑C PD", "3 devices at once", "Airline safe", "LED display"],
    tags: ["charger", "travel", "laptop", "phone", "battery", "power"],
    emoji: "🔋", tint: "from-amber-200 via-yellow-100 to-lime-100",
    retailPrice: 129, wholesaleTiers: [{ minQty: 20, unitPrice: 92 }, { minQty: 100, unitPrice: 84 }],
    moq: 20, packSize: 20, resellerPrice: 95, rating: 4.6, reviews: 1290, stock: 300,
  },
  {
    sku: "PM-EL-004", name: "Lumen 4K Streaming Projector", brand: "Lumen", category: "electronics",
    owner: "s-alnoor",
    description: "Compact 4K-input projector with built-in streaming apps and a 120\" image. Perfect for majlis movie nights.",
    highlights: ["4K input, 1080p native", "Built-in apps", "Auto keystone", "Up to 120\""],
    tags: ["projector", "movies", "home cinema", "tv", "family", "entertainment"],
    emoji: "📽️", tint: "from-indigo-200 via-violet-100 to-rose-100",
    retailPrice: 899, compareAtPrice: 1099, wholesaleTiers: [], moq: 1, packSize: 1, rating: 4.4, reviews: 128, stock: 14,
  },
  {
    sku: "PM-HK-001", name: "Barista Pro Espresso Machine", brand: "Kaffa", category: "home-kitchen",
    description: "15-bar espresso machine with steam wand and built-in grinder. Make flat whites and karak-style lattes at home.",
    highlights: ["15-bar pump", "Built-in conical grinder", "Steam wand", "2L tank"],
    tags: ["coffee", "espresso", "kitchen", "appliance", "gift", "breakfast"],
    emoji: "☕", tint: "from-orange-200 via-amber-100 to-stone-100",
    retailPrice: 1299, compareAtPrice: 1599, wholesaleTiers: [{ minQty: 3, unitPrice: 1090 }], moq: 3, packSize: 1,
    resellerPrice: 1120, rating: 4.8, reviews: 341, stock: 22,
  },
  {
    sku: "PM-HK-002", name: "AirCrisp 6L Digital Air Fryer", brand: "AirCrisp", category: "home-kitchen",
    description: "Family-size air fryer with 8 presets and a viewing window. Crispy samosas with 90% less oil.",
    highlights: ["6L basket", "8 presets", "Viewing window", "Dishwasher-safe"],
    tags: ["air fryer", "cooking", "kitchen", "healthy", "family", "appliance"],
    emoji: "🍟", tint: "from-red-200 via-orange-100 to-amber-100",
    retailPrice: 299, compareAtPrice: 379, wholesaleTiers: [{ minQty: 6, unitPrice: 239 }, { minQty: 24, unitPrice: 219 }],
    moq: 6, packSize: 2, resellerPrice: 235, rating: 4.6, reviews: 2104, stock: 85,
  },
  {
    sku: "PM-HK-003", name: "Dallah Brass Arabic Coffee Set", brand: "Majlis", category: "home-kitchen",
    owner: "s-alnoor",
    description: "Hand-finished brass dallah with six finjan cups and serving tray. A classic for hosting guests during Eid.",
    highlights: ["Brass dallah 1L", "6 finjan cups", "Engraved tray", "Gift box"],
    tags: ["arabic coffee", "gift", "eid", "ramadan", "hosting", "traditional", "majlis"],
    emoji: "🫖", tint: "from-yellow-200 via-amber-100 to-orange-100",
    retailPrice: 249, wholesaleTiers: [{ minQty: 10, unitPrice: 195 }], moq: 10, packSize: 5, resellerPrice: 199,
    rating: 4.9, reviews: 207, stock: 40,
  },
  {
    sku: "PM-HK-004", name: "CoolBreeze Smart Tower Fan", brand: "CoolBreeze", category: "home-kitchen",
    description: "Whisper-quiet tower fan with app control, 12 speeds and sleep mode. Built for UAE summers.",
    highlights: ["App + voice control", "12 speeds", "Sleep mode", "Oscillation 90°"],
    tags: ["fan", "cooling", "summer", "bedroom", "smart home"],
    emoji: "🌀", tint: "from-sky-200 via-cyan-100 to-blue-100",
    retailPrice: 189, wholesaleTiers: [{ minQty: 10, unitPrice: 149 }], moq: 10, packSize: 2, resellerPrice: 152,
    rating: 4.3, reviews: 389, stock: 7,
  },
  {
    sku: "PM-FA-001", name: "Dune Runner Sneakers", brand: "Dune", category: "fashion",
    description: "Breathable knit running shoes with responsive foam. Light enough for evening runs on Kite Beach.",
    highlights: ["Breathable knit", "Responsive foam", "Sizes EU 38–46", "Recycled laces"],
    tags: ["shoes", "sneakers", "running", "fitness", "men", "women", "sport"],
    emoji: "👟", tint: "from-lime-200 via-emerald-100 to-teal-100",
    retailPrice: 259, compareAtPrice: 329, wholesaleTiers: [{ minQty: 12, unitPrice: 189 }], moq: 12, packSize: 6,
    resellerPrice: 195, rating: 4.5, reviews: 618, stock: 140,
  },
  {
    sku: "PM-FA-002", name: "Linen Kandura — Summer Weight", brand: "Al Fakher Tailors", category: "fashion",
    owner: "s-alnoor",
    description: "Lightweight premium linen-blend kandura, cut for comfort in 45°C heat. Available in white and sand.",
    highlights: ["Linen blend", "Breathable", "White / Sand", "Sizes 52–62"],
    tags: ["kandura", "menswear", "traditional", "eid", "summer", "clothing"],
    emoji: "🥻", tint: "from-stone-200 via-neutral-100 to-amber-50",
    retailPrice: 345, wholesaleTiers: [{ minQty: 10, unitPrice: 270 }], moq: 10, packSize: 5, rating: 4.7, reviews: 96, stock: 55,
  },
  {
    sku: "PM-FA-003", name: "Oasis Silk Abaya", brand: "Oasis", category: "fashion",
    description: "Flowing crepe-silk abaya with subtle embroidered cuffs. Includes matching shayla.",
    highlights: ["Crepe silk", "Embroidered cuffs", "Matching shayla", "Sizes 50–60"],
    tags: ["abaya", "womenswear", "modest", "eid", "gift", "clothing"],
    emoji: "👗", tint: "from-rose-200 via-pink-100 to-fuchsia-100",
    retailPrice: 420, compareAtPrice: 520, wholesaleTiers: [{ minQty: 6, unitPrice: 330 }], moq: 6, packSize: 3,
    resellerPrice: 340, rating: 4.8, reviews: 233, stock: 33,
  },
  {
    sku: "PM-BE-001", name: "Arabian Oud Eau de Parfum 100ml", brand: "Oud House", category: "beauty",
    description: "Rich oud with rose, saffron and amber. Long-lasting, made for evenings and special occasions.",
    highlights: ["100ml EDP", "Oud · Rose · Saffron", "12h+ longevity", "Gift-ready"],
    tags: ["perfume", "oud", "fragrance", "gift", "eid", "luxury", "men", "women"],
    emoji: "🧴", tint: "from-amber-300 via-orange-100 to-rose-100",
    retailPrice: 385, compareAtPrice: 450, wholesaleTiers: [{ minQty: 12, unitPrice: 290 }], moq: 12, packSize: 6,
    resellerPrice: 300, rating: 4.9, reviews: 1022, stock: 75,
  },
  {
    sku: "PM-BE-002", name: "Desert Glow SPF50 Sunscreen", brand: "Sahra Skin", category: "beauty",
    description: "Lightweight, non-greasy SPF50 PA++++ with niacinamide. No white cast, beach and gym friendly.",
    highlights: ["SPF50 PA++++", "Niacinamide", "No white cast", "Sweat resistant"],
    tags: ["skincare", "sunscreen", "summer", "beach", "spf", "face"],
    emoji: "☀️", tint: "from-yellow-200 via-orange-100 to-pink-100",
    retailPrice: 79, wholesaleTiers: [{ minQty: 24, unitPrice: 52 }, { minQty: 96, unitPrice: 46 }], moq: 24, packSize: 24,
    resellerPrice: 55, rating: 4.6, reviews: 1834, stock: 410,
  },
  {
    sku: "PM-BE-003", name: "Argan Repair Hair Oil", brand: "Sahra Skin", category: "beauty",
    description: "Cold-pressed argan oil serum that tames frizz from humidity and repairs heat damage.",
    highlights: ["Cold-pressed argan", "Anti-frizz", "Heat protection", "100ml"],
    tags: ["haircare", "oil", "frizz", "humidity", "beauty"],
    emoji: "💧", tint: "from-teal-200 via-emerald-100 to-lime-100",
    retailPrice: 65, wholesaleTiers: [{ minQty: 24, unitPrice: 41 }], moq: 24, packSize: 12, resellerPrice: 44,
    rating: 4.4, reviews: 512, stock: 0,
  },
  {
    sku: "PM-GR-001", name: "Premium Medjool Dates 1kg", brand: "Liwa Farms", category: "grocery",
    description: "Large, soft Medjool dates from Liwa. Naturally sweet, perfect for iftar and gifting.",
    highlights: ["Grade A Medjool", "1kg box", "UAE grown", "No added sugar"],
    tags: ["dates", "ramadan", "iftar", "snack", "healthy", "gift", "food"],
    emoji: "🌴", tint: "from-amber-200 via-orange-100 to-yellow-50",
    retailPrice: 69, wholesaleTiers: [{ minQty: 20, unitPrice: 48 }, { minQty: 100, unitPrice: 42 }], moq: 20, packSize: 10,
    resellerPrice: 50, rating: 4.9, reviews: 2401, stock: 520,
  },
  {
    sku: "PM-GR-002", name: "Specialty Arabica Beans 1kg", brand: "Kaffa", category: "grocery",
    description: "Medium-roast Ethiopian & Colombian blend, roasted weekly in Al Quoz. Notes of chocolate and berry.",
    highlights: ["Roasted in Dubai", "Medium roast", "Whole bean", "1kg"],
    tags: ["coffee", "beans", "espresso", "breakfast", "food"],
    emoji: "🫘", tint: "from-stone-300 via-amber-100 to-orange-50",
    retailPrice: 115, wholesaleTiers: [{ minQty: 10, unitPrice: 86 }, { minQty: 50, unitPrice: 78 }], moq: 10, packSize: 5,
    resellerPrice: 88, rating: 4.7, reviews: 377, stock: 160,
  },
  {
    sku: "PM-GR-003", name: "Mixed Nuts Gift Tin 750g", brand: "Liwa Farms", category: "grocery",
    description: "Roasted cashews, almonds, pistachios and macadamias in a reusable gift tin.",
    highlights: ["750g", "4 premium nuts", "Lightly salted", "Reusable tin"],
    tags: ["nuts", "snack", "gift", "eid", "healthy", "food"],
    emoji: "🥜", tint: "from-orange-200 via-amber-100 to-yellow-100",
    retailPrice: 95, wholesaleTiers: [{ minQty: 12, unitPrice: 68 }], moq: 12, packSize: 6, resellerPrice: 70,
    rating: 4.6, reviews: 289, stock: 90,
  },
  {
    sku: "PM-BK-001", name: "CloudNest Baby Stroller", brand: "CloudNest", category: "baby-kids",
    description: "One-hand fold travel stroller with full recline and UPF50 canopy for sunny mall walks.",
    highlights: ["One-hand fold", "UPF50 canopy", "Full recline", "Cabin-size"],
    tags: ["baby", "stroller", "travel", "newborn", "parents"],
    emoji: "👶", tint: "from-sky-200 via-indigo-100 to-violet-100",
    retailPrice: 799, compareAtPrice: 949, wholesaleTiers: [{ minQty: 4, unitPrice: 650 }], moq: 4, packSize: 1,
    resellerPrice: 670, rating: 4.7, reviews: 158, stock: 18,
  },
  {
    sku: "PM-BK-002", name: "STEM Robot Building Kit", brand: "BrightMinds", category: "baby-kids",
    description: "12-in-1 coding robot kit for ages 8+. App-based block coding, no screen time required to start.",
    highlights: ["12 builds", "Ages 8+", "Block coding app", "Rechargeable"],
    tags: ["toys", "kids", "stem", "education", "gift", "robot", "coding"],
    emoji: "🤖", tint: "from-cyan-200 via-sky-100 to-indigo-100",
    retailPrice: 189, wholesaleTiers: [{ minQty: 10, unitPrice: 139 }], moq: 10, packSize: 5, resellerPrice: 145,
    rating: 4.8, reviews: 402, stock: 61,
  },
  {
    sku: "PM-BK-003", name: "Plush Camel Soft Toy", brand: "BrightMinds", category: "baby-kids",
    description: "Ultra-soft, hypoallergenic plush camel — the cuddliest souvenir from the UAE.",
    highlights: ["Hypoallergenic", "35cm", "Machine washable", "0+ years"],
    tags: ["toys", "baby", "kids", "gift", "souvenir", "plush"],
    emoji: "🐪", tint: "from-amber-100 via-orange-50 to-rose-50",
    retailPrice: 59, wholesaleTiers: [{ minQty: 24, unitPrice: 34 }], moq: 24, packSize: 12, resellerPrice: 36,
    rating: 4.9, reviews: 733, stock: 250,
  },
  {
    sku: "PM-SP-001", name: "Desert Camping Tent (4-person)", brand: "Desert Gear", category: "sports",
    owner: "s-desertgear",
    description: "Wind-rated dome tent for winter camping in Al Qudra or Jebel Jais. Sets up in 5 minutes.",
    highlights: ["4-person", "Wind-rated", "5-minute setup", "UV-coated fly"],
    tags: ["camping", "tent", "outdoor", "winter", "family", "desert", "adventure"],
    emoji: "⛺", tint: "from-orange-200 via-amber-100 to-lime-100",
    retailPrice: 459, wholesaleTiers: [{ minQty: 5, unitPrice: 360 }], moq: 5, packSize: 1, rating: 4.6, reviews: 141, stock: 26,
  },
  {
    sku: "PM-SP-002", name: "ProGrip Yoga Mat 6mm", brand: "Zen", category: "sports",
    description: "Non-slip, sweat-resistant TPE yoga mat with alignment lines and carry strap.",
    highlights: ["6mm TPE", "Non-slip both sides", "Alignment lines", "Carry strap"],
    tags: ["yoga", "fitness", "workout", "home gym", "pilates"],
    emoji: "🧘", tint: "from-fuchsia-200 via-violet-100 to-indigo-100",
    retailPrice: 99, wholesaleTiers: [{ minQty: 20, unitPrice: 62 }], moq: 20, packSize: 10, resellerPrice: 65,
    rating: 4.5, reviews: 864, stock: 180,
  },
  {
    sku: "PM-SP-003", name: "Insulated Steel Bottle 1L", brand: "Desert Gear", category: "sports",
    owner: "s-desertgear",
    description: "Keeps water ice-cold for 24 hours — even in a parked car in August.",
    highlights: ["24h cold", "1L", "Leak-proof", "BPA-free"],
    tags: ["bottle", "hydration", "summer", "gym", "hiking", "outdoor"],
    emoji: "🧊", tint: "from-blue-200 via-sky-100 to-cyan-50",
    retailPrice: 75, wholesaleTiers: [{ minQty: 24, unitPrice: 45 }], moq: 24, packSize: 12, rating: 4.7, reviews: 1503, stock: 340,
  },
  {
    sku: "PM-BE-004", name: "Bakhoor Burner & Mubakhar Set", brand: "Oud House", category: "beauty",
    owner: "s-oudhouse", status: "pending",
    description: "Electric mubakhar with a selection of four premium bakhoor blends.",
    highlights: ["USB‑C electric burner", "4 bakhoor blends", "Gift box"],
    tags: ["bakhoor", "fragrance", "home", "gift", "eid"],
    emoji: "🪔", tint: "from-rose-200 via-amber-100 to-yellow-50",
    retailPrice: 210, wholesaleTiers: [], moq: 1, packSize: 1, rating: 0, reviews: 0, stock: 30,
  },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function buildSeed() {
  const products: Product[] = [];
  const stock: StockRecord[] = [];
  raw.forEach((r, i) => {
    const { stock: onHand, owner, status, ...rest } = r;
    const id = `p-${String(i + 1).padStart(3, "0")}`;
    products.push({
      ...rest,
      id,
      slug: slugify(r.name),
      owner: owner ?? "poomas",
      status: status ?? "active",
      createdAt: new Date(Date.UTC(2026, 8, 1 + i)).toISOString(),
    });
    stock.push({ productId: id, onHand, reserved: 0, lowStockAt: 10 });
  });
  return { products, stock };
}
