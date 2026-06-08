export const dynamic = 'force-dynamic';
// DELETE /api/admin/maintenance/[orderId] — removes a MaintenanceOrder and all
// related records (tasks, bugReports, vcSchedules) from the database.
// Admin-only.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;

  try {
    // Delete child records first (no cascade defined in schema)
    await prisma.$transaction([
      prisma.maintenanceTask.deleteMany({ where: { maintenanceOrderId: orderId } }),
      prisma.bugReport.deleteMany(       { where: { maintenanceOrderId: orderId } }),
      prisma.vCSchedule.deleteMany(      { where: { maintenanceOrderId: orderId } }), // Prisma client: vCSchedule
      prisma.maintenanceOrder.delete(    { where: { id: orderId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Maintenance order not found." }, { status: 404 });
    }
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}
