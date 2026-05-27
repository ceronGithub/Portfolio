export const dynamic = 'force-dynamic';
// POST /api/admin/systems/[id]/addons — Create a new addon for a system.
// Admin-only.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── POST — create addon for system ────────────────────────────────────────────
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: systemId } = await context.params;
  const body = await req.json();
  const { label, price, category, description } = body;

  if (!label || typeof label !== "string")
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  if (typeof price !== "number" || price < 0)
    return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
  if (!category || typeof category !== "string")
    return NextResponse.json({ error: "category is required" }, { status: 400 });

  try {
    // addonKey = slugified label for stable referencing
    const addonKey = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const addon = await prisma.systemAddon.create({
      data: {
        systemId,
        addonKey,
        label:       label.trim(),
        price,
        category:    category.trim(),
        description: description ?? null,
      },
    });
    return NextResponse.json({ addon }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/systems/[id]/addons]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}