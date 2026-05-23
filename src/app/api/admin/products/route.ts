// GET /api/products?category=character|weapon|interior|exterior[&latest=true]
// Public route — returns active products filtered by category.
// Optional: &latest=true returns only products with isLatest=true.
// Used by the buyer browse modal and Latest Drop sections.
//
// NOTE: The seed stores GDrive viewer URLs (drive.google.com/file/d/{id}/view).
// Browsers cannot use these as <video src>. This route rewrites them to
// /api/drive-video?id={id} proxy URLs before returning so videos load correctly.

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

// Force dynamic rendering — this route reads live DB data.
// Without this Next.js caches the response at build time.
export const dynamic = "force-dynamic";

// Extract the raw Drive file ID from any supported GDrive URL format,
// or return the value unchanged if it's already a proxy URL or null.
function toProxyUrl(raw: string | null): string | null {
  if (!raw) return null;
  // Already a proxy URL — leave it alone
  if (raw.startsWith("/api/drive-video")) return raw;
  // drive.google.com/file/d/{id}/view  OR  /open?id={id}  OR  /uc?id={id}
  const matchFile = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) return `/api/drive-video?id=${matchFile[1]}`;
  const matchParam = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchParam) return `/api/drive-video?id=${matchParam[1]}`;
  return raw;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const latestOnly = searchParams.get("latest") === "true";

  const validCategories = ["character", "weapon", "interior", "exterior"];

  if (!category || !validCategories.includes(category)) {
    return NextResponse.json({ error: "Valid category required: character | weapon | interior | exterior" }, { status: 400 });
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
      isLatest:        true,
      previewVideoUrl: true,
      facePngUrl:      true,
      actionOneUrl:    true,
      actionTwoUrl:    true,
      actionThreeUrl:  true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Rewrite all GDrive viewer URLs → /api/drive-video proxy URLs
  const mapped = products.map(p => ({
    ...p,
    previewVideoUrl: toProxyUrl(p.previewVideoUrl),
    actionOneUrl:    toProxyUrl(p.actionOneUrl),
    actionTwoUrl:    toProxyUrl(p.actionTwoUrl),
    actionThreeUrl:  toProxyUrl(p.actionThreeUrl),
  }));

  return NextResponse.json({ products: mapped });
}