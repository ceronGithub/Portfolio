export const dynamic = "force-dynamic";
// PATCH  /api/admin/systems/[id]/design-tiers/[tierId] — Update a design tier.
// DELETE /api/admin/systems/[id]/design-tiers/[tierId] — Delete a design tier.
// Admin-only. Uses raw SQL to survive stale Prisma client after migration.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── PATCH — update a design tier ─────────────────────────────────────────────
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string; tierId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tierId } = await context.params;
  const body       = await req.json();
  const { name, tagline, priceModifier, demoVideoUrl, liveUrl, sortOrder } = body;

  if (!name?.trim())
    return NextResponse.json({ error: "name is required" }, { status: 400 });

  const parsedPrice     = typeof priceModifier === "number" ? priceModifier : parseInt(priceModifier ?? "0", 10);
  const parsedSortOrder = typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder ?? "0", 10);

  try {
    await prisma.$executeRaw`
      UPDATE "DesignTier"
      SET
        name           = ${name.trim()},
        tagline        = ${tagline?.trim() || null},
        "priceModifier" = ${parsedPrice},
        "demoVideoUrl" = ${demoVideoUrl?.trim() || null},
        "liveUrl"      = ${liveUrl?.trim() || null},
        "sortOrder"    = ${parsedSortOrder}
      WHERE id = ${tierId}
    `;

    const [tier] = await prisma.$queryRaw<any[]>`
      SELECT id, "systemId", name, slug, tagline, "priceModifier", "demoVideoUrl", "liveUrl", "sortOrder"
      FROM "DesignTier" WHERE id = ${tierId}
    `;
    return NextResponse.json({ tier });
  } catch (err) {
    console.error("[PATCH /api/admin/systems/[id]/design-tiers/[tierId]]", err);
    return NextResponse.json({ error: "Failed to update tier." }, { status: 500 });
  }
}

// ── DELETE — remove a design tier ────────────────────────────────────────────
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string; tierId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tierId } = await context.params;

  try {
    await prisma.$executeRaw`DELETE FROM "DesignTier" WHERE id = ${tierId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/systems/[id]/design-tiers/[tierId]]", err);
    return NextResponse.json({ error: "Failed to delete tier." }, { status: 500 });
  }
}
