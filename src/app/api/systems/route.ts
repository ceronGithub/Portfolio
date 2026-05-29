export const dynamic = "force-dynamic";
// GET /api/systems — Returns full system data for the visitor page.
// Includes: tag, title, basePrice, accent, description, timeline, deploy,
//           features[], displayStatus, and addons[].
// Uses $queryRaw fallback for displayStatus in case Prisma client is stale.

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

export async function GET() {
  try {
    const systems = await prisma.system.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id:          true,
        tag:         true,
        title:       true,
        basePrice:   true,
        accent:      true,
        description: true,
        timeline:    true,
        deploy:      true,
        features:    true,
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

    // Attach displayStatus via $queryRawUnsafe — more reliable than tagged $queryRaw
    // which silently returns empty array without parameters in some Prisma versions.
    let statusMap = new Map<string, string>();
    try {
      const statusRows = await prisma.$queryRawUnsafe<{ id: string; ds: string }[]>(
        `SELECT id, COALESCE("displayStatus", 'visible') AS ds FROM "System" WHERE "isActive" = true`
      );
      statusMap = new Map(statusRows.map(r => [r.id, r.ds]));
    } catch {
      // Pre-migration fallback — all systems default to visible
    }

    const result = systems.map((s: any) => ({
      ...s,
      displayStatus: statusMap.get(s.id) ?? "visible",
    }));

    return NextResponse.json({ systems: result });
  } catch (err) {
    console.error("[GET /api/systems]", err);
    return NextResponse.json({ systems: [] });
  }
}