export const dynamic = 'force-dynamic';
// GET /api/admin/maintenance/vc/booked-slots
// Returns all booked preferredDate hours (PENDING or CONFIRMED) across all buyers.
// Used by the admin custom VC calendar to gray out unavailable time slots.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all VC schedules that are still active (not done/cancelled)
  const schedules = await prisma.vCSchedule.findMany({
    where:  { status: { in: ["PENDING", "CONFIRMED"] } },
    select: { preferredDate: true, confirmedDate: true },
  });

  // Return booked ISO strings — client checks hour match
  const bookedSlots = schedules.map((s: { preferredDate: Date; confirmedDate: Date | null }) => ({
    date: (s.confirmedDate ?? s.preferredDate).toISOString(),
  }));

  return NextResponse.json({ bookedSlots });
}