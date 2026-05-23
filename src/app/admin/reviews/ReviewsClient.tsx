// admin/reviews/ReviewsClient.tsx — Client-side reviews table.
// Filter by star rating. Delete with confirmation. Live row removal.

"use client";

import { useState } from "react";

type ReviewRow = {
  id:        string;
  rating:    number;
  comment:   string;
  assetId:   string;
  createdAt: string;
  buyerName: string;
  email:     string;
};

// ── Star renderer — filled vs outline SVGs ────────────────────────────────────
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

// ── Format date helper ────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

// ── Filter tab values ─────────────────────────────────────────────────────────
const FILTER_OPTIONS = ["All", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

function filterRating(option: FilterOption): number | null {
  if (option === "All") return null;
  return parseInt(option[0]);
}

// ── Main client component ─────────────────────────────────────────────────────
export default function ReviewsClient({ reviews: initial }: { reviews: ReviewRow[] }) {
  const [reviews,       setReviews]      = useState<ReviewRow[]>(initial);
  const [activeFilter,  setActiveFilter] = useState<FilterOption>("All");
  const [deletingId,    setDeletingId]   = useState<string | null>(null);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const targetRating = filterRating(activeFilter);
  const visibleReviews = targetRating === null
    ? reviews
    : reviews.filter(r => r.rating === targetRating);

  // ── Delete a review ───────────────────────────────────────────────────────
  async function handleDelete(reviewId: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="adminReviewsContent">

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
              {opt === "All"
                ? reviews.length
                : reviews.filter(r => r.rating === filterRating(opt)).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {visibleReviews.length === 0 ? (
        <div className="adminReviewsEmpty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p>No reviews found for this filter.</p>
        </div>
      ) : (
        <div className="adminReviewsTable">
          <div className="adminReviewsTableHeader">
            <span>Buyer</span>
            <span>Asset</span>
            <span>Rating</span>
            <span>Comment</span>
            <span>Date</span>
            <span></span>
          </div>

          {visibleReviews.map(review => (
            <div key={review.id} className="adminReviewsTableRow">
              <div className="adminReviewsBuyerCell">
                <span className="adminReviewsBuyerName">{review.buyerName}</span>
                <span className="adminReviewsBuyerEmail">{review.email}</span>
              </div>
              <span className="adminReviewsAssetId">{review.assetId}</span>
              <StarRating rating={review.rating} />
              <span className="adminReviewsComment">
                {review.comment || <em className="adminReviewsNoComment">No comment</em>}
              </span>
              <span className="adminReviewsDate">{formatDate(review.createdAt)}</span>
              <button
                className="adminReviewsDeleteBtn"
                onClick={() => handleDelete(review.id)}
                disabled={deletingId === review.id}
                aria-label="Delete review"
              >
                {deletingId === review.id ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
