export const dynamic = 'force-dynamic';
// PATCH /api/admin/systems/[id] — Update system fields (basePrice, title, description, etc.)
// DELETE /api/admin/systems/[id] — Deactivate or delete a system.
// Admin-only.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

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
    "bgVideoUrl", "demoVideoUrl",
  ];

  const data: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  try {
    const system = await prisma.system.update({ where: { id }, data });
    return NextResponse.json({ system });
  } catch {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
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