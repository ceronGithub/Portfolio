export const dynamic = 'force-dynamic';
// api/admin/addons/[id]/route.ts — Admin-only PATCH + DELETE for a SystemAddon by id.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") return null;
  return session;
}

// Updates an existing SystemAddon — accepts label, price, category, description fields.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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

// Deletes a SystemAddon by id — admin only.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.systemAddon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }
}