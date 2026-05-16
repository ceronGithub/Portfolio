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

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

const AI_ROW_EXTERIOR: string[] = [
  `${SB}/exterior/Drone_shot_revealing_landscape_202605061517.mp4`,
  `${SB}/exterior/Drone_shot_revealing_landscape_202605061518.mp4`,
  `${SB}/exterior/project-01.mp4`,
  `${SB}/exterior/project-02.mp4`,
  `${SB}/exterior/project-03.mp4`,
  `${SB}/exterior/project-04.mp4`,
  `${SB}/exterior/project-05.mp4`,
];

const AI_ROW_INTERIOR: string[] = [
  `${SB}/interior/interior-01.mp4`,
  `${SB}/interior/interior-02.mp4`,
  `${SB}/interior/interior-03.mp4`,
  `${SB}/interior/interior-04.mp4`,
  `${SB}/interior/interior-05.mp4`,
  `${SB}/interior/interior-06.mp4`,
  `${SB}/interior/interior-07.mp4`,
];

const AI_ROW_WEAPON: string[] = [
  `${SB}/weapon/axe-01-animation.mp4`,
  `${SB}/weapon/axe-02-animation.mp4`,
  `${SB}/weapon/axe-03-animation.mp4`,
  `${SB}/weapon/axe-04-animation.mp4`,
  `${SB}/weapon/axe-05-animation.mp4`,
  `${SB}/weapon/axe-07-animation.mp4`,
];

const AI_ROW_CHARACTER: string[] = [
  `${SB}/character/orc-01-animation.mp4`,
  `${SB}/character/orc-02-animation.mp4`,
  `${SB}/character/orc-03-animation.mp4`,
  `${SB}/character/orc-04-animation.mp4`,
  `${SB}/character/orc-05-animation.mp4`,
  `${SB}/character/orc-06-animation.mp4`,
  `${SB}/character/orc-07-animation.mp4`,
  `${SB}/character/orc-08-animation.mp4`,
  `${SB}/character/orc-09-animation.mp4`,
  `${SB}/character/orc-11-animation.mp4`,
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
                preload="auto"
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