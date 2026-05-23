// admin/testimonials/page.tsx — Visitor Testimonials Moderation page.
// Shows all testimonials (pending + approved). Admin can approve or delete.
// Protected: ADMIN only.

import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import TestimonialsClient   from "./TestimonialsClient";
import "./testimonials.css";

export default async function AdminTestimonialsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  // Guard: Testimonial model may not exist if migration hasn't run yet
  let testimonials: any[] = [];
  try {
    testimonials = await (prisma as any).testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch { /* migration pending — page loads empty */ }

  const serialized = testimonials.map((t: any) => ({
    id:         t.id,
    name:       t.name,
    project:    t.project,
    rate:       t.rate,
    comment:    t.comment,
    initials:   t.initials,
    accent:     t.accent,
    isApproved: t.isApproved,
    createdAt:  t.createdAt.toISOString(),
  }));

  const approvedCount = testimonials.filter((t: any) => t.isApproved).length;
  const pendingCount  = testimonials.length - approvedCount;

  return (
    <AdminShell adminName={adminName}>
      <div className="adminTestimonialsPage">

        <div className="adminPageHeader">
          <div>
            <h1 className="adminPageTitle">Testimonials</h1>
            <p className="adminPageSubtitle">{testimonials.length} submitted — {pendingCount} pending approval</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="adminTestimonialsStrip">
          <div className="adminTestimonialsStripItem">
            <span className="adminTestimonialsStripValue" style={{ color: "#c9a96e" }}>{testimonials.length}</span>
            <span className="adminTestimonialsStripLabel">Total</span>
          </div>
          <div className="adminTestimonialsStripDivider" />
          <div className="adminTestimonialsStripItem">
            <span className="adminTestimonialsStripValue" style={{ color: "#38a169" }}>{approvedCount}</span>
            <span className="adminTestimonialsStripLabel">Approved</span>
          </div>
          <div className="adminTestimonialsStripDivider" />
          <div className="adminTestimonialsStripItem">
            <span className="adminTestimonialsStripValue" style={{ color: "#d69e2e" }}>{pendingCount}</span>
            <span className="adminTestimonialsStripLabel">Pending</span>
          </div>
        </div>

        <TestimonialsClient testimonials={serialized} />
      </div>
    </AdminShell>
  );
}
