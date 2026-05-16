// AssetBuySection — Character / Weapon buying section.
// Layout: orc-blue bg left, content right.
// Two cards: 3D OBJ file + MP4 animation (placeholders).
// BUY button → checkout. Browse button → modal with scrollable list.
// Select in modal → closes modal → auto-plays selected asset video in second card.
// Fog canvas: cinematic ground fog rising from the bottom of the section.

"use client";

import { useState, useRef, useEffect } from "react";
import "./asset-buy-section.css";

// ── FogWisp: elliptical radial gradient blob spawned at the bottom, rises upward ──
// Three layers control size, speed, and opacity for a convincing depth stack.
interface FogWisp {
  x: number; y: number;            // current canvas position
  vx: number;                       // horizontal drift per frame
  vy: number;                       // vertical rise per frame (negative = up)
  swayAmplitude: number;            // horizontal sine sway width
  swayFrequency: number;            // horizontal sine sway speed
  swayOffset: number;               // phase so each wisp sways differently
  radiusX: number; radiusY: number; // ellipse half-axes
  life: number; maxLife: number;    // age tracking for fade in/out
  opacity: number;                  // peak alpha — intentionally high for visibility
  layer: number;                    // 0 = deep/large/slow, 1 = mid, 2 = surface/small/fast
}

// Spawns a wisp just below the bottom edge, spread across full canvas width
function spawnFogWisp(canvasWidth: number, canvasHeight: number): FogWisp {
  const layer = Math.floor(Math.random() * 3);

  // Larger and slower at deep layer, smaller and faster at surface
  const radiusScale  = [2.2, 1.5, 0.95][layer];
  const riseSpeed    = [0.15, 0.26, 0.40][layer];
  // Higher opacity so the fog is clearly visible against the dark background
  const peakOpacity  = [0.32, 0.25, 0.18][layer];

  return {
    x:             Math.random() * canvasWidth * 1.3 - canvasWidth * 0.15,
    y:             canvasHeight + Math.random() * 80,
    vx:            (Math.random() - 0.5) * 0.28,
    vy:            -(Math.random() * riseSpeed + 0.08),
    swayAmplitude: Math.random() * 28 + 10,
    swayFrequency: Math.random() * 0.003 + 0.001,
    swayOffset:    Math.random() * Math.PI * 2,
    radiusX:       (Math.random() * 210 + 170) * radiusScale,
    radiusY:       (Math.random() * 65  + 42)  * radiusScale,
    life:          0,
    maxLife:       Math.random() * 500 + 350,
    opacity:       peakOpacity * (Math.random() * 0.25 + 0.88),
    layer,
  };
}

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

interface AssetItem {
  id:       string;
  label:    string;
  category: "Character" | "Weapon";
  videoSrc: string;
  price:    string;
}

const ALL_ASSETS: AssetItem[] = [
  // Characters
  { id:"orc-01", label:"Orc 01 — Warrior",     category:"Character", videoSrc:`${SB}/character/orc-01-animation.mp4`, price:"₱5,500" },
  { id:"orc-02", label:"Orc 02 — Fighter",      category:"Character", videoSrc:`${SB}/character/orc-02-animation.mp4`, price:"₱5,500" },
  { id:"orc-03", label:"Orc 03 — Red Skin",     category:"Character", videoSrc:`${SB}/character/orc-03-animation.mp4`, price:"₱5,500" },
  { id:"orc-04", label:"Orc 04 — Armored",      category:"Character", videoSrc:`${SB}/character/orc-04-animation.mp4`, price:"₱5,500" },
  { id:"orc-05", label:"Orc 05 — Shaman",       category:"Character", videoSrc:`${SB}/character/orc-05-animation.mp4`, price:"₱5,500" },
  { id:"orc-06", label:"Orc 06 — Berserker",    category:"Character", videoSrc:`${SB}/character/orc-06-animation.mp4`, price:"₱5,500" },
  { id:"orc-07", label:"Orc 07 — Heavy",        category:"Character", videoSrc:`${SB}/character/orc-07-animation.mp4`, price:"₱5,500" },
  { id:"orc-08", label:"Orc 08 — Scout",        category:"Character", videoSrc:`${SB}/character/orc-08-animation.mp4`, price:"₱5,500" },
  { id:"orc-09", label:"Orc 09 — Elite",        category:"Character", videoSrc:`${SB}/character/orc-09-animation.mp4`, price:"₱5,500" },
  { id:"orc-11", label:"Orc 11 — Warlord",      category:"Character", videoSrc:`${SB}/character/orc-11-animation.mp4`, price:"₱5,500" },
  // Weapons
  { id:"axe-01", label:"Axe 01 — Battle Axe",   category:"Weapon",    videoSrc:`${SB}/weapon/axe-01-animation.mp4`,    price:"₱3,500" },
  { id:"axe-02", label:"Axe 02 — War Axe",      category:"Weapon",    videoSrc:`${SB}/weapon/axe-02-animation.mp4`,    price:"₱3,500" },
  { id:"axe-03", label:"Axe 03 — Runic Axe",    category:"Weapon",    videoSrc:`${SB}/weapon/axe-03-animation.mp4`,    price:"₱3,500" },
  { id:"axe-04", label:"Axe 04 — Viking Axe",   category:"Weapon",    videoSrc:`${SB}/weapon/axe-04-animation.mp4`,    price:"₱3,500" },
  { id:"axe-05", label:"Axe 05 — Ornate Axe",   category:"Weapon",    videoSrc:`${SB}/weapon/axe-05-animation.mp4`,    price:"₱3,500" },
  { id:"axe-07", label:"Axe 07 — Bloodied Axe", category:"Weapon",    videoSrc:`${SB}/weapon/axe-07-animation.mp4`,    price:"₱3,500" },
];

