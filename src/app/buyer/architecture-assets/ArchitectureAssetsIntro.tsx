// ArchitectureAssetsIntro — Buyer > Architecture scroll-jacked intro.
// Exact mirror of visitor/ArchitectureIntroSection — all mechanisms identical.
//
// SCROLL DOWN → variable-rate forward play() on forwardVid
//   playbackRate = clamp(RATE_MIN, 1 + diff×RATE_GAIN, RATE_MAX)
//   No seeks — decoder never interrupted.
//
// SCROLL UP → variable-rate forward play() on reverseVid
//   reverseVid = original played backwards, all-keyframe encode (-g 1).
//   Mirror position: revTarget = revDur - forwardTarget.
//   Direction determined by scroll velocity (deltaY), NOT per-tick target delta.
//   One clean seek on direction change, then pure playbackRate from there.
//
// EXIT: last 15% of scroll progress fades overlay opacity 1→0 via DOM.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-assets-intro.css";

const FORWARD_VIDEO    = "/videos/buyer-architecture-intro.mp4";
const REVERSE_VIDEO    = "/videos/buyer-architecture-intro-reverse.mp4";
const SCROLL_BUDGET_VH = 4;
const FADE_START       = 0.85;

const RATE_GAIN      = 8.0;
const RATE_MIN       = 0.0;
const RATE_MAX       = 16.0;
const HOLD_THRESHOLD = 0.008;

// Zoom config
const SCALE_FWD_START = 1.0;
const SCALE_FWD_END   = 1.08;
const SCALE_REV_START = 1.08;
const SCALE_REV_END   = 1.18;

const TAGLINES = [
  "Photorealistic architecture,",
  "interior and exterior —",
  "ready for your next project.",
];

