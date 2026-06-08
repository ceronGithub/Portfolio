// admin/appointments/page.tsx — Admin appointments dashboard.
// Shows all consultation requests with status management, threaded comments, and delete.
// Protected: ADMIN only.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import AdminAppointmentsClient from "./AdminAppointmentsClient";
import "./admin-appointments.css";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  const appointments = await prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user:     { select: { name: true, email: true } },
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
    buyerName:      a.buyerName,
    buyerEmail:     a.buyerEmail,
    systemTitle:    a.systemTitle,
    basePrice:      a.basePrice,
    quotedPrice:    a.quotedPrice,
    selectedAddons: a.selectedAddons as any[],
    scheduledDate:  a.scheduledDate,
    message:        a.message ?? null,
    status:         a.status,
    adminNote:      a.adminNote ?? null,
    createdAt:      a.createdAt.toISOString(),
    user:           a.user,
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

  return (
    <AdminShell adminName={adminName}>
      <AdminAppointmentsClient appointments={serialized} />
    </AdminShell>
  );
}
