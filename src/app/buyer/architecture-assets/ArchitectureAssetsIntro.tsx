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
  const sectionRef    = useRef<HTMLDivElement>(null);
  const videoRef      = useRef<HTMLVideoElement>(null);
  const rafRef        = useRef<number | null>(null);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const [progress, setProgress] = useState(0);

  // ── Scroll → video.currentTime (lerp-smoothed) ─────────────────────────
  useEffect(() => {
    // Guard: exit early if the video element is not yet mounted.
    // Cast to non-null so TypeScript does not flag it inside closures.
    if (!videoRef.current) return;
    const videoElement = videoRef.current as HTMLVideoElement;

    videoElement.preload     = "auto";
    videoElement.muted       = true;
    videoElement.playsInline = true;

    // Lerp factor — lower = smoother/slower, higher = snappier.
    // 0.12 gives a silky ~8-frame ease-out on each scroll tick.
    const LERP = 0.12;

    // Returns scroll progress (0–1) relative to the sticky section height.
    function getScrollProgress(): number {
      const el = sectionRef.current;
      if (!el) return 0;
      const top        = el.getBoundingClientRect().top;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return Math.max(0, Math.min(1, -top / scrollable));
    }

    // Runs every animation frame — lerps currentTime toward targetTime for smooth scrubbing.
    function animate(): void {
      rafRef.current = requestAnimationFrame(animate);
      const duration = videoElement.duration;
      if (!duration || !isFinite(duration)) return;

      const diff = targetTimeRef.current - currentTimeRef.current;
      if (Math.abs(diff) < 0.001) return;
      currentTimeRef.current   += diff * LERP;
      videoElement.currentTime  = currentTimeRef.current;
      setProgress(currentTimeRef.current / duration);
    }

    // Updates the target time on every scroll event — animate() smooths toward it.
    function onScroll(): void {
      const duration = videoElement.duration;
      if (!duration || !isFinite(duration)) return;
      targetTimeRef.current = getScrollProgress() * duration;
    }

    // Kick off the animation loop
    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Sync on first paint
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

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

        {/* ── 3-line slogan ── */}
        <div className="archAssetsSlogan">
          {TAGLINES.map((line, i) => {
            const start = (i / TAGLINES.length) * 0.75;
            const raw   = (progress - start) / (1 / TAGLINES.length);
            const vis   = Math.max(0, Math.min(1, raw * 2.5));
            const ty    = Math.max(0, (1 - raw) * 40);
            const blur  = Math.max(0, (1 - vis) * 12);
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