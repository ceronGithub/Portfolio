// PATCH /api/admin/products/[id]
// Admin-only. Updates one or more editable fields on a Product record.
// Accepts: isActive (boolean), isLatest (boolean), price (number),
//          previewVideoUrl, facePngUrl, threeDUrl, actionOneUrl,
//          actionTwoUrl, actionThreeUrl (all strings or null).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// Allowed string-or-null media fields that can be patched directly.
const MEDIA_FIELDS = [
  "previewVideoUrl", "facePngUrl", "threeDUrl",
  "actionOneUrl", "actionTwoUrl", "actionThreeUrl",
] as const;

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

  // Build update data — only include fields present in the request body.
  const data: Record<string, unknown> = {};

  if (typeof body.isActive  === "boolean") data.isActive  = body.isActive;
  if (typeof body.isLatest  === "boolean") data.isLatest  = body.isLatest;
  if (typeof body.price     === "number")  data.price     = body.price;
  if (typeof body.name      === "string")  data.name      = body.name.trim();
  if (typeof body.description === "string" || body.description === null)
    data.description = body.description;

  for (const field of MEDIA_FIELDS) {
    if (field in body) {
      const val = body[field];
      if (typeof val === "string" || val === null) data[field] = val;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  // isLatest is per-category exclusive: only one product per category can be
  // the latest drop. When setting isLatest: true, clear the flag on all other
  // products in the same category first (atomic transaction).
  let updatedProduct;
  if (data.isLatest === true) {
    const target = await prisma.product.findUnique({
      where:  { id },
      select: { category: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    [, updatedProduct] = await prisma.$transaction([
      prisma.product.updateMany({
        where: { category: target.category, id: { not: id }, isLatest: true },
        data:  { isLatest: false },
      }),
      prisma.product.update({ where: { id }, data }),
    ]);
  } else {
    updatedProduct = await prisma.product.update({ where: { id }, data });
  }

  return NextResponse.json({ product: updatedProduct });
}