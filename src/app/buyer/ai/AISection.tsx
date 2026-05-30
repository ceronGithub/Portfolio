// AISection — client component.
// 4-row CSS auto-scroll carousel — video only, no text.
//
// FIX STRATEGY:
//   Per-card IntersectionObserver does NOT work with CSS-animated tracks because
//   the browser computes intersection against the layout position, not the
//   GPU-composited (transformed) position. Cards appear "visible" even when
//   they're offscreen.
//
//   Solution: Row-level observer only.
//     - All video srcs set upfront, preload="none" (zero network cost until play).
//     - When the ROW enters the viewport → play all videos in that row.
//     - When the ROW leaves the viewport → pause all videos in that row.
//     - This guarantees uniform playback: all cards in a visible row play together.

"use client";


import "./ai-section.css";

// Video rows — Cloudflare R2 (zero egress, direct CDN).
const R2 = "https://pub-2ce00f29dc8e495183023b1ecef335df.r2.dev";

const AI_ROW_EXTERIOR: string[] = [
  `${R2}/architecture/exterior_1.mp4`,
  `${R2}/architecture/exterior_2.mp4`,
  `${R2}/architecture/exterior_3.mp4`,
  `${R2}/architecture/exterior_4.mp4`,
];

const AI_ROW_INTERIOR: string[] = [
  `${R2}/architecture/interior_1.mp4`,
  `${R2}/architecture/interior_2.mp4`,
  `${R2}/architecture/interior_3.mp4`,
  `${R2}/architecture/interior_4.mp4`,
  `${R2}/architecture/interior_5.mp4`,
];

const AI_ROW_WEAPON: string[] = [
  `${R2}/weapon/axe-01-animation.mp4`,
  `${R2}/weapon/axe-02-animation.mp4`,
  `${R2}/weapon/axe-03-animation.mp4`,
];

const AI_ROW_CHARACTER: string[] = [
  `${R2}/character/orc-01-animation.mp4`,
  `${R2}/character/orc-02-animation.mp4`,
  `${R2}/character/orc-03-animation.mp4`,
  `${R2}/character/orc-04-animation.mp4`,
  `${R2}/character/orc-05-animation.mp4`,
];

const ALL_ROWS = [
  { label: "Exterior",  srcs: AI_ROW_EXTERIOR  },
  { label: "Interior",  srcs: AI_ROW_INTERIOR  },
  { label: "Weapon",    srcs: AI_ROW_WEAPON    },
  { label: "Character", srcs: AI_ROW_CHARACTER },
];

/* ── AiCarouselRow ──────────────────────────────────────────────────────
   No observer, no play/pause logic.
   Videos autoplay + loop continuously regardless of visibility.
   ──────────────────────────────────────────────────────────────────── */
function AiCarouselRow({ srcs, reversed }: { srcs: string[]; reversed?: boolean }) {
  const loopSrcs = [...srcs, ...srcs]; // duplicate for seamless CSS loop

  return (
    <div className="aiCarouselRowViewport">
      <div
        className={`aiCarouselRowTrack ${
          reversed ? "aiCarouselRowReversed" : "aiCarouselRowForward"
        }`}
      >
        {loopSrcs.map((src, i) => (
          <div key={i} className="aiVideoCard">
            <div className="aiVideoCardFrame">
              <video
                src={src}
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                className="aiVideoCardNative"
                preload="none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── Section ────────────────────────────────────────────────────────── */
export default function AISection() {
  return (
    <section className="aiSection">
      <div className="aiSectionHeader">
        <p className="aiSectionLabel">AI-Generated</p>
        <h2 className="aiSectionTitle">Visual assets, ready to use.</h2>
        <p className="aiSectionSub">
          Exterior, interior, weapon, and character animations — all AI-generated and available for purchase.
        </p>
      </div>

      <div className="aiCarouselRows">
        {ALL_ROWS.map((row, i) => (
          <div key={row.label} className="aiCarouselRowGroup">
            <AiCarouselRow srcs={row.srcs} reversed={i % 2 !== 0} />
          </div>
        ))}
      </div>
    </section>
  );
}