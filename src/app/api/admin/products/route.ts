export const dynamic = 'force-dynamic';
// POST /api/admin/products — Creates a new product record in the database.
// PATCH and DELETE live in [id]/route.ts (dynamic segment).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";

// ── POST /api/admin/products — Create a new product ──────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, category, priceMeshOnly, priceStandard, priceFullPack } = body;

    if (!name?.trim())    return NextResponse.json({ error: "Name is required."     }, { status: 400 });
    if (!category?.trim()) return NextResponse.json({ error: "Category is required." }, { status: 400 });
    if (typeof priceMeshOnly !== "number" || priceMeshOnly < 0)
      return NextResponse.json({ error: "Invalid Mesh Only price."  }, { status: 400 });
    if (typeof priceStandard !== "number" || priceStandard < 0)
      return NextResponse.json({ error: "Invalid Standard price."   }, { status: 400 });
    if (typeof priceFullPack !== "number" || priceFullPack < 0)
      return NextResponse.json({ error: "Invalid Full Pack price."  }, { status: 400 });

    const VALID_TIERS = ["mesh_only", "standard", "full_pack"];
    const rawTiers    = typeof body.enabledTiers === "string" ? body.enabledTiers : "mesh_only,standard,full_pack";
    const enabledTiers = rawTiers.split(",").map((t: string) => t.trim()).filter((t: string) => VALID_TIERS.includes(t)).join(",")
      || "mesh_only,standard,full_pack";

    const data: Record<string, unknown> = {
      name:          name.trim(),
      category:      category.trim(),
      priceMeshOnly,
      priceStandard,
      priceFullPack,
      enabledTiers,
      isActive:      true,
      isLatest:      false,
    };

    // Optional fields
    if (body.description)     data.description     = body.description;
    if (body.previewVideoUrl)  data.previewVideoUrl  = body.previewVideoUrl;
    if (body.facePngUrl)       data.facePngUrl       = body.facePngUrl;
    if (body.threeDUrl)        data.threeDUrl         = body.threeDUrl;
    if (body.mediaDriveIds)    data.mediaDriveIds     = body.mediaDriveIds;
    const actionFields = ["actionOneUrl","actionTwoUrl","actionThreeUrl","actionFourUrl","actionFiveUrl","actionSixUrl","actionSevenUrl"];
    for (const f of actionFields) {
      if (body[f]) data[f] = body[f];
    }

    // isLatest — if true, clear siblings in same category first
    if (body.isLatest === true) {
      await prisma.product.updateMany({
        where: { category: category.trim() },
        data:  { isLatest: false },
      });
      data.isLatest = true;
    }

    const product = await prisma.product.create({ data: data as any });

    revalidatePath("/buyer",          "layout");
    revalidatePath("/admin/products", "layout");

    return NextResponse.json({ product }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/admin/products]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}