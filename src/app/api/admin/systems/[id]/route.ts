export const dynamic = 'force-dynamic';
// PATCH /api/admin/systems/[id]/addons/[addonId] — update addon fields.
// DELETE /api/admin/systems/[id]/addons/[addonId] — delete an addon.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

type Params = { params: { id: string; addonId: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { addonId } = params;
  const body = await req.json();
  const allowed = ["label", "price", "category", "description"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  try {
    const addon = await prisma.systemAddon.update({ where: { id: addonId }, data });
    return NextResponse.json({ addon });
  } catch {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { addonId } = params;
  try {
    await prisma.systemAddon.delete({ where: { id: addonId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }
}