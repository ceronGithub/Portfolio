// checkout/bundle/page.tsx — Server Component.
// Reads ?ids= query param (comma-separated asset slugs).
// Resolves asset data from the static ALL_ASSETS registry.
// Renders BundleCheckoutClient with resolved items.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import { notFound }         from "next/navigation";
import BundleCheckoutClient from "./BundleCheckoutClient";

// ── Static asset registry (mirrors buy-section data) ─────────────────────────
// Price is stored here as the source of truth for server-side total calculation.
const ASSET_REGISTRY: Record<string, { id: string; label: string; category: string; price: number }> = {
  "orc-01": { id: "orc-01", label: "Orc 01 — Warrior",      category: "Character", price: 5500 },
  "orc-02": { id: "orc-02", label: "Orc 02 — Fighter",      category: "Character", price: 5500 },
  "orc-03": { id: "orc-03", label: "Orc 03 — Red Skin",     category: "Character", price: 5500 },
  "orc-04": { id: "orc-04", label: "Orc 04 — Armored",      category: "Character", price: 5500 },
  "orc-05": { id: "orc-05", label: "Orc 05 — Shaman",       category: "Character", price: 5500 },
  "axe-01": { id: "axe-01", label: "Axe 01 — Battle Axe",   category: "Weapon",    price: 3500 },
  "axe-02": { id: "axe-02", label: "Axe 02 — War Axe",      category: "Weapon",    price: 3500 },
  "axe-03": { id: "axe-03", label: "Axe 03 — Runic Axe",    category: "Weapon",    price: 3500 },
  "axe-04": { id: "axe-04", label: "Axe 04 — Viking Axe",   category: "Weapon",    price: 3500 },
  "axe-05": { id: "axe-05", label: "Axe 05 — Ornate Axe",   category: "Weapon",    price: 3500 },
  "ext-drone-01": { id: "ext-drone-01", label: "Drone Reveal 01", category: "Exterior", price: 8500 },
  "ext-drone-02": { id: "ext-drone-02", label: "Drone Reveal 02", category: "Exterior", price: 8500 },
  "ext-proj-01":  { id: "ext-proj-01",  label: "Project 01",      category: "Exterior", price: 8500 },
  "ext-proj-02":  { id: "ext-proj-02",  label: "Project 02",      category: "Exterior", price: 8500 },
  "ext-proj-03":  { id: "ext-proj-03",  label: "Project 03",      category: "Exterior", price: 8500 },
  "ext-proj-04":  { id: "ext-proj-04",  label: "Project 04",      category: "Exterior", price: 8500 },
  "ext-proj-05":  { id: "ext-proj-05",  label: "Project 05",      category: "Exterior", price: 8500 },
  "int-01": { id: "int-01", label: "Interior 01 — Suite",   category: "Interior", price: 7500 },
  "int-02": { id: "int-02", label: "Interior 02 — Living",  category: "Interior", price: 7500 },
  "int-03": { id: "int-03", label: "Interior 03 — Kitchen", category: "Interior", price: 7500 },
  "int-04": { id: "int-04", label: "Interior 04 — Bedroom", category: "Interior", price: 7500 },
  "int-05": { id: "int-05", label: "Interior 05 — Lobby",   category: "Interior", price: 7500 },
  "int-06": { id: "int-06", label: "Interior 06 — Office",  category: "Interior", price: 7500 },
  "int-07": { id: "int-07", label: "Interior 07 — Luxury",  category: "Interior", price: 7500 },
};

// ── Bundle discount tiers (mirrors buy-section logic) ─────────────────────────
function getBundleDiscount(count: number): number {
  if (count >= 5) return 0.15;
  if (count >= 3) return 0.10;
  if (count >= 2) return 0.05;
  return 0;
}

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

export default async function BundleCheckoutPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { ids } = await searchParams;
  if (!ids) notFound();

  // Resolve each slug against the static registry
  const rawIds    = ids.split(",").map(s => s.trim()).filter(Boolean);
  const resolvedItems = rawIds
    .map(id => ASSET_REGISTRY[id])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (resolvedItems.length === 0) notFound();

  // Compute totals server-side
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
