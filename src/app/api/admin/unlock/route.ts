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

  const { userId, productId, fileKey } = await req.json();
  if (!userId || !productId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Auto-resolve fileKey from Product if not provided by admin
  let resolvedFileKey = fileKey ?? null;
  if (!resolvedFileKey) {
    const product = await prisma.product.findUnique({
      where:  { id: productId },
      select: { fileKeyObj: true, fileKeyFbx: true, fileKeyGlb: true },
    });
    // Use first available file key from product
    resolvedFileKey = product?.fileKeyObj ?? product?.fileKeyFbx ?? product?.fileKeyGlb ?? null;
  }

  const ownership = await (prisma.ownership as any).upsert({
    where:  { userId_productId: { userId, productId } },
    update: { fileKey: resolvedFileKey },
    create: { userId, productId, fileKey: resolvedFileKey },
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

  const { userId, productId, fileKey } = await req.json();
  if (!userId || !productId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const ownership = await (prisma.ownership as any).update({
    where: { userId_productId: { userId, productId } },
    data:  { fileKey: fileKey ?? null },
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