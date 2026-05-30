export const dynamic = 'force-dynamic';
// api/google/callback/route.ts
// Handles the OAuth2 redirect from Google after admin grants Drive access.
// Exchanges the authorization code for tokens, saves to DB (permanent).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { saveGoogleTokens }          from "@/lib/googleDrive";

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI         = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/admin/products?drive_error=no_code", req.url));
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  });

  const tokens = await tokenResponse.json();

  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(new URL("/admin/products?drive_error=token_failed", req.url));
  }

  // Save tokens to DB — permanent storage, no expiry on refresh token
  await saveGoogleTokens(tokens.refresh_token, tokens.access_token);

  return NextResponse.redirect(new URL("/admin/products?drive_connected=true", req.url));
}