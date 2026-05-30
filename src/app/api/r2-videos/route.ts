export const dynamic = "force-dynamic";
// api/r2-videos/route.ts

import { NextRequest, NextResponse }       from "next/server";
import { S3Client, ListObjectsV2Command }  from "@aws-sdk/client-s3";

// prefix → { folder to list, filename filter to separate interior vs exterior }
const PREFIX_MAP: Record<string, { folder: string; filter: string }> = {
  "architecture/interior": { folder: "architecture/", filter: "interior" },
  "architecture/exterior": { folder: "architecture/", filter: "exterior" },
  "weapon":                { folder: "weapon/",        filter: "" },
  "character":             { folder: "character/",     filter: "" },
};

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID is not set");
  s3Client = new S3Client({
    region:   "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return s3Client;
}

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get("prefix") ?? "";
  const config = PREFIX_MAP[prefix];

  if (!config) {
    return NextResponse.json(
      { error: `Invalid prefix. Allowed: ${Object.keys(PREFIX_MAP).join(", ")}` },
      { status: 400 }
    );
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!bucketName || !publicBase) {
    return NextResponse.json(
      { error: "R2_BUCKET_NAME or NEXT_PUBLIC_R2_PUBLIC_URL is not set" },
      { status: 500 }
    );
  }

  try {
    const client = getS3Client();
    const urls: string[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket:            bucketName,
        Prefix:            config.folder,
        ContinuationToken: continuationToken,
        MaxKeys:           1000,
      });

      const response = await client.send(command);

      for (const obj of response.Contents ?? []) {
        const key      = obj.Key ?? "";
        const filename = key.split("/").pop() ?? "";
        if (!filename.endsWith(".mp4")) continue;
        // Filter by filename prefix for interior/exterior split
        if (config.filter && !filename.startsWith(config.filter)) continue;
        urls.push(`${publicBase.replace(/\/$/, "")}/${key}`);
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    urls.sort();

    return NextResponse.json({ urls }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });

  } catch (err) {
    console.error("[r2-videos] listing error:", err);
    return NextResponse.json({ error: "Failed to list R2 videos" }, { status: 502 });
  }
}