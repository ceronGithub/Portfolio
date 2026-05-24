// GET  /api/admin/products?category=... — Returns active products by category.
// POST /api/admin/products             — Creates a new product (admin only).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";

// Force dynamic — reads live DB, must not be cached at build time.
export const dynamic = "force-dynamic";

function toProxyUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("/api/drive-video")) return raw;
  const matchFile  = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile)  return `/api/drive-video?id=${matchFile[1]}`;
  const matchParam = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchParam) return `/api/drive-video?id=${matchParam[1]}`;
  return raw;
}

const ANIM_KEYS = [
  { key: "animIdleUrl",      label: "Idle"     },
  { key: "animWalkUrl",      label: "Walk"     },
  { key: "animRunUrl",       label: "Run"      },
  { key: "animAttackOneUrl", label: "Attack 1" },
  { key: "animAttackTwoUrl", label: "Attack 2" },
  { key: "animDeathUrl",     label: "Death"    },
  { key: "animHitUrl",       label: "Hit"      },
] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category   = searchParams.get("category");
  const latestOnly = searchParams.get("latest") === "true";

  const validCategories = ["character", "weapon", "interior", "exterior"];
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json(
      { error: "Valid category required: character | weapon | interior | exterior" },
      { status: 400 }
    );
  }

  const products = await prisma.product.findMany({
    where: {
      category: category as "character" | "weapon" | "interior" | "exterior",
      isActive: true,
      ...(latestOnly ? { isLatest: true } : {}),
    },
    select: {
      id:              true,
      name:            true,
      price:           true,
      category:        true,
      packageTier:     true,
      isLatest:        true,
      previewVideoUrl: true,
      facePngUrl:      true,
      fileKeyObj:      true,
      fileKeyFbx:      true,
      fileKeyGlb:      true,
      animIdleUrl:     true,
      animWalkUrl:     true,
      animRunUrl:      true,
      animAttackOneUrl: true,
      animAttackTwoUrl: true,
      animDeathUrl:    true,
      animHitUrl:      true,
      actionOneUrl:    true,
      actionTwoUrl:    true,
      actionThreeUrl:  true,
    },
    orderBy: { createdAt: "asc" },
  });

  const mapped = products.map((p: Record<string, any>) => {
    const animNames = ANIM_KEYS
      .filter(a => !!p[a.key])
      .map(a => a.label);

    return {
      id:             p.id,
      name:           p.name,
      price:          p.price,
      category:       p.category,
      packageTier:    p.packageTier,
      isLatest:       p.isLatest,
      previewVideoUrl: toProxyUrl(p.previewVideoUrl),
      facePngUrl:     p.facePngUrl,
      // Format flags — buyer UI uses these for badges
      hasObj:         !!p.fileKeyObj,
      hasFbx:         !!p.fileKeyFbx,
      hasGlb:         !!p.fileKeyGlb,
      // Animation summary
      animCount:      animNames.length,
      animNames,
      // Legacy
      actionOneUrl:   toProxyUrl(p.actionOneUrl),
      actionTwoUrl:   toProxyUrl(p.actionTwoUrl),
      actionThreeUrl: toProxyUrl(p.actionThreeUrl),
    };
  });

  return NextResponse.json({ products: mapped });
}
// POST /api/admin/products — Create a new product. Admin only.
// Accepts all product fields; only name, price, category are required.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, price, category, description, isLatest,
            previewVideoUrl, facePngUrl, threeDUrl,
            actionOneUrl, actionTwoUrl, actionThreeUrl,
            fileKeyObj, fileKeyFbx, fileKeyGlb,
            animIdleUrl, animWalkUrl, animRunUrl,
            animAttackOneUrl, animAttackTwoUrl, animDeathUrl, animHitUrl,
          } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "price must be a non-negative number" }, { status: 400 });
    }
    const validCategories = ["character", "weapon", "interior", "exterior"];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json({ error: "category must be character | weapon | interior | exterior" }, { status: 400 });
    }

    // If isLatest is true, clear siblings in same category first
    if (isLatest === true) {
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
        description:     description?.trim() || null,
        isLatest:        isLatest === true,
        isActive:        true,
        previewVideoUrl: previewVideoUrl?.trim() || null,
        facePngUrl:      facePngUrl?.trim()      || null,
        threeDUrl:       threeDUrl?.trim()        || null,
        actionOneUrl:    actionOneUrl?.trim()     || null,
        actionTwoUrl:    actionTwoUrl?.trim()     || null,
        actionThreeUrl:  actionThreeUrl?.trim()   || null,
        fileKeyObj:      fileKeyObj?.trim()       || null,
        fileKeyFbx:      fileKeyFbx?.trim()       || null,
        fileKeyGlb:      fileKeyGlb?.trim()       || null,
        animIdleUrl:     animIdleUrl?.trim()      || null,
        animWalkUrl:     animWalkUrl?.trim()       || null,
        animRunUrl:      animRunUrl?.trim()        || null,
        animAttackOneUrl: animAttackOneUrl?.trim() || null,
        animAttackTwoUrl: animAttackTwoUrl?.trim() || null,
        animDeathUrl:    animDeathUrl?.trim()      || null,
        animHitUrl:      animHitUrl?.trim()        || null,
      },
    });

    revalidatePath("/buyer", "layout");
    revalidatePath("/admin/products", "layout");

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/products]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}