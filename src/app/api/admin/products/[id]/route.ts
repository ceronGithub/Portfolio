// PATCH /api/admin/products/[id]
// Admin-only. Updates isActive field on a Product record.
// Used by the Products page toggle button.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body   = await req.json();

  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive (boolean) required" }, { status: 400 });
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data:  { isActive: body.isActive },
  });

  return NextResponse.json({ product: updatedProduct });
}
