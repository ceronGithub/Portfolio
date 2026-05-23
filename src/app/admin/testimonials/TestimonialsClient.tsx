// admin/testimonials/TestimonialsClient.tsx — Testimonials moderation UI.
// Filter: All / Pending / Approved. Approve and Delete actions.

"use client";

import { useState } from "react";

type TestimonialRow = {
  id:         string;
  name:       string;
  project:    string;
  rate:       number;
  comment:    string;
  initials:   string;
  accent:     string;
  isApproved: boolean;
  createdAt:  string;
};

type FilterTab = "All" | "Pending" | "Approved";

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

// ── Rate bar — satisfaction % ─────────────────────────────────────────────────
function RateBar({ rate, accent }: { rate: number; accent: string }) {
  return (
    <div className="adminTestimonialsRateBar">
      <div className="adminTestimonialsRateTrack">
        <div className="adminTestimonialsRateFill" style={{ width: `${rate}%`, background: accent }} />
      </div>
      <span className="adminTestimonialsRateNum" style={{ color: accent }}>{rate}%</span>
    </div>
  );
}

// ── Avatar badge ──────────────────────────────────────────────────────────────
function Avatar({ initials, accent }: { initials: string; accent: string }) {
  return (
    <div className="adminTestimonialsAvatar"
      style={{ background: accent + "22", color: accent, border: `1px solid ${accent}44` }}>
      {initials}
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────
export default function TestimonialsClient({ testimonials: initial }: { testimonials: TestimonialRow[] }) {
  const [testimonials,  setTestimonials]  = useState<TestimonialRow[]>(initial);
  const [activeFilter,  setActiveFilter]  = useState<FilterTab>("All");
  const [approvingId,   setApprovingId]   = useState<string | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);

  // ── Filter ────────────────────────────────────────────────────────────────
  const visibleTestimonials = testimonials.filter(t => {
    if (activeFilter === "Pending")  return !t.isApproved;
    if (activeFilter === "Approved") return t.isApproved;
    return true;
  });

  // ── Approve ───────────────────────────────────────────────────────────────
  async function handleApprove(testimonialId: string) {
    setApprovingId(testimonialId);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${testimonialId}`, { method: "PATCH" });
      if (res.ok) {
        setTestimonials(prev =>
          prev.map(t => t.id === testimonialId ? { ...t, isApproved: true } : t)
        );
      }
    } finally {
      setApprovingId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(testimonialId: string) {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    setDeletingId(testimonialId);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${testimonialId}`, { method: "DELETE" });
      if (res.ok) {
        setTestimonials(prev => prev.filter(t => t.id !== testimonialId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const pendingCount  = testimonials.filter(t => !t.isApproved).length;
  const approvedCount = testimonials.filter(t => t.isApproved).length;

  return (
    <div className="adminTestimonialsContent">

      {/* Filter tabs */}
      <div className="adminTestimonialsFilterTabs">
        {(["All", "Pending", "Approved"] as FilterTab[]).map(tab => (
          <button
            key={tab}
            className={`adminTestimonialsFilterTab ${activeFilter === tab ? "adminTestimonialsFilterTabActive" : ""}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
            <span className="adminTestimonialsFilterCount">
              {tab === "All" ? testimonials.length : tab === "Pending" ? pendingCount : approvedCount}
            </span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {visibleTestimonials.length === 0 ? (
        <div className="adminTestimonialsEmpty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No testimonials in this filter.</p>
        </div>
      ) : (
        <div className="adminTestimonialsGrid">
          {visibleTestimonials.map(t => (
            <div key={t.id} className={`adminTestimonialsCard ${t.isApproved ? "adminTestimonialsCardApproved" : "adminTestimonialsCardPending"}`}>

              {/* Status badge */}
              <div className="adminTestimonialsCardBadge">
                {t.isApproved ? (
                  <span className="adminTestimonialsBadgeApproved">Approved</span>
                ) : (
                  <span className="adminTestimonialsBadgePending">Pending</span>
                )}
                <span className="adminTestimonialsCardDate">{formatDate(t.createdAt)}</span>
              </div>

              {/* Header */}
              <div className="adminTestimonialsCardHeader">
                <Avatar initials={t.initials} accent={t.accent} />
                <div>
                  <p className="adminTestimonialsCardName">{t.name}</p>
                  <p className="adminTestimonialsCardProject">{t.project}</p>
                </div>
              </div>

              {/* Rate bar */}
              <RateBar rate={t.rate} accent={t.accent} />

              {/* Comment */}
              <p className="adminTestimonialsCardComment">&ldquo;{t.comment}&rdquo;</p>

              {/* Actions */}
              <div className="adminTestimonialsCardActions">
                {!t.isApproved && (
                  <button
                    className="adminTestimonialsApproveBtn"
                    onClick={() => handleApprove(t.id)}
                    disabled={approvingId === t.id}
                  >
                    {approvingId === t.id ? "Approving…" : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                )}
                <button
                  className="adminTestimonialsDeleteBtn"
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  aria-label="Delete testimonial"
                >
                  {deletingId === t.id ? "…" : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
