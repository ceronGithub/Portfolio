export const dynamic = 'force-dynamic';
// GET /api/products?category=character|weapon|interior|exterior
// Returns active products for a given category.
// Used by AssetBuySection and ArchitectureBuySection to populate the browse modal.
import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

const VALID_CATEGORIES = ["weapon", "character", "interior", "exterior"] as const;
type ValidCategory = typeof VALID_CATEGORIES[number];

// Category → accent color mapping
const CATEGORY_ACCENT: Record<ValidCategory, string> = {
  character: "#22c55e",
  weapon:    "#c9935e",
  interior:  "#60a5fa",
  exterior:  "#a78bfa",
};

function toProxyUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("/api/drive-video")) return raw;
  const matchFile = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) return `/api/drive-video?id=${matchFile[1]}`;
  return raw;
}

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "";

  if (!VALID_CATEGORIES.includes(category as ValidCategory)) {
    return NextResponse.json({ error: "Invalid or missing category" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where:   { category: category as ValidCategory, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id:             true,
      slug:           true,
      name:           true,
      price:          true,
      category:       true,
      packageTier:    true,
      previewVideoUrl:true,
      facePngUrl:     true,
      fileKeyObj:     true,
      fileKeyFbx:     true,
      fileKeyGlb:     true,
      animIdleUrl:    true,
      animWalkUrl:    true,
      animRunUrl:     true,
      animAttackOneUrl:true,
      animAttackTwoUrl:true,
      animDeathUrl:   true,
      animHitUrl:     true,
    },
  });

  const mapped = products.map((p: any) => ({
    id:             p.id,
    slug:           p.slug,
    name:           p.name,
    price:          p.price,
    category:       p.category,
    packageTier:    p.packageTier,
    accent:         CATEGORY_ACCENT[p.category as ValidCategory] ?? "#888",
    previewVideoUrl: toProxyUrl(p.previewVideoUrl),
    facePngUrl:     p.facePngUrl,
    hasObj:         !!p.fileKeyObj,
    hasFbx:         !!p.fileKeyFbx,
    hasGlb:         !!p.fileKeyGlb,
    animCount: [
      p.animIdleUrl, p.animWalkUrl, p.animRunUrl,
      p.animAttackOneUrl, p.animAttackTwoUrl,
      p.animDeathUrl, p.animHitUrl,
    ].filter(Boolean).length,
    animNames: [
      p.animIdleUrl      ? "Idle"     : null,
      p.animWalkUrl      ? "Walk"     : null,
      p.animRunUrl       ? "Run"      : null,
      p.animAttackOneUrl ? "Attack 1" : null,
      p.animAttackTwoUrl ? "Attack 2" : null,
      p.animDeathUrl     ? "Death"    : null,
      p.animHitUrl       ? "Hit"      : null,
    ].filter(Boolean),
  }));

  return NextResponse.json({ products: mapped });
}