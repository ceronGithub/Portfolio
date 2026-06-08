// buyer/appointments/page.tsx — Buyer's appointment history.
// Lists all consultation requests with status, reference number, system details,
// and the full AppointmentComment thread (admin notes + buyer notes + replies).

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import AppointmentsClient  from "./AppointmentsClient";
import "./appointments.css";

export const dynamic = "force-dynamic";

export default async function BuyerAppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const appointments = await prisma.appointment.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    include: {
      // All root comments + their replies
      comments: {
        where:   { parentId: null },
        orderBy: { createdAt: "asc" },
        include: {
          replies: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  const serialized = appointments.map((a: any) => ({
    id:             a.id,
    referenceNo:    a.referenceNo,
    systemTitle:    a.systemTitle,
    basePrice:      a.basePrice,
    quotedPrice:    a.quotedPrice,
    selectedAddons: a.selectedAddons as any[],
    scheduledDate:  a.scheduledDate,
    message:        a.message ?? null,
    adminNote:      a.adminNote ?? null,
    status:         a.status,
    createdAt:      a.createdAt.toISOString(),
    comments: a.comments.map((c: any) => ({
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
  }));

  return <AppointmentsClient appointments={serialized} />;
}
