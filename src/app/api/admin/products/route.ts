export const dynamic = 'force-dynamic';
// PATCH /api/admin/products/[id] — Admin-only product field updater.
// DELETE /api/admin/products/[id] — Purges all R2 + Drive files then deletes DB record.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { revalidatePath }            from "next/cache";
import { getValidAccessToken }       from "@/lib/googleDrive";
import { S3Client, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// ── Lazy R2 client ────────────────────────────────────────────────────
let s3: S3Client | null = null;
function getS3(): S3Client {
  if (s3) return s3;
  s3 = new S3Client({
    region:   "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return s3;
}

// ── deleteR2File — deletes one R2 object by its public URL. Best-effort. ──
async function deleteR2File(url: string): Promise<void> {
  try {
    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");
    if (!publicBase || !url.startsWith(publicBase)) return;
    const key    = url.slice(publicBase.length).replace(/^\//, "");
    const bucket = process.env.R2_BUCKET_NAME!;
    await getS3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    await getS3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch { /* silent — best-effort */ }
}

// ── deleteDriveFile — deletes one Drive file by ID. Best-effort. ──────
async function deleteDriveFile(fileId: string): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return;
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch { /* silent — best-effort */ }
}

// ── PATCH ─────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body   = await req.json();

    // ── isLatest toggle ───────────────────────────────────────────────
    if (typeof body.isLatest === "boolean") {
      if (body.isLatest === true) {
        const product = await prisma.product.findUnique({
          where:  { id },
          select: { category: true },
        });
        if (!product) {
          return NextResponse.json({ error: "Product not found." }, { status: 404 });
        }
        await prisma.product.updateMany({
          where: { category: product.category, id: { not: id } },
          data:  { isLatest: false },
        });
      }
      const latestData: Record<string, unknown> = { isLatest: body.isLatest };
      const VALID_TIERS_SET = ["mesh_only", "standard", "full_pack"];
      if (typeof body.packageTier === "string" && VALID_TIERS_SET.includes(body.packageTier)) {
        latestData.packageTier = body.packageTier;
      }
      const updated = await prisma.product.update({ where: { id }, data: latestData });
      revalidatePath("/buyer", "layout");
      return NextResponse.json({ product: updated });
    }

    // ── All other field updates ───────────────────────────────────────
    const MEDIA = [
      "previewVideoUrl", "facePngUrl", "threeDUrl",
      "actionOneUrl", "actionTwoUrl", "actionThreeUrl",
      "fileKeyObj", "fileKeyFbx", "fileKeyGlb",
      "animIdleUrl", "animWalkUrl", "animRunUrl",
      "animAttackOneUrl", "animAttackTwoUrl", "animDeathUrl", "animHitUrl",
    ] as const;

    const TIER_PRICES = ["priceMeshOnly", "priceStandard", "priceFullPack"] as const;
    const VALID_TIERS = ["mesh_only", "standard", "full_pack"];

    const data: Record<string, unknown> = {};

    if (typeof body.isActive    === "boolean") data.isActive    = body.isActive;
    if (typeof body.name        === "string")  data.name        = body.name.trim();
    if ("description" in body)                 data.description = body.description ?? null;

    if (typeof body.packageTier === "string" && VALID_TIERS.includes(body.packageTier)) {
      data.packageTier = body.packageTier;
    }

    // enabledTiers — comma-separated list of buyer-visible tiers, e.g. "mesh_only,standard"
    // At least one tier must remain enabled.
    if (typeof body.enabledTiers === "string") {
      const tiers = body.enabledTiers.split(",").map((t: string) => t.trim()).filter((t: string) => VALID_TIERS.includes(t));
      if (tiers.length > 0) data.enabledTiers = tiers.join(",");
    }

    for (const field of TIER_PRICES) {
      if (field in body) data[field] = body[field] !== null ? Number(body[field]) : null;
    }

    for (const field of MEDIA) {
      if (field in body) data[field] = typeof body[field] === "string" ? body[field] : null;
    }

    // mediaDriveIds — JSON string map of { fieldName: driveFileId }
    // Merged with existing map so per-field updates don't erase other fields.
    if (typeof body.mediaDriveIds === "string") {
      // Fetch existing map and merge new entries on top
      const existing = await prisma.product.findUnique({ where: { id }, select: { mediaDriveIds: true } });
      let existingMap: Record<string, string> = {};
      try { existingMap = JSON.parse(existing?.mediaDriveIds ?? "{}"); } catch { /* empty */ }
      const incomingMap: Record<string, string> = {};
      try { Object.assign(incomingMap, JSON.parse(body.mediaDriveIds)); } catch { /* empty */ }
      const mergedMap = { ...existingMap, ...incomingMap };
      data.mediaDriveIds = JSON.stringify(mergedMap);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.product.update({ where: { id }, data });
    revalidatePath("/buyer", "layout");
    return NextResponse.json({ product: updated });

  } catch (err: any) {
    console.error("[PATCH /api/admin/products/[id]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// ── DELETE /api/admin/products/[id] — purge files then cascade delete ─
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch the full product so we know which files to purge
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // ── Collect all media field values ────────────────────────────────
    const ALL_MEDIA_FIELDS = [
      "previewVideoUrl", "facePngUrl",    "threeDUrl",
      "actionOneUrl",    "actionTwoUrl",  "actionThreeUrl",
      "actionFourUrl",   "actionFiveUrl", "actionSixUrl", "actionSevenUrl",
      "animIdleUrl",     "animWalkUrl",   "animRunUrl",
      "animAttackOneUrl","animAttackTwoUrl","animDeathUrl","animHitUrl",
    ] as const;

    const r2Urls:   string[] = [];
    const driveIds: string[] = [];

    for (const field of ALL_MEDIA_FIELDS) {
      const val = (product as Record<string, any>)[field] as string | null;
      if (!val) continue;

      // /api/drive-video?id=XXX — extract Drive ID
      const driveMatch = val.match(/[?&]id=([^&]+)/);
      if (driveMatch) { driveIds.push(driveMatch[1]); continue; }

      // Bare Drive file ID — no http prefix, no slash
      if (!val.startsWith("http") && !val.startsWith("/")) { driveIds.push(val); continue; }

      // R2 public URL
      if (val.startsWith("http") && !val.includes("drive.google.com")) { r2Urls.push(val); continue; }

      // /api/drive-video proxied URL — fallback extraction
      if (val.startsWith("/api/drive-video")) {
        const extracted = new URLSearchParams(val.split("?")[1] ?? "").get("id");
        if (extracted) driveIds.push(extracted);
      }
    }

    // ── Add Drive IDs from mediaDriveIds map (for files uploaded to Both) ──
    // When admin uploads to "both", only the R2 URL is saved to the media field.
    // The Drive file ID is tracked separately here so we can purge it on delete.
    if ((product as Record<string, any>).mediaDriveIds) {
      try {
        const driveMap: Record<string, string> = JSON.parse(
          (product as Record<string, any>).mediaDriveIds as string
        );
        for (const driveId of Object.values(driveMap)) {
          if (driveId && !driveIds.includes(driveId)) driveIds.push(driveId);
        }
      } catch { /* malformed JSON — skip */ }
    }

    // ── Best-effort parallel purge from R2 and Drive ──────────────────
    await Promise.allSettled([
      ...r2Urls.map(deleteR2File),
      ...driveIds.map(deleteDriveFile),
    ]);

    // ── Cascade DB delete ─────────────────────────────────────────────
    await prisma.ownership.deleteMany({ where: { productId: id } });
    await prisma.order.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    revalidatePath("/buyer", "layout");
    return NextResponse.json({ deleted: true });

  } catch (err: any) {
    console.error("[DELETE /api/admin/products/[id]]", err?.message);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

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
    if (body.description)    data.description    = body.description;
    if (body.previewVideoUrl) data.previewVideoUrl = body.previewVideoUrl;
    if (body.facePngUrl)      data.facePngUrl      = body.facePngUrl;
    if (body.threeDUrl)       data.threeDUrl        = body.threeDUrl;
    if (body.mediaDriveIds)   data.mediaDriveIds    = body.mediaDriveIds;
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