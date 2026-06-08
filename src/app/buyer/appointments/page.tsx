// buyer/appointments/page.tsx — Buyer's appointment history.
// Lists all consultation requests with status, reference number, and system details.
// Soft-deleted (deletedAt != null) appointments are hidden from the buyer.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import AppointmentsClient  from "./AppointmentsClient";
import "./appointments.css";

export default async function BuyerAppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const appointments = await prisma.appointment.findMany({
    where:   { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  // Serialize for client
  const serialized = appointments.map((a) => ({
    id:            a.id,
    referenceNo:   a.referenceNo,
    systemTitle:   a.systemTitle,
    basePrice:     a.basePrice,
    quotedPrice:   a.quotedPrice,
    selectedAddons: a.selectedAddons as any[],
    scheduledDate: a.scheduledDate,
    message:       a.message ?? null,
    adminNote:     a.adminNote ?? null,
    status:        a.status,
    createdAt:     a.createdAt.toISOString(),
    comments:      a.comments.map(c => ({
      id:        c.id,
      role:      c.role,
      content:   c.content,
      parentId:  c.parentId ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  return <AppointmentsClient appointments={serialized} />;
}