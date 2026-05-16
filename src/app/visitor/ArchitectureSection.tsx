// ArchitectureSection — Visitor > AI Visual Systems > Section 1.
// Sticky scroll-jacking reveal:
//   Phase 0→0.25 : chair-right slides in from right, chair-left from left
//   Phase 0.25→0.55 : table rises from bottom center, slogan text fades in with parallax
//   Phase 0.55→0.75 : slogan info lines (steps 01/02/03) fade in sequentially
//   Phase 0.75→1.0 : entire sticky fades out → videos section scrolls into view
// After the sticky section, the MagazineSection videos render normally.

"use client";

import { useRef, useEffect, useState } from "react";
import "./architecture-section.css";

// ── Info lines shown in the slogan center block ──────────────────────────────
// These are the registration/access steps — replaces generic CTA text
const ARCHITECTURE_STEPS = [
  { num: "01", title: "Create a free account", desc: "Register with your email. 30 seconds." },
  { num: "02", title: "Purchase the collection", desc: "One-time payment. No subscription. Lifetime access." },
  { num: "03", title: "Download forever", desc: "Instant access. Re-download anytime from your dashboard." },
];

interface ArchitectureSectionProps {
  children: React.ReactNode; // The MagazineSection videos passed as children
}

export default function ArchitectureSection({ children }: ArchitectureSectionProps) {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // ── Scroll progress: 0 at sticky top, 1 when sticky section is fully scrolled ──
  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect       = el.getBoundingClientRect();
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = Math.max(0, Math.min(1, -rect.top / scrollable));
      setProgress(raw);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Derived animation values ─────────────────────────────────────────────

  // Chairs slide in from edges (progress 0 → 0.30)
  const chairProgress   = Math.min(1, progress / 0.30);
  const chairRightX     = (1 - chairProgress) * 140;   // starts at +140px right
  const chairLeftX      = -(1 - chairProgress) * 140;  // starts at -140px left
  const chairOpacity    = chairProgress;

  // Table rises from bottom (progress 0.20 → 0.50)
  const tableProgress   = Math.max(0, Math.min(1, (progress - 0.20) / 0.30));
  const tableY          = (1 - tableProgress) * 120;
  const tableOpacity    = tableProgress;

  // Slogan headline (progress 0.25 → 0.52)
  const sloganProgress  = Math.max(0, Math.min(1, (progress - 0.25) / 0.27));
  const sloganY         = (1 - sloganProgress) * 40;
  const sloganOpacity   = sloganProgress;

  // Info steps stagger (progress 0.48 → 0.78), each step offset by 0.08
  const stepsBase       = 0.48;
  const stepOpacity     = (i: number) =>
    Math.max(0, Math.min(1, (progress - stepsBase - i * 0.08) / 0.14));
  const stepY           = (i: number) =>
    (1 - Math.max(0, Math.min(1, (progress - stepsBase - i * 0.08) / 0.14))) * 24;

  // Whole sticky fades out at end (progress 0.82 → 1.0)
  const stickyOpacity   = progress > 0.82
    ? Math.max(0, 1 - (progress - 0.82) / 0.18)
    : 1;

  return (
    <div ref={sectionRef} className="archSection">

      {/* ── Sticky cinematic reveal ───────────────────────────────────── */}
      <div className="archSticky" style={{ opacity: stickyOpacity }}>

        {/* Dark ambient bg */}
        <div className="archBg" />

        {/* ── Chair right ── */}
        <div
          className="archChairRight"
          style={{
            transform:  `translate3d(${chairRightX}px, 0, 0)`,
            opacity:    chairOpacity,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/arch-chair-right.png" alt="Chair" className="archChairImg" />
        </div>

        {/* ── Chair left ── */}
        <div
          className="archChairLeft"
          style={{
            transform:  `translate3d(${chairLeftX}px, 0, 0)`,
            opacity:    chairOpacity,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/arch-chair-left.png" alt="Chair" className="archChairImg archChairImgFlip" />
        </div>

        {/* ── Center column: table + slogan + steps ── */}
        <div className="archCenter">

          {/* Table rises from bottom */}
          <div
            className="archTable"
            style={{
              transform: `translate3d(0, ${tableY}px, 0)`,
              opacity:   tableOpacity,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/arch-table-center.png" alt="Table" className="archTableImg" />
          </div>

          {/* Slogan above the table */}
          <div
            className="archSlogan"
            style={{
              transform: `translate3d(0, ${sloganY}px, 0)`,
              opacity:   sloganOpacity,
            }}
          >
            <p className="archSloganEyebrow">AI Interior & Exterior</p>
            <h2 className="archSloganTitle">
              Spaces that live<br />
              <em className="archSloganItalic">in your imagination.</em>
            </h2>
          </div>

          {/* Steps — staggered fade in */}
          <div className="archSteps">
            {ARCHITECTURE_STEPS.map((step, i) => (
              <div
                key={step.num}
                className="archStep"
                style={{
                  opacity:   stepOpacity(i),
                  transform: `translate3d(0, ${stepY(i)}px, 0)`,
                }}
              >
                <span className="archStepNum">{step.num}</span>
                <div>
                  <strong className="archStepTitle">{step.title}</strong>
                  <p className="archStepDesc">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* CTA — appears with last step */}
            <div
              className="archStepCta"
              style={{
                opacity:   stepOpacity(2),
                transform: `translate3d(0, ${stepY(2)}px, 0)`,
              }}
            >
              <a href="/register" className="archCtaBtn">
                Get Architecture Access
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                  <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Progress bar at bottom */}
        <div className="archProgressBar">
          <div className="archProgressFill" style={{ width: `${progress * 100}%` }} />
        </div>

      </div>

      {/* ── Videos section — renders after sticky scroll completes ── */}
      <div className="archVideos">
        {children}
      </div>

    </div>
  );
}
