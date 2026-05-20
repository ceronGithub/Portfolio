// ArchitectureIntroSection — Visitor > Architecture scroll-jacked intro.
// Fixed-overlay + sentinel scroll-jack pattern.
//
// SMOOTH VIDEO TECHNIQUE:
// Never seek video.currentTime directly (causes frame-decode jumps).
// Instead: video plays at normal speed via video.play().
// A rAF loop compares video.currentTime vs targetTime and adjusts
// video.playbackRate to catch up smoothly — like a PID controller.
// Scroll only updates targetTime. The video engine handles decoding
// at its own pace, producing buttery playback regardless of scroll speed.
//
// EXIT: During the last 15% of scroll progress, opacity is driven
// from 1 → 0 via direct DOM write (no React state, no re-render).
// The next section sits at z-index: 51 so it renders above this overlay.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-intro-section.css";

const INTRO_VIDEO      = "/videos/visitor-architecture-intro.mp4";
const SCROLL_BUDGET_VH = 4; // viewport-heights this intro consumes
const FADE_START       = 0.85; // p at which exit fade begins

const TAGLINES = [
  "Photorealistic architecture,",
  "interior and exterior —",
  "ready for your next project.",
];

export default function ArchitectureIntroSection() {
  const sentinelRef   = useRef<HTMLDivElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);
  const lineRefs      = useRef<(HTMLParagraphElement | null)[]>([]);
  const progressRef   = useRef(0);
  const targetTimeRef = useRef(0);
  const rafRef        = useRef<number | null>(null);

  const [active, setActive] = useState(false);
  const [done,   setDone]   = useState(false);

  // ── Slogan: direct DOM writes, zero re-renders ──────────────────────
  function applySlogan(p: number): void {
    const ca = Math.max(0, Math.sin(p * Math.PI) * 2.5);
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const threshold = (i / TAGLINES.length) * 0.82;
      const raw = (p - threshold) / (1 / TAGLINES.length);
      const vis = Math.max(0, Math.min(1, raw * 2.2));
      const ty  = Math.max(0, (1 - raw) * 36);
      const blur = Math.max(0, (1 - vis) * 10);
      el.style.opacity   = String(vis);
      el.style.transform = `translate3d(0,${ty}px,0)`;
      el.style.filter    = `blur(${blur}px)`;
      el.style.textShadow = vis > 0.05
        ? `${-ca * 0.6}px 0 0 rgba(255,0,60,${0.35 * vis}),
           ${ca  * 0.6}px 0 0 rgba(0,200,255,${0.35 * vis}),
           0 0 30px rgba(0,0,0,0.95)`
        : "none";
    });
  }

  // ── rAF loop: smooth video playback rate control ─────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted       = true;
    vid.playsInline = true;
    vid.preload     = "auto";
    vid.loop        = false;

    // Do NOT autoplay on mount — video starts only when scroll drives targetTime > 0
    // This prevents twitching on the first frame before any scrolling occurs

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      if (!vid || !vid.duration || !isFinite(vid.duration)) return;

      const current = vid.currentTime;
      const diff    = targetTimeRef.current - current;
      const rawRate = 1 + diff * 3.0;

      if (diff < -0.04) {
        // Scrolled back — seek directly to target (one clean jump, no per-frame nudge)
        // Only seek if we're meaningfully far — avoids twitching on tiny diffs
        if (!vid.paused) vid.pause();
        if (Math.abs(diff) > 0.08) {
          vid.currentTime = Math.max(0, targetTimeRef.current);
        }
      } else if (Math.abs(diff) < 0.04) {
        // Close enough to target — hold position, no playback
        // Guard: only call pause() once, not every rAF frame
        if (!vid.paused) vid.pause();
      } else {
        // Safe forward playback — Chrome/Safari min playbackRate is 0.0625
        const rate = Math.min(4, Math.max(0.07, rawRate));
        if (vid.paused) vid.play().catch(() => {});
        vid.playbackRate = rate;
      }

      applySlogan(progressRef.current);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll → targetTime + opacity ───────────────────────────────────
  useEffect(() => {
    function onScroll(): void {
      const sentinel = sentinelRef.current;
      const vid      = videoRef.current;
      if (!sentinel) return;

      const rect       = sentinel.getBoundingClientRect();
      const totalH     = sentinel.offsetHeight;
      const scrolledIn = -rect.top;

      // Above sentinel
      if (scrolledIn < 0) {
        setActive(false);
        setDone(false);
        progressRef.current   = 0;
        targetTimeRef.current = 0;
        if (overlayRef.current) overlayRef.current.style.opacity = "0";
        return;
      }

      // Past sentinel
      if (scrolledIn >= totalH) {
        setActive(false);
        setDone(true);
        progressRef.current   = 1;
        if (vid?.duration) targetTimeRef.current = vid.duration;
        if (overlayRef.current) overlayRef.current.style.opacity = "0";
        return;
      }

      const p = scrolledIn / totalH;
      progressRef.current = p;
      setActive(true);
      setDone(false);

      // Smooth exit fade during last 15%
      const exitOpacity = p < FADE_START
        ? 1
        : Math.max(0, 1 - (p - FADE_START) / (1 - FADE_START));
      if (overlayRef.current) overlayRef.current.style.opacity = String(exitOpacity);

      if (vid?.duration && isFinite(vid.duration)) {
        targetTimeRef.current = p * vid.duration;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Sentinel — holds scroll budget, never visible */}
      <div
        ref={sentinelRef}
        className="archIntroSentinel"
        style={{ height: `${SCROLL_BUDGET_VH * 100}vh` }}
        aria-hidden="true"
      />

      {/* Fixed overlay — covers viewport while active */}
      <div
        ref={overlayRef}
        className={
          "archIntroFixed" +
          (active ? " archIntroFixedActive" : "") +
          (done   ? " archIntroFixedDone"   : "")
        }
      >
        <video
          ref={videoRef}
          src={INTRO_VIDEO}
          className="archIntroVideoBg"
          muted
          playsInline
          preload="auto"
        />

        <div className="archIntroScrim" />

        <div className="archIntroTickerWrap">
          <p className="archIntroTicker">
            AI-ASSET ON EXTERIOR &amp; INTERIOR DESIGN
          </p>
        </div>

        <div className="archIntroSlogan">
          {TAGLINES.map((line, i) => (
            <p
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className="archIntroLine"
            >
              {line}
            </p>
          ))}
        </div>

        <div className="archIntroBottomGrad" />
      </div>
    </>
  );
}