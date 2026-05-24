// POST   /api/admin/unlock — Creates an Ownership record (manual grant).
// PATCH  /api/admin/unlock — Attaches a fileKey to an existing Ownership record.
// DELETE /api/admin/unlock — Removes an Ownership record (revoke access).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Creates or updates an Ownership record linking a user to a product.
// Accepts optional fileKey to attach a download file at grant time.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, productId, fileKey, grantedTier } = await req.json();
  if (!userId || !productId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const tier = grantedTier ?? "mesh_only";

  const ownership = await (prisma.ownership as any).upsert({
    where:  { userId_productId: { userId, productId } },
    update: { fileKey: fileKey ?? null, grantedTier: tier },
    create: { userId, productId, fileKey: fileKey ?? null, grantedTier: tier },
  });

  return NextResponse.json({ ownership });
}

// Attaches (or clears) a fileKey on an existing Ownership record.
// Body: { userId, productId, fileKey: string | null }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, productId, fileKey, grantedTier } = await req.json();
  if (!userId || !productId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const data: any = { fileKey: fileKey ?? null };
  if (grantedTier) data.grantedTier = grantedTier;

  const ownership = await (prisma.ownership as any).update({
    where: { userId_productId: { userId, productId } },
    data,
  });

  return NextResponse.json({ ownership });
}

// Removes an Ownership record, revoking product access from a user.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, productId } = await req.json();
  if (!userId || !productId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await prisma.ownership.deleteMany({
    where: { userId, productId },
  });

  return NextResponse.json({ ok: true });
}