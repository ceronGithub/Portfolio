export const dynamic = 'force-dynamic';
// GET  /api/admin/products — Returns all products for admin dashboard.
// POST /api/admin/products — Creates a new product record.
// Protected: ADMIN only.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";

// ── GET — list all products ───────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

// ── POST — create a new product ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, price, category, description,
            previewVideoUrl, facePngUrl, threeDUrl,
            actionOneUrl, actionTwoUrl, actionThreeUrl,
            actionFourUrl, actionFiveUrl, actionSixUrl, actionSevenUrl,
            fileKeyObj, fileKeyFbx, fileKeyGlb,
            animIdleUrl, animWalkUrl, animRunUrl,
            animAttackOneUrl, animAttackTwoUrl, animDeathUrl, animHitUrl,
            mediaDriveIds,
          } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }

    const VALID_CATEGORIES = ["weapon", "character", "interior", "exterior"];
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // ── If isLatest is true, clear the flag on all sibling products in same category
    // so only one product per category holds the isLatest flag at a time.
    const isLatestValue = body.isLatest === true;
    if (isLatestValue) {
      await prisma.product.updateMany({
        where: { category, isLatest: true },
        data:  { isLatest: false },
      });
    }

    const product = await prisma.product.create({
      data: {
        name:            name.trim(),
        price,
        category,
        description:     description ?? null,
        isLatest:        isLatestValue,
        previewVideoUrl: previewVideoUrl ?? null,
        facePngUrl:      facePngUrl      ?? null,
        threeDUrl:       threeDUrl       ?? null,
        actionOneUrl:    actionOneUrl    ?? null,
        actionTwoUrl:    actionTwoUrl    ?? null,
        actionThreeUrl:  actionThreeUrl  ?? null,
        actionFourUrl:   actionFourUrl   ?? null,
        actionFiveUrl:   actionFiveUrl   ?? null,
        actionSixUrl:    actionSixUrl    ?? null,
        actionSevenUrl:  actionSevenUrl  ?? null,
        fileKeyObj:      fileKeyObj      ?? null,
        fileKeyFbx:      fileKeyFbx      ?? null,
        fileKeyGlb:      fileKeyGlb      ?? null,
        animIdleUrl:     animIdleUrl     ?? null,
        animWalkUrl:     animWalkUrl     ?? null,
        animRunUrl:      animRunUrl      ?? null,
        animAttackOneUrl:animAttackOneUrl?? null,
        animAttackTwoUrl:animAttackTwoUrl?? null,
        animDeathUrl:    animDeathUrl    ?? null,
        animHitUrl:      animHitUrl      ?? null,
        mediaDriveIds:   typeof mediaDriveIds === "string" ? mediaDriveIds : null,
      },
    });

    revalidatePath("/buyer", "layout");
    return NextResponse.json({ product }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/admin/products]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}