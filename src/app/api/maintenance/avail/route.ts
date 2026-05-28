export const dynamic = 'force-dynamic';
// POST /api/maintenance/avail
// Buyer avails a maintenance package. Creates a MaintenanceOrder for the buyer.
// Sets expiry to 30 days from now. Prevents duplicate active orders.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body   = await req.json();
  const { packageType } = body;

  if (!["BASIC", "PRIORITY", "FULL"].includes(packageType)) {
    return NextResponse.json({ error: "Invalid package type" }, { status: 400 });
  }

  // Check for existing active maintenance order
  const existing = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (existing) {
    return NextResponse.json({ error: "You already have an active maintenance package." }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const order = await prisma.maintenanceOrder.create({
    data: {
      userId,
      package:   packageType,
      expiresAt,
    },
  });

  return NextResponse.json({ order });
}

// GET /api/maintenance/avail — returns buyer's active maintenance order
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const order = await prisma.maintenanceOrder.findFirst({
    where:   { userId, status: "ACTIVE" },
    include: {
      vcSchedules: { orderBy: { createdAt: "desc" } },
      bugReports:  { orderBy: { createdAt: "desc" } },
      tasks:       { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json({ order });
}
