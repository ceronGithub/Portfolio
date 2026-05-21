// AssetCompareTool.tsx — Side-by-side asset preview comparison.
// Two slots: buyer picks any asset from a dropdown for each slot.
// Both videos autoplay muted. Stat rows below each (category, price, format).
// "Add to Cart" CTA under each slot routes to checkout.

"use client";

import { useState, useCallback } from "react";
import "./asset-compare-tool.css";

const SB = "https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/videos";

interface CompareAsset {
  id:       string;
  label:    string;
  category: "Character" | "Weapon";
  videoSrc: string;
  price:    number;
  format:   string;
  polyNote: string;
}

const COMPARE_ASSETS: CompareAsset[] = [
  { id:"orc-01", label:"Orc 01 — Warrior",     category:"Character", videoSrc:`${SB}/character/orc-01-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~24k tris" },
  { id:"orc-02", label:"Orc 02 — Fighter",      category:"Character", videoSrc:`${SB}/character/orc-02-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~22k tris" },
  { id:"orc-03", label:"Orc 03 — Red Skin",     category:"Character", videoSrc:`${SB}/character/orc-03-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~23k tris" },
  { id:"orc-04", label:"Orc 04 — Armored",      category:"Character", videoSrc:`${SB}/character/orc-04-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~28k tris" },
  { id:"orc-05", label:"Orc 05 — Shaman",       category:"Character", videoSrc:`${SB}/character/orc-05-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~21k tris" },
  { id:"orc-06", label:"Orc 06 — Berserker",    category:"Character", videoSrc:`${SB}/character/orc-06-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~25k tris" },
  { id:"orc-07", label:"Orc 07 — Heavy",        category:"Character", videoSrc:`${SB}/character/orc-07-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~30k tris" },
  { id:"orc-08", label:"Orc 08 — Scout",        category:"Character", videoSrc:`${SB}/character/orc-08-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~20k tris" },
  { id:"orc-09", label:"Orc 09 — Elite",        category:"Character", videoSrc:`${SB}/character/orc-09-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~26k tris" },
  { id:"orc-11", label:"Orc 11 — Warlord",      category:"Character", videoSrc:`${SB}/character/orc-11-animation.mp4`, price:5500, format:"OBJ + FBX", polyNote:"~32k tris" },
  { id:"axe-01", label:"Axe 01 — Battle Axe",   category:"Weapon",    videoSrc:`${SB}/weapon/axe-01-animation.mp4`,    price:3500, format:"OBJ + FBX", polyNote:"~8k tris"  },
  { id:"axe-02", label:"Axe 02 — War Axe",       category:"Weapon",    videoSrc:`${SB}/weapon/axe-02-animation.mp4`,    price:3500, format:"OBJ + FBX", polyNote:"~7k tris"  },
  { id:"axe-03", label:"Axe 03 — Runic Axe",     category:"Weapon",    videoSrc:`${SB}/weapon/axe-03-animation.mp4`,    price:3500, format:"OBJ + FBX", polyNote:"~9k tris"  },
  { id:"axe-04", label:"Axe 04 — Viking Axe",    category:"Weapon",    videoSrc:`${SB}/weapon/axe-04-animation.mp4`,    price:3500, format:"OBJ + FBX", polyNote:"~8k tris"  },
  { id:"axe-05", label:"Axe 05 — Ornate Axe",    category:"Weapon",    videoSrc:`${SB}/weapon/axe-05-animation.mp4`,    price:3500, format:"OBJ + FBX", polyNote:"~9k tris"  },
  { id:"axe-07", label:"Axe 07 — Bloodied Axe",  category:"Weapon",    videoSrc:`${SB}/weapon/axe-07-animation.mp4`,    price:3500, format:"OBJ + FBX", polyNote:"~8k tris"  },
];

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── Single comparison slot ────────────────────────────────────────────────
function CompareSlot({
  slot,
  selected,
  opposite,
  onChange,
}: {
  slot:     "A" | "B";
  selected: CompareAsset | null;
  opposite: CompareAsset | null;
  onChange: (asset: CompareAsset | null) => void;
}) {
  // Callback ref — fires whenever the video element mounts or src changes
  const videoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    el.load();
    el.play().catch(() => {});
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSameAsOpposite = selected && opposite && selected.id === opposite.id;

  // Stats comparison helpers
  const priceHigher = selected && opposite && selected.price > opposite.price;
  const priceLower  = selected && opposite && selected.price < opposite.price;

  return (
    <div className={`compareSlot ${selected ? "compareSlotFilled" : "compareSlotEmpty"}`}>

      {/* Slot label */}
      <div className="compareSlotLabel">
        <span className="compareSlotLetter">{slot}</span>
        <span className="compareSlotHint">Select asset to compare</span>
      </div>

      {/* Dropdown */}
      <div className="compareDropdownWrap">
        <select
          className="compareDropdown"
          value={selected?.id ?? ""}
          onChange={e => {
            const asset = COMPARE_ASSETS.find(a => a.id === e.target.value) ?? null;
            onChange(asset);
          }}
        >
          <option value="">— Choose asset —</option>
          <optgroup label="Characters">
            {COMPARE_ASSETS.filter(a => a.category === "Character").map(a => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </optgroup>
          <optgroup label="Weapons">
            {COMPARE_ASSETS.filter(a => a.category === "Weapon").map(a => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </optgroup>
        </select>
        <span className="compareDropdownChevron">▾</span>
      </div>

      {/* Same-asset warning */}
      {isSameAsOpposite && (
        <p className="compareSameWarning">⚠ Same asset selected in both slots</p>
      )}

      {/* Video preview */}
      <div className="compareVideoWrap">
        {selected ? (
          <video
            ref={videoCallbackRef}
            key={selected.id}
            src={selected.videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="compareVideo"
          />
        ) : (
          <div className="compareVideoPlaceholder">
            <span className="compareVideoPlaceholderIcon">▶</span>
            <p>Select an asset to preview</p>
          </div>
        )}
      </div>

      {/* Stats table */}
      {selected && (
        <div className="compareStats">
          <div className="compareStatRow">
            <span className="compareStatKey">Category</span>
            <span className="compareStatVal">{selected.category}</span>
          </div>
          <div className="compareStatRow">
            <span className="compareStatKey">Price</span>
            <span className={`compareStatVal ${priceHigher ? "compareStatHigher" : priceLower ? "compareStatLower" : ""}`}>
              {fmt(selected.price)}
              {priceHigher && <span className="compareStatTag compareStatTagRed">higher</span>}
              {priceLower  && <span className="compareStatTag compareStatTagGreen">lower</span>}
            </span>
          </div>
          <div className="compareStatRow">
            <span className="compareStatKey">Format</span>
            <span className="compareStatVal">{selected.format}</span>
          </div>
          <div className="compareStatRow">
            <span className="compareStatKey">Polycount</span>
            <span className="compareStatVal">{selected.polyNote}</span>
          </div>
          <div className="compareStatRow">
            <span className="compareStatKey">Textures</span>
            <span className="compareStatVal">4K PBR</span>
          </div>
          <div className="compareStatRow">
            <span className="compareStatKey">Animations</span>
            <span className="compareStatVal">Idle · Walk · Attack</span>
          </div>
        </div>
      )}

      {/* CTA */}
      {selected && (
        <a
          href={`/checkout/${selected.id}`}
          className="compareAddBtn"
        >
          Buy {selected.label.split("—")[0].trim()} — {fmt(selected.price)}
        </a>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function AssetCompareTool() {
  const [slotA, setSlotA] = useState<CompareAsset | null>(null);
  const [slotB, setSlotB] = useState<CompareAsset | null>(null);

  function handleClear() {
    setSlotA(null);
    setSlotB(null);
  }

  return (
    <section className="compareSection">
      {/* Header */}
      <div className="compareHeader">
        <p className="compareEyebrow">Asset Studio</p>
        <h2 className="compareTitle">Compare Assets</h2>
        <p className="compareSub">
          Pick any two assets to preview them side-by-side before buying.
        </p>
        {(slotA || slotB) && (
          <button className="compareClearBtn" onClick={handleClear}>
            Clear both
          </button>
        )}
      </div>

      {/* Slots */}
      <div className="compareGrid">
        <CompareSlot slot="A" selected={slotA} opposite={slotB} onChange={setSlotA} />

        {/* VS divider */}
        <div className="compareVsDivider">
          <span className="compareVsLabel">VS</span>
        </div>

        <CompareSlot slot="B" selected={slotB} opposite={slotA} onChange={setSlotB} />
      </div>
    </section>
  );
}