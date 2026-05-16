// ModelingSection — Visitor > AI Visual Systems > Section 2.
// Sticky scroll-jacking reveal:
//   Phase 0→0.30 : orc-right slides in from right, orc-left from left
//   Phase 0.28→0.58 : center slogan fades in with parallax upward drift
//   Phase 0.52→0.80 : info steps (01/02/03) stagger in
//   Phase 0.82→1.0  : sticky fades out → videos appear
// After sticky, MagazineSection videos render normally as children.

"use client";

import { useRef, useEffect, useState } from "react";
import "./modeling-section.css";

// ── Info steps shown in the center slogan ──────────────────────────────────
const MODELING_STEPS = [
  { num: "01", title: "Create a free account", desc: "Register with your email. 30 seconds, no card required." },
  { num: "02", title: "Purchase the collection", desc: "One-time payment. No subscription. Full .OBJ source files included." },
  { num: "03", title: "Download forever", desc: "Instant dashboard access. Re-download anytime, lifetime." },
];

interface ModelingSectionProps {
  children: React.ReactNode; // MagazineSection video rows
}

export default function ModelingSection({ children }: ModelingSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // ── Scroll progress tracker ───────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect       = el.getBoundingClientRect();
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      setProgress(Math.max(0, Math.min(1, -rect.top / scrollable)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Animation values ─────────────────────────────────────────────────────

  // Orcs slide in from sides (progress 0 → 0.30)
  const orcProgress  = Math.min(1, progress / 0.30);
  const orcRightX    =  (1 - orcProgress) * 160;
  const orcLeftX     = -(1 - orcProgress) * 160;
  const orcOpacity   = orcProgress;

  // Slogan block rises (progress 0.28 → 0.55)
  const sloganProg   = Math.max(0, Math.min(1, (progress - 0.28) / 0.27));
  const sloganY      = (1 - sloganProg) * 50;
  const sloganOpacity = sloganProg;

  // Steps stagger (progress 0.52 → 0.80)
  const stepsBase    = 0.52;
  const stepOpacity  = (i: number) =>
    Math.max(0, Math.min(1, (progress - stepsBase - i * 0.08) / 0.14));
  const stepY        = (i: number) =>
    (1 - Math.max(0, Math.min(1, (progress - stepsBase - i * 0.08) / 0.14))) * 26;

  // Fade out at end (progress 0.82 → 1.0)
  const stickyOpacity = progress > 0.82
    ? Math.max(0, 1 - (progress - 0.82) / 0.18)
    : 1;

  return (
    <div ref={sectionRef} className="modelSection">

      {/* ── Sticky cinematic reveal ───────────────────────────────────── */}
      <div className="modelSticky" style={{ opacity: stickyOpacity }}>

        <div className="modelBg" />

        {/* ── Orc right ── */}
        <div
          className="modelOrcRight"
          style={{
            transform: `translate3d(${orcRightX}px, 0, 0)`,
            opacity:   orcOpacity,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/model-orc-right.png" alt="3D Character" className="modelOrcImg" />
        </div>

        {/* ── Orc left ── */}
        <div
          className="modelOrcLeft"
          style={{
            transform: `translate3d(${orcLeftX}px, 0, 0)`,
            opacity:   orcOpacity,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/model-orc-left.png" alt="3D Character" className="modelOrcImg" />
        </div>

        {/* ── Center: slogan + steps ── */}
        <div className="modelCenter">

          {/* Slogan */}
          <div
            className="modelSlogan"
            style={{
              transform: `translate3d(0, ${sloganY}px, 0)`,
              opacity:   sloganOpacity,
            }}
          >
            <p className="modelSloganEyebrow">3D Character & Weapon Modeling</p>
            <h2 className="modelSloganTitle">
              Sculpted by AI.<br />
              <em className="modelSloganItalic">Built for your game.</em>
            </h2>
          </div>

          {/* Steps staggered */}
          <div className="modelSteps">
            {MODELING_STEPS.map((step, i) => (
              <div
                key={step.num}
                className="modelStep"
                style={{
                  opacity:   stepOpacity(i),
                  transform: `translate3d(0, ${stepY(i)}px, 0)`,
                }}
              >
                <span className="modelStepNum">{step.num}</span>
                <div>
                  <strong className="modelStepTitle">{step.title}</strong>
                  <p className="modelStepDesc">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* CTA */}
            <div
              className="modelStepCta"
              style={{
                opacity:   stepOpacity(2),
                transform: `translate3d(0, ${stepY(2)}px, 0)`,
              }}
            >
              <a href="/register" className="modelCtaBtn">
                Get Modeling Access
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                  <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Progress bar */}
        <div className="modelProgressBar">
          <div className="modelProgressFill" style={{ width: `${progress * 100}%` }} />
        </div>

      </div>

      {/* ── Videos — visible after sticky scroll completes ── */}
      <div className="modelVideos">
        {children}
      </div>

    </div>
  );
}
