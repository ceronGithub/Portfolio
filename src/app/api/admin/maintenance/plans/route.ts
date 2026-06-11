export const dynamic = "force-dynamic";
// GET  /api/admin/maintenance/plans — Return all 3 plan rows from DB.
// PATCH /api/admin/maintenance/plans — Update price/limits for all 3 plans.
// Admin-only. Uses raw SQL for safety after migrations.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT package, price, "bugLimit", "revisionLimit"
      FROM "MaintenancePlan"
      ORDER BY CASE package WHEN 'BASIC' THEN 1 WHEN 'PRIORITY' THEN 2 WHEN 'FULL' THEN 3 END
    `;
    // Return as { BASIC: {...}, PRIORITY: {...}, FULL: {...} }
    const plans = Object.fromEntries(rows.map(r => [r.package, {
      price: r.price, bugLimit: r.bugLimit, revisionLimit: r.revisionLimit
    }]));
    return NextResponse.json({ plans });
  } catch (err) {
    console.error("[GET /api/admin/maintenance/plans]", err);
    return NextResponse.json({ error: "Failed to load plans." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  for (const key of ["BASIC", "PRIORITY", "FULL"] as const) {
    const pkg = body[key];
    if (typeof pkg?.price !== "number" || typeof pkg?.bugLimit !== "number" || typeof pkg?.revisionLimit !== "number")
      return NextResponse.json({ error: `Invalid data for ${key}` }, { status: 400 });
    if (pkg.price < 0 || pkg.bugLimit < 0 || pkg.revisionLimit < 0)
      return NextResponse.json({ error: `${key} values must be >= 0` }, { status: 400 });
  }

  try {
    await prisma.$executeRaw`
      UPDATE "MaintenancePlan" SET price = ${body.BASIC.price},    "bugLimit" = ${body.BASIC.bugLimit},    "revisionLimit" = ${body.BASIC.revisionLimit}    WHERE package = 'BASIC'
    `;
    await prisma.$executeRaw`
      UPDATE "MaintenancePlan" SET price = ${body.PRIORITY.price}, "bugLimit" = ${body.PRIORITY.bugLimit}, "revisionLimit" = ${body.PRIORITY.revisionLimit} WHERE package = 'PRIORITY'
    `;
    await prisma.$executeRaw`
      UPDATE "MaintenancePlan" SET price = ${body.FULL.price},     "bugLimit" = ${body.FULL.bugLimit},     "revisionLimit" = ${body.FULL.revisionLimit}     WHERE package = 'FULL'
    `;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT package, price, "bugLimit", "revisionLimit" FROM "MaintenancePlan"
    `;
    const plans = Object.fromEntries(rows.map(r => [r.package, {
      price: r.price, bugLimit: r.bugLimit, revisionLimit: r.revisionLimit
    }]));
    return NextResponse.json({ ok: true, plans });
  } catch (err) {
    console.error("[PATCH /api/admin/maintenance/plans]", err);
    return NextResponse.json({ error: "Failed to update plans." }, { status: 500 });
  }
}
