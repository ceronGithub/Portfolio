export const dynamic = 'force-dynamic';
// api/admin/uploads/route.ts
// POST — receives multipart form data from the admin upload page.
// Uploads ALL files to the selected Google Drive folder.
//
// Form fields expected:
//   - productType     : string (the selected Drive folder name = product type)
//   - driveFolderId   : string (Google Drive folder ID to upload into)
//   - files[]         : File[] (all files being uploaded)

import { NextRequest, NextResponse }   from "next/server";
import { getServerSession }            from "next-auth";
import { authOptions }                 from "@/lib/auth";
import { getValidAccessToken, uploadFileToDrive, createDriveFolder, listDriveFolders } from "@/lib/googleDrive";

export async function POST(req: NextRequest) {
  // Admin-only guard
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Google Drive not connected" }, { status: 401 });
  }

  const formData      = await req.formData();
  const driveFolderId = formData.get("driveFolderId") as string;
  const productType   = formData.get("productType")   as string;
  const files         = formData.getAll("files") as File[];

  if (!driveFolderId || files.length === 0) {
    return NextResponse.json({ error: "driveFolderId and files are required" }, { status: 400 });
  }

  const results: { fileName: string; drive?: string; error?: string }[] = [];

  // ── Find or create a product-type subfolder inside the selected Drive folder ──
  // This keeps uploads organized: Drive folder → ProductType subfolder → files
  const existingFolders = await listDriveFolders(accessToken);
  let productFolderId   = existingFolders.find(f => f.name === productType)?.id;

  if (!productFolderId) {
    productFolderId = await createDriveFolder(accessToken, productType, driveFolderId);
  }

  // ── Upload each file to Google Drive ─────────────────────────────────
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const fileName    = file.name;
    const mimeType    = file.type || "application/octet-stream";
    const result: typeof results[0] = { fileName };

    try {
      const driveFile = await uploadFileToDrive(
        accessToken,
        fileName,
        mimeType,
        buffer,
        productFolderId
      );
      result.drive = driveFile.webViewLink ?? driveFile.id;
    } catch (err) {
      result.error = `Drive upload failed: ${(err as Error).message}`;
    }

    results.push(result);
  }

  return NextResponse.json({ success: true, results });
}

// Max duration and body size for large video uploads
export const maxDuration = 300;
export const maxBodySize = "100mb";