// admin/inquiries/page.tsx — Inquiries & Contact Messages admin page.
// Two tabs: Custom Requests (from Inquiry model) + Contact Messages (from ContactMessage model).
// Protected: ADMIN only.

export const dynamic = "force-dynamic";
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import InquiriesClient      from "./InquiriesClient";
import "./inquiries.css";

export default async function AdminInquiriesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  // ── Custom Requests (Inquiry model) ────────────────────────────────────────
  const customRequests = await prisma.inquiry.findMany({
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

  const serializedRequests = customRequests.map((r: any) => ({
    id:             r.id,
    assetType:      r.assetType,
    description:    r.description,
    animCount:      r.animCount ?? null,
    polyBudget:     r.polyBudget ?? null,
    reference:      r.reference ?? null,
    deliverySpeed:  r.deliverySpeed,
    estimatedQuote: r.estimatedQuote ?? null,
    adminQuote:     r.adminQuote     ?? null,
    adminComment:   r.adminComment   ?? null,
    buyerComment:   r.buyerComment   ?? null,
    status:         r.status,
    createdAt:      r.createdAt.toISOString(),
    buyerName:      r.user.name ?? r.user.email.split("@")[0],
    email:          r.user.email,
    comments:       (r.comments ?? []).map((c: any) => ({
      id:        c.id,
      role:      c.role,
      content:   c.content,
      parentId:  c.parentId ?? null,
      createdAt: c.createdAt.toISOString(),
      replies:   (c.replies ?? []).map((rep: any) => ({
        id:        rep.id,
        role:      rep.role,
        content:   rep.content,
        parentId:  rep.parentId ?? null,
        createdAt: rep.createdAt.toISOString(),
        replies:   [],
      })),
    })),
  }));

  // ── Contact Messages (ContactMessage model) ────────────────────────────────
  // Guard: ContactMessage model may not exist if migration hasn't run
  let contactMessages: any[] = [];
  try {
    contactMessages = await (prisma as any).contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch { /* migration pending */ }

  const serializedContacts = contactMessages.map((c: any) => ({
    id:          c.id,
    contactName: c.contactName,
    email:       c.email,
    subject:     c.subject ?? "",
    message:     c.message,
    status:      c.status,
    createdAt:   c.createdAt.toISOString(),
  }));

  const newRequestsCount = customRequests.filter((r: any) => r.status === "pending").length;
  const newContactsCount = contactMessages.filter((c: any) => c.status === "new").length;

  return (
    <AdminShell adminName={adminName}>
      <div className="adminInquiriesPage">

        <div className="adminPageHeader">
          <div>
            <h1 className="adminPageTitle">Inquiries</h1>
            <p className="adminPageSubtitle">
              {customRequests.length} custom request{customRequests.length !== 1 ? "s" : ""} · {contactMessages.length} contact message{contactMessages.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="adminInquiriesStrip">
          <div className="adminInquiriesStripItem">
            <span className="adminInquiriesStripValue" style={{ color: "#c9a96e" }}>{customRequests.length}</span>
            <span className="adminInquiriesStripLabel">Custom Requests</span>
          </div>
          <div className="adminInquiriesStripDivider" />
          <div className="adminInquiriesStripItem">
            <span className="adminInquiriesStripValue" style={{ color: "#d69e2e" }}>{newRequestsCount}</span>
            <span className="adminInquiriesStripLabel">Pending</span>
          </div>
          <div className="adminInquiriesStripDivider" />
          <div className="adminInquiriesStripItem">
            <span className="adminInquiriesStripValue" style={{ color: "#7eb8d4" }}>{contactMessages.length}</span>
            <span className="adminInquiriesStripLabel">Contact Msgs</span>
          </div>
          <div className="adminInquiriesStripDivider" />
          <div className="adminInquiriesStripItem">
            <span className="adminInquiriesStripValue" style={{ color: "#e53e3e" }}>{newContactsCount}</span>
            <span className="adminInquiriesStripLabel">Unread</span>
          </div>
        </div>

        <InquiriesClient
          customRequests={serializedRequests}
          contactMessages={serializedContacts}
        />
      </div>
    </AdminShell>
  );
}