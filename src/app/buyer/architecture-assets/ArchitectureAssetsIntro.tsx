// ArchitectureAssetsIntro — Cinematic intro section for AI Architecture Asset Studio.
// Same sticky-scroll pattern as AIAssetsIntro but themed for Interior/Exterior.
// Left image: interior render. Right image: exterior drone shot.
// Fog, dust particles, vignette pulse, chromatic aberration text reveal.
// Left blank for now — structure and CSS in place, content TBD.

"use client";

import { useEffect, useRef, useState } from "react";
import "./architecture-assets-intro.css";

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
    x: Math.random() * w,
    y: h + 10,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -(Math.random() * 0.55 + 0.15),
    size: Math.random() * 1.8 + 0.4,
    opacity: Math.random() * 0.3 + 0.04,
    life: 0,
    maxLife: Math.random() * 320 + 180,
  };
}

export default function ArchitectureAssetsIntro() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const particles  = useRef<Particle[]>([]);
  const [progress, setProgress] = useState(0);

  // Scroll progress driver
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

  // Dust particle canvas
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
        ctx!.fillStyle = `rgba(210,200,185,${alpha})`;
        ctx!.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  const vignettePulse = 0.5 + Math.sin(progress * Math.PI * 2.5) * 0.25;
  const imageSlide    = Math.max(0, 1 - progress / 0.18);
  const imageScale    = 1 + progress * 0.08;
  const caStr         = Math.max(0, Math.sin(progress * Math.PI) * 2.5);

  return (
    <section ref={sectionRef} className="archAssetsIntroSection">
      <div className="archAssetsSticky">

        {/* Dust particles */}
        <canvas ref={canvasRef} className="archAssetsDustCanvas" />

        {/* Fog SVG */}
        <svg className="archAssetsFogSvg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="archAssetsF" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.005" numOctaves="6" seed="12" result="noise">
                <animate attributeName="baseFrequency" values="0.008 0.005;0.012 0.008;0.008 0.005" dur="18s" repeatCount="indefinite" />
              </feTurbulence>
              <feColorMatrix type="matrix" values="0 0 0 0 0.04  0 0 0 0 0.04  0 0 0 0 0.06  0 0 0 0.55 0" in="noise" result="fogA" />
              <feGaussianBlur stdDeviation="8" in="fogA" result="fogBlur" />
              <feBlend in="SourceGraphic" in2="fogBlur" mode="screen" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="transparent" filter="url(#archAssetsF)" />
        </svg>

        {/* Vignette */}
        <div className="archAssetsVignette" style={{ opacity: vignettePulse }} />

        {/* Left image — interior */}
        <div
          className="archAssetsImageLeft"
          style={{
            transform:       `translate3d(${-imageSlide * 120}px, 0, 0) scale(${imageScale})`,
            transformOrigin: "left center",
          }}
        >
          {/* Leave blank — interior image placeholder */}
          <div className="archAssetsImgPlaceholder" />
          <div className="archAssetsLeftFade" />
        </div>

        {/* Right image — exterior */}
        <div
          className="archAssetsImageRight"
          style={{
            transform:       `translate3d(${imageSlide * 120}px, 0, 0) scale(${imageScale})`,
            transformOrigin: "right center",
          }}
        >
          {/* Leave blank — exterior image placeholder */}
          <div className="archAssetsImgPlaceholder" />
          <div className="archAssetsRightFade" />
        </div>

        <div className="archAssetsCenterDark" />

        {/* Center text */}
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
                      ? `${-caStr * 0.6}px 0 0 rgba(255,180,0,${0.3 * vis}),
                         ${caStr * 0.6}px 0 0 rgba(0,180,255,${0.3 * vis}),
                         0 0 30px rgba(0,0,0,0.95)`
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

      </div>
    </section>
  );
}
