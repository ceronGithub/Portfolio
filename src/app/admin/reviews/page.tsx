// admin/reviews/page.tsx — Reviews Moderation page.
// Lists all buyer reviews with star rating, buyer name, asset, date, delete.
// Protected: ADMIN only.

import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import ReviewsClient        from "./ReviewsClient";
import "./reviews.css";

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  const serialized = reviews.map((r: any) => ({
    id:        r.id,
    rating:    r.rating,
    comment:   r.comment ?? "",
    assetId:   r.assetId,
    createdAt: r.createdAt.toISOString(),
    buyerName: r.user.name ?? r.user.email.split("@")[0],
    email:     r.user.email,
  }));

  return (
    <AdminShell adminName={adminName}>
      <div className="adminReviewsPage">

        <div className="adminPageHeader">
          <div>
            <h1 className="adminPageTitle">Reviews</h1>
            <p className="adminPageSubtitle">{reviews.length} total review{reviews.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="adminReviewsStrip">
          <div className="adminReviewsStripItem">
            <span className="adminReviewsStripValue" style={{ color: "#c9a96e" }}>{reviews.length}</span>
            <span className="adminReviewsStripLabel">Total</span>
          </div>
          <div className="adminReviewsStripDivider" />
          <div className="adminReviewsStripItem">
            <span className="adminReviewsStripValue" style={{ color: "#38a169" }}>
              {reviews.length > 0
                ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
                : "—"}
            </span>
            <span className="adminReviewsStripLabel">Avg Rating</span>
          </div>
          <div className="adminReviewsStripDivider" />
          <div className="adminReviewsStripItem">
            <span className="adminReviewsStripValue" style={{ color: "#7eb8d4" }}>
              {reviews.filter((r: any) => r.rating >= 4).length}
            </span>
            <span className="adminReviewsStripLabel">4–5 Stars</span>
          </div>
          <div className="adminReviewsStripDivider" />
          <div className="adminReviewsStripItem">
            <span className="adminReviewsStripValue" style={{ color: "#e53e3e" }}>
              {reviews.filter((r: any) => r.rating <= 2).length}
            </span>
            <span className="adminReviewsStripLabel">1–2 Stars</span>
          </div>
        </div>

        <ReviewsClient reviews={serialized} />
      </div>
    </AdminShell>
  );
}
