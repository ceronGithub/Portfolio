// api/auth/google/callback/route.ts
// Handles the OAuth2 redirect from Google after admin grants Drive access.
// Exchanges the authorization code for access + refresh tokens.
// Stores the refresh token in an httpOnly cookie for subsequent Drive API calls.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI         = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback";

export async function GET(req: NextRequest) {
  // Only admins can complete this OAuth flow
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/admin/uploads?error=no_code", req.url));
  }

  // Exchange authorization code for tokens
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

  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/admin/uploads?error=token_failed", req.url));
  }

  // Store tokens in httpOnly cookies (30-day expiry for refresh token)
  const response = NextResponse.redirect(new URL("/admin/uploads?connected=true", req.url));

  response.cookies.set("google_access_token", tokens.access_token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    maxAge:   3600, // 1 hour
    path:     "/",
  });

  if (tokens.refresh_token) {
    response.cookies.set("google_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      maxAge:   60 * 60 * 24 * 30, // 30 days
      path:     "/",
    });
  }

  return response;
}