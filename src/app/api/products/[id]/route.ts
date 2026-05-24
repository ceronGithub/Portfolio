// DELETE & PATCH /api/admin/products/[id] — Delete with cascade or update fields.
// DELETE: Removes product + cascading orders & ownership records.
// PATCH: Updates product fields (isActive, price, media, etc).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify product exists before deleting
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete cascading: first remove all orders for this product
    await prisma.order.deleteMany({
      where: { productId: id },
    });

    // Remove all ownership records for this product
    await prisma.ownership.deleteMany({
      where: { productId: id },
    });

    // Finally delete the product itself
    const deleted = await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/admin/products", "layout");
    revalidatePath("/buyer", "layout");

    return NextResponse.json({
      message: `Product "${product.name}" deleted with cascade`,
      deleted,
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/products/[id]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body   = await req.json();

    // ── isLatest toggle ───────────────────────────────────────────────
    // Only one product per category can be isLatest. When setting true,
    // first clear all siblings, then set the target. Two plain updates —
    // no transaction needed since brief inconsistency is acceptable here.
    if (typeof body.isLatest === "boolean") {
      if (body.isLatest === true) {
        // Find the product's category
        const product = await prisma.product.findUnique({
          where:  { id },
          select: { category: true },
        });
        if (!product) {
          return NextResponse.json({ error: "Product not found." }, { status: 404 });
        }
        // Clear isLatest on all others in same category
        await prisma.product.updateMany({
          where: { category: product.category, id: { not: id } },
          data:  { isLatest: false },
        });
      }
      // Set the target
      const updated = await prisma.product.update({
        where: { id },
        data:  { isLatest: body.isLatest },
      });
      revalidatePath("/buyer", "layout");
      return NextResponse.json({ product: updated });
    }

    // ── All other field updates ───────────────────────────────────────
    const MEDIA = [
      "previewVideoUrl", "facePngUrl", "threeDUrl",
      "actionOneUrl", "actionTwoUrl", "actionThreeUrl",
    ] as const;

    const data: Record<string, unknown> = {};

    if (typeof body.isActive  === "boolean") data.isActive  = body.isActive;
    if (typeof body.price     === "number")  data.price     = body.price;
    if (typeof body.name      === "string")  data.name      = body.name.trim();
    if ("description" in body)               data.description = body.description ?? null;

    for (const field of MEDIA) {
      if (field in body) data[field] = typeof body[field] === "string" ? body[field] : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.product.update({ where: { id }, data });
    revalidatePath("/buyer", "layout");
    return NextResponse.json({ product: updated });

  } catch (err: any) {
    console.error("[PATCH /api/admin/products/[id]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}