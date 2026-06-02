// admin/reviews/ReviewsClient.tsx — Reviews moderation UI.
// Filter by star rating. Actions: delete, hide/unhide, highlight/unhighlight, pin/unpin, admin reply.
// hide = hidden from buyer + visitor. highlight = featured. pin = pinned to top. reply = admin reply shown to buyer.

"use client";

import { useState } from "react";
import { sanitize } from "@/lib/utils";

type ReviewRow = {
  id:            string;
  rating:        number;
  comment:       string;
  assetId:       string;
  createdAt:     string;
  buyerName:     string;
  email:         string;
  isHidden:      boolean;
  isHighlighted: boolean;
  isPinned:      boolean;
  adminReply:    string | null;
};

// ── Star renderer ─────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="adminReviewStars">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} width="13" height="13" viewBox="0 0 24 24" fill={star <= rating ? "#f6c90e" : "none"}
          stroke={star <= rating ? "#f6c90e" : "#555"} strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

const FILTER_OPTIONS = ["All", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

function filterRating(option: FilterOption): number | null {
  if (option === "All") return null;
  return parseInt(option[0]);
}

// ── Admin Reply Editor — inline textarea ──────────────────────────────────────
function AdminReplyEditor({ reviewId, currentReply, onSave }: {
  reviewId:     string;
  currentReply: string | null;
  onSave:       (id: string, reply: string | null) => void;
}) {
  const [editing,  setEditing]  = useState(false);
  const [value,    setValue]    = useState(currentReply ?? "");
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    setSaving(true);
    const trimmed = value.trim() || null;
    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminReply: trimmed }),
      });
      if (res.ok) {
        onSave(reviewId, trimmed);
        setEditing(false);
        setValue(trimmed ?? "");
      }
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="adminReviewsReplyEditor">
        <textarea
          className="adminReviewsReplyTextarea"
          autoFocus
          value={value}
          disabled={saving}
          placeholder="Write an admin reply…"
          onChange={e => setValue(sanitize(e.target.value))}
          rows={2}
        />
        <div className="adminReviewsReplyActions">
          <button className="adminReviewsReplySave" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="adminReviewsReplyCancel" onClick={() => { setEditing(false); setValue(currentReply ?? ""); }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className={`adminReviewsReplyBtn ${currentReply ? "adminReviewsReplyBtnSet" : ""}`}
      onClick={() => setEditing(true)}
      title="Add or edit admin reply"
    >
      {currentReply ? (
        <span className="adminReviewsReplyPreview">{currentReply}</span>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Reply
        </>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReviewsClient({ reviews: initial }: { reviews: ReviewRow[] }) {
  const [reviews,      setReviews]     = useState<ReviewRow[]>(initial);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [togglingId,   setTogglingId]  = useState<string | null>(null);
  const [deletingId,   setDeletingId]  = useState<string | null>(null);
  const [toast,        setToast]       = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const targetRating   = filterRating(activeFilter);
  const visibleReviews = targetRating === null
    ? reviews
    : reviews.filter(r => r.rating === targetRating);

  // ── Generic PATCH toggle helper ───────────────────────────────────────────
  async function patchReview(reviewId: string, data: Record<string, unknown>) {
    setTogglingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ...data } : r));
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

  async function handleToggleHide(review: ReviewRow) {
    const ok = await patchReview(review.id, { isHidden: !review.isHidden });
    if (ok) showToast(review.isHidden ? "Review visible." : "Review hidden from buyers & visitors.", "ok");
  }

  async function handleToggleHighlight(review: ReviewRow) {
    const ok = await patchReview(review.id, { isHighlighted: !review.isHighlighted });
    if (ok) showToast(review.isHighlighted ? "Highlight removed." : "Review highlighted.", "ok");
  }

  async function handleTogglePin(review: ReviewRow) {
    const ok = await patchReview(review.id, { isPinned: !review.isPinned });
    if (ok) showToast(review.isPinned ? "Review unpinned." : "Review pinned to top.", "ok");
  }

  function handleReplyUpdate(id: string, reply: string | null) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, adminReply: reply } : r));
    showToast(reply ? "Reply saved." : "Reply cleared.", "ok");
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        showToast("Review deleted.", "ok");
      } else {
        showToast("Failed to delete review.", "err");
      }
    } catch {
      showToast("Network error. Try again.", "err");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="adminReviewsContent">

      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          background: toast.type === "ok" ? "#22c55e" : "#ef4444",
          color: "#0d0d0d", padding: "0.6rem 1.2rem", borderRadius: "8px",
          fontWeight: 600, fontSize: "0.85rem", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      {/* Filter tabs */}
      <div className="adminReviewsFilterTabs">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            className={`adminReviewsFilterTab ${activeFilter === opt ? "adminReviewsFilterTabActive" : ""}`}
            onClick={() => setActiveFilter(opt)}
          >
            {opt}
            <span className="adminReviewsFilterCount">
              {opt === "All" ? reviews.length : reviews.filter(r => r.rating === filterRating(opt)).length}
            </span>
          </button>
        ))}
      </div>

      {visibleReviews.length === 0 ? (
        <div className="adminReviewsEmpty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p>No reviews found for this filter.</p>
        </div>
      ) : (
        <div className="adminReviewsCards">
          {visibleReviews.map(review => (
            <div
              key={review.id}
              className={`adminReviewsCard ${review.isHidden ? "adminReviewsCardHidden" : ""} ${review.isPinned ? "adminReviewsCardPinned" : ""} ${review.isHighlighted ? "adminReviewsCardHighlighted" : ""}`}
            >
              {/* Status flags */}
              <div className="adminReviewsCardFlags">
                {review.isPinned      && <span className="adminReviewsFlag adminReviewsFlagPin">📌 Pinned</span>}
                {review.isHighlighted && <span className="adminReviewsFlag adminReviewsFlagHighlight">⭐ Highlighted</span>}
                {review.isHidden      && <span className="adminReviewsFlag adminReviewsFlagHidden">👁 Hidden</span>}
              </div>

              {/* Header row */}
              <div className="adminReviewsCardHeader">
                <div className="adminReviewsBuyerCell">
                  <span className="adminReviewsBuyerName">{review.buyerName}</span>
                  <span className="adminReviewsBuyerEmail">{review.email}</span>
                </div>
                <div className="adminReviewsCardHeaderRight">
                  <StarRating rating={review.rating} />
                  <span className="adminReviewsAssetId">{review.assetId}</span>
                  <span className="adminReviewsDate">{formatDate(review.createdAt)}</span>
                </div>
              </div>

              {/* Comment */}
              <p className="adminReviewsComment">
                {review.comment || <em className="adminReviewsNoComment">No comment</em>}
              </p>

              {/* Admin reply */}
              <AdminReplyEditor
                reviewId={review.id}
                currentReply={review.adminReply}
                onSave={handleReplyUpdate}
              />

              {/* Action row */}
              <div className="adminReviewsCardActions">
                <button
                  className={`adminReviewsActionBtn ${review.isPinned ? "adminReviewsActionBtnActive" : ""}`}
                  onClick={() => handleTogglePin(review)}
                  disabled={togglingId === review.id}
                  title={review.isPinned ? "Unpin" : "Pin to top"}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={review.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-2a7 7 0 0 0-7-7 7 7 0 0 0-7 7v2z"/><line x1="12" y1="10" x2="12" y2="3"/>
                  </svg>
                  {review.isPinned ? "Unpin" : "Pin"}
                </button>

                <button
                  className={`adminReviewsActionBtn ${review.isHighlighted ? "adminReviewsActionBtnHighlight" : ""}`}
                  onClick={() => handleToggleHighlight(review)}
                  disabled={togglingId === review.id}
                  title={review.isHighlighted ? "Remove highlight" : "Highlight"}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={review.isHighlighted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {review.isHighlighted ? "Unhighlight" : "Highlight"}
                </button>

                <button
                  className={`adminReviewsActionBtn ${review.isHidden ? "adminReviewsActionBtnHidden" : ""}`}
                  onClick={() => handleToggleHide(review)}
                  disabled={togglingId === review.id}
                  title={review.isHidden ? "Unhide" : "Hide from buyers & visitors"}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {review.isHidden ? (
                      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    ) : (
                      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    )}
                  </svg>
                  {review.isHidden ? "Unhide" : "Hide"}
                </button>

                <button
                  className="adminReviewsDeleteBtn"
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  title="Delete review permanently"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  {deletingId === review.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
