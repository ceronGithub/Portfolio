// POST /api/admin/products
// Admin-only. Creates a new Product record in the database.
// Required body fields: name (string), price (number), category (string).
// Optional: description, isLatest, isActive, previewVideoUrl, facePngUrl,
//           threeDUrl, actionOneUrl, actionTwoUrl, actionThreeUrl.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

const VALID_CATEGORIES = ["weapon", "character", "interior", "exterior"] as const;
type ProductCategory = typeof VALID_CATEGORIES[number];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Validate required fields
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name (string) is required." }, { status: 400 });
  }
  if (typeof body.price !== "number" || body.price < 0) {
    return NextResponse.json({ error: "price (non-negative number) is required." }, { status: 400 });
  }
  if (!body.category || !VALID_CATEGORIES.includes(body.category as ProductCategory)) {
    return NextResponse.json(
      { error: "category must be one of: weapon | character | interior | exterior" },
      { status: 400 }
    );
  }

  const newProduct = await prisma.product.create({
    data: {
      name:            body.name.trim(),
      price:           body.price,
      category:        body.category as ProductCategory,
      description:     typeof body.description  === "string" ? body.description  : null,
      isLatest:        typeof body.isLatest      === "boolean" ? body.isLatest    : false,
      isActive:        typeof body.isActive      === "boolean" ? body.isActive    : true,
      previewVideoUrl: typeof body.previewVideoUrl === "string" ? body.previewVideoUrl : null,
      facePngUrl:      typeof body.facePngUrl      === "string" ? body.facePngUrl      : null,
      threeDUrl:       typeof body.threeDUrl        === "string" ? body.threeDUrl        : null,
      actionOneUrl:    typeof body.actionOneUrl    === "string" ? body.actionOneUrl    : null,
      actionTwoUrl:    typeof body.actionTwoUrl    === "string" ? body.actionTwoUrl    : null,
      actionThreeUrl:  typeof body.actionThreeUrl  === "string" ? body.actionThreeUrl  : null,
    },
  });

  return NextResponse.json({ product: newProduct }, { status: 201 });
}