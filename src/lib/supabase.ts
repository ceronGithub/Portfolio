// supabase.ts — Singleton Supabase client for storage access.
// Used for reading/writing files in Supabase Storage buckets.
// The public URL base is also exported for direct URL construction
// (used in AISection, DashboardHero, AssetBuySection).
//
// HOW IT WORKS:
//   1. createClient() is called once and stored in globalThis to
//      survive Next.js hot-reload in development.
//   2. The anon key is safe for storage reads on public buckets.
//   3. For authenticated uploads, use the service role key server-side only.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Environment variables ─────────────────────────────────────────────
// Add these to your .env.local file:
//   NEXT_PUBLIC_SUPABASE_URL=https://ktuahohvysmjxumekaov.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "https://ktuahohvysmjxumekaov.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// ── Singleton pattern — prevents multiple client instances ─────────────
const globalForSupabase = globalThis as unknown as { supabase: SupabaseClient };

export const supabase: SupabaseClient =
  globalForSupabase.supabase ?? createClient(supabaseUrl, supabaseAnonKey);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}

// ── Public storage base URL — for direct video/image URL construction ──
// Usage: `${SUPABASE_STORAGE_URL}/videos/exterior/clip.mp4`
export const SUPABASE_STORAGE_URL = `${supabaseUrl}/storage/v1/object/public`;
