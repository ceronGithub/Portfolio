export const dynamic = 'force-dynamic';
// [...nextauth]/route.ts
// Next-auth v4 App Router handler.
// Handler is instantiated HERE directly — not re-exported from lib/auth.
// This is required for Next.js 16 + Turbopack compatibility.
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };