export const dynamic = "force-dynamic";
// POST /api/maintenance/expire
// Checks all ACTIVE MaintenanceOrders — marks any with expiresAt < now as EXPIRED.
// Called on page load from both buyer and admin maintenance pages.

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await prisma.maintenanceOrder.updateMany({
      where: {
        status:    "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({ expired: result.count });
  } catch (err: any) {
    console.error("[POST /api/maintenance/expire]", err?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
