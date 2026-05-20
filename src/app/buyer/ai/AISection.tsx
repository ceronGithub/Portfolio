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

const AI_ROW_EXTERIOR: string[] = [
  GD("1QKCGiJCNzSbpkVsQPN073ws6WbZMwrZC"), // Drone_shot_1517
  GD("1hIAB7FrCEnn8cfrGSCplccHkZ4Gonnxu"), // Drone_shot_1518
  GD("1kp23x5YBnWovDamPDT2FS00d1ID9SB0k"), // project-01
  GD("10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T"), // project-02
  GD("1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ"), // project-03
  GD("1On-oICTEgx81tNSRyW7DZYk3IOEDBiAT"), // project-04
  GD("1MJR8A38OCNRDxb_jRheBdRgexnAOugZf"), // AI_video_architectural
];

const AI_ROW_INTERIOR: string[] = [
  GD("16IlbksfqFgAsIUlIbSnfG1k0miktYC0d"), // cinematic_motion_0923
  GD("1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ"), // cinematic_motion_0923 (1)
  GD("1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce"), // cinematic_motion_0923 (2)
  GD("1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl"), // cinematic_motion_0923 (3)
  GD("1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu"), // cinematic_motion_0923 (4)
  GD("1iqOFR1-0gO4v-Wk7PzBKZ2TsSeL0qoOW"), // cinematic_motion_0936
  GD("1p34uCYAykKSH9c5fHXh1PuRn_S5XS3sG"), // cinematic_motion_0939
];

const AI_ROW_WEAPON: string[] = [
  GD("1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8"), // axe-01
  GD("1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67"), // axe-02
  GD("1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld"), // axe-03
  GD("1jjU-r5EawMDjzhbJueiadCMjkcCZrHtr"), // axe-04
  GD("1vl3KhBI_UQIugyIXeBTduabrOh0eZSU5"), // axe-05
  GD("1DcmVwUgfOzvl8wzJJOq-YP7pR_8ZXZ4u"), // axe-06
  GD("1k9AhDcIY-Em7Wyl5fd2i79DomElK1DnM"), // axe-07
  GD("1tqcYpL3wqMpomBiXOo_N6yDwspdEgmWu"), // axe-08
  GD("1rOZz4JdPpbII8L68TkmPxCNrKhC0Bnax"), // hammer-01
  GD("1vzptVR7H_6LP5mt_n_8d9I1SBXggylAF"), // hammer-02
  GD("15BTm6HFoc8WUHpAbIucC1LBHY7M_bs5r"), // sw-03
];

const AI_ROW_CHARACTER: string[] = [
  GD("1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP"), // orc-01
  GD("1SaHl7fGvD2uoy34clB1p2UWT-knWENwl"), // orc-02
  GD("1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i"), // orc-03
  GD("1cx2sETIft3K7R8NnNPumoLet1pW5It0a"), // orc-04
  GD("1-n33tw86ViaKB6xzM0UuCrgF45JVc63-"), // orc-05
  GD("1XVymFPXK8aQa-Ud7DwpkaQ6g3BrGiLjH"), // orc-06
  GD("16-RCaA3WjQjMf1GT0Ad2JrjAhR-U_FyH"), // orc-07
  GD("1Wjgt2RcRkUrbxEMnLQWWdiUdQ3OHwpx3"), // orc-08
  GD("1JB-kYyq0XMrPe0pgrh5L2S-nGmK-wvXE"), // orc-09
  GD("1q3rW69QWjYEK5T53rRTpTFlR7X9ZERRe"), // orc-10
  GD("1CTk71XmBB9yNz9Osbfd-YHg9mrsgmZkf"), // orc-11
  GD("1ZPSoWhJc0ukVny9sCKp0-ytzTsz0aL50"), // orc-12
  GD("1W1eHcST6_noKH3VCygvpKz-JFZkCF6Su"), // orc-13
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