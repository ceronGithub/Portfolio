export const dynamic = "force-dynamic";
// GET /api/maintenance/plans
// Public (buyer-authenticated) endpoint that returns current pricing and limits
// for all 3 maintenance packages from the DB.
// Used by buyer/maintenance to show live prices set by admin.

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";

// Fallback if DB not yet migrated
const FALLBACK = {
  BASIC:    { price: 4500,  bugLimit: 3, revisionLimit: 2 },
  PRIORITY: { price: 8500,  bugLimit: 5, revisionLimit: 4 },
  FULL:     { price: 15000, bugLimit: 8, revisionLimit: 6 },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await prisma.$queryRaw<{ package: string; price: number; bugLimit: number; revisionLimit: number }[]>`
      SELECT package, price, "bugLimit", "revisionLimit"
      FROM "MaintenancePlan"
      ORDER BY CASE package WHEN 'BASIC' THEN 1 WHEN 'PRIORITY' THEN 2 WHEN 'FULL' THEN 3 END
    `;

    if (!rows || rows.length === 0)
      return NextResponse.json({ plans: FALLBACK });

    const plans = Object.fromEntries(
      rows.map(r => [r.package, { price: r.price, bugLimit: r.bugLimit, revisionLimit: r.revisionLimit }])
    );
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ plans: FALLBACK });
  }
}
