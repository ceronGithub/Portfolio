// checkout/bundle/page.tsx — Server Component.
// Reads ?ids= query param (comma-separated asset slugs or cuids).
// Resolves asset data from DB by slug match (preferred) then name match (fallback).
// Passes real cuid product IDs to BundleCheckoutClient for order creation.

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
  searchParams: Promise<{ ids?: string }>;
}

export default async function BundleCheckoutPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { ids } = await searchParams;
  if (!ids) notFound();

  const rawIds = ids.split(",").map(s => s.trim()).filter(Boolean);
  if (rawIds.length === 0) notFound();

  // ── Resolve products from DB ──────────────────────────────────────────────
  // Query by slug OR cuid so both legacy slug URLs and new cuid URLs work.
  // Each rawId is tried as a slug first (via OR), then as a cuid.
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

  // Map to the shape BundleCheckoutClient expects.
  // id = real cuid (used for order creation), label = display name.
  const resolvedItems = products.map((p: { id: string; name: string; category: string; price: number }) => ({
    id:       p.id,                           // real cuid — passed to order API
    label:    p.name,
    category: toDisplayCategory(p.category),
    price:    p.price,
  }));

  // Compute totals server-side using DB prices (never trust client)
  const rawTotal       = resolvedItems.reduce((sum: number, a: { price: number }) => sum + a.price, 0);
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