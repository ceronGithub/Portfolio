export const dynamic = "force-dynamic";
// api/admin/drive-delete/route.ts
// Deletes a single file from Google Drive by file ID.
// Admin-only.
//
// Body: { fileId: string }

import { NextRequest, NextResponse }        from "next/server";
import { getServerSession }                  from "next-auth";
import { authOptions }                       from "@/lib/auth";
import { getValidAccessToken }               from "@/lib/googleDrive";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await req.json().catch(() => ({}));
  if (!fileId || typeof fileId !== "string") {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 401 });
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
      {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 204 = deleted, 404 = already gone — both are acceptable
    if (res.status === 204 || res.status === 404) {
      return NextResponse.json({ success: true, deleted: fileId });
    }

    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.error?.message ?? `Drive API error ${res.status}` },
      { status: res.status }
    );
  } catch (err) {
    console.error("[drive-delete]", err);
    return NextResponse.json({ error: "Failed to delete from Drive" }, { status: 502 });
  }
}