export default function ArchitectureAssetsIntro() {
  const sentinelRef   = useRef<HTMLDivElement>(null);
  const fwdVideoRef   = useRef<HTMLVideoElement>(null);
  const revVideoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);
  const lineRefs      = useRef<(HTMLParagraphElement | null)[]>([]);
  const progressRef   = useRef(0);
  const targetTimeRef = useRef(0);
  const directionRef  = useRef<"fwd" | "rev">("fwd");
  const velocityRef   = useRef(0);
  const rafRef        = useRef<number | null>(null);

  const [active, setActive] = useState(false);
  const [done,   setDone]   = useState(false);

  // ── Slogan: direct DOM writes ─────────────────────────────────────────
  function applySlogan(p: number): void {
    const ca = Math.max(0, Math.sin(p * Math.PI) * 2.5);
    lineRefs.current.forEach((el: HTMLParagraphElement | null, i: number) => {
      if (!el) return;
      const threshold = (i / TAGLINES.length) * 0.82;
      const raw  = (p - threshold) / (1 / TAGLINES.length);
      const vis  = Math.max(0, Math.min(1, raw * 2.2));
      const ty   = Math.max(0, (1 - raw) * 36);
      const blur = Math.max(0, (1 - vis) * 10);
      el.style.opacity    = String(vis);
      el.style.transform  = `translate3d(0,${ty}px,0)`;
      el.style.filter     = `blur(${blur}px)`;
      el.style.textShadow = vis > 0.05
        ? `${-ca * 0.6}px 0 0 rgba(255,0,60,${0.35 * vis}),
           ${ca  * 0.6}px 0 0 rgba(0,200,255,${0.35 * vis}),
           0 0 30px rgba(0,0,0,0.95)`
        : "none";
    });
  }

  // ── rAF loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fwd = fwdVideoRef.current;
    const rev = revVideoRef.current;
    if (!fwd || !rev) return;

    [fwd, rev].forEach(v => {
      v.muted       = true;
      v.playsInline = true;
      v.preload     = "auto";
      v.loop        = false;
    });

    fwd.style.opacity = "1";
    rev.style.opacity = "0";

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      if (!fwd || !rev) return;

      const fwdDur = fwd.duration;
      const revDur = rev.duration;
      if (!fwdDur || !isFinite(fwdDur) || !revDur || !isFinite(revDur)) return;

      const target = targetTimeRef.current;
      const p      = progressRef.current;

      // Direction determined by scroll velocity — not per-tick delta
      const vel    = velocityRef.current;
      const newDir: "fwd" | "rev" = vel > 0.001
        ? "fwd"
        : vel < -0.001
          ? "rev"
          : directionRef.current;

      // One clean seek on direction change, then pure playbackRate
      if (newDir !== directionRef.current) {
        directionRef.current = newDir;
        if (newDir === "fwd") {
          rev.pause();
          rev.style.opacity = "0";
          fwd.style.opacity = "1";
          fwd.currentTime   = Math.max(0, Math.min(fwdDur, target));
        } else {
          fwd.pause();
          fwd.style.opacity = "0";
          rev.style.opacity = "1";
          rev.currentTime   = Math.max(0, Math.min(revDur, revDur - target));
        }
      }

      // Drive active video with playbackRate only.
      // Hard boundary clamp: pause at ends so video never loops.
      if (directionRef.current === "fwd") {
        const clampedTarget = Math.min(fwdDur - 0.05, target);
        const diff = clampedTarget - fwd.currentTime;
        if (Math.abs(diff) < HOLD_THRESHOLD || fwd.currentTime >= fwdDur - 0.05) {
          if (!fwd.paused) fwd.pause();
        } else {
          const rate = Math.min(RATE_MAX, Math.max(RATE_MIN, 1 + Math.abs(diff) * RATE_GAIN));
          if (fwd.paused) fwd.play().catch(() => {});
          fwd.playbackRate = rate;
        }
        fwd.style.opacity = "1";
        rev.style.opacity = "0";
      } else {
        const revTarget     = Math.max(0.05, Math.min(revDur, revDur - target));
        const diff          = revTarget - rev.currentTime;
        if (Math.abs(diff) < HOLD_THRESHOLD || rev.currentTime <= 0.05) {
          if (!rev.paused) rev.pause();
        } else {
          const rate = Math.min(RATE_MAX, Math.max(RATE_MIN, 1 + Math.abs(diff) * RATE_GAIN));
          if (rev.paused) rev.play().catch(() => {});
          rev.playbackRate = rate;
        }
        fwd.style.opacity = "0";
        rev.style.opacity = "1";
      }

      // Zoom scale
      const fwdScale = SCALE_FWD_START + (SCALE_FWD_END - SCALE_FWD_START) * p;
      const revScale = SCALE_REV_START + (SCALE_REV_END - SCALE_REV_START) * (1 - p);
      fwd.style.transform = `scale(${fwdScale}) translateZ(0)`;
      rev.style.transform = `scale(${revScale}) translateZ(0)`;

      applySlogan(p);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Wheel handler — velocity for direction detection ──────────────────
  useEffect(() => {
    let decayTimer: ReturnType<typeof setTimeout> | null = null;

    function onWheel(e: WheelEvent): void {
      velocityRef.current = e.deltaY;
      if (decayTimer) clearTimeout(decayTimer);
      decayTimer = setTimeout(() => { velocityRef.current = 0; }, 80);
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (decayTimer) clearTimeout(decayTimer);
    };
  }, []);

  // ── Scroll → targetTime + overlay opacity ────────────────────────────
  useEffect(() => {
    function onScroll(): void {
      const sentinel = sentinelRef.current;
      const fwd      = fwdVideoRef.current;
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
        if (fwd?.duration) targetTimeRef.current = fwd.duration;
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

      if (fwd?.duration && isFinite(fwd.duration)) {
        targetTimeRef.current = p * fwd.duration;
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
        className="archAssetsIntroSentinel"
        style={{ height: `${SCROLL_BUDGET_VH * 100}vh` }}
        aria-hidden="true"
      />
      <div
        ref={overlayRef}
        className={
          "archAssetsIntroFixed" +
          (active ? " archAssetsIntroActive" : "") +
          (done   ? " archAssetsIntroDone"   : "")
        }
      >
        <video
          ref={fwdVideoRef}
          src={FORWARD_VIDEO}
          className="archAssetsVideoBg"
          muted playsInline preload="auto"
        />
        <video
          ref={revVideoRef}
          src={REVERSE_VIDEO}
          className="archAssetsVideoBg"
          muted playsInline preload="auto"
        />
        <div className="archAssetsScrim" />
        <div className="archAssetsTickerWrap">
          <p className="archAssetsTicker">
            AI-ASSET ON EXTERIOR &amp; INTERIOR DESIGN
          </p>
        </div>
        <div className="archAssetsSlogan">
          {TAGLINES.map((line, i) => (
            <p
              key={i}
              ref={(el: HTMLParagraphElement | null) => { lineRefs.current[i] = el; }}
              className="archAssetsLine"
            >
              {line}
            </p>
          ))}
        </div>
        <div className="archAssetsBottomGrad" />
      </div>
    </>
  );
}