// ReviewSection.tsx — Buyer review / rating section.
// Shows owned digital products AND owned systems in one scrollable row.
// Buyer clicks a card to open the rating form. Already-reviewed items show rating + Edit button.
// Edit mode: pre-fills form, PATCHes /api/reviews/[id].
// Wired to /api/reviews (GET + POST + PATCH). Admin sees all via /api/admin/reviews.

"use client";

import { useState, useEffect, useMemo } from "react";
import "./review-section.css";
import { sanitize } from "@/lib/utils";
import { useToast }  from "@/app/buyer/shared/useToast";
import ToastStack    from "@/app/buyer/shared/ToastStack";

interface Review {
  id:        string;
  rating:    number;
  comment:   string;
  createdAt: string;
  userName:  string;
  assetId:   string;
}

interface OwnedItem {
  id:   string;
  name: string;
}

interface Props {
  ownedProductIds: string[];
  ownedProducts:   OwnedItem[];
  ownedSystems:    OwnedItem[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Star renderer ──────────────────────────────────────────────────────────
function Stars({ rating, interactive, onRate }: {
  rating: number; interactive?: boolean; onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || rating) : rating;

  return (
    <div className={`rvStars ${interactive ? "rvStarsInteractive" : ""}`}>
      {[1,2,3,4,5].map(i => (
        <svg
          key={i}
          className={`rvStar ${i <= display ? "rvStarFilled" : "rvStarEmpty"}`}
          width="18" height="18" viewBox="0 0 24 24"
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(i)}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= display ? "#f59e0b" : "none"}
            stroke={i <= display ? "#f59e0b" : "rgba(255,255,255,0.15)"}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="rvRatingBar">
      <span className="rvRatingBarLabel">{label}</span>
      <div className="rvRatingBarTrack">
        <div className="rvRatingBarFill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rvRatingBarCount">{count}</span>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function ReviewSection({ ownedProducts, ownedSystems }: Props) {
  const { toasts, showToast, dismissToast } = useToast();

  // All reviews from DB
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Which item card is selected (for new review OR edit)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Edit mode: holds the review being edited
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Form state
  const [formRating,   setFormRating]   = useState(0);
  const [formText,     setFormText]     = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  // Filter for the review list
  const [filterAsset, setFilterAsset] = useState<string>("all");

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then((data: Review[]) => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Combined list: digital products + system products
  const allOwnedItems: OwnedItem[] = useMemo(() => [
    ...ownedProducts,
    ...ownedSystems,
  ], [ownedProducts, ownedSystems]);

  // Map of assetId → submitted review
  const submittedReviewMap = useMemo(() => {
    const map: Record<string, Review> = {};
    for (const review of reviews) {
      map[review.assetId] = review;
    }
    return map;
  }, [reviews]);

  // Open new review form for an item
  function handleSelectItem(itemId: string) {
    if (selectedId === itemId && !editingReviewId) {
      setSelectedId(null);
      setEditingReviewId(null);
      return;
    }
    setSelectedId(itemId);
    setEditingReviewId(null);
    setFormRating(0);
    setFormText("");
  }

  // Open edit form for an already-reviewed item
  function handleEditReview(itemId: string) {
    const existing = submittedReviewMap[itemId];
    if (!existing) return;
    setSelectedId(itemId);
    setEditingReviewId(existing.id);
    setFormRating(existing.rating);
    setFormText(existing.comment ?? "");
  }

  function handleCancel() {
    setSelectedId(null);
    setEditingReviewId(null);
    setFormRating(0);
    setFormText("");
  }

  // Submit new review
  async function handleSubmit() {
    if (!selectedId || formRating === 0) {
      showToast("✕ Please select a rating.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ assetId: selectedId, rating: formRating, comment: formText }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setReviews(prev => [data, ...prev]);
        handleCancel();
        showToast("✓ Review submitted. Thank you!", "success");
      } else if (res.status === 409) {
        showToast("✕ You already reviewed this item.", "error");
      } else {
        showToast(`✕ ${data.error ?? "Something went wrong."}`, "error");
      }
    } catch {
      showToast("✕ Network error. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Save edited review
  async function handleSaveEdit() {
    if (!editingReviewId || formRating === 0) {
      showToast("✕ Please select a rating.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${editingReviewId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rating: formRating, comment: formText }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === editingReviewId ? data : r));
        handleCancel();
        showToast("✓ Review updated successfully.", "success");
      } else {
        showToast(`✕ ${data.error ?? "Update failed."}`, "error");
      }
    } catch {
      showToast("✕ Network error. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Resolve item name from id (products or systems)
  function resolveItemName(id: string): string {
    return allOwnedItems.find(i => i.id === id)?.name ?? id;
  }

  // Filter the public review list
  const filtered = useMemo(() =>
    filterAsset === "all" ? reviews : reviews.filter(r => r.assetId === filterAsset),
  [reviews, filterAsset]);

  const scopeCount: number = filtered.length;

  const avgRating = useMemo(() => {
    if (filtered.length === 0) return 0;
    return filtered.reduce((s, r) => s + r.rating, 0) / filtered.length;
  }, [filtered]);

  const ratingDist: { star: number; count: number }[] = useMemo(() =>
    [5,4,3,2,1].map(star => ({
      star,
      count: filtered.filter(r => r.rating === star).length,
    })),
  [filtered]);

  const reviewedAssetIds = useMemo(() =>
    Array.from(new Set(reviews.map(r => r.assetId))),
  [reviews]);

  const hasOwned = allOwnedItems.length > 0;

  return (
    <section className="rvSection">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="rvInner">

        {/* ── Header ── */}
        <div className="rvHeader">
          <div className="rvHeaderLeft">
            <p className="rvEyebrow">Community</p>
            <h2 className="rvTitle">Reviews &amp; Ratings</h2>
          </div>
          <p className="rvSub">Honest feedback from verified buyers.</p>
        </div>

        {/* ── Owned items scroll row (products + systems) ── */}
        {hasOwned ? (
          <div className="rvProductBlock">
            <p className="rvProductBlockLabel">Rate your purchases</p>
            <div className="rvProductScroll">
              {allOwnedItems.map(item => {
                const alreadyReviewed = submittedReviewMap[item.id];
                const isSelected      = selectedId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rvProductCard ${isSelected ? "rvProductCardSelected" : ""} ${alreadyReviewed ? "rvProductCardReviewed" : ""}`}
                  >
                    <p className="rvProductCardName">{item.name}</p>
                    {alreadyReviewed ? (
                      <div className="rvProductCardRated">
                        <Stars rating={alreadyReviewed.rating} />
                        <div className="rvProductCardRatedActions">
                          <span className="rvProductCardRatedLabel">Reviewed</span>
                          <button
                            className="rvProductCardEditBtn"
                            onClick={() => handleEditReview(item.id)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="rvProductCardRateBtn"
                        onClick={() => handleSelectItem(item.id)}
                      >
                        {isSelected ? "Rating…" : "Rate →"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Inline form — new review or edit ── */}
            {selectedId && (
              <div className="rvInlineForm">
                <p className="rvInlineFormProduct">
                  {editingReviewId ? "Edit your review — " : ""}{resolveItemName(selectedId)}
                </p>

                <div className="rvFormStarRow">
                  <span className="rvFormStarLabel">Your rating</span>
                  <Stars rating={formRating} interactive onRate={setFormRating} />
                </div>

                <textarea
                  className="rvFormTextarea"
                  placeholder="Share your experience (optional, max 500 chars)"
                  value={formText}
                  maxLength={500}
                  rows={3}
                  onChange={e => setFormText(sanitize(e.target.value))}
                />
                <span className="rvFormCharCount">{formText.length}/500</span>

                <div className="rvInlineFormActions">
                  <button className="rvFormCancelBtn" onClick={handleCancel}>Cancel</button>
                  <button
                    className={`rvFormSubmit ${submitting ? "rvFormSubmitLoading" : ""}`}
                    onClick={editingReviewId ? handleSaveEdit : handleSubmit}
                    disabled={submitting || formRating === 0}
                  >
                    {submitting ? "Saving…" : editingReviewId ? "Save Changes" : "Submit Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rvFormLocked">
            <span className="rvFormLockedIcon">🔒</span>
            <p>Purchase a product or system to leave a review.</p>
          </div>
        )}

        {/* ── Rating summary ── */}
        <div className="rvSummary">
          <div className="rvSummaryScore">
            <span className="rvSummaryAvg">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
            <div className="rvSummaryRight">
              <Stars rating={Math.round(avgRating)} />
              <p className="rvSummaryCount">{scopeCount} review{scopeCount !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="rvRatingBars">
            {ratingDist.map(({ star, count }) => (
              <RatingBar key={star} label={`${star}★`} count={count} total={scopeCount} />
            ))}
          </div>
        </div>

        {/* ── Filter row ── */}
        {reviewedAssetIds.length > 0 && (
          <div className="rvFilterRow">
            <button
              className={`rvFilterBtn ${filterAsset === "all" ? "rvFilterBtnActive" : ""}`}
              onClick={() => setFilterAsset("all")}
            >
              All
            </button>
            {reviewedAssetIds.map(aid => (
              <button
                key={aid}
                className={`rvFilterBtn ${filterAsset === aid ? "rvFilterBtnActive" : ""}`}
                onClick={() => setFilterAsset(aid)}
              >
                {resolveItemName(aid)}
              </button>
            ))}
          </div>
        )}

        {/* ── Review list ── */}
        {loading && (
          <div className="rvLoadingRow">
            {[1,2,3].map(i => <div key={i} className="rvCardSkeleton" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rvEmpty">
            <p className="rvEmptyText">No reviews yet. Be the first.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="rvList">
            {filtered.map(review => (
              <div key={review.id} className="rvCard">
                <div className="rvCardTop">
                  <div className="rvCardAvatar">
                    {review.userName[0].toUpperCase()}
                  </div>
                  <div className="rvCardInfo">
                    <p className="rvCardName">{review.userName}</p>
                    <p className="rvCardMeta">
                      {resolveItemName(review.assetId)}
                      {" · "}
                      {fmtDate(review.createdAt)}
                    </p>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="rvCardComment">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
