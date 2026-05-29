export const dynamic = 'force-dynamic';
// PATCH /api/admin/systems/[id] — Update system fields.
// DELETE /api/admin/systems/[id] — Remove a system.
// Admin-only.
// Uses $executeRaw for displayStatus updates so it works even when
// the Prisma generated client is stale (pre-generate after migration).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

const VALID_DISPLAY_STATUSES = ["visible", "coming_soon", "ongoing", "hidden"];

// ── PATCH — update system fields ──────────────────────────────────────────────
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body    = await req.json();

  const ALLOWED = [
    "basePrice", "title", "description", "accent",
    "timeline", "deploy", "features", "isActive",
    "bgVideoUrl", "demoVideoUrl", "displayStatus",
  ];

  const data: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) data[key] = body[key];
  }

  // Validate displayStatus value
  if ("displayStatus" in data && !VALID_DISPLAY_STATUSES.includes(data.displayStatus as string)) {
    return NextResponse.json({ error: "Invalid displayStatus value" }, { status: 400 });
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  // Pull displayStatus out separately — handle via raw SQL to survive stale Prisma client
  const { displayStatus, ...prismaData } = data;

  try {
    // 1. Update all non-displayStatus fields via Prisma ORM
    if (Object.keys(prismaData).length > 0) {
      await prisma.system.update({ where: { id }, data: prismaData });
    }

    // 2. Update displayStatus via raw SQL — works regardless of Prisma client generation state
    if (displayStatus !== undefined) {
      await prisma.$executeRaw`
        UPDATE "System"
        SET    "displayStatus" = ${displayStatus as string}
        WHERE  id = ${id}
      `;
    }

    const updated = await prisma.system.findUnique({ where: { id } });
    return NextResponse.json({ system: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/systems]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ── DELETE — remove a system ──────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  try {
    await prisma.systemAddon.deleteMany({ where: { systemId: id } });
    await prisma.system.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }
}
