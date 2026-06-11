export const dynamic = "force-dynamic";
// PATCH /api/admin/maintenance/plans
// Updates pricing and usage limits for maintenance packages.
// Writes to /src/config/maintenance-plans.json — the shared source of truth
// read by both the buyer UI (PKG_CONFIG) and the checkout route.
// Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { writeFile, readFile }       from "fs/promises";
import path                          from "path";

const CONFIG_PATH = path.join(process.cwd(), "src", "config", "maintenance-plans.json");

type PkgUpdate = { price: number; bugLimit: number; revisionLimit: number };
type PlansBody = { BASIC: PkgUpdate; PRIORITY: PkgUpdate; FULL: PkgUpdate };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const raw   = await readFile(CONFIG_PATH, "utf-8");
    const plans = JSON.parse(raw);
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: "Could not read plans config." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: PlansBody = await req.json();

  // Validate presence of all 3 packages
  for (const key of ["BASIC", "PRIORITY", "FULL"] as const) {
    const pkg = body[key];
    if (typeof pkg?.price !== "number" || typeof pkg?.bugLimit !== "number" || typeof pkg?.revisionLimit !== "number")
      return NextResponse.json({ error: `Invalid data for ${key}` }, { status: 400 });
    if (pkg.price < 0 || pkg.bugLimit < 0 || pkg.revisionLimit < 0)
      return NextResponse.json({ error: `${key} values must be >= 0` }, { status: 400 });
  }

  const updated = {
    BASIC:    { price: body.BASIC.price,    bugLimit: body.BASIC.bugLimit,    revisionLimit: body.BASIC.revisionLimit    },
    PRIORITY: { price: body.PRIORITY.price, bugLimit: body.PRIORITY.bugLimit, revisionLimit: body.PRIORITY.revisionLimit },
    FULL:     { price: body.FULL.price,     bugLimit: body.FULL.bugLimit,     revisionLimit: body.FULL.revisionLimit     },
  };

  try {
    await writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return NextResponse.json({ ok: true, plans: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/maintenance/plans]", err);
    return NextResponse.json({ error: "Failed to write plans config." }, { status: 500 });
  }
}
