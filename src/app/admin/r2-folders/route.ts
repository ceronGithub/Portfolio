export const dynamic = "force-dynamic";
// api/admin/r2-folders/route.ts
// Lists top-level folders (common prefixes) in the R2 bucket.
// Admin-only. Used to populate the folder dropdown in FileUploadField.

import { NextResponse }                  from "next/server";
import { getServerSession }               from "next-auth";
import { authOptions }                    from "@/lib/auth";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delimiter "/" → CommonPrefixes = top-level folders only
    const res = await getS3().send(new ListObjectsV2Command({
      Bucket:    process.env.R2_BUCKET_NAME!,
      Delimiter: "/",
      MaxKeys:   200,
    }));

    const folders: string[] = (res.CommonPrefixes ?? [])
      .map((p: { Prefix?: string }) => p.Prefix?.replace(/\/$/, "") ?? "")
      .filter(Boolean)
      .sort();

    return NextResponse.json({ folders });
  } catch (err) {
    console.error("[r2-folders]", err);
    return NextResponse.json({ error: "Failed to list R2 folders" }, { status: 502 });
  }
}