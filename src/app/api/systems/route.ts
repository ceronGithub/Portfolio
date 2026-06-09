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
            price:       true,
            category:    true,
            description: true,
          },
        },

      },
    });

    // Fetch designTiers via raw SQL — safe even if Prisma client is stale after migration
    let designTiersMap: Record<string, any[]> = {};
    try {
      const rawTiers = await prisma.$queryRaw<any[]>`
        SELECT id, "systemId", name, slug, tagline, "priceModifier", "demoVideoUrl", "liveUrl", "sortOrder"
        FROM "DesignTier"
        ORDER BY "systemId", "sortOrder" ASC
      `;
      for (const tier of rawTiers) {
        if (!designTiersMap[tier.systemId]) designTiersMap[tier.systemId] = [];
        designTiersMap[tier.systemId].push(tier);
      }
    } catch {
      designTiersMap = {};
    }

    // Merge: raw SQL displayStatus + designTiers take priority over Prisma ORM result
    const merged = systems.map((s: typeof systems[number]) => ({
      ...s,
      displayStatus: statusMap.get(s.id) ?? s.displayStatus ?? "visible",
      designTiers:   designTiersMap[s.id] ?? [],
    }));

    return NextResponse.json({ systems: merged });
  } catch (err) {
    console.error("[GET /api/systems]", err);
    return NextResponse.json({ systems: [] });
  }
}