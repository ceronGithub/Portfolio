// DownloadsClient — Buyer download history page.
// Lists all owned products with re-download button.
// Search filter + category tabs (All / Character / Weapon / System).

"use client";

import { useState, useMemo } from "react";
import "./downloads.css";

interface DownloadItem {
  id:          string;
  productId:   string;
  name:        string;
  description: string;
  fileKey:     string | null;
  grantedAt:   string;
}

interface Props {
  downloads: DownloadItem[];
}

// Derive category from product name convention
function getCategory(name: string): "Character" | "Weapon" | "System" {
  const n = name.toLowerCase();
  if (n.includes("axe") || n.includes("sword") || n.includes("bow") || n.includes("weapon")) return "Weapon";
  if (n.includes("orc") || n.includes("character"))  return "Character";
  return "System";
}

const CATEGORY_ICON: Record<string, string> = {
  Character: "🧟",
  Weapon:    "⚔️",
  System:    "🖥️",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function DownloadsClient({ downloads }: Props) {
  const [search, setSearch]     = useState("");
  const [tab, setTab]           = useState<"All" | "Character" | "Weapon" | "System">("All");
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return downloads.filter(d => {
      const cat  = getCategory(d.name);
      const matchTab  = tab === "All" || cat === tab;
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [downloads, tab, search]);

  async function handleDownload(item: DownloadItem) {
    if (!item.fileKey) return;
    setDownloading(item.id);
    try {
      // Construct Supabase storage URL from fileKey
      const url = `https://ktuahohvysmjxumekaov.supabase.co/storage/v1/object/public/assets/${item.fileKey}`;
      const a   = document.createElement("a");
      a.href     = url;
      a.download = item.name;
      a.target   = "_blank";
      a.click();
    } finally {
      setTimeout(() => setDownloading(null), 1200);
    }
  }

  return (
    <div className="dlPage">
      {/* Header */}
      <div className="dlHeader">
        <div>
          <p className="dlEyebrow">Your Library</p>
          <h1 className="dlTitle">Downloads</h1>
          <p className="dlSub">{downloads.length} asset{downloads.length !== 1 ? "s" : ""} · Lifetime access</p>
        </div>
      </div>

      {/* Controls */}
      <div className="dlControls">
        {/* Search */}
        <div className="dlSearchWrap">
          <span className="dlSearchIcon">⌕</span>
          <input
            className="dlSearch"
            type="text"
            placeholder="Search your library…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="dlSearchClear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Category tabs */}
        <div className="dlTabs">
          {(["All", "Character", "Weapon", "System"] as const).map(t => (
            <button
              key={t}
              className={`dlTab ${tab === t ? "dlTabActive" : ""}`}
              onClick={() => setTab(t)}
            >
              {t !== "All" && <span>{CATEGORY_ICON[t]} </span>}
              {t}
              {t === "All" && <span className="dlTabCount">{downloads.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="dlEmpty">
          <p className="dlEmptyIcon">{search ? "🔍" : "📦"}</p>
          <p className="dlEmptyText">
            {search ? `No results for "${search}"` : "No downloads yet."}
          </p>
          {!search && (
            <p className="dlEmptyHint">Purchase assets from the Character & Weapon section to see them here.</p>
          )}
        </div>
      )}

      {/* Download list */}
      {filtered.length > 0 && (
        <div className="dlList">
          {filtered.map(item => {
            const cat      = getCategory(item.name);
            const isBusy   = downloading === item.id;
            const hasFile  = !!item.fileKey;

            return (
              <div key={item.id} className="dlRow">
                {/* Icon */}
                <div className="dlRowIcon">{CATEGORY_ICON[cat]}</div>

                {/* Info */}
                <div className="dlRowInfo">
                  <p className="dlRowName">{item.name}</p>
                  <p className="dlRowMeta">
                    <span className="dlRowCat">{cat}</span>
                    <span className="dlRowDot">·</span>
                    <span className="dlRowDate">Purchased {formatDate(item.grantedAt)}</span>
                  </p>
                  {item.description && (
                    <p className="dlRowDesc">{item.description}</p>
                  )}
                </div>

                {/* Download button */}
                <button
                  className={`dlRowBtn ${!hasFile ? "dlRowBtnDisabled" : ""} ${isBusy ? "dlRowBtnBusy" : ""}`}
                  onClick={() => handleDownload(item)}
                  disabled={!hasFile || isBusy}
                  title={!hasFile ? "File not yet available" : "Download"}
                >
                  {isBusy ? (
                    <span className="dlRowBtnSpinner" />
                  ) : (
                    <>
                      <span className="dlRowBtnIcon">↓</span>
                      <span>{hasFile ? "Download" : "Pending"}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}