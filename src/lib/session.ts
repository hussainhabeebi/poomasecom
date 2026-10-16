import { cookies } from "next/headers";
import type { Channel, Role } from "./types";

// Demo identity: a cookie holds the active role so every portal can be
// explored without accounts. Replace with real authentication (e.g. Auth.js
// or a managed identity provider) before launch — the role checks in
// actions.ts stay the same.

export const ROLES: { role: Role; label: string; who: string }[] = [
  { role: "guest", label: "Guest shopper", who: "Browsing" },
  { role: "customer", label: "Customer", who: "Aisha K." },
  { role: "wholesale", label: "Wholesale buyer", who: "Marina Mini Mart" },
  { role: "seller", label: "Marketplace seller", who: "Al Noor Trading" },
  { role: "reseller", label: "Dropshipper", who: "ShopNow Reseller" },
  { role: "affiliate", label: "Creator / affiliate", who: "Sara Eats Dubai" },
  { role: "admin", label: "Admin", who: "Operations" },
];

/** Fixed demo identities behind each role. */
export const DEMO = {
  sellerId: "s-alnoor",
  affiliateCode: "SARAEATS",
  resellerId: "r-1",
  wholesaleId: "w-1",
  customerEmail: "aisha@example.ae",
};

export async function getRole(): Promise<Role> {
  const v = (await cookies()).get("pm_role")?.value as Role | undefined;
  return ROLES.some((r) => r.role === v) ? v! : "guest";
}

export function channelFor(role: Role): Channel {
  if (role === "wholesale") return "wholesale";
  if (role === "reseller") return "reseller";
  return "retail";
}