export default function AssetBuySection() {
  const [browseOpen,    setBrowseOpen]    = useState(false);
  const [browseTab,     setBrowseTab]     = useState<"Character" | "Weapon">("Character");
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const videoCardRef = useRef<HTMLVideoElement>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogRafRef    = useRef<number>(0);
  const fogWisps     = useRef<FogWisp[]>([]);

  const filteredAssets = ALL_ASSETS.filter(a => a.category === browseTab);

  // ── Fog canvas animation ─────────────────────────────────────────────────────
  // Ground fog: wisps spawn at bottom, rise upward with horizontal sine sway.
  // Deep layer (0) renders first so it sits behind mid and surface layers.
  // Canvas size matches its CSS size on mount and every resize.
  useEffect(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas pixel size to its CSS layout size
    function resize() {
      canvas!.width  = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Pre-seed 30 wisps distributed across their lifecycle so fog is dense on load
    for (let i = 0; i < 30; i++) {
      const wisp   = spawnFogWisp(canvas.width, canvas.height);
      wisp.life    = Math.random() * wisp.maxLife * 0.7;
      // Walk position forward proportionally to age
      wisp.x      += wisp.vx * wisp.life;
      wisp.y       = (canvas.height + 80) + wisp.vy * wisp.life;
      wisp.x      += Math.sin(wisp.life * wisp.swayFrequency + wisp.swayOffset) * wisp.swayAmplitude;
      fogWisps.current.push(wisp);
    }

    function drawFog() {
      const cw = canvas!.width;
      const ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);

      // Keep steady supply — target 36 wisps on screen at all times
      if (fogWisps.current.length < 36 && Math.random() < 0.55)
        fogWisps.current.push(spawnFogWisp(cw, ch));

      // Cull expired wisps
      fogWisps.current = fogWisps.current.filter(p => p.life < p.maxLife);

      // Render deep → surface so surface layer appears in front
      const sorted = [...fogWisps.current].sort((a, b) => a.layer - b.layer);

      for (const p of sorted) {
        // Advance physics
        p.life += 1;
        p.x    += p.vx + Math.sin(p.life * p.swayFrequency + p.swayOffset) * 0.35;
        p.y    += p.vy;

        const ratio = p.life / p.maxLife;

        // Smooth fade in (first 15%) → hold → fade out (last 22%)
        const fadeIn  = Math.min(1, ratio / 0.15);
        const fadeOut = ratio > 0.78 ? Math.max(0, 1 - (ratio - 0.78) / 0.22) : 1;
        const alpha   = p.opacity * fadeIn * fadeOut;

        if (alpha < 0.003) continue;

        // Color by layer — deep = cool blue-grey, surface = warm white-grey
        const r = p.layer === 0 ? 185 : p.layer === 1 ? 205 : 222;
        const g = p.layer === 0 ? 200 : p.layer === 1 ? 215 : 225;
        const b = p.layer === 0 ? 230 : p.layer === 1 ? 228 : 230;

        // Draw as squashed ellipse via scale transform + radial gradient
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.scale(1, p.radiusY / p.radiusX);
        const grad = ctx!.createRadialGradient(0, 0, 0, 0, 0, p.radiusX);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(0.4,  `rgba(${r},${g},${b},${alpha * 0.6})`);
        grad.addColorStop(0.75, `rgba(${r},${g},${b},${alpha * 0.2})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx!.beginPath();
        ctx!.arc(0, 0, p.radiusX, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
        ctx!.restore();
      }

      fogRafRef.current = requestAnimationFrame(drawFog);
    }

    fogRafRef.current = requestAnimationFrame(drawFog);
    return () => {
      cancelAnimationFrame(fogRafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ── Auto-play video card when selectedAsset changes and modal is closed ──
  // When a new asset is selected and browseOpen becomes false, load + play the video.
  useEffect(() => {
    if (!browseOpen && selectedAsset && videoCardRef.current) {
      const video = videoCardRef.current;
      video.load();
      video.play().catch(() => {
        // Autoplay blocked by browser — video will play on first user interaction
      });
    }
  }, [browseOpen, selectedAsset]);

  // ── Select handler: set asset + close modal ──
  function handleSelectAsset(asset: AssetItem) {
    setSelectedAsset(asset);
    setBrowseOpen(false);
  }

  return (
    <>
      <section className="assetBuySection">

        {/* Background orc — left */}
        <div className="assetBuyBgOrc">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/orc-blue.png" alt="" className="assetBuyBgOrcImg" />
          <div className="assetBuyBgOrcFade" />
        </div>

        {/* ── Fog canvas — ground fog rising from the bottom ── */}
        <canvas ref={fogCanvasRef} className="assetBuyFogCanvas" />

        {/* Content */}
        <div className="assetBuyContent">

          <div className="assetBuyHeaderRow">
            <div>
              <p className="assetBuyLabel">Character & Weapon</p>
              <h2 className="assetBuyTitle">One time Purchase.<br />Lifetime access</h2>
            </div>
            <div className="assetBuyActions">
              <button className="assetBuyBtn" onClick={() => {}}>BUY</button>
              <button className="assetBrowseBtn" onClick={() => setBrowseOpen(true)}>Browse</button>
            </div>
          </div>

          {/* Two cards: OBJ placeholder + MP4 video card */}
          <div className="assetBuyCards">

            {/* Card 1 — 3D obj placeholder */}
            <div className="assetBuyCard">
              <div className="assetBuyCardInner">
                <span className="assetBuyCardIcon">📦</span>
                <p className="assetBuyCardLabel">3D obj file here</p>
              </div>
            </div>

            {/* Card 2 — MP4 animation: shows selected asset video or placeholder */}
            <div className="assetBuyCard">
              {selectedAsset ? (
                <video
                  ref={videoCardRef}
                  src={selectedAsset.videoSrc}
                  className="assetBuyCardVideo"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="assetBuyCardInner">
                  <span className="assetBuyCardIcon">🎬</span>
                  <p className="assetBuyCardLabel">Mp4 animation here</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* ── Browse Modal ── */}
      {browseOpen && (
        <div className="assetModalOverlay" onClick={() => setBrowseOpen(false)}>
          <div className="assetModal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="assetModalHeader">
              <div className="assetModalTabs">
                {(["Character", "Weapon"] as const).map(tab => (
                  <button
                    key={tab}
                    className={`assetModalTab ${browseTab === tab ? "assetModalTabActive" : ""}`}
                    onClick={() => setBrowseTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button className="assetModalClose" onClick={() => setBrowseOpen(false)}>✕</button>
            </div>

            {/* Scrollable list */}
            <div className="assetModalList">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className={`assetModalRow ${selectedAsset?.id === asset.id ? "assetModalRowActive" : ""}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  {/* Video thumbnail */}
                  <div className="assetModalThumb">
                    <video
                      src={asset.videoSrc}
                      autoPlay muted loop playsInline
                      className="assetModalThumbVideo"
                    />
                  </div>

                  {/* Info */}
                  <div className="assetModalRowInfo">
                    <p className="assetModalRowLabel">{asset.label}</p>
                    <p className="assetModalRowCategory">{asset.category}</p>
                  </div>

                  {/* Price + select */}
                  <div className="assetModalRowRight">
                    <p className="assetModalRowPrice">{asset.price}</p>
                    <button
                      className="assetModalSelectBtn"
                      onClick={e => { e.stopPropagation(); handleSelectAsset(asset); }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className="assetModalFooter">
              <p className="assetModalFooterNote">
                {selectedAsset ? `Selected: ${selectedAsset.label}` : "Select an asset to purchase"}
              </p>
              {selectedAsset && (
                <button className="assetModalBuyBtn">
                  Buy Now — {selectedAsset.price}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}