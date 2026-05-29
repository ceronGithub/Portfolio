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

    // Attach displayStatus via raw SQL — safe even with stale Prisma client
    const statusRows = await prisma.$queryRaw<{ id: string; displayStatus: string }[]>`
      SELECT id, COALESCE("displayStatus", 'visible') AS "displayStatus"
      FROM   "System"
      WHERE  "isActive" = true
    `;
    const statusMap = new Map(statusRows.map(r => [r.id, r.displayStatus]));

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
