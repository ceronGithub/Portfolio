// ArchitectureAssetsIntro — Cinematic scroll-driven intro for Architecture Studio.
// Mechanism: scroll-jacked sequence (same Apple-style sticky scroll).
// The uploaded luxury home walkthrough video plays as a FULLSCREEN BG video.
// Left panel slides in from left (interior label). Right panel from right (exterior).
// Text reveal: chromatic aberration + blur + letter-spacing on scroll progress.
// Dust particles float upward. Fog SVG turbulence animates over everything.
// Bottom fog fades into the next section.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-assets-intro.css";

const INTRO_VIDEO = "/videos/intro-architecture.mp4";

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

const TAGLINES = [
  "Photorealistic architecture,",
  "interior and exterior —",
  "ready for your next project.",
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  life: number; maxLife: number;
}

function spawnParticle(w: number, h: number): Particle {
  return {
    x:       Math.random() * w,
    y:       h + 10,
    vx:      (Math.random() - 0.5) * 0.35,
    vy:      -(Math.random() * 0.55 + 0.15),
    size:    Math.random() * 1.8 + 0.4,
    opacity: Math.random() * 0.25 + 0.03,
    life:    0,
    maxLife: Math.random() * 320 + 180,
  };
}

export default function ArchitectureAssetsIntro() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const rafRef      = useRef<number>(0);
  const particles   = useRef<Particle[]>([]);
  const [progress, setProgress] = useState(0);

  // ── Scroll progress driver ──────────────────────────────────────────────
  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const top        = el.getBoundingClientRect().top;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      setProgress(Math.max(0, Math.min(1, -top / scrollable)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Dust particle canvas ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 55; i++) {
      const p = spawnParticle(canvas.width, canvas.height);
      p.y    = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.current.push(p);
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      if (particles.current.length < 75 && Math.random() < 0.45)
        particles.current.push(spawnParticle(w, h));
      particles.current = particles.current.filter(p => p.life < p.maxLife);
      for (const p of particles.current) {
        p.life += 1; p.x += p.vx; p.y += p.vy;
        const lr    = p.life / p.maxLife;
        const alpha = p.opacity * Math.min(1, lr * 6) * (1 - Math.max(0, (lr - 0.7) / 0.3));
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(220,210,195,${alpha})`;
        ctx!.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Derived animation values ────────────────────────────────────────────
  const vignettePulse = 0.45 + Math.sin(progress * Math.PI * 2.5) * 0.2;
  const panelSlide    = Math.max(0, 1 - progress / 0.2);       // 0→1 slides panels in
  const videoScale    = 1 + progress * 0.06;                    // subtle Ken Burns
  const videoOpacity  = Math.min(1, progress * 4);              // fade in on first scroll
  const caStr         = Math.max(0, Math.sin(progress * Math.PI) * 2.8);
  const overlayOpacity = Math.max(0, 1 - progress * 1.8);       // dark overlay fades as video reveals

  return (
    <section ref={sectionRef} className="archAssetsIntroSection">
      <div className="archAssetsSticky">

        {/* ── LAYER 1 — Fullscreen background video ── */}
        <video
          ref={videoRef}
          src={INTRO_VIDEO}
          className="archAssetsVideoBg"
          autoPlay
          muted
          loop
          playsInline
          style={{
            opacity:   videoOpacity,
            transform: `scale(${videoScale})`,
          }}
        />

        {/* Initial dark overlay — fades out as scroll starts */}
        <div
          className="archAssetsVideoOverlay"
          style={{ opacity: overlayOpacity }}
        />

        {/* ── LAYER 2 — Left panel (Interior label) ── */}
        <div
          className="archAssetsPanel archAssetsPanelLeft"
          style={{
            transform:       `translate3d(${-panelSlide * 100}%, 0, 0)`,
            transformOrigin: "left center",
          }}
        >
          <div className="archAssetsPanelContent archAssetsPanelContentLeft">
            <p className="archAssetsPanelEyebrow">Interior</p>
            <div className="archAssetsPanelDivider" />
            <div className="archAssetsPanelVideos">
              <video src={`${SB}/interior/interior-01.mp4`} autoPlay muted loop playsInline className="archAssetsPanelThumb" />
              <video src={`${SB}/interior/interior-02.mp4`} autoPlay muted loop playsInline className="archAssetsPanelThumb" />
              <video src={`${SB}/interior/interior-03.mp4`} autoPlay muted loop playsInline className="archAssetsPanelThumb archAssetsPanelThumbHide" />
            </div>
          </div>
          <div className="archAssetsPanelFadeRight" />
        </div>

        {/* ── LAYER 2 — Right panel (Exterior label) ── */}
        <div
          className="archAssetsPanel archAssetsPanelRight"
          style={{
            transform:       `translate3d(${panelSlide * 100}%, 0, 0)`,
            transformOrigin: "right center",
          }}
        >
          <div className="archAssetsPanelFadeLeft" />
          <div className="archAssetsPanelContent archAssetsPanelContentRight">
            <p className="archAssetsPanelEyebrow">Exterior</p>
            <div className="archAssetsPanelDivider" />
            <div className="archAssetsPanelVideos">
              <video src={`${SB}/exterior/project-01.mp4`} autoPlay muted loop playsInline className="archAssetsPanelThumb" />
              <video src={`${SB}/exterior/project-02.mp4`} autoPlay muted loop playsInline className="archAssetsPanelThumb" />
              <video src={`${SB}/exterior/project-03.mp4`} autoPlay muted loop playsInline className="archAssetsPanelThumb archAssetsPanelThumbHide" />
            </div>
          </div>
        </div>

        {/* ── LAYER 3 — Dust particles ── */}
        <canvas ref={canvasRef} className="archAssetsDustCanvas" />

        {/* ── LAYER 4 — Fog SVG ── */}
        <svg className="archAssetsFogSvg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="archF2" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.004" numOctaves="5" seed="9" result="noise">
                <animate attributeName="baseFrequency" values="0.008 0.004;0.013 0.007;0.008 0.004" dur="20s" repeatCount="indefinite" />
              </feTurbulence>
              <feColorMatrix type="matrix"
                values="0 0 0 0 0.04
                        0 0 0 0 0.035
                        0 0 0 0 0.03
                        0 0 0 0.45 0"
                in="noise" result="fogA" />
              <feGaussianBlur stdDeviation="10" in="fogA" result="fogBlur" />
              <feBlend in="SourceGraphic" in2="fogBlur" mode="screen" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="transparent" filter="url(#archF2)" />
        </svg>

        {/* ── LAYER 5 — Vignette ── */}
        <div className="archAssetsVignette" style={{ opacity: vignettePulse }} />

        {/* ── LAYER 6 — Center dark radial ── */}
        <div className="archAssetsCenterDark" />

        {/* ── LAYER 7 — Center text ── */}
        <div className="archAssetsCenterText">
          <p className="archAssetsEyebrow">AI Architecture Studio</p>

          <div className="archAssetsLines">
            {TAGLINES.map((line, i) => {
              const threshold = (i / TAGLINES.length) * 0.82;
              const raw       = (progress - threshold) / (1 / TAGLINES.length);
              const vis       = Math.max(0, Math.min(1, raw * 2.2));
              const ty        = Math.max(0, (1 - raw) * 36);
              const blur      = Math.max(0, (1 - vis) * 10);
              const spacing   = 0.02 + vis * 0.025;

              return (
                <p
                  key={i}
                  className="archAssetsLine"
                  style={{
                    opacity:       vis,
                    transform:     `translate3d(0,${ty}px,0)`,
                    filter:        `blur(${blur}px)`,
                    letterSpacing: `${spacing}em`,
                    textShadow: vis > 0.05
                      ? `${-caStr * 0.5}px 0 0 rgba(255,200,100,${0.28 * vis}),
                         ${caStr * 0.5}px 0 0 rgba(100,200,255,${0.28 * vis}),
                         0 0 40px rgba(0,0,0,0.98)`
                      : "none",
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>

          <p
            className="archAssetsCta"
            style={{ opacity: Math.max(0, (progress - 0.84) * 9) }}
          >
            — Explore the full catalog ↓ —
          </p>
        </div>

        {/* ── LAYER 8 — Bottom fog ── */}
        <div className="archAssetsBottomFog" aria-hidden="true">
          <svg className="archAssetsBottomFogSvg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <filter id="archBottomFogF" x="-10%" y="-50%" width="120%" height="200%">
                <feTurbulence type="fractalNoise" baseFrequency="0.011 0.005" numOctaves="5" seed="4" result="noise">
                  <animate attributeName="baseFrequency" values="0.011 0.005;0.017 0.008;0.011 0.005" dur="16s" repeatCount="indefinite" />
                </feTurbulence>
                <feColorMatrix type="matrix"
                  values="0 0 0 0 0.03  0 0 0 0 0.025  0 0 0 0 0.02  0 0 0 0.68 0"
                  in="noise" result="fog" />
                <feGaussianBlur stdDeviation="7" in="fog" result="softFog" />
                <feComposite in="softFog" in2="SourceGraphic" operator="over" />
              </filter>
              <linearGradient id="archBottomFogGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#000" stopOpacity="0" />
                <stop offset="40%"  stopColor="#000" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="transparent" filter="url(#archBottomFogF)" opacity="0.8" />
            <rect width="100%" height="100%" fill="url(#archBottomFogGrad)" />
          </svg>
        </div>

      </div>
    </section>
  );
}
