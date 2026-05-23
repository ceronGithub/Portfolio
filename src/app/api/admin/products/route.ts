// GET /api/products?category=character|weapon|interior|exterior[&latest=true]
// Returns active products filtered by category.
// GDrive viewer URLs are rewritten to /api/drive-video proxy URLs.
// New: packageTier, hasObj/hasFbx/hasGlb flags, animCount, animNames returned.

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

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