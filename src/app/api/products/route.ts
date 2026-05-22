// GET /api/products?category=character|weapon|interior|exterior
// Public route — returns active products filtered by category.
// Used by the buyer browse modal to populate Character and Weapon tabs.

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const validCategories = ["character", "weapon", "interior", "exterior"];

  if (!category || !validCategories.includes(category)) {
    return NextResponse.json({ error: "Valid category required: character | weapon | interior | exterior" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: {
      category: category as "character" | "weapon" | "interior" | "exterior",
      isActive: true,
    },
    select: {
      id:             true,
      name:           true,
      price:          true,
      category:       true,
      previewVideoUrl: true,
      facePngUrl:     true,
      actionOneUrl:   true,
      actionTwoUrl:   true,
      actionThreeUrl: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ products });
}