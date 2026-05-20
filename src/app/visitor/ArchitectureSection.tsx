// ArchitectureSection — Visitor > Architecture Intro.
// Fixed-overlay + sentinel scroll-jack pattern.
//
// SMOOTH VIDEO TECHNIQUE:
// Never seek video.currentTime directly (causes frame-decode jumps).
// Instead: video plays at normal speed via video.play().
// A rAF loop compares video.currentTime vs targetTime and adjusts
// video.playbackRate to catch up smoothly — like a PID controller.
// Scroll only updates targetTime. The video engine handles decoding
// at its own pace, producing buttery playback regardless of scroll speed.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-section.css";

const INTRO_VIDEO      = "/videos/visitor-architecture-intro.mp4";
const SCROLL_BUDGET_VH = 4;   // how many viewport-heights this intro consumes

const TAGLINES = [
  "Photorealistic architecture,",
  "interior and exterior —",
  "ready for your next project.",
];

export default function ArchitectureSection() {
  const sentinelRef  = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const lineRefs     = useRef<(HTMLParagraphElement | null)[]>([]);

  // Scroll state
  const progressRef  = useRef(0);       // 0–1 scroll progress through sentinel
  const targetTimeRef = useRef(0);      // desired video time (seconds)
  const rafRef       = useRef<number | null>(null);

  const [active, setActive] = useState(false);
  const [done,   setDone]   = useState(false);

  // ── Slogan DOM writes — no React re-renders ──────────────────────────
  function applyStyles(p: number): void {
    const caStr = Math.max(0, Math.sin(p * Math.PI) * 2.5);
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const threshold = (i / TAGLINES.length) * 0.82;
      const raw       = (p - threshold) / (1 / TAGLINES.length);
      const vis       = Math.max(0, Math.min(1, raw * 2.2));
      const ty        = Math.max(0, (1 - raw) * 36);
      const blur      = Math.max(0, (1 - vis) * 10);
      el.style.opacity       = String(vis);
      el.style.transform     = `translate3d(0,${ty}px,0)`;
      el.style.filter        = `blur(${blur}px)`;
      el.style.textShadow    = vis > 0.05
        ? `${-caStr * 0.6}px 0 0 rgba(255,0,60,${0.35 * vis}),
           ${caStr  * 0.6}px 0 0 rgba(0,200,255,${0.35 * vis}),
           0 0 30px rgba(0,0,0,0.95)`
        : "none";
    });
  }

  // ── rAF loop: smooth video playback rate control ─────────────────────
  // Instead of seeking, we let the video play and nudge its speed.
  // This lets the browser decode frames in order — no jumps.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted       = true;
    vid.playsInline = true;
    vid.preload     = "auto";
    vid.loop        = false;

    // Start playing immediately (muted autoplay is allowed everywhere)
    const playPromise = vid.play();
    if (playPromise) playPromise.catch(() => {/* autoplay blocked — rAF will still seek gently */});

    function loop() {
      rafRef.current = requestAnimationFrame(loop);

      if (!vid || !vid.duration || !isFinite(vid.duration)) return;

      const current = vid.currentTime;
      const target  = targetTimeRef.current;
      const diff    = target - current;

      // Smoothing: set playbackRate proportional to how far behind/ahead we are.
      // Clamped between 0 (pause) and 4x speed.
      // At diff = 0 → rate = 0 (pause). At diff = 1s → rate ≈ 4 (catch up fast).
      // The 3.0 multiplier controls responsiveness — higher = snappier catch-up.
      const rate = Math.max(0, Math.min(4, 1 + diff * 3.0));
      vid.playbackRate = rate;

      // If we're ahead of target (user scrolled back), pause and nudge backwards
      // by small seek steps (avoids large backward seeks that cause stutters)
      if (diff < -0.05) {
        vid.playbackRate = 0;
        vid.currentTime  = Math.max(0, current - 0.04);
      }

      // Update slogan based on scroll progress
      applyStyles(progressRef.current);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll → targetTime ──────────────────────────────────────────────
  useEffect(() => {
    function onScroll(): void {
      const sentinel = sentinelRef.current;
      const vid      = videoRef.current;
      if (!sentinel) return;

      const rect       = sentinel.getBoundingClientRect();
      const totalH     = sentinel.offsetHeight;
      const scrolledIn = -rect.top;

      if (scrolledIn < 0) {
        setActive(false);
        setDone(false);
        progressRef.current  = 0;
        targetTimeRef.current = 0;
        return;
      }

      if (scrolledIn >= totalH) {
        setActive(false);
        setDone(true);
        progressRef.current  = 1;
        if (vid?.duration) targetTimeRef.current = vid.duration;
        return;
      }

      const p = scrolledIn / totalH;
      progressRef.current = p;
      setActive(true);
      setDone(false);

      // Map scroll progress to video duration — rAF loop drives playback smoothly
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
      {/* ── Sentinel: holds scroll space, never visible ────────────────── */}
      <div
        ref={sentinelRef}
        className="archSentinel"
        style={{ height: `${SCROLL_BUDGET_VH * 100}vh` }}
        aria-hidden="true"
      />

      {/* ── Fixed overlay: covers viewport while active ────────────────── */}
      <div
        className={
          "archFixed" +
          (active ? " archFixedActive" : "") +
          (done   ? " archFixedDone"   : "")
        }
      >
        <video
          ref={videoRef}
          src={INTRO_VIDEO}
          className="archVideoBg"
          muted
          playsInline
          preload="auto"
        />

        <div className="archScrim" />

        <div className="archTickerWrap">
          <p className="archTicker">
            AI-ASSET ON EXTERIOR &amp; INTERIOR DESIGN
          </p>
        </div>

        <div className="archSlogan">
          {TAGLINES.map((line, i) => (
            <p
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className="archLine"
            >
              {line}
            </p>
          ))}
        </div>

        <div className="archBottomGrad" />
      </div>
    </>
  );
}