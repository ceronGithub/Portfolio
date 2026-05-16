// Guards /admin and /dashboard routes using JWT cookie directly.
// Prisma cannot run in Edge runtime — uses next-auth JWT helper instead.
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token && (pathname.startsWith("/admin") || pathname.startsWith("/buyer"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/buyer", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/buyer/:path*"],
};