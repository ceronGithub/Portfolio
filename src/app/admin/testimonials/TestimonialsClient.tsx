// admin/testimonials/TestimonialsClient.tsx — Testimonials moderation UI.
// Filter: All / Pending / Approved. Actions: approve, delete, hide, highlight, pin, admin reply.
// hide = hidden from visitor/buyer. highlight = featured. pin = pinned to top.

"use client";

import { useState } from "react";
import { sanitize } from "@/lib/utils";

type TestimonialRow = {
  id:            string;
  name:          string;
  project:       string;
  rate:          number;
  comment:       string;
  initials:      string;
  accent:        string;
  isApproved:    boolean;
  isHidden:      boolean;
  isHighlighted: boolean;
  isPinned:      boolean;
  adminReply:    string | null;
  createdAt:     string;
};

type FilterTab = "All" | "Pending" | "Approved";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

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

function Avatar({ initials, accent }: { initials: string; accent: string }) {
  return (
    <div className="adminTestimonialsAvatar"
      style={{ background: accent + "22", color: accent, border: `1px solid ${accent}44` }}>
      {initials}
    </div>
  );
}

// ── Admin Reply Editor ────────────────────────────────────────────────────────
function AdminReplyEditor({ testimonialId, currentReply, onSave }: {
  testimonialId: string;
  currentReply:  string | null;
  onSave:        (id: string, reply: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(currentReply ?? "");
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    setSaving(true);
    const trimmed = value.trim() || null;
    try {
      const res = await fetch(`/api/admin/testimonials?id=${testimonialId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminReply: trimmed }),
      });
      if (res.ok) {
        onSave(testimonialId, trimmed);
        setEditing(false);
        setValue(trimmed ?? "");
      }
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="adminTestimonialsReplyEditor">
        <textarea
          className="adminTestimonialsReplyTextarea"
          autoFocus
          value={value}
          disabled={saving}
          placeholder="Write an admin reply to this testimonial…"
          onChange={e => setValue(sanitize(e.target.value))}
          rows={2}
        />
        <div className="adminTestimonialsReplyActions">
          <button className="adminTestimonialsReplySave" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Reply"}
          </button>
          <button className="adminTestimonialsReplyCancel" onClick={() => { setEditing(false); setValue(currentReply ?? ""); }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className={`adminTestimonialsReplyBtn ${currentReply ? "adminTestimonialsReplyBtnSet" : ""}`}
      onClick={() => setEditing(true)}
      title="Add or edit admin reply"
    >
      {currentReply ? (
        <span className="adminTestimonialsReplyPreview">↩ {currentReply}</span>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Add Reply
        </>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TestimonialsClient({ testimonials: initial }: { testimonials: TestimonialRow[] }) {
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>(initial);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [togglingId,   setTogglingId]   = useState<string | null>(null);
  const [approvingId,  setApprovingId]  = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const visibleTestimonials = testimonials.filter(t => {
    if (activeFilter === "Pending")  return !t.isApproved;
    if (activeFilter === "Approved") return t.isApproved;
    return true;
  });

  const pendingCount  = testimonials.filter(t => !t.isApproved).length;
  const approvedCount = testimonials.filter(t => t.isApproved).length;

  // ── Generic PATCH helper ─────────────────────────────────────────────────
  async function patchTestimonial(id: string, data: Record<string, unknown>) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (res.ok) {
        setTestimonials(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
        return true;
      }
      showToast("Action failed. Try again.", "err");
      return false;
    } catch {
      showToast("Network error.", "err");
      return false;
    } finally {
      setTogglingId(null);
    }
  }

  async function handleApprove(id: string) {
    setApprovingId(id);
    const ok = await patchTestimonial(id, { isApproved: true });
    if (ok) showToast("Testimonial approved.", "ok");
    setApprovingId(null);
  }

  async function handleToggleHide(t: TestimonialRow) {
    const ok = await patchTestimonial(t.id, { isHidden: !t.isHidden });
    if (ok) showToast(t.isHidden ? "Testimonial visible." : "Testimonial hidden from visitors & buyers.", "ok");
  }

  async function handleToggleHighlight(t: TestimonialRow) {
    const ok = await patchTestimonial(t.id, { isHighlighted: !t.isHighlighted });
    if (ok) showToast(t.isHighlighted ? "Highlight removed." : "Testimonial highlighted.", "ok");
  }

  async function handleTogglePin(t: TestimonialRow) {
    const ok = await patchTestimonial(t.id, { isPinned: !t.isPinned });
    if (ok) showToast(t.isPinned ? "Testimonial unpinned." : "Testimonial pinned to top.", "ok");
  }

  function handleReplyUpdate(id: string, reply: string | null) {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, adminReply: reply } : t));
    showToast(reply ? "Reply saved." : "Reply cleared.", "ok");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTestimonials(prev => prev.filter(t => t.id !== id));
        showToast("Testimonial deleted.", "ok");
      } else {
        showToast("Failed to delete testimonial.", "err");
      }
    } catch {
      showToast("Network error. Try again.", "err");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="adminTestimonialsContent">

      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          background: toast.type === "ok" ? "#22c55e" : "#ef4444",
          color: "#0d0d0d", padding: "0.6rem 1.2rem", borderRadius: "8px",
          fontWeight: 600, fontSize: "0.85rem", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

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
            <div
              key={t.id}
              className={[
                "adminTestimonialsCard",
                t.isApproved    ? "adminTestimonialsCardApproved"    : "adminTestimonialsCardPending",
                t.isHidden      ? "adminTestimonialsCardHidden"      : "",
                t.isPinned      ? "adminTestimonialsCardPinned"      : "",
                t.isHighlighted ? "adminTestimonialsCardHighlighted" : "",
              ].filter(Boolean).join(" ")}
            >
              {/* Status + flags row */}
              <div className="adminTestimonialsCardBadge">
                {t.isApproved ? (
                  <span className="adminTestimonialsBadgeApproved">Approved</span>
                ) : (
                  <span className="adminTestimonialsBadgePending">Pending</span>
                )}
                {t.isPinned      && <span className="adminTestimonialsFlag adminTestimonialsFlagPin">📌 Pinned</span>}
                {t.isHighlighted && <span className="adminTestimonialsFlag adminTestimonialsFlagHighlight">⭐ Highlighted</span>}
                {t.isHidden      && <span className="adminTestimonialsFlag adminTestimonialsFlagHidden">👁 Hidden</span>}
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

              <RateBar rate={t.rate} accent={t.accent} />

              <p className="adminTestimonialsCardComment">&ldquo;{t.comment}&rdquo;</p>

              {/* Admin reply */}
              <AdminReplyEditor
                testimonialId={t.id}
                currentReply={t.adminReply}
                onSave={handleReplyUpdate}
              />

              {/* Actions */}
              <div className="adminTestimonialsCardActions">
                {!t.isApproved && (
                  <button
                    className="adminTestimonialsApproveBtn"
                    onClick={() => handleApprove(t.id)}
                    disabled={approvingId === t.id || togglingId === t.id}
                  >
                    {approvingId === t.id ? "Approving…" : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                )}

                <button
                  className={`adminTestimonialsActionBtn ${t.isPinned ? "adminTestimonialsActionBtnActive" : ""}`}
                  onClick={() => handleTogglePin(t)}
                  disabled={togglingId === t.id}
                  title={t.isPinned ? "Unpin" : "Pin to top"}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={t.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-2a7 7 0 0 0-7-7 7 7 0 0 0-7 7v2z"/><line x1="12" y1="10" x2="12" y2="3"/>
                  </svg>
                  {t.isPinned ? "Unpin" : "Pin"}
                </button>

                <button
                  className={`adminTestimonialsActionBtn ${t.isHighlighted ? "adminTestimonialsActionBtnHighlight" : ""}`}
                  onClick={() => handleToggleHighlight(t)}
                  disabled={togglingId === t.id}
                  title={t.isHighlighted ? "Remove highlight" : "Highlight"}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={t.isHighlighted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {t.isHighlighted ? "Unhighlight" : "Highlight"}
                </button>

                <button
                  className={`adminTestimonialsActionBtn ${t.isHidden ? "adminTestimonialsActionBtnHidden" : ""}`}
                  onClick={() => handleToggleHide(t)}
                  disabled={togglingId === t.id}
                  title={t.isHidden ? "Unhide" : "Hide from visitors & buyers"}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {t.isHidden ? (
                      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    ) : (
                      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    )}
                  </svg>
                  {t.isHidden ? "Unhide" : "Hide"}
                </button>

                <button
                  className="adminTestimonialsDeleteBtn"
                  onClick={() => handleDelete(t.id)}
                  disabled={deletingId === t.id}
                  title="Delete permanently"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  {deletingId === t.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
