export const dynamic = 'force-dynamic';
// GET /api/products/by-ids?ids=id1,id2,...
// Returns minimal product data for a set of cuid IDs.
// Used by CartDrawer to resolve display names, categories, prices, and accent colors.

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

// Category → accent color mapping (matches ASSET_META in BuyerDashboardClient)
const CATEGORY_ACCENT: Record<string, string> = {
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
  const rawIds = req.nextUrl.searchParams.get("ids") ?? "";
  const ids    = rawIds.split(",").map(s => s.trim()).filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where:  { id: { in: ids } },
    select: { id: true, name: true, priceMeshOnly: true, priceStandard: true, priceFullPack: true, category: true, previewVideoUrl: true },
  });

  const mapped = products.map((p: { id: string; name: string; priceMeshOnly: number; priceStandard: number; priceFullPack: number; category: string; previewVideoUrl: string | null }) => ({
    id:             p.id,
    name:           p.name,
    category:       p.category,
    priceMeshOnly:  p.priceMeshOnly,
    priceStandard:  p.priceStandard,
    priceFullPack:  p.priceFullPack,
    accent:         CATEGORY_ACCENT[p.category] ?? "#888",
    previewVideoUrl: toProxyUrl(p.previewVideoUrl),
  }));

  return NextResponse.json({ products: mapped });
}