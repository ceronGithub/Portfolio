// RecentlyViewedRow — Shows up to 8 recently previewed assets as a horizontal scroll row.
// Sits above the AssetBuySection. Empty during first session.
// Each card shows label, category, price and a "View" button that opens the browse modal.

"use client";

import "./recently-viewed.css";
import { RecentItem } from "./useRecentlyViewed";

interface Props {
  items:       RecentItem[];
  onView:      (id: string) => void;   // opens browse modal scrolled to item
  onClearAll:  () => void;
}

function fmt(p: number): string {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

const CATEGORY_COLOR: Record<string, string> = {
  Character: "#22c55e",
  Weapon:    "#c9935e",
};

export default function RecentlyViewedRow({ items, onView, onClearAll }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="rvSection">
      <div className="rvHeader">
        <div className="rvHeaderLeft">
          <p className="rvEyebrow">Session History</p>
          <h3 className="rvTitle">Recently Viewed</h3>
        </div>
        <button className="rvClearBtn" onClick={onClearAll}>Clear</button>
      </div>

      <div className="rvScrollWrap">
        <div className="rvScroll">
          {items.map(item => (
            <div key={item.id} className="rvCard">
              <div className="rvCardTop">
                <span
                  className="rvCardCategory"
                  style={{ color: CATEGORY_COLOR[item.category] ?? "#888" }}
                >
                  {item.category}
                </span>
              </div>
              <p className="rvCardLabel">{item.label}</p>
              <p className="rvCardPrice">{fmt(item.price)}</p>
              <button
                className="rvCardViewBtn"
                onClick={() => onView(item.id)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
