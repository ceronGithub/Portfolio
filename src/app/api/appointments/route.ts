export const dynamic = "force-dynamic";
// POST /api/appointments — Creates an appointment ticket.
// Validates session, builds referenceNo (APT-YYYY-XXXX), saves to DB.
// No PayMongo — consultation only. EmailJS fires client-side after this succeeds.
//
// GET /api/appointments — Returns all appointments for the logged-in buyer,
// including the full AppointmentComment thread (admin notes + buyer notes + replies).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

// ── Generate reference number: APT-2026-0001 ──────────────────────────────
async function generateReferenceNo(): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.appointment.count();
  const seq   = String(count + 1).padStart(4, "0");
  return `APT-${year}-${seq}`;
}

// ── POST — create appointment ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId      = (session.user as any).id as string;
  const buyerName   = session.user.name  ?? "Buyer";
  const buyerEmail  = session.user.email ?? "";

  const body = await req.json();
  const { systemId, systemTitle, basePrice, selectedAddons, quotedPrice, scheduledDate, message } = body;

  // ── Validation ────────────────────────────────────────────────────────
  if (!systemId || !systemTitle || typeof basePrice !== "number" || typeof quotedPrice !== "number")
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (!scheduledDate)
    return NextResponse.json({ error: "scheduledDate required" }, { status: 400 });

  // Enforce minimum +1 day from today
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate   = new Date(today);
  minDate.setDate(minDate.getDate() + 1);
  const picked    = new Date(scheduledDate);
  if (picked < minDate)
    return NextResponse.json({ error: "scheduledDate must be at least tomorrow" }, { status: 400 });

  const referenceNo = await generateReferenceNo();

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      buyerName,
      buyerEmail,
      systemId,
      systemTitle,
      basePrice,
      selectedAddons: selectedAddons ?? [],
      quotedPrice,
      scheduledDate,
      message:        message ?? null,
      referenceNo,
      status:         "PENDING",
    },
  });

  return NextResponse.json({ ok: true, referenceNo: appointment.referenceNo, id: appointment.id }, { status: 201 });
}

// ── GET — fetch buyer's appointments with full comment thread ─────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  const appointments = await prisma.appointment.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    include: {
      // Fetch all root-level comments (admin + buyer notes); replies nested under each
      comments: {
        where:   { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  return NextResponse.json({
    appointments: appointments.map((a: any) => ({
      id:             a.id,
      referenceNo:    a.referenceNo,
      systemTitle:    a.systemTitle,
      basePrice:      a.basePrice,
      quotedPrice:    a.quotedPrice,
      selectedAddons: a.selectedAddons,
      scheduledDate:  a.scheduledDate,
      message:        a.message ?? null,
      adminNote:      a.adminNote ?? null,
      status:         a.status,
      createdAt:      a.createdAt.toISOString(),
      comments:       a.comments.map((c: any) => ({
        id:        c.id,
        role:      c.role,
        content:   c.content,
        parentId:  c.parentId,
        createdAt: c.createdAt.toISOString(),
        replies:   c.replies.map((r: any) => ({
          id:        r.id,
          role:      r.role,
          content:   r.content,
          parentId:  r.parentId,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    })),
  });
}
