// PATCH /api/admin/systems/[id]
// Admin-only. Updates any editable field on a System:
// basePrice, isActive, title, description, features, accent,
// timeline, deploy, bgVideoUrl, demoVideoUrl.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data: Record<string, any> = {};

  if (typeof body.basePrice === "number" && body.basePrice >= 0) {
    data.basePrice = Math.round(body.basePrice);
  }
  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }
  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (typeof body.description === "string") {
    data.description = body.description.trim();
  }
  if (typeof body.accent === "string" && body.accent.trim()) {
    data.accent = body.accent.trim();
  }
  if (typeof body.timeline === "string" && body.timeline.trim()) {
    data.timeline = body.timeline.trim();
  }
  if (typeof body.deploy === "string" && body.deploy.trim()) {
    data.deploy = body.deploy.trim();
  }
  if (Array.isArray(body.features)) {
    data.features = body.features.filter((f: any) => typeof f === "string" && f.trim());
  }
  // demoVideoUrl and bgVideoUrl: accept string or explicit null to clear
  if ("demoVideoUrl" in body) {
    data.demoVideoUrl = typeof body.demoVideoUrl === "string" && body.demoVideoUrl.trim()
      ? body.demoVideoUrl.trim()
      : null;
  }
  if ("bgVideoUrl" in body) {
    data.bgVideoUrl = typeof body.bgVideoUrl === "string" && body.bgVideoUrl.trim()
      ? body.bgVideoUrl.trim()
      : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { id } = await params;
  const system = await prisma.system.update({ where: { id }, data });
  return NextResponse.json({ system });
}