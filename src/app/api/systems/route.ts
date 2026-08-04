export const dynamic = "force-dynamic";
// GET /api/systems — Returns full system data for the visitor page.
// displayStatus is read via raw SQL to survive stale Prisma client after migrations.

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

export async function GET() {
  try {
    // Read displayStatus via raw SQL — survives stale Prisma client
    const rawStatuses = await prisma.$queryRaw<{ id: string; displayStatus: string }[]>`
      SELECT id, "displayStatus" FROM "System" WHERE "isActive" = true
    `;
    const statusMap = new Map(rawStatuses.map((r: { id: string; displayStatus: string }) => [r.id, r.displayStatus ?? "visible"]));

    const systems = await prisma.system.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id:            true,
        tag:           true,
        title:         true,
        basePrice:     true,
        setupFee:      true,
        monthlyFee:    true,
        accent:        true,
        description:   true,
        timeline:      true,
        deploy:        true,
        features:      true,
        displayStatus: true,
        addons: {
          orderBy: [{ category: "asc" }, { label: "asc" }],
          select: {
            id:          true,
            addonKey:    true,
            label:       true,
            pricingType: true,
            price:       true,
            priceMin:    true,
            priceMax:    true,
            category:    true,
            description: true,
          },
        },

      },
    });

    // Fetch designTiers via raw SQL — safe even if Prisma client is stale after migration.
    // Tries the "features" column first (per-tier package details); if that migration
    // hasn't run yet on this deploy, falls back to the legacy shape so the configurator
    // still renders — just without per-tier details until the migration completes.
    let designTiersMap: Record<string, any[]> = {};
    try {
      const rawTiers = await prisma.$queryRaw<any[]>`
        SELECT id, "systemId", name, slug, tagline, "priceModifier", features, "demoVideoUrl", "liveUrl", "sortOrder"
        FROM "DesignTier"
        ORDER BY "systemId", "sortOrder" ASC
      `;
      for (const tier of rawTiers) {
        if (!designTiersMap[tier.systemId]) designTiersMap[tier.systemId] = [];
        designTiersMap[tier.systemId].push({ ...tier, features: tier.features ?? [] });
      }
    } catch {
      try {
        const rawTiersLegacy = await prisma.$queryRaw<any[]>`
          SELECT id, "systemId", name, slug, tagline, "priceModifier", "demoVideoUrl", "liveUrl", "sortOrder"
          FROM "DesignTier"
          ORDER BY "systemId", "sortOrder" ASC
        `;
        for (const tier of rawTiersLegacy) {
          if (!designTiersMap[tier.systemId]) designTiersMap[tier.systemId] = [];
          designTiersMap[tier.systemId].push({ ...tier, features: [] });
        }
      } catch {
        designTiersMap = {};
      }
    }

    // Read setupFee/monthlyFee via raw SQL — survives stale Prisma client right after migration,
    // same defensive pattern used for displayStatus above.
    let subscriptionMap = new Map<string, { setupFee: number | null; monthlyFee: number | null }>();
    try {
      const rawSubscription = await prisma.$queryRaw<{ id: string; setupFee: number | null; monthlyFee: number | null }[]>`
        SELECT id, "setupFee", "monthlyFee" FROM "System" WHERE "isActive" = true
      `;
      subscriptionMap = new Map(rawSubscription.map(r => [r.id, { setupFee: r.setupFee, monthlyFee: r.monthlyFee }]));
    } catch {
      subscriptionMap = new Map();
    }

    // Fetch Service Tiers (Basic/Standard/Premium) — informational-only, shown inside the
    // visitor Systems Showcase. Never tied to checkout math. Raw SQL for the same stale-client safety.
    let serviceTiers: any[] = [];
    try {
      serviceTiers = await prisma.$queryRaw<any[]>`
        SELECT id, name, tagline, "priceLabel", features, "sortOrder"
        FROM "ServiceTier"
        ORDER BY "sortOrder" ASC
      `;
    } catch {
      serviceTiers = [];
    }

    // Merge: raw SQL displayStatus + subscription fields + designTiers take priority over Prisma ORM result
    const merged = systems.map((s: typeof systems[number]) => ({
      ...s,
      displayStatus: statusMap.get(s.id) ?? s.displayStatus ?? "visible",
      setupFee:      subscriptionMap.get(s.id)?.setupFee   ?? (s as any).setupFee   ?? null,
      monthlyFee:    subscriptionMap.get(s.id)?.monthlyFee ?? (s as any).monthlyFee ?? null,
      addons: s.addons.map((a: (typeof s.addons)[number]) => ({
        ...a,
        pricingType: (a as any).pricingType ?? "fixed",
        priceMin:    (a as any).priceMin    ?? null,
        priceMax:    (a as any).priceMax    ?? null,
      })),
      designTiers:   designTiersMap[s.id] ?? [],
    }));

    return NextResponse.json({ systems: merged, serviceTiers });
  } catch (err) {
    console.error("[GET /api/systems]", err);
    return NextResponse.json({ systems: [] });
  }
}