export const dynamic = "force-dynamic";
// api/admin/drive-folders/route.ts
// Lists all Google Drive folders.
// Admin-only. Used to populate the GDrive folder dropdown in FileUploadField.

import { NextResponse }                         from "next/server";
import { getServerSession }                      from "next-auth";
import { authOptions }                           from "@/lib/auth";
import { getValidAccessToken, listDriveFolders } from "@/lib/googleDrive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 401 });
    }

    const folders = await listDriveFolders(accessToken);
    // folders = [{ id, name }]
    return NextResponse.json({ folders });
  } catch (err) {
    console.error("[drive-folders]", err);
    return NextResponse.json({ error: "Failed to list Drive folders" }, { status: 502 });
  }
}