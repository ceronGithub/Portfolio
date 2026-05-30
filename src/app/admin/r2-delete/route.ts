export const dynamic = "force-dynamic";
// api/admin/r2-delete/route.ts
// Deletes a single object from R2 by its full public URL or key.
// Admin-only.
//
// Body: { url: string }  — the full public R2 URL of the file
// Derives the object key by stripping the public base URL prefix.

import { NextRequest, NextResponse }                from "next/server";
import { getServerSession }                          from "next-auth";
import { authOptions }                               from "@/lib/auth";
import { S3Client, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

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

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json().catch(() => ({}));
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicBase) {
    return NextResponse.json({ error: "R2 public URL not configured" }, { status: 500 });
  }

  // Derive key from URL — strip public base prefix
  if (!url.startsWith(publicBase)) {
    return NextResponse.json({ error: "URL does not belong to this R2 bucket" }, { status: 400 });
  }

  const key    = url.slice(publicBase.length).replace(/^\//, "");
  const bucket = process.env.R2_BUCKET_NAME!;

  try {
    // Verify object exists before deleting
    await getS3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    await getS3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return NextResponse.json({ success: true, deleted: key });
  } catch (err: any) {
    if (err?.name === "NotFound" || err?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "Object not found in R2" }, { status: 404 });
    }
    console.error("[r2-delete]", err);
    return NextResponse.json({ error: "Failed to delete from R2" }, { status: 502 });
  }
}