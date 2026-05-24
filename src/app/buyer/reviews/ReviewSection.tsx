// ReviewSection.tsx — Buyer review / rating section.
// Uses asset slug IDs (orc-01, axe-03, int-01, etc.) — no Product table.
// Only buyers who own an asset can review it.

"use client";

import { useState, useEffect, useMemo } from "react";
import "./review-section.css";
import { sanitize } from "@/lib/utils";

// ── Asset label map ────────────────────────────────────────────────────────
const ASSET_LABELS: Record<string, string> = {
  "orc-01": "Orc 01 — Warrior",     "orc-02": "Orc 02 — Fighter",
  "orc-03": "Orc 03 — Red Skin",    "orc-04": "Orc 04 — Armored",
  "orc-05": "Orc 05 — Shaman",      "orc-06": "Orc 06 — Berserker",
  "orc-07": "Orc 07 — Heavy",       "orc-08": "Orc 08 — Scout",
  "orc-09": "Orc 09 — Elite",       "orc-10": "Orc 10 — Destroyer",
  "orc-11": "Orc 11 — Warlord",     "orc-12": "Orc 12",
  "orc-13": "Orc 13",
  "axe-01": "Axe 01 — Battle Axe",  "axe-02": "Axe 02 — War Axe",
  "axe-03": "Axe 03 — Runic Axe",   "axe-04": "Axe 04 — Viking Axe",
  "axe-05": "Axe 05 — Ornate Axe",  "axe-06": "Axe 06 — Broad Axe",
  "axe-07": "Axe 07 — Bloodied Axe","axe-08": "Axe 08 — Dark Axe",
  "int-01": "Interior 01 — Suite",  "int-02": "Interior 02 — Living",
  "int-03": "Interior 03 — Kitchen","int-04": "Interior 04 — Bedroom",
  "int-05": "Interior 05 — Lobby",  "int-06": "Interior 06 — Office",
  "int-07": "Interior 07 — Luxury",
  "ext-drone-01": "Drone Reveal 01","ext-drone-02": "Drone Reveal 02",
  "ext-proj-01":  "Project 01",     "ext-proj-02":  "Project 02",
  "ext-proj-03":  "Project 03",     "ext-proj-04":  "Project 04",
  "ext-proj-05":  "Project 05",
};

function assetLabel(id: string) {
  return ASSET_LABELS[id] ?? id;
}

interface Review {
  id:        string;
  rating:    number;
  comment:   string;
  createdAt: string;
  userName:  string;
  assetId:   string;
}

interface Props {
  ownedProductIds: string[];  // asset slug IDs buyer owns
  ownedProducts:   { id: string; name: string }[]; // kept for compat, not used
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
          width="16" height="16" viewBox="0 0 24 24"
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
export default function ReviewSection({ ownedProductIds }: Props) {
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filterAsset,setFilterAsset]= useState<string>("all");
  const [formAsset,  setFormAsset]  = useState(ownedProductIds[0] ?? "");
  const [formRating, setFormRating] = useState(0);
  const [formText,   setFormText]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg,  setSubmitMsg]  = useState("");

  useEffect(() => {
    fetch("/api/reviews")
      .then(r => r.json())
      .then((data: Review[]) => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Keep formAsset in sync if ownedProductIds changes
  useEffect(() => {
    if (!formAsset && ownedProductIds.length > 0) setFormAsset(ownedProductIds[0]);
  }, [ownedProductIds]);

  const filtered = useMemo(() =>
    filterAsset === "all" ? reviews : reviews.filter(r => r.assetId === filterAsset),
  [reviews, filterAsset]);

  const scopeCount = filtered.length;

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

  async function handleSubmit() {
    if (!formAsset || formRating === 0) {
      setSubmitMsg("Please select an asset and a rating.");
      return;
    }
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ assetId: formAsset, rating: formRating, comment: formText }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setReviews(prev => [data, ...prev]);
        setFormRating(0);
        setFormText("");
        setSubmitMsg("Review submitted. Thank you!");
      } else if (res.status === 409) {
        setSubmitMsg("You already reviewed this asset.");
      } else {
        setSubmitMsg(data.error ?? "Something went wrong.");
      }
    } catch {
      setSubmitMsg("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rvSection">
      <div className="rvInner">

        {/* Header */}
        <div className="rvHeader">
          <div className="rvHeaderLeft">
            <p className="rvEyebrow">Community</p>
            <h2 className="rvTitle">Reviews & Ratings</h2>
          </div>
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
                <RatingBar key={star} label={`${star}★`} count={count} total={scopeCount} />
              ))}
            </div>
          </div>

          {/* Submit form — only for buyers who own assets */}
          {ownedProductIds.length > 0 ? (
            <div className="rvForm">
              <p className="rvFormTitle">Leave a Review</p>

              <select
                className="rvFormSelect"
                value={formAsset}
                onChange={e => setFormAsset(sanitize(e.target.value))}
              >
                {ownedProductIds.map(id => (
                  <option key={id} value={id}>{assetLabel(id)}</option>
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
                onChange={e => setFormText(sanitize(e.target.value))}
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
          ) : (
            <div className="rvFormLocked">
              <span className="rvFormLockedIcon">🔒</span>
              <p>Purchase an asset to leave a review.</p>
            </div>
          )}
        </div>

        {/* Filter row */}
        {reviewedAssetIds.length > 0 && (
          <div className="rvFilterRow">
            <button
              className={`rvFilterBtn ${filterAsset === "all" ? "rvFilterBtnActive" : ""}`}
              onClick={() => setFilterAsset("all")}
            >
              All Assets
            </button>
            {reviewedAssetIds.map(aid => (
              <button
                key={aid}
                className={`rvFilterBtn ${filterAsset === aid ? "rvFilterBtnActive" : ""}`}
                onClick={() => setFilterAsset(aid)}
              >
                {assetLabel(aid)}
              </button>
            ))}
          </div>
        )}

        {/* Review list */}
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
                      {assetLabel(review.assetId)} · {fmtDate(review.createdAt)}
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