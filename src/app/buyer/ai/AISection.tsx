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

const GD = (id: string) => `/api/drive-video?id=${id}`;

// 5 videos per row — reduced from 7–13 to limit concurrent Drive video requests
const AI_ROW_EXTERIOR: string[] = [
  GD("1QKCGiJCNzSbpkVsQPN073ws6WbZMwrZC"), // Drone_shot_1517
  GD("1hIAB7FrCEnn8cfrGSCplccHkZ4Gonnxu"), // Drone_shot_1518
  GD("1kp23x5YBnWovDamPDT2FS00d1ID9SB0k"), // project-01
  GD("10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T"), // project-02
  GD("1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ"), // project-03
];

const AI_ROW_INTERIOR: string[] = [
  GD("16IlbksfqFgAsIUlIbSnfG1k0miktYC0d"), // cinematic_motion_0923
  GD("1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ"), // cinematic_motion_0923 (1)
  GD("1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce"), // cinematic_motion_0923 (2)
  GD("1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl"), // cinematic_motion_0923 (3)
  GD("1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu"), // cinematic_motion_0923 (4)
];

const AI_ROW_WEAPON: string[] = [
  GD("1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8"), // axe-01
  GD("1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67"), // axe-02
  GD("1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld"), // axe-03
  GD("1jjU-r5EawMDjzhbJueiadCMjkcCZrHtr"), // axe-04
  GD("1vl3KhBI_UQIugyIXeBTduabrOh0eZSU5"), // axe-05
];

const AI_ROW_CHARACTER: string[] = [
  GD("1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP"), // orc-01
  GD("1SaHl7fGvD2uoy34clB1p2UWT-knWENwl"), // orc-02
  GD("1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i"), // orc-03
  GD("1cx2sETIft3K7R8NnNPumoLet1pW5It0a"), // orc-04
  GD("1-n33tw86ViaKB6xzM0UuCrgF45JVc63-"), // orc-05
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