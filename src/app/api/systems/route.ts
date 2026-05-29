export const dynamic = "force-dynamic";
// GET /api/systems — Returns tag + displayStatus for all active systems.
// Used by visitor page to reflect admin-controlled display status.
// Uses $queryRaw as a fallback in case the Prisma client is stale
// (i.e. generated before the displayStatus migration ran).

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

export async function GET() {
  try {
    // Try normal Prisma query first (works when client is up to date)
    const systems = await prisma.system.findMany({
      where:  { isActive: true },
      select: { tag: true, displayStatus: true },
    });
    return NextResponse.json({ systems });
  } catch {
    // Prisma client is stale — fall back to raw SQL which always works
    try {
      const rows = await prisma.$queryRaw<{ tag: string; displayStatus: string }[]>`
        SELECT tag,
               COALESCE("displayStatus", 'visible') AS "displayStatus"
        FROM   "System"
        WHERE  "isActive" = true
      `;
      return NextResponse.json({ systems: rows });
    } catch {
      return NextResponse.json({ systems: [] });
    }
  }
}
