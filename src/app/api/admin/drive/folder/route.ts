export const dynamic = 'force-dynamic';
// api/google/callback/route.ts
// Handles Google OAuth2 redirect. Exchanges code for tokens.
// Stores access + refresh tokens in httpOnly cookies.
// NOTE: No session guard here — cookies are the auth mechanism for Drive.

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI         = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  // Google returned an error (e.g. user denied access)
  if (error) {
    return NextResponse.redirect(new URL(`/admin/uploads?error=${error}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/uploads?error=no_code", req.url));
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.access_token) {
    console.error("Token exchange failed:", tokens);
    return NextResponse.redirect(new URL("/admin/uploads?error=token_failed", req.url));
  }

  // Store tokens in httpOnly cookies
  const response = NextResponse.redirect(new URL("/admin/uploads?connected=true", req.url));

  response.cookies.set("google_access_token", tokens.access_token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   3600,           // 1 hour
    path:     "/",
  });

  if (tokens.refresh_token) {
    response.cookies.set("google_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 30, // 30 days
      path:     "/",
    });
  }

  return response;
}