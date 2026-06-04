// checkout/bundle/page.tsx — Server Component.
// Reads ?items= query param (comma-separated id:tier tuples) or legacy ?ids= (plain ids).
// Resolves asset data from DB, applies tier multiplier to compute the correct price.
// Passes real cuid product IDs + resolved prices to BundleCheckoutClient.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import { notFound }         from "next/navigation";
import { prisma }           from "@/lib/prisma";
import BundleCheckoutClient from "./BundleCheckoutClient";

// ── Bundle discount tiers (mirrors buy-section logic) ─────────────────────────
function getBundleDiscount(count: number): number {
  if (count >= 5) return 0.15;
  if (count >= 3) return 0.10;
  if (count >= 2) return 0.05;
  return 0;
}

// ── Tier multipliers (mirrors AssetBuySection.tsx computeTierPrice) ───────────
function applyTierMultiplier(basePrice: number, tier: string): number {
  if (tier === "mesh_only") return Math.round(basePrice * 0.45);
  if (tier === "standard")  return Math.round(basePrice * 0.75);
  return basePrice; // full_pack = base price
}

// ── Normalise category enum to display string ─────────────────────────────────
function toDisplayCategory(category: string): string {
  const map: Record<string, string> = {
    character: "Character",
    weapon:    "Weapon",
    interior:  "Interior",
    exterior:  "Exterior",
  };
  return map[category] ?? category;
}

interface Props {
  searchParams: Promise<{ ids?: string; items?: string }>;
}

export default async function BundleCheckoutPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const params = await searchParams;

  // ── Parse id:tier tuples from ?items= or fallback to plain ?ids= ─────────
  type TupleEntry = { id: string; tier: string };
  let tuples: TupleEntry[] = [];

  if (params.items) {
    // New format: ?items=id1:mesh_only,id2:standard,id3:full_pack
    tuples = params.items
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const [id, tier] = s.split(":");
        return { id: id ?? "", tier: tier ?? "full_pack" };
      })
      .filter(t => t.id.length > 0);
  } else if (params.ids) {
    // Legacy format: ?ids=id1,id2 — default to full_pack tier
    tuples = params.ids
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(id => ({ id, tier: "full_pack" }));
  }

  if (tuples.length === 0) notFound();

  const rawIds = tuples.map(t => t.id);

  // ── Resolve products from DB ──────────────────────────────────────────────
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { slug: { in: rawIds } },
        { id:   { in: rawIds } },
      ],
    },
    select: {
      id:       true,
      slug:     true,
      name:     true,
      price:    true,
      category: true,
    },
  });

  if (products.length === 0) notFound();

  // Build a lookup so we can match each tuple to its DB product
  const productById:   Record<string, typeof products[0]> = {};
  const productBySlug: Record<string, typeof products[0]> = {};
  for (const p of products) {
    productById[p.id] = p;
    if (p.slug) productBySlug[p.slug] = p;
  }

  // Map each tuple → resolved item with tier-correct price
  const resolvedItems = tuples
    .map(({ id, tier }) => {
      const p = productById[id] ?? productBySlug[id];
      if (!p) return null;
      return {
        id:       p.id,
        label:    p.name,
        category: toDisplayCategory(p.category),
        price:    applyTierMultiplier(p.price, tier),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (resolvedItems.length === 0) notFound();

  // Compute totals server-side using tier-resolved prices
  const rawTotal       = resolvedItems.reduce((sum, a) => sum + a.price, 0);
  const discountRate   = getBundleDiscount(resolvedItems.length);
  const discountAmount = Math.round(rawTotal * discountRate);
  const finalTotal     = rawTotal - discountAmount;

  return (
    <BundleCheckoutClient
      items={resolvedItems}
      rawTotal={rawTotal}
      discountRate={discountRate}
      discountAmount={discountAmount}
      finalTotal={finalTotal}
    />
  );
}