import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import { createHash }                from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
             ?? req.headers.get("x-real-ip")
             ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    const fingerprint = createHash("sha256").update(`${ip}|${ua}`).digest("hex");
    const date        = new Date().toISOString().slice(0, 10);

    await prisma.siteVisit.upsert({
      where:  { fingerprint_date: { fingerprint, date } },
      update: {},
      create: { fingerprint, date },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}