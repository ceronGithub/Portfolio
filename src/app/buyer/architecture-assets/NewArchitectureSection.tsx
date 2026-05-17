// NewArchitectureSection — Latest Drop for Architecture Studio.
// Fire canvas right side. Parallax exterior video bg left.
// Card 1 — latest exterior drop (live video).
// Card 2 — latest interior drop (live video).
// Update LATEST_EXTERIOR and LATEST_INTERIOR when new content drops.

"use client";

import { useRef, useEffect, useState } from "react";
import "./new-architecture-section.css";

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

// ── Update these when a new drop is available ─────────────────────────────
const LATEST_EXTERIOR = {
  label:       "Drone Reveal — Project 05",
  videoSrc:    `${SB}/exterior/project-05.mp4`,
  price:       "₱8,500",
  releaseNote: "4K · exterior scene · editable Blender file",
  isLive:      true,
};

const LATEST_INTERIOR = {
  label:       "Interior 07 — Luxury Suite",
  videoSrc:    `${SB}/interior/interior-07.mp4`,
  price:       "₱7,500",
  releaseNote: "4K · interior walkthrough · editable Blender file",
  isLive:      true,
};
// ─────────────────────────────────────────────────────────────────────────

interface FireParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

function spawnFireParticle(w: number, h: number): FireParticle {
  return {
    x:       w * 0.72 + (Math.random() - 0.5) * w * 0.28,
    y:       h,
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

  // ── Fire canvas ─────────────────────────────────────────────────────────
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

        const sz   = p.size * (1 - ratio * 0.4);
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz);
        grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.5, `rgba(${r},${Math.max(0, g - 40)},0,${alpha * 0.6})`);
        grad.addColorStop(1,   `rgba(0,0,0,0)`);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      fireRafRef.current = requestAnimationFrame(drawFire);
    }

    fireRafRef.current = requestAnimationFrame(drawFire);
    return () => { cancelAnimationFrame(fireRafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  // ── Parallax scroll ─────────────────────────────────────────────────────
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

      {/* Parallax bg — exterior drone video */}
      <div className="newArchBgWrap">
        <video
          src={`${SB}/exterior/Drone_shot_revealing_landscape_202605061517.mp4`}
          autoPlay muted loop playsInline
          className="newArchBgVideo"
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
            <h2 className="newArchTitle">New Architecture Assets.<br />Available now</h2>
          </div>
          {(LATEST_EXTERIOR.isLive || LATEST_INTERIOR.isLive) ? (
            <span className="newArchLiveBadge">● Live</span>
          ) : (
            <span className="newArchComingSoon">Coming Soon</span>
          )}
        </div>

        {/* Dual asset meta */}
        <div className="newArchDualMeta">
          <div className="newArchMetaItem">
            <p className="newArchMetaName">{LATEST_EXTERIOR.label}</p>
            <p className="newArchMetaPrice">{LATEST_EXTERIOR.price}</p>
            <p className="newArchMetaNote">{LATEST_EXTERIOR.releaseNote}</p>
          </div>
          <div className="newArchMetaDivider" />
          <div className="newArchMetaItem">
            <p className="newArchMetaName">{LATEST_INTERIOR.label}</p>
            <p className="newArchMetaPrice">{LATEST_INTERIOR.price}</p>
            <p className="newArchMetaNote">{LATEST_INTERIOR.releaseNote}</p>
          </div>
        </div>

        <div className="newArchCards">
          {/* Card 1 — Latest exterior */}
          <div className="newArchCard newArchCardVideo">
            <video
              src={LATEST_EXTERIOR.videoSrc}
              autoPlay muted loop playsInline
              className="newArchCardVideoEl"
            />
            <div className="newArchCardVideoLabel">Exterior</div>
          </div>

          {/* Card 2 — Latest interior */}
          <div className="newArchCard newArchCardVideo">
            <video
              src={LATEST_INTERIOR.videoSrc}
              autoPlay muted loop playsInline
              className="newArchCardVideoEl"
            />
            <div className="newArchCardVideoLabel">Interior</div>
          </div>
        </div>
      </div>
    </section>
  );
}
