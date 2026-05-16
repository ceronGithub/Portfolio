// api/admin/drive/folders/route.ts
// GET — returns all Google Drive folders for the authenticated admin.
// Used by the upload page to populate the folder selector dropdowns.

import { NextResponse }        from "next/server";
import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { getValidAccessToken, listDriveFolders } from "@/lib/googleDrive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const folders = await listDriveFolders(accessToken);
  return NextResponse.json({ folders });
}
