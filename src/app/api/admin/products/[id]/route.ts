export const dynamic = 'force-dynamic';
// PATCH /api/admin/products/[id] — Admin-only product field updater.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";

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
      // Set the target — also update packageTier if provided in same call
      const latestData: Record<string, unknown> = { isLatest: body.isLatest };
      const VALID_TIERS_SET = ["mesh_only", "standard", "full_pack"];
      if (typeof body.packageTier === "string" && VALID_TIERS_SET.includes(body.packageTier)) {
        latestData.packageTier = body.packageTier;
      }
      const updated = await prisma.product.update({
        where: { id },
        data:  latestData,
      });
      revalidatePath("/buyer", "layout");
      return NextResponse.json({ product: updated });
    }

    // ── All other field updates ───────────────────────────────────────
    const MEDIA = [
      "previewVideoUrl", "facePngUrl", "threeDUrl",
      "actionOneUrl", "actionTwoUrl", "actionThreeUrl",
      "fileKeyObj", "fileKeyFbx", "fileKeyGlb",
      "animIdleUrl", "animWalkUrl", "animRunUrl",
      "animAttackOneUrl", "animAttackTwoUrl", "animDeathUrl", "animHitUrl",
    ] as const;

    const TIER_PRICES = ["priceMesh", "priceStandard", "priceFull"] as const;
    const VALID_TIERS = ["mesh_only", "standard", "full_pack"];

    const data: Record<string, unknown> = {};

    if (typeof body.isActive    === "boolean") data.isActive    = body.isActive;
    if (typeof body.price       === "number")  data.price       = body.price;
    if (typeof body.name        === "string")  data.name        = body.name.trim();
    if ("description" in body)                 data.description = body.description ?? null;

    // packageTier — validates against known enum values
    if (typeof body.packageTier === "string" && VALID_TIERS.includes(body.packageTier)) {
      data.packageTier = body.packageTier;
    }

    for (const field of TIER_PRICES) {
      if (field in body) data[field] = body[field] !== null ? Number(body[field]) : null;
    }

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
// ── DELETE /api/admin/products/[id] — cascade delete product ─────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Cascade: remove ownership and orders before deleting product
    await prisma.ownership.deleteMany({ where: { productId: id } });
    await prisma.order.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    revalidatePath("/buyer", "layout");
    return NextResponse.json({ deleted: true });

  } catch (err: any) {
    console.error("[DELETE /api/admin/products/[id]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}