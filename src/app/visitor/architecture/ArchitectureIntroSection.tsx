// ArchitectureIntroSection — Visitor > Architecture scroll-jacked intro.
// Fixed-overlay + sentinel scroll-jack pattern.
//
// SCROLL DOWN → variable-rate forward play()
//   Engine drives currentTime at rate = clamp(0.07, 1 + diff×3, 4).
//   Fast when far from target, slows as it catches up. No seeks.
//
// SCROLL UP → variable-rate reverse (end → start)
//   Same formula as forward but applied in reverse direction.
//   Per rAF tick: step back (rate / 60) seconds toward targetTime.
//   Fast when far, eases in as currentTime approaches target.
//   Mirrors the forward feel exactly — same gain, same clamp, same cadence.
//
// EXIT: last 15% of scroll progress fades overlay opacity 1→0 via DOM.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-intro-section.css";

const INTRO_VIDEO      = "/videos/visitor-architecture-intro.mp4";
const SCROLL_BUDGET_VH = 4;
const FADE_START       = 0.85;

const RATE_GAIN     = 3.0;
const RATE_MIN      = 0.07;
const RATE_MAX      = 4.0;
const HOLD_THRESHOLD = 0.03; // seconds — dead zone both directions

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

  // ── Slogan: direct DOM writes, zero re-renders ───────────────────────
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

  // ── rAF loop ──────────────────────────────────────────────────────────
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
      const diff    = target - current; // + = forward, - = reverse

      if (Math.abs(diff) < HOLD_THRESHOLD) {
        // ── Dead zone — hold ─────────────────────────────────────────
        if (!vid.paused) vid.pause();

      } else if (diff > 0) {
        // ── FORWARD: variable-rate play() ────────────────────────────
        // Engine advances currentTime naturally at the given rate.
        // No currentTime writes — decoder never interrupted.
        const rate = Math.min(RATE_MAX, Math.max(RATE_MIN, 1 + diff * RATE_GAIN));
        if (vid.paused) vid.play().catch(() => {});
        vid.playbackRate = rate;

      } else {
        // ── REVERSE: same variable-rate, direction inverted ──────────
        // |diff| drives rate — identical formula as forward.
        // Step back (rate / 60)s per tick — mirrors forward cadence.
        // Fast when currentTime is far above target, eases in as close.
        if (!vid.paused) vid.pause();
        const absDiff = Math.abs(diff);
        const rate    = Math.min(RATE_MAX, Math.max(RATE_MIN, 1 + absDiff * RATE_GAIN));
        const step    = rate / 60;
        vid.currentTime = Math.max(0, current - step);
      }

      applySlogan(progressRef.current);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll → targetTime + overlay opacity ────────────────────────────
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
        progressRef.current = 1;
        if (vid?.duration) targetTimeRef.current = vid.duration;
        if (overlayRef.current) overlayRef.current.style.opacity = "0";
        return;
      }

      const p = scrolledIn / totalH;
      progressRef.current = p;
      setActive(true);
      setDone(false);

      // Exit fade: last 15% of scroll budget
      const exitOpacity = p < FADE_START
        ? 1
        : Math.max(0, 1 - (p - FADE_START) / (1 - FADE_START));
      if (overlayRef.current) overlayRef.current.style.opacity = String(exitOpacity);

      // Map scroll progress → video time
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