export const dynamic = "force-dynamic";
// GET  /api/admin/systems/[id]/design-tiers — List all design tiers for a system.
// POST /api/admin/systems/[id]/design-tiers — Create a new design tier.
// Admin-only. Uses raw SQL to survive stale Prisma client after migration.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── GET — list design tiers for a system ──────────────────────────────────────
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  try {
    const tiers = await prisma.$queryRaw<any[]>`
      SELECT id, "systemId", name, slug, tagline, "priceModifier", "demoVideoUrl", "liveUrl", "sortOrder", "createdAt"
      FROM "DesignTier"
      WHERE "systemId" = ${id}
      ORDER BY "sortOrder" ASC
    `;
    return NextResponse.json({ tiers });
  } catch (err) {
    console.error("[GET /api/admin/systems/[id]/design-tiers]", err);
    return NextResponse.json({ tiers: [] });
  }
}

// ── POST — create a new design tier ──────────────────────────────────────────
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body   = await req.json();
  const { name, slug, tagline, priceModifier, demoVideoUrl, liveUrl, sortOrder } = body;

  if (!name?.trim() || !slug?.trim())
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });

  // Validate slug — only lowercase, numbers, hyphens
  if (!/^[a-z0-9-]+$/.test(slug.trim()))
    return NextResponse.json({ error: "slug must be lowercase letters, numbers, hyphens only" }, { status: 400 });

  const parsedPrice     = typeof priceModifier === "number" ? priceModifier : parseInt(priceModifier ?? "0", 10);
  const parsedSortOrder = typeof sortOrder === "number" ? sortOrder : parseInt(sortOrder ?? "0", 10);

  try {
    const tierId = require("crypto").randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "DesignTier" (id, "systemId", name, slug, tagline, "priceModifier", "demoVideoUrl", "liveUrl", "sortOrder", "createdAt")
      VALUES (
        ${tierId}, ${id}, ${name.trim()}, ${slug.trim()},
        ${tagline?.trim() || null}, ${parsedPrice},
        ${demoVideoUrl?.trim() || null}, ${liveUrl?.trim() || null},
        ${parsedSortOrder}, NOW()
      )
    `;

    const [tier] = await prisma.$queryRaw<any[]>`
      SELECT id, "systemId", name, slug, tagline, "priceModifier", "demoVideoUrl", "liveUrl", "sortOrder"
      FROM "DesignTier" WHERE id = ${tierId}
    `;
    return NextResponse.json({ tier }, { status: 201 });
  } catch (err: any) {
    // Unique constraint violation on [systemId, slug]
    if (err?.code === "23505" || err?.message?.includes("unique"))
      return NextResponse.json({ error: "A tier with this slug already exists for this system." }, { status: 409 });
    console.error("[POST /api/admin/systems/[id]/design-tiers]", err);
    return NextResponse.json({ error: "Failed to create tier." }, { status: 500 });
  }
}
