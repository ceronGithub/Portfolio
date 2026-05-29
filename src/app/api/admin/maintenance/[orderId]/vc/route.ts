export const dynamic = 'force-dynamic';
// POST /api/admin/maintenance/[orderId]/vc — Admin schedules a VC call for a client.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId }                         = await params;
  const body                                = await req.json();
  const { buyerName, buyerPhone, preferredDate, adminNote } = body;

  if (!buyerName || !buyerPhone || !preferredDate) {
    return NextResponse.json({ error: "Name, phone, and date are required." }, { status: 400 });
  }

  const vc = await prisma.vCSchedule.create({
    data: {
      maintenanceOrderId: orderId,
      initiator:          "ADMIN",
      buyerName,
      buyerPhone,
      preferredDate:      new Date(preferredDate),
      status:             "CONFIRMED",
      adminNote:          adminNote ?? null,
    },
  });

  return NextResponse.json({ vc });
}