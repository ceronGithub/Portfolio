// NewArchitectureSection — "Latest Drop" for Architecture Asset Studio.
// UPDATED: Real exterior video wired in from Supabase.
//   Card 1 — MP4 exterior drone shot (latest drop).
//   Card 2 — Interior render placeholder.

"use client";

import { useRef, useEffect, useState } from "react";
import "./new-architecture-section.css";

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

// ── Latest drop config — update when new architecture asset drops ─────────
const LATEST = {
  title:       "Exterior — Drone Reveal 01",
  subtitle:    "New Architecture Asset. Available now",
  videoSrc:    `${SB}/exterior/Drone_shot_revealing_landscape_202605061517.mp4`,
  price:       "₱8,500",
  isLive:      true,
  releaseNote: "4K render · exterior scene · editable Blender file",
};
// ─────────────────────────────────────────────────────────────────────────

interface FireParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

function spawnFireParticle(canvasWidth: number, canvasHeight: number): FireParticle {
  return {
    x:       canvasWidth * 0.72 + (Math.random() - 0.5) * canvasWidth * 0.28,
    y:       canvasHeight,
    vx:      (Math.random() - 0.5) * 0.6,
    vy:      -(Math.random() * 2.8 + 1.2),
    life:    0,
    maxLife: Math.random() * 80 + 55,
    size:    Math.random() * 18 + 6,
  };
}

export default function NewArchitectureSection() {
  const sectionRef    = useRef<HTMLDivElement>(null);
  const fireCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireRafRef    = useRef<number>(0);
  const fireParticles = useRef<FireParticle[]>([]);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const canvas = fireCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 40; i++) {
      const p = spawnFireParticle(canvas.width, canvas.height);
      p.life = Math.random() * p.maxLife;
      p.y    = canvas.height - (p.life / p.maxLife) * canvas.height * 0.75;
      fireParticles.current.push(p);
    }

    function drawFire() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      if (fireParticles.current.length < 80 && Math.random() < 0.75)
        fireParticles.current.push(spawnFireParticle(w, h));

      fireParticles.current = fireParticles.current.filter(p => p.life < p.maxLife);

      for (const p of fireParticles.current) {
        p.life += 1;
        p.x    += p.vx + Math.sin(p.life * 0.12) * 0.4;
        p.y    += p.vy;

        const ratio = p.life / p.maxLife;
        const alpha = Math.max(0, (1 - ratio) * (ratio < 0.2 ? ratio * 5 : 1));

        let r: number, g: number, b: number;
        if (ratio < 0.15)      { r = 255; g = 255; b = 220; }
        else if (ratio < 0.35) { r = 255; g = 200; b = 60;  }
        else if (ratio < 0.6)  { r = 255; g = 100; b = 10;  }
        else                   { r = 180; g = 20;  b = 0;   }

        const currentSize = p.size * (1 - ratio * 0.4);
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.5, `rgba(${r},${Math.max(0, g - 40)},0,${alpha * 0.6})`);
        grad.addColorStop(1,   `rgba(0,0,0,0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      fireRafRef.current = requestAnimationFrame(drawFire);
    }

    fireRafRef.current = requestAnimationFrame(drawFire);
    return () => { cancelAnimationFrame(fireRafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setParallaxY(center * 0.15);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="newArchSection">

      {/* Parallax background — blank placeholder */}
      <div className="newArchBgWrap">
        <div
          className="newArchBgPlaceholder"
          style={{ transform: `translate3d(0, ${parallaxY}px, 0)` }}
        />
        <div className="newArchBgFade" />
      </div>

      {/* Fire canvas */}
      <canvas ref={fireCanvasRef} className="newArchFireCanvas" />

      {/* Content */}
      <div className="newArchContent">
        <div className="newArchHeaderRow">
          <div>
            <p className="newArchLabel">Latest Drop</p>
            <h2 className="newArchTitle">{LATEST.subtitle}</h2>
          </div>
          {LATEST.isLive ? (
            <span className="newArchLiveBadge">● Live</span>
          ) : (
            <span className="newArchComingSoon">Coming Soon</span>
          )}
        </div>

        {/* Asset meta */}
        <div className="newArchMeta">
          <p className="newArchMetaName">{LATEST.title}</p>
          <p className="newArchMetaPrice">{LATEST.price}</p>
          <p className="newArchMetaNote">{LATEST.releaseNote}</p>
        </div>

        <div className="newArchCards">
          {/* Card 1 — placeholder for new exterior asset */}
          <div className="newArchCard">
            <div className="newArchCardInner">
              <span className="newArchCardIcon">🏙️</span>
              <p className="newArchCardLabel">Exterior render here</p>
            </div>
          </div>

          {/* Card 2 — placeholder for new interior asset */}
          <div className="newArchCard">
            <div className="newArchCardInner">
              <span className="newArchCardIcon">🏠</span>
              <p className="newArchCardLabel">Interior render here</p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}