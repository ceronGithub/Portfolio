// ArchitectureAssetsIntro — Scroll-Linked Video Playback + slogan only.
// NOTHING else. No panels, no thumbnails, no eyebrow, no vignette, no fog.
// Scroll drives video.currentTime directly (Apple-style scrubbing).
// 3-line slogan reveals one by one as scroll progresses.
// Clean bottom gradient to blend into next section.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-assets-intro.css";

const INTRO_VIDEO = "/videos/intro-architecture.mp4";

const TAGLINES = [
  "Photorealistic architecture,",
  "interior and exterior —",
  "ready for your next project.",
];

export default function ArchitectureAssetsIntro() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  // ── Scroll → video.currentTime ─────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.preload     = "auto";
    video.muted       = true;
    video.playsInline = true;

    function onScroll() {
      const el = sectionRef.current;
      if (!el || !video) return;
      const top        = el.getBoundingClientRect().top;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const p = Math.max(0, Math.min(1, -top / scrollable));
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = p * video.duration;
      }
      setProgress(p);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="archAssetsIntroSection">
      <div className="archAssetsSticky">

        {/* ── Video — full screen, scroll-scrubbed ── */}
        <video
          ref={videoRef}
          src={INTRO_VIDEO}
          className="archAssetsVideoBg"
          muted
          playsInline
          preload="auto"
        />

        {/* ── Dark scrim so text is always readable ── */}
        <div className="archAssetsScrim" />

        {/* ── Top ticker label ── */}
        <div className="archAssetsTickerWrap">
          <p className="archAssetsTicker">
            AI-ASSET ON EXTERIOR &amp; INTERIOR DESIGN
          </p>
        </div>

        {/* ── 3-line slogan ── */}
        <div className="archAssetsSlogan">
          {TAGLINES.map((line, i) => {
            const threshold  = (i / TAGLINES.length) * 0.82;
            const raw        = (progress - threshold) / (1 / TAGLINES.length);
            const vis        = Math.max(0, Math.min(1, raw * 2.2));
            const ty         = Math.max(0, (1 - raw) * 36);
            const blur       = Math.max(0, (1 - vis) * 10);
            return (
              <p
                key={i}
                className="archAssetsLine"
                style={{
                  opacity:       vis,
                  transform:     `translate3d(0, ${ty}px, 0)`,
                  filter:        `blur(${blur}px)`,
                }}
              >
                {line}
              </p>
            );
          })}
        </div>

        {/* ── Bottom gradient — fades into next section ── */}
        <div className="archAssetsBottomGrad" />

      </div>
    </section>
  );
}