export const dynamic = "force-dynamic";
// GET /api/systems — Returns full system data for the visitor page.

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

export async function GET() {
  try {
    const systems = await prisma.system.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id:            true,
        tag:           true,
        title:         true,
        basePrice:     true,
        accent:        true,
        description:   true,
        timeline:      true,
        deploy:        true,
        features:      true,
        displayStatus: true,
        addons: {
          orderBy: [{ category: "asc" }, { label: "asc" }],
          select: {
            id:          true,
            addonKey:    true,
            label:       true,
            price:       true,
            category:    true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({ systems });
  } catch (err) {
    console.error("[GET /api/systems]", err);
    return NextResponse.json({ systems: [] });
  }
}