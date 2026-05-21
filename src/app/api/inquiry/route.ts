// api/inquiry/route.ts — POST custom request inquiry (auth required).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body   = await req.json();
  const { assetType, description, animCount, polyBudget, reference, deliverySpeed, estimatedQuote } = body;

  if (!assetType || !description || !deliverySpeed) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      userId,
      assetType,
      description,
      animCount:      animCount     ?? null,
      polyBudget:     polyBudget    ?? null,
      reference:      reference     ?? null,
      deliverySpeed,
      estimatedQuote: estimatedQuote ?? null,
    },
  });

  return NextResponse.json({ id: inquiry.id }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId   = (session.user as any).id as string;
  const inquiries = await prisma.inquiry.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(inquiries);
}