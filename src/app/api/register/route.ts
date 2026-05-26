// POST /api/register
// Creates a new BUYER user in Supabase. Validates email uniqueness and hashes password.
// Rate limited: max 5 attempts per IP per hour (in-memory, resets on server restart).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt       from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── In-memory IP rate limiter ─────────────────────────────────────────────────
// Stores { count, resetAt } per IP. Resets after 1 hour from first attempt.
// Safe for single-instance deployments; for multi-instance use Upstash Redis instead.

const MAX_ATTEMPTS  = 5;
const WINDOW_MS     = 60 * 60 * 1000; // 1 hour

const ipAttemptMap  = new Map<string, { count: number; resetAt: number }>();

function getRealIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now    = Date.now();
  const record = ipAttemptMap.get(ip);

  if (!record || now > record.resetAt) {
    // First attempt in this window — initialise the counter
    ipAttemptMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Still within limit — increment
  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// ── POST /api/register ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Rate limit check ────────────────────────────────────────────────────────
  const ip = getRealIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many registration attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).` },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  // ── Field validation ────────────────────────────────────────────────────────
  const { name, email, age, password } = await req.json();

  if (!name || !email || !age || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .single();
  
  if (existing) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from("User")
    .insert([{ name, email, age, password: hashed, role: "BUYER", isActive: true, isBanned: false }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }

  return NextResponse.json({ id: user.id, email: user.email });
}