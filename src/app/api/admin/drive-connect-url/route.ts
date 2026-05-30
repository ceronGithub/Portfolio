export const dynamic = "force-dynamic";
// GET /api/admin/drive-connect-url
// Returns the Google OAuth URL for Drive reconnection.
// Admin-only. Used by ProductsClient to show a reconnect link inline.

import { NextResponse }    from "next/server";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId    = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback";

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "https://www.googleapis.com/auth/drive",
    access_type:   "offline",
    prompt:        "consent",
  });

  return NextResponse.json({
    url: `https://accounts.google.com/o/oauth2/auth?${params.toString()}`,
  });
}