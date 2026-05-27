export const dynamic = 'force-dynamic';
// api/admin/addons/[id]/route.ts — Admin-only PATCH + DELETE for a SystemAddon by id.
// PATCH: update label, price, category, or description of any addon directly by its id.
// DELETE: remove an addon by its id.
// Auth guard: requires active ADMIN session on every handler.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

type Params = { params: { id: string } };

// ── Guard: Admin only ─────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// ── PATCH /api/admin/addons/[id] — update an addon's fields ──────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body    = await req.json();
  const allowed = ["label", "price", "category", "description"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  try {
    const addon = await prisma.systemAddon.update({ where: { id }, data });
    return NextResponse.json({ addon });
  } catch {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }
}

// ── DELETE /api/admin/addons/[id] — remove an addon ──────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  try {
    await prisma.systemAddon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }
}