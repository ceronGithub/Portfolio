export const dynamic = 'force-dynamic';
// POST /api/maintenance/vc — Buyer submits a VC call request.
// Requires active maintenance order. Stores name, phone, preferred date.
// GET  /api/maintenance/vc — Returns buyer's VC schedule history.
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
  const { buyerName, buyerPhone, preferredDate } = body;

  if (!buyerName || !buyerPhone || !preferredDate) {
    return NextResponse.json({ error: "Name, phone, and preferred date are required." }, { status: 400 });
  }

  // Get active maintenance order
  const order = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!order) {
    return NextResponse.json({ error: "No active maintenance package found." }, { status: 404 });
  }

  const schedule = await prisma.vCSchedule.create({
    data: {
      maintenanceOrderId: order.id,
      initiator:          "BUYER",
      buyerName,
      buyerPhone,
      preferredDate:      new Date(preferredDate),
    },
  });

  return NextResponse.json({ schedule });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const order = await prisma.maintenanceOrder.findFirst({
    where: { userId, status: "ACTIVE" },
  });

  if (!order) return NextResponse.json({ schedules: [] });

  const schedules = await prisma.vCSchedule.findMany({
    where:   { maintenanceOrderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ schedules });
}
