// api/admin/product-upload/route.ts
// Single-file upload for the Add/Edit Product form.
// Admin picks a file, chooses destination: "r2" | "gdrive" | "both".
// Returns: { r2Url, driveId, driveUrl } — whichever apply.
//
// FormData fields:
//   file        — the File blob
//   destination — "r2" | "gdrive" | "both"
//   r2Folder    — R2 key prefix, e.g. "products/characters"  (optional, default "products")
//   driveFolderId — Google Drive folder ID to upload into     (required for gdrive/both)

export const dynamic    = "force-dynamic";
export const maxDuration = 300;

import { NextRequest, NextResponse }              from "next/server";
import { getServerSession }                        from "next-auth";
import { authOptions }                             from "@/lib/auth";
import { S3Client, PutObjectCommand }              from "@aws-sdk/client-s3";
import { getValidAccessToken, uploadFileToDrive, createDriveFolder, listDriveFolders } from "@/lib/googleDrive";

// ── R2 client (lazy) ──────────────────────────────────────────────────────
let s3: S3Client | null = null;
function getS3(): S3Client {
  if (s3) return s3;
  const accountId = process.env.R2_ACCOUNT_ID!;
  s3 = new S3Client({
    region:   "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return s3;
}

export async function POST(req: NextRequest) {
  // Admin-only guard
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form           = await req.formData();
  const file           = form.get("file")           as File   | null;
  const destination    = form.get("destination")    as string | null;
  const r2Folder       = (form.get("r2Folder")      as string | null) ?? "products";
  const driveSubfolder = (form.get("driveSubfolder") as string | null) ?? "";
  const driveFolderId  = form.get("driveFolderId")  as string | null;

  if (!file)        return NextResponse.json({ error: "No file provided" },        { status: 400 });
  if (!destination) return NextResponse.json({ error: "No destination provided" }, { status: 400 });

  const buffer   = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  // Sanitize filename — no spaces, no special chars
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key      = `${r2Folder}/${Date.now()}_${safeName}`;

  let r2Url:    string | null = null;
  let driveId:  string | null = null;
  let driveUrl: string | null = null;
  const errors: string[]      = [];

  // ── Upload to R2 ─────────────────────────────────────────────────────
  if (destination === "r2" || destination === "both") {
    try {
      const bucket    = process.env.R2_BUCKET_NAME!;
      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
      await getS3().send(new PutObjectCommand({
        Bucket:      bucket,
        Key:         key,
        Body:        buffer,
        ContentType: mimeType,
      }));
      r2Url = `${publicBase.replace(/\/$/, "")}/${key}`;
    } catch (err) {
      errors.push(`R2 upload failed: ${(err as Error).message}`);
    }
  }

  // ── Upload to Google Drive ────────────────────────────────────────────
  if (destination === "gdrive" || destination === "both") {
    if (!driveFolderId) {
      errors.push("driveFolderId is required for Google Drive upload.");
    } else {
      try {
        const accessToken = await getValidAccessToken();
        if (!accessToken) throw new Error("Google Drive not connected — please reconnect in Admin.");

        // Resolve target folder — create subfolder if specified
        let targetFolderId = driveFolderId;
        if (driveSubfolder.trim()) {
          const existing = await listDriveFolders(accessToken);
          const found    = existing.find(f => f.name === driveSubfolder.trim());
          targetFolderId = found?.id ?? await createDriveFolder(accessToken, driveSubfolder.trim(), driveFolderId);
        }

        const driveFile = await uploadFileToDrive(accessToken, safeName, mimeType, buffer, targetFolderId);
        driveId  = driveFile.id;
        driveUrl = driveFile.webViewLink ?? `https://drive.google.com/file/d/${driveFile.id}/view`;
      } catch (err) {
        errors.push(`Drive upload failed: ${(err as Error).message}`);
      }
    }
  }

  const success = (r2Url !== null) || (driveId !== null);
  return NextResponse.json({ success, r2Url, driveId, driveUrl, errors });
}