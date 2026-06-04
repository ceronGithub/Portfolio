export const dynamic = "force-dynamic";
// GET /api/buyer/download?productId=xxx&field=fileKeyObj
// Verifies buyer owns the product and the requested field is allowed for their tier.
// Then redirects to R2 public URL (direct) or proxies the Drive file.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { getValidAccessToken }       from "@/lib/googleDrive";

// ── Fields allowed per tier ───────────────────────────────────────────────────
const TIER_FIELDS: Record<string, string[]> = {
  mesh_only: [
    "fileKeyObj", "fileKeyFbx", "facePngUrl", "fileKey",
  ],
  standard: [
    "fileKeyObj", "fileKeyFbx", "fileKeyGlb", "facePngUrl", "fileKey",
    "previewVideoUrl",
    "animIdleUrl", "animWalkUrl", "animRunUrl", "animAttackOneUrl", "animDeathUrl",
  ],
  full_pack: [
    "fileKeyObj", "fileKeyFbx", "fileKeyGlb", "facePngUrl", "fileKey",
    "previewVideoUrl",
    "animIdleUrl", "animWalkUrl", "animRunUrl", "animAttackOneUrl", "animDeathUrl",
    "animAttackTwoUrl", "animHitUrl",
  ],
};

function isDriveId(value: string): boolean {
  // Drive file IDs are alphanumeric + dashes/underscores, no slashes or spaces
  // R2/HTTP URLs always start with http
  return !value.startsWith("http") && !value.startsWith("/");
}

function extractDriveId(value: string): string | null {
  // Handle full Drive URLs: drive.google.com/file/d/ID/view
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : isDriveId(value) ? value : null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId    = (session.user as any).id as string;
  const productId = req.nextUrl.searchParams.get("productId");
  const field     = req.nextUrl.searchParams.get("field");

  if (!productId || !field)
    return NextResponse.json({ error: "Missing productId or field" }, { status: 400 });

  // ── Verify ownership ──────────────────────────────────────────────────────
  const ownership = await (prisma.ownership as any).findUnique({
    where:   { userId_productId: { userId, productId } },
    include: { product: true },
  });

  if (!ownership)
    return NextResponse.json({ error: "Not purchased" }, { status: 403 });

  const grantedTier    = ownership.grantedTier ?? "mesh_only";
  const allowedFields  = TIER_FIELDS[grantedTier] ?? TIER_FIELDS["mesh_only"];

  // ── Verify field is allowed for this tier ─────────────────────────────────
  if (!allowedFields.includes(field))
    return NextResponse.json({ error: "Not included in your tier" }, { status: 403 });

  // ── Get file value from product (or ownership for fileKey) ────────────────
  const product = ownership.product as Record<string, any>;
  let fileValue: string | null = null;

  if (field === "fileKey") {
    fileValue = (ownership as any).fileKey ?? null;
  } else {
    fileValue = product[field] ?? null;
  }

  if (!fileValue)
    return NextResponse.json({ error: "File not available yet" }, { status: 404 });

  // ── Serve file — R2 or Google Drive ──────────────────────────────────────
  const driveId = extractDriveId(fileValue);

  if (!driveId) {
    // R2 public URL — redirect directly
    return NextResponse.redirect(fileValue, 302);
  }

  // Google Drive — proxy with authenticated access token
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    // Fallback: unauthenticated export URL
    const fallbackUrl = `https://drive.google.com/uc?export=download&id=${driveId}&confirm=t`;
    return NextResponse.redirect(fallbackUrl, 302);
  }

  // Stream file via Drive API with auth
  const range = req.headers.get("range") ?? undefined;
  const fetchHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent":  "Mozilla/5.0",
  };
  if (range) fetchHeaders["Range"] = range;

  const upstream = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media`,
    { headers: fetchHeaders }
  );

  if (!upstream.ok)
    return NextResponse.json({ error: "Drive fetch failed" }, { status: upstream.status });

  const contentType   = upstream.headers.get("content-type")   ?? "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");
  const contentRange  = upstream.headers.get("content-range");

  const resHeaders: Record<string, string> = {
    "Content-Type":        contentType,
    "Content-Disposition": `attachment; filename="${field}"`,
    "Accept-Ranges":       "bytes",
    "Cache-Control":       "private, max-age=300",
  };
  if (contentLength) resHeaders["Content-Length"] = contentLength;
  if (contentRange)  resHeaders["Content-Range"]  = contentRange;

  return new NextResponse(upstream.body, {
    status:  upstream.status,
    headers: resHeaders,
  });
}