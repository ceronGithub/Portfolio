// NewArchitectureSection — Architecture Studio latest drop teaser.
// Coming Soon state — text only, no videos, no fire canvas, no parallax.
// Flip isLive to true and populate asset fields when the drop is ready.

"use client";

import "./new-architecture-section.css";

// ── Update these when the architecture drop is ready ──────────────────────
const LATEST_EXTERIOR = {
  label:       "Drone Reveal — Project 05",
  price:       "₱8,500",
  releaseNote: "4K · exterior scene · editable Blender file",
  isLive:      false,
};

const LATEST_INTERIOR = {
  label:       "Interior 07 — Luxury Suite",
  price:       "₱7,500",
  releaseNote: "4K · interior walkthrough · editable Blender file",
  isLive:      false,
};
// ─────────────────────────────────────────────────────────────────────────

export default function NewArchitectureSection() {
  const isLive = LATEST_EXTERIOR.isLive || LATEST_INTERIOR.isLive;

  return (
    <section className="newArchSection">

      <div className="newArchContent">
        <div className="newArchHeaderRow">
          <div>
            <p className="newArchLabel">Latest Drop</p>
            <h2 className="newArchTitle">New Architecture Assets.</h2>
          </div>
          {isLive ? (
            <span className="newArchLiveBadge">● Live</span>
          ) : (
            <span className="newArchComingSoon">Coming Soon</span>
          )}
        </div>

        {/* Dual asset meta — hidden until live */}
        {isLive && (
          <div className="newArchDualMeta">
            <div className="newArchMetaItem">
              <p className="newArchMetaName">{LATEST_EXTERIOR.label}</p>
              <p className="newArchMetaPrice">{LATEST_EXTERIOR.price}</p>
              <p className="newArchMetaNote">{LATEST_EXTERIOR.releaseNote}</p>
            </div>
            <div className="newArchMetaDivider" />
            <div className="newArchMetaItem">
              <p className="newArchMetaName">{LATEST_INTERIOR.label}</p>
              <p className="newArchMetaPrice">{LATEST_INTERIOR.price}</p>
              <p className="newArchMetaNote">{LATEST_INTERIOR.releaseNote}</p>
            </div>
          </div>
        )}

        {/* Teaser cards — text only, no media */}
        <div className="newArchCards">

          <div className="newArchCard">
            <div className="newArchCardInner">
              <span className="newArchCardIcon">🏗️</span>
              <p className="newArchCardLabel">Exterior</p>
              <p className="newArchCardSub">Coming Soon</p>
            </div>
          </div>

          <div className="newArchCard">
            <div className="newArchCardInner">
              <span className="newArchCardIcon">🪟</span>
              <p className="newArchCardLabel">Interior</p>
              <p className="newArchCardSub">Coming Soon</p>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}