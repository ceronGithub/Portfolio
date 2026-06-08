// ReviewSection.tsx — Buyer review / rating section.
// Shows a horizontal scrollable row of all owned products.
// Buyer clicks a product card to open the rating form for that product.
// Already-reviewed products show their submitted rating.
// Wired to /api/reviews (GET + POST). Admin sees all via /api/admin/reviews.

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

interface OwnedProduct {
  id:   string;
  name: string;
}

interface Props {
  ownedProductIds: string[];
  ownedProducts:   OwnedProduct[];
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
export default function ReviewSection({ ownedProducts }: Props) {
  const { toasts, showToast, dismissToast } = useToast();

  // All reviews from DB
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Which product card is selected for reviewing
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Form state for the selected product
  const [formRating,   setFormRating]   = useState(0);
  const [formText,     setFormText]     = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  // Filter for the review list below
  const [filterAsset,  setFilterAsset]  = useState<string>("all");

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then((data: Review[]) => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Map of assetId → submitted review (so we know which products already have a review)
  const submittedReviewMap = useMemo(() => {
    const map: Record<string, Review> = {};
    for (const review of reviews) {
      map[review.assetId] = review;
    }
    return map;
  }, [reviews]);

  // When a product card is clicked, open rating form for it (reset form)
  function handleSelectProduct(productId: string) {
    // Toggle off if already selected
    if (selectedProductId === productId) {
      setSelectedProductId(null);
      return;
    }
    setSelectedProductId(productId);
    setFormRating(0);
    setFormText("");
  }

  async function handleSubmit() {
    if (!selectedProductId || formRating === 0) {
      showToast("✕ Please select a product and a rating.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ assetId: selectedProductId, rating: formRating, comment: formText }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setReviews(prev => [data, ...prev]);
        setFormRating(0);
        setFormText("");
        setSelectedProductId(null);
        showToast("✓ Review submitted. Thank you!", "success");
      } else if (res.status === 409) {
        showToast("✕ You already reviewed this product.", "error");
      } else {
        const msg = data.error ?? "Something went wrong.";
        showToast(`✕ ${msg}`, "error");
      }
    } catch {
      showToast("✕ Network error. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
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

  const ratingDist = useMemo(() =>
    [5,4,3,2,1].map(star => ({
      star,
      count: filtered.filter(r => r.rating === star).length,
    })),
  [filtered]);

  // Assets that appear in reviews — for the filter buttons
  const reviewedAssetIds = useMemo(() =>
    Array.from(new Set(reviews.map(r => r.assetId))),
  [reviews]);

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

        {/* ── Owned products scroll row ── */}
        {ownedProducts.length > 0 ? (
          <div className="rvProductBlock">
            <p className="rvProductBlockLabel">Rate your purchased products</p>
            <div className="rvProductScroll">
              {ownedProducts.map(product => {
                const alreadyReviewed = submittedReviewMap[product.id];
                const isSelected      = selectedProductId === product.id;

                return (
                  <button
                    key={product.id}
                    className={`rvProductCard ${isSelected ? "rvProductCardSelected" : ""} ${alreadyReviewed ? "rvProductCardReviewed" : ""}`}
                    onClick={() => !alreadyReviewed && handleSelectProduct(product.id)}
                    disabled={!!alreadyReviewed}
                    title={alreadyReviewed ? `You rated this ${alreadyReviewed.rating}★` : `Rate ${product.name}`}
                  >
                    <p className="rvProductCardName">{product.name}</p>
                    {alreadyReviewed ? (
                      <div className="rvProductCardRated">
                        <Stars rating={alreadyReviewed.rating} />
                        <span className="rvProductCardRatedLabel">Reviewed</span>
                      </div>
                    ) : (
                      <span className="rvProductCardCta">
                        {isSelected ? "Rating…" : "Rate →"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Inline rating form — appears below scroll row when a card is selected ── */}
            {selectedProductId && !submittedReviewMap[selectedProductId] && (
              <div className="rvInlineForm">
                <p className="rvInlineFormProduct">
                  {ownedProducts.find(p => p.id === selectedProductId)?.name}
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
                  <button
                    className="rvFormCancelBtn"
                    onClick={() => setSelectedProductId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`rvFormSubmit ${submitting ? "rvFormSubmitLoading" : ""}`}
                    onClick={handleSubmit}
                    disabled={submitting || formRating === 0}
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rvFormLocked">
            <span className="rvFormLockedIcon">🔒</span>
            <p>Purchase an asset to leave a review.</p>
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
            {ratingDist.map(({ star, count }: { star: number; count: number }) => (
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
                {/* Show product name if available, fallback to assetId */}
                {ownedProducts.find(p => p.id === aid)?.name ?? aid}
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
                      {ownedProducts.find(p => p.id === review.assetId)?.name ?? review.assetId}
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