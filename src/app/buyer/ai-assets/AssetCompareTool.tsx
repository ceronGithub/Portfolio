// AssetCompareTool.tsx — Side-by-side asset preview comparison.
// Two slots: buyer picks any asset from a dropdown for each slot.
// Both videos autoplay muted via Google Drive proxy.
// Stat rows below each (category, price, format).
// "Buy" CTA routes to checkout. Owned assets show "Owned" badge.

"use client";

import { useState, useRef, useEffect } from "react";
import "./asset-compare-tool.css";

const GD = (id: string) => `/api/drive-video?id=${id}`;

interface CompareAsset {
  id:       string;
  label:    string;
  category: "Character" | "Weapon";
  videoSrc: string;
  price:    number;
  format:   string;
  polyNote: string;
}

// ── All assets with Google Drive video sources ─────────────────────────────
const COMPARE_ASSETS: CompareAsset[] = [
  // Characters
  { id:"orc-01", label:"Orc 01 — Warrior",     category:"Character", videoSrc:GD("1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP"), price:5500, format:"OBJ + FBX", polyNote:"~24k tris" },
  { id:"orc-02", label:"Orc 02 — Fighter",      category:"Character", videoSrc:GD("1SaHl7fGvD2uoy34clB1p2UWT-knWENwl"), price:5500, format:"OBJ + FBX", polyNote:"~22k tris" },
  { id:"orc-03", label:"Orc 03 — Red Skin",     category:"Character", videoSrc:GD("1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i"), price:5500, format:"OBJ + FBX", polyNote:"~23k tris" },
  { id:"orc-04", label:"Orc 04 — Armored",      category:"Character", videoSrc:GD("1cx2sETIft3K7R8NnNPumoLet1pW5It0a"), price:5500, format:"OBJ + FBX", polyNote:"~28k tris" },
  { id:"orc-05", label:"Orc 05 — Shaman",       category:"Character", videoSrc:GD("1-n33tw86ViaKB6xzM0UuCrgF45JVc63-"), price:5500, format:"OBJ + FBX", polyNote:"~21k tris" },
  { id:"orc-06", label:"Orc 06 — Berserker",    category:"Character", videoSrc:GD("1XVymFPXK8aQa-Ud7DwpkaQ6g3BrGiLjH"), price:5500, format:"OBJ + FBX", polyNote:"~25k tris" },
  { id:"orc-07", label:"Orc 07 — Heavy",        category:"Character", videoSrc:GD("16-RCaA3WjQjMf1GT0Ad2JrjAhR-U_FyH"), price:5500, format:"OBJ + FBX", polyNote:"~30k tris" },
  { id:"orc-08", label:"Orc 08 — Scout",        category:"Character", videoSrc:GD("1Wjgt2RcRkUrbxEMnLQWWdiUdQ3OHwpx3"), price:5500, format:"OBJ + FBX", polyNote:"~20k tris" },
  { id:"orc-09", label:"Orc 09 — Elite",        category:"Character", videoSrc:GD("1JB-kYyq0XMrPe0pgrh5L2S-nGmK-wvXE"), price:5500, format:"OBJ + FBX", polyNote:"~26k tris" },
  { id:"orc-10", label:"Orc 10 — Destroyer",    category:"Character", videoSrc:GD("1q3rW69QWjYEK5T53rRTpTFlR7X9ZERRe"), price:5500, format:"OBJ + FBX", polyNote:"~29k tris" },
  { id:"orc-11", label:"Orc 11 — Warlord",      category:"Character", videoSrc:GD("1CTk71XmBB9yNz9Osbfd-YHg9mrsgmZkf"), price:5500, format:"OBJ + FBX", polyNote:"~32k tris" },
  { id:"orc-12", label:"Orc 12",                category:"Character", videoSrc:GD("1ZPSoWhJc0ukVny9sCKp0-ytzTsz0aL50"), price:5500, format:"OBJ + FBX", polyNote:"~27k tris" },
  { id:"orc-13", label:"Orc 13",                category:"Character", videoSrc:GD("1W1eHcST6_noKH3VCygvpKz-JFZkCF6Su"), price:5500, format:"OBJ + FBX", polyNote:"~28k tris" },
  // Weapons
  { id:"axe-01", label:"Axe 01 — Battle Axe",   category:"Weapon",    videoSrc:GD("1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8"), price:3500, format:"OBJ + FBX", polyNote:"~8k tris"  },
  { id:"axe-02", label:"Axe 02 — War Axe",       category:"Weapon",    videoSrc:GD("1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67"), price:3500, format:"OBJ + FBX", polyNote:"~7k tris"  },
  { id:"axe-03", label:"Axe 03 — Runic Axe",     category:"Weapon",    videoSrc:GD("1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld"), price:3500, format:"OBJ + FBX", polyNote:"~9k tris"  },
  { id:"axe-04", label:"Axe 04 — Viking Axe",    category:"Weapon",    videoSrc:GD("1jjU-r5EawMDjzhbJueiadCMjkcCZrHtr"), price:3500, format:"OBJ + FBX", polyNote:"~8k tris"  },
  { id:"axe-05", label:"Axe 05 — Ornate Axe",    category:"Weapon",    videoSrc:GD("1vl3KhBI_UQIugyIXeBTduabrOh0eZSU5"), price:3500, format:"OBJ + FBX", polyNote:"~9k tris"  },
  { id:"axe-06", label:"Axe 06 — Broad Axe",     category:"Weapon",    videoSrc:GD("1DcmVwUgfOzvl8wzJJOq-YP7pR_8ZXZ4u"), price:3500, format:"OBJ + FBX", polyNote:"~8k tris"  },
  { id:"axe-07", label:"Axe 07 — Bloodied Axe",  category:"Weapon",    videoSrc:GD("1k9AhDcIY-Em7Wyl5fd2i79DomElK1DnM"), price:3500, format:"OBJ + FBX", polyNote:"~8k tris"  },
  { id:"axe-08", label:"Axe 08 — Dark Axe",      category:"Weapon",    videoSrc:GD("1tqcYpL3wqMpomBiXOo_N6yDwspdEgmWu"), price:3500, format:"OBJ + FBX", polyNote:"~9k tris"  },
];

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── Props ──────────────────────────────────────────────────────────────────
export interface AssetCompareToolProps {
  ownedAssetIds?: Set<string>;
  wishlistIds?:   Set<string>;
  onAddToWishlist?: (id: string) => void;
}

// ── Single comparison slot ─────────────────────────────────────────────────
function CompareSlot({
  slot,
  selected,
  opposite,
  ownedAssetIds,
  onChange,
}: {
  slot:          "A" | "B";
  selected:      CompareAsset | null;
  opposite:      CompareAsset | null;
  ownedAssetIds: Set<string>;
  onChange:      (asset: CompareAsset | null) => void;
}) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Reload and play whenever selection changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !selected) return;
    setVideoLoading(true);
    el.load();
    el.play().catch(() => {});
  }, [selected?.id]);

  const isOwned          = selected ? ownedAssetIds.has(selected.id) : false;
  const isSameAsOpposite = selected && opposite && selected.id === opposite.id;
  const priceHigher      = selected && opposite && selected.price > opposite.price;
  const priceLower       = selected && opposite && selected.price < opposite.price;

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

      {/* Video preview — key forces remount when selection changes */}
      <div className="compareVideoWrap">
        {selected ? (
          <>
            {videoLoading && (
              <div className="compareVideoLoading">
                <span className="compareVideoLoadingDot" />
                <span className="compareVideoLoadingDot" />
                <span className="compareVideoLoadingDot" />
              </div>
            )}
            <video
              ref={videoRef}
              key={selected.id}
              src={selected.videoSrc}
              autoPlay
              muted
              loop
              playsInline
              className={`compareVideo ${videoLoading ? "compareVideoHidden" : ""}`}
              onCanPlay={() => setVideoLoading(false)}
              onWaiting={() => setVideoLoading(true)}
            />
          </>
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
        isOwned ? (
          <div className="compareOwnedBadge">✓ Owned</div>
        ) : (
          <a
            href={`/checkout/${selected.id}`}
            className="compareAddBtn"
          >
            Buy {selected.label.split("—")[0].trim()} — {fmt(selected.price)}
          </a>
        )
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function AssetCompareTool({
  ownedAssetIds = new Set(),
}: AssetCompareToolProps) {
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
        <CompareSlot slot="A" selected={slotA} opposite={slotB} ownedAssetIds={ownedAssetIds} onChange={setSlotA} />

        {/* VS divider */}
        <div className="compareVsDivider">
          <span className="compareVsLabel">VS</span>
        </div>

        <CompareSlot slot="B" selected={slotB} opposite={slotA} ownedAssetIds={ownedAssetIds} onChange={setSlotB} />
      </div>
    </section>
  );
}