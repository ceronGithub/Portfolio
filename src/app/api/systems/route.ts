export const dynamic = "force-dynamic";
// GET /api/systems — Returns display status for all active systems (by tag).
// Used by visitor page to reflect admin-controlled display status without a full page rebuild.

import { NextResponse }  from "next/server";
import { prisma }        from "@/lib/prisma";

export async function GET() {
  try {
    const systems = await prisma.system.findMany({
      where:  { isActive: true },
      select: { tag: true, displayStatus: true },
    });
    return NextResponse.json({ systems });
  } catch {
    return NextResponse.json({ systems: [] });
  }
}
