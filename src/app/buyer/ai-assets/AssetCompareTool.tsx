// AssetCompareTool.tsx — Side-by-side asset preview comparison.
// Two slots: buyer picks any asset from a dropdown for each slot.
// Assets fetched from DB via /api/products?category= (same source as browse modal).
// Both videos autoplay muted via Google Drive proxy.
// Stat rows below each (category, price, format, polycount).
// "Buy" CTA routes to /checkout/bundle?ids={cuid}. Owned assets show "Owned" badge.

"use client";

import { useState, useRef, useEffect } from "react";
import "./asset-compare-tool.css";

// ── Static enrichment — polycount + format per asset name pattern ─────────
// DB has no polycount/format fields; these are decorative stats only.
const POLY_MAP: Record<string, string> = {
  "orc-01":"~24k tris","orc-02":"~22k tris","orc-03":"~23k tris","orc-04":"~28k tris",
  "orc-05":"~21k tris","orc-06":"~25k tris","orc-07":"~30k tris","orc-08":"~20k tris",
  "orc-09":"~26k tris","orc-10":"~29k tris","orc-11":"~32k tris","orc-12":"~27k tris",
  "orc-13":"~28k tris","axe-01":"~8k tris", "axe-02":"~7k tris", "axe-03":"~9k tris",
  "axe-04":"~8k tris", "axe-05":"~9k tris", "axe-06":"~8k tris", "axe-07":"~8k tris",
  "axe-08":"~9k tris",
};

// Derive a slug-like key from a product name for the poly map lookup.
// e.g. "Orc 01 — Warrior" → "orc-01", "Axe 03 — Runic Axe" → "axe-03"
function nameToSlug(name: string): string {
  const match = name.match(/^(Orc|Axe)\s+(\d+)/i);
  if (!match) return "";
  return `${match[1].toLowerCase()}-${match[2].padStart(2, "0")}`;
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── Types ──────────────────────────────────────────────────────────────────
interface CompareAsset {
  id:       string;   // real DB cuid — used for checkout and owned check
  label:    string;
  category: string;
  videoSrc: string;
  price:    number;
  polyNote: string;
}

export interface AssetCompareToolProps {
  ownedAssetIds?: Set<string>;
}

// ── Single comparison slot ─────────────────────────────────────────────────
function CompareSlot({
  slot,
  selected,
  opposite,
  allAssets,
  ownedAssetIds,
  onChange,
}: {
  slot:          "A" | "B";
  selected:      CompareAsset | null;
  opposite:      CompareAsset | null;
  allAssets:     CompareAsset[];
  ownedAssetIds: Set<string>;
  onChange:      (asset: CompareAsset | null) => void;
}) {
  const videoRef           = useRef<HTMLVideoElement>(null);
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

  const characters = allAssets.filter(a => a.category === "character");
  const weapons    = allAssets.filter(a => a.category === "weapon");

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
            const asset = allAssets.find(a => a.id === e.target.value) ?? null;
            onChange(asset);
          }}
        >
          <option value="">— Choose asset —</option>
          {characters.length > 0 && (
            <optgroup label="Characters">
              {characters.map(a => (
                <option key={a.id} value={a.id}>
                  {ownedAssetIds.has(a.id) ? `✓ ${a.label}` : a.label}
                </option>
              ))}
            </optgroup>
          )}
          {weapons.length > 0 && (
            <optgroup label="Weapons">
              {weapons.map(a => (
                <option key={a.id} value={a.id}>
                  {ownedAssetIds.has(a.id) ? `✓ ${a.label}` : a.label}
                </option>
              ))}
            </optgroup>
          )}
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
            <span className="compareStatVal" style={{ textTransform: "capitalize" }}>{selected.category}</span>
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
            <span className="compareStatVal">OBJ + FBX</span>
          </div>
          {selected.polyNote && (
            <div className="compareStatRow">
              <span className="compareStatKey">Polycount</span>
              <span className="compareStatVal">{selected.polyNote}</span>
            </div>
          )}
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

      {/* CTA — uses real DB cuid via /checkout/bundle */}
      {selected && (
        isOwned ? (
          <div className="compareOwnedBadge">✓ Owned</div>
        ) : (
          <a
            href={`/checkout/bundle?ids=${selected.id}`}
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
  const [allAssets, setAllAssets] = useState<CompareAsset[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [slotA, setSlotA]         = useState<CompareAsset | null>(null);
  const [slotB, setSlotB]         = useState<CompareAsset | null>(null);

  // Fetch Character + Weapon assets from DB on mount — same source as browse modal
  useEffect(() => {
    async function fetchAssets() {
      setLoading(true);
      try {
        const [charRes, weapRes] = await Promise.all([
          fetch("/api/products?category=character"),
          fetch("/api/products?category=weapon"),
        ]);
        const [charData, weapData] = await Promise.all([charRes.json(), weapRes.json()]);

        const mapProduct = (p: any): CompareAsset => ({
          id:       p.id,
          label:    p.name,
          category: p.category,
          videoSrc: p.previewVideoUrl ?? "",
          price:    p.price,
          polyNote: POLY_MAP[nameToSlug(p.name)] ?? "",
        });

        const characters: CompareAsset[] = (charData.products ?? []).map(mapProduct);
        const weapons:    CompareAsset[] = (weapData.products ?? []).map(mapProduct);
        setAllAssets([...characters, ...weapons]);
      } catch {
        setAllAssets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

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

      {/* Loading skeleton */}
      {loading ? (
        <div className="compareLoadingWrap">
          <span className="compareVideoLoadingDot" />
          <span className="compareVideoLoadingDot" />
          <span className="compareVideoLoadingDot" />
        </div>
      ) : (
        /* Slots */
        <div className="compareGrid">
          <CompareSlot
            slot="A"
            selected={slotA}
            opposite={slotB}
            allAssets={allAssets}
            ownedAssetIds={ownedAssetIds}
            onChange={setSlotA}
          />

          {/* VS divider */}
          <div className="compareVsDivider">
            <span className="compareVsLabel">VS</span>
          </div>

          <CompareSlot
            slot="B"
            selected={slotB}
            opposite={slotA}
            allAssets={allAssets}
            ownedAssetIds={ownedAssetIds}
            onChange={setSlotB}
          />
        </div>
      )}
    </section>
  );
}