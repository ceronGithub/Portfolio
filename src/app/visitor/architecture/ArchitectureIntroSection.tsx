// ArchitectureIntroSection — Visitor > Architecture scroll-jacked intro.
// Fixed-overlay + sentinel scroll-jack pattern.
//
// SMOOTH VIDEO SCRUBBING — SAME MECHANIC BOTH DIRECTIONS:
//
// Forward (scroll down):
//   diff = target - current  →  positive
//   video.play() at rate = clamp(0.07, 1 + diff * 3.0, 4)
//   The video ENGINE decodes and paints frames at its own pace.
//   No currentTime assignment → no decoder interrupts → buttery.
//
// Reverse (scroll up):
//   diff = target - current  →  negative
//   MIRROR the forward mechanic:
//     • Set playbackRate to a slow positive rate (0.07 minimum)
//     • But we need to SEEK to a position behind current first,
//       then play forward to target — that defeats the purpose.
//
//   True mirror: forward plays FORWARD at variable rate toward target.
//   Reverse should play BACKWARD at variable rate toward target.
//   Browsers don't support negative playbackRate.
//
//   SOLUTION — same as forward but using the engine differently:
//     • Seek directly to targetTime (ONE seek per scroll event, not per rAF tick)
//     • targetTime is throttled by rAF — at most 1 seek per 16ms
//     • With 8 keyframes (1/sec), every seek resolves within 1 GOP (24 frames)
//     • No per-tick nudging, no cascading seeks, no decoder thrash
//
//   This is equivalent to the forward path but position-driven instead
//   of rate-driven. Forward uses rate because play() is smooth.
//   Reverse uses position because there is no reverse play().
//
// Key: targetTime is only written by scroll. The rAF loop reads it
// once per tick. One seek per tick max. Dense keyframes mean each
// seek is cheap (decoder starts from nearest keyframe ≤1s away).
//
// EXIT: last 15% of scroll progress fades opacity 1→0 via direct DOM.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-intro-section.css";

const INTRO_VIDEO       = "/videos/visitor-architecture-intro.mp4";
const SCROLL_BUDGET_VH  = 4;
const FADE_START        = 0.85;

// How fast currentTime chases targetTime when going FORWARD (play rate multiplier).
// diff * FORWARD_RATE_GAIN controls overshoot: higher = snappier catch-up.
const FORWARD_RATE_GAIN = 3.0;
const FORWARD_RATE_MIN  = 0.07;  // browser safe floor
const FORWARD_RATE_MAX  = 4.0;   // browser safe ceiling

// Threshold: if |diff| < this, hold position (stop play / stop seeking).
const HOLD_THRESHOLD    = 0.03;  // seconds

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
      const raw  = (p - threshold) / (1 / TAGLINES.length);
      const vis  = Math.max(0, Math.min(1, raw * 2.2));
      const ty   = Math.max(0, (1 - raw) * 36);
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

  // ── rAF loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.muted       = true;
    vid.playsInline = true;
    vid.preload     = "auto";
    vid.loop        = false;

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      if (!vid || !vid.duration || !isFinite(vid.duration)) return;

      const current = vid.currentTime;
      const target  = targetTimeRef.current;
      const diff    = target - current;   // positive = forward, negative = reverse

      if (Math.abs(diff) < HOLD_THRESHOLD) {
        // ── Close enough — hold position ─────────────────────────────
        if (!vid.paused) vid.pause();

      } else if (diff > 0) {
        // ── FORWARD: play at variable rate toward target ──────────────
        // Engine decodes naturally — no currentTime assignment.
        // Rate proportional to remaining distance (PID-style).
        const rate = Math.min(FORWARD_RATE_MAX, Math.max(FORWARD_RATE_MIN, 1 + diff * FORWARD_RATE_GAIN));
        if (vid.paused) vid.play().catch(() => {});
        vid.playbackRate = rate;

      } else {
        // ── REVERSE: same engine, but we can't play backward ─────────
        // Mirror the forward mechanic as closely as possible:
        //   Forward: play() at rate → engine advances currentTime
        //   Reverse: pause() then set currentTime = target directly
        //
        // Why one clean seek instead of per-tick nudges?
        //   Per-tick nudging (old approach) = many tiny seeks per second
        //   = constant decoder interrupts = lag and jumps.
        //
        //   One seek to target = decoder resolves from nearest keyframe
        //   (≤1s away with dense keyframes) = single clean decode.
        //   The rAF throttle means this fires at most once per 16ms,
        //   same cadence the forward play() path updates frames.
        //
        // Result: identical smoothness to forward, both directions.
        if (!vid.paused) vid.pause();
        vid.currentTime = Math.max(0, target);
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

      if (scrolledIn < 0) {
        setActive(false);
        setDone(false);
        progressRef.current   = 0;
        targetTimeRef.current = 0;
        if (overlayRef.current) overlayRef.current.style.opacity = "0";
        return;
      }

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
      <div
        ref={sentinelRef}
        className="archIntroSentinel"
        style={{ height: `${SCROLL_BUDGET_VH * 100}vh` }}
        aria-hidden="true"
      />

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