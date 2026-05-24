// LatestDropTicker — Sticky top banner that runs a scrolling marquee
// when at least one isLatest product is active. Hidden when no latest drops exist.
// Receives the same latestCharacter, latestWeapon, latestInterior, latestExterior
// props from BuyerDashboardClient — zero extra fetches needed.
"use client";

import "./latest-drop-ticker.css";

interface LatestProduct {
  id:       string;
  name:     string;
  price:    number;
  category: string;
}

interface Props {
  latestCharacter: LatestProduct | null;
  latestWeapon:    LatestProduct | null;
  latestInterior:  LatestProduct | null;
  latestExterior:  LatestProduct | null;
}

// Maps category key to display label shown in the ticker.
const CATEGORY_LABEL: Record<string, string> = {
  character: "Character",
  weapon:    "Weapon",
  interior:  "Interior",
  exterior:  "Exterior",
};

// Separator glyph between ticker items.
const SEPARATOR = "✦";

export default function LatestDropTicker({
  latestCharacter,
  latestWeapon,
  latestInterior,
  latestExterior,
}: Props) {
  // Build the list of active latest products.
  const activeDrops = [latestCharacter, latestWeapon, latestInterior, latestExterior].filter(
    (p): p is LatestProduct => p !== null
  );

  // Nothing to show — render nothing, no layout impact.
  if (activeDrops.length === 0) return null;

  // Build one ticker segment per active drop.
  // Duplicate the array so the marquee loop looks seamless.
  const tickerItems = [...activeDrops, ...activeDrops];

  return (
    <div className="latestDropTicker" role="marquee" aria-label="Latest drops">
      <span className="latestDropTickerLabel">NEW DROP</span>
      <div className="latestDropTickerTrack">
        <div className="latestDropTickerInner">
          {tickerItems.map((product, index) => (
            <span key={`${product.id}-${index}`} className="latestDropTickerItem">
              <span className="latestDropTickerSep">{SEPARATOR}</span>
              <span className="latestDropTickerCategory">
                {CATEGORY_LABEL[product.category] ?? product.category}
              </span>
              <span className="latestDropTickerName">{product.name}</span>
              <span className="latestDropTickerPrice">
                ₱{product.price.toLocaleString()}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
