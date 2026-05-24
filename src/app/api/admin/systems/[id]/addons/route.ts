// POST /api/admin/systems/[id]/addons
// Admin-only. Creates a new SystemAddon under the given system.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { label, price, category, description } = body;

  if (!label || typeof label !== "string" || label.trim().length === 0) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
  }
  if (!category || typeof category !== "string" || category.trim().length === 0) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  // Generate a unique addonKey from label (slug-style) + timestamp
  const addonKey = label.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + "_" + Date.now();

  const addon = await prisma.systemAddon.create({
    data: {
      addonKey,
      label:       label.trim(),
      price:       Math.round(price),
      category:    category.trim(),
      description: description?.trim() ?? null,
      systemId:    id,
    },
  });

  return NextResponse.json({ addon }, { status: 201 });
}