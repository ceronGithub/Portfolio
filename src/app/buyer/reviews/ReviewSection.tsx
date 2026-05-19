// ReviewSection.tsx — Buyer review / rating section.
// Fetches all reviews on mount. Lets the logged-in buyer submit a new review.
// Star rating: 1–5 SVG stars. Filter by product. Shows average rating per product.

"use client";

import { useState, useEffect, useMemo } from "react";
import "./review-section.css";

interface Review {
  id:          string;
  rating:      number;
  comment:     string;
  createdAt:   string;
  userName:    string;
  productId:   string;
  productName: string;
}

interface Props {
  ownedProductIds: string[];   // only owned products can be reviewed
  ownedProducts:   { id: string; name: string }[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Star renderer ─────────────────────────────────────────────────────────
function Stars({
  rating,
  interactive,
  onRate,
}: {
  rating:      number;
  interactive?: boolean;
  onRate?:     (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || rating) : rating;

  return (
    <div className={`rvStars ${interactive ? "rvStarsInteractive" : ""}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`rvStar ${i <= display ? "rvStarFilled" : "rvStarEmpty"}`}
          width="16" height="16" viewBox="0 0 24 24"
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(i)}
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i <= display ? "#f59e0b" : "none"}
            stroke={i <= display ? "#f59e0b" : "rgba(255,255,255,0.15)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

// ── Average rating bar ────────────────────────────────────────────────────
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
export default function ReviewSection({ ownedProductIds, ownedProducts }: Props) {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filterProd, setFilterProd] = useState<string>("all");
  const [formProd,   setFormProd]   = useState(ownedProducts[0]?.id ?? "");
  const [formRating, setFormRating] = useState(0);
  const [formText,   setFormText]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg,  setSubmitMsg]  = useState("");

  // ── Fetch reviews ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then((data: Review[]) => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Filtered reviews ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filterProd === "all") return reviews;
    return reviews.filter(r => r.productId === filterProd);
  }, [reviews, filterProd]);

  // ── Average + distribution ───────────────────────────────────────────────
  const avgRating = useMemo(() => {
    const scope = filterProd === "all" ? reviews : filtered;
    if (scope.length === 0) return 0;
    return scope.reduce((s, r) => s + r.rating, 0) / scope.length;
  }, [reviews, filtered, filterProd]);

  const ratingDist = useMemo(() => {
    const scope = filterProd === "all" ? reviews : filtered;
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      count: scope.filter(r => r.rating === star).length,
    }));
  }, [reviews, filtered, filterProd]);

  // ── Submit review ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!formProd || formRating === 0) {
      setSubmitMsg("Please select a product and rating.");
      return;
    }
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId: formProd, rating: formRating, comment: formText }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setReviews(prev => [data, ...prev]);
        setFormRating(0);
        setFormText("");
        setSubmitMsg("Review submitted. Thank you!");
      } else if (res.status === 409) {
        setSubmitMsg("You already reviewed this product.");
      } else {
        setSubmitMsg(data.error ?? "Something went wrong.");
      }
    } catch {
      setSubmitMsg("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const scopeCount = filterProd === "all" ? reviews.length : filtered.length;

  return (
    <section className="rvSection">
      <div className="rvInner">

        {/* Header */}
        <div className="rvHeader">
          <p className="rvEyebrow">Community</p>
          <h2 className="rvTitle">Reviews & Ratings</h2>
          <p className="rvSub">Honest feedback from verified buyers.</p>
        </div>

        {/* Stats + form row */}
        <div className="rvTopRow">

          {/* Rating summary */}
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
                <RatingBar
                  key={star}
                  label={`${star}★`}
                  count={count}
                  total={scopeCount}
                />
              ))}
            </div>
          </div>

          {/* Submit form — only if buyer owns products */}
          {ownedProducts.length > 0 && (
            <div className="rvForm">
              <p className="rvFormTitle">Leave a Review</p>

              <select
                className="rvFormSelect"
                value={formProd}
                onChange={e => setFormProd(e.target.value)}
              >
                {ownedProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

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
                onChange={e => setFormText(e.target.value)}
              />
              <span className="rvFormCharCount">{formText.length}/500</span>

              <button
                className={`rvFormSubmit ${submitting ? "rvFormSubmitLoading" : ""}`}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>

              {submitMsg && (
                <p className={`rvFormMsg ${submitMsg.includes("Thank") ? "rvFormMsgOk" : "rvFormMsgErr"}`}>
                  {submitMsg}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Filter row */}
        <div className="rvFilterRow">
          <button
            className={`rvFilterBtn ${filterProd === "all" ? "rvFilterBtnActive" : ""}`}
            onClick={() => setFilterProd("all")}
          >
            All Products
          </button>
          {Array.from(new Set(reviews.map(r => r.productId))).map(pid => {
            const name = reviews.find(r => r.productId === pid)?.productName ?? pid;
            return (
              <button
                key={pid}
                className={`rvFilterBtn ${filterProd === pid ? "rvFilterBtnActive" : ""}`}
                onClick={() => setFilterProd(pid)}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Review list */}
        {loading && <p className="rvLoading">Loading reviews…</p>}

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
                      {review.productName} · {fmtDate(review.createdAt)}
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
