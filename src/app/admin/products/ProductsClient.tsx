// ProductsClient.tsx — Admin Products & Systems page.
// Section 1: Legacy Products table with active toggle.
// Section 2: Systems Catalog accordion — inline base price editor,
//            per-addon inline price editor, and add-new-addon form.
// IntersectionObserver entrance animations on all cards.
// Protocol v23 Rule 17 design standards applied.
"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface Product {
  id: string; name: string; description: string | null;
  price: number; isActive: boolean; createdAt: Date;
}

interface Addon {
  id: string; addonKey: string; label: string;
  price: number; category: string; description: string | null;
}

interface System {
  id: string; tag: string; title: string; basePrice: number;
  accent: string; timeline: string; deploy: string;
  description: string; isActive: boolean; addons: Addon[];
}

interface Props { products: Product[]; systems: System[]; }

// ── useReveal — IntersectionObserver entrance animation ────────────────
// Adds "apVisible" class when element enters the viewport.
function useReveal() {
  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("apVisible"); },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return elementRef;
}

// ── API helpers ────────────────────────────────────────────────────────

async function toggleProductActive(id: string, current: boolean): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: !current }),
  });
  return res.ok;
}

async function updateSystemBasePrice(id: string, basePrice: number): Promise<boolean> {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basePrice }),
  });
  return res.ok;
}

async function updateAddonPrice(addonId: string, price: number): Promise<boolean> {
  const res = await fetch(`/api/admin/addons/${addonId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price }),
  });
  return res.ok;
}

async function createAddon(
  systemId: string,
  data: { label: string; price: number; category: string; description?: string }
): Promise<Addon | null> {
  const res = await fetch(`/api/admin/systems/${systemId}/addons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.addon ?? null;
}

// ── computeAnalytics — derives chart summary stats ─────────────────────
// Returns total, average, peak value+label, and MoM/WoW growth %.
function computeAnalytics(data: { label: string; value: number }[]): {
  total: number; average: number; peakValue: number; peakLabel: string; growth: number | null;
} {
  if (data.length === 0) return { total: 0, average: 0, peakValue: 0, peakLabel: "—", growth: null };

  const total    = data.reduce((sum, d) => sum + d.value, 0);
  const average  = Math.round(total / data.length);
  const peak     = data.reduce((best, d) => d.value > best.value ? d : best, data[0]);

  // Growth: compare last period vs second-to-last
  let growth: number | null = null;
  if (data.length >= 2) {
    const last = data[data.length - 1].value;
    const prev = data[data.length - 2].value;
    if (prev > 0) growth = Math.round(((last - prev) / prev) * 100);
    else if (last > 0) growth = 100;
    else growth = 0;
  }

  return { total, average, peakValue: peak.value, peakLabel: peak.label, growth };
}

// ── formatPeso — compact peso display ─────────────────────────────────
function formatPeso(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `₱${(value / 1_000).toFixed(1)}k`;
  return `₱${value.toLocaleString("en-PH")}`;
}

// ── AnalyticsBar — summary strip shown above each chart card ───────────
// Shows Total, Average, Peak, and Growth for the dataset.
function AnalyticsBar({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const { total, average, peakValue, peakLabel, growth } = computeAnalytics(data);
  const hasData = total > 0;

  return (
    <div className="apAnalyticsBar">
      <div className="apAnalyticsStat">
        <span className="apAnalyticsLabel">Total</span>
        <span className="apAnalyticsValue" style={{ color: hasData ? color : undefined }}>
          {hasData ? formatPeso(total) : "—"}
        </span>
      </div>
      <div className="apAnalyticsDivider" />
      <div className="apAnalyticsStat">
        <span className="apAnalyticsLabel">Average</span>
        <span className="apAnalyticsValue">{hasData ? formatPeso(average) : "—"}</span>
      </div>
      <div className="apAnalyticsDivider" />
      <div className="apAnalyticsStat">
        <span className="apAnalyticsLabel">Peak</span>
        <span className="apAnalyticsValue">
          {hasData ? `${formatPeso(peakValue)} (${peakLabel})` : "—"}
        </span>
      </div>
      {growth !== null && (
        <>
          <div className="apAnalyticsDivider" />
          <div className="apAnalyticsStat">
            <span className="apAnalyticsLabel">vs last period</span>
            <span
              className="apAnalyticsValue apAnalyticsGrowth"
              style={{ color: growth >= 0 ? "#68d391" : "#fc8181" }}
            >
              {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── SystemBasePriceEditor — inline editor for system base price ────────
function SystemBasePriceEditor({ systemId, initialPrice, accent }: {
  systemId: string; initialPrice: number; accent: string;
}) {
  const [price, setPrice]     = useState(initialPrice);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(initialPrice));
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  async function handleSave() {
    const parsed = parseInt(draft.replace(/,/g, ""), 10);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    const ok = await updateSystemBasePrice(systemId, parsed);
    if (ok) { setPrice(parsed); setSaved(true); setTimeout(() => setSaved(false), 2200); }
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() { setDraft(String(price)); setEditing(false); }

  if (editing) {
    return (
      <div className="apPriceEditor" onClick={e => e.stopPropagation()}>
        <span className="apPriceCurrency">₱</span>
        <input
          className="apPriceInput"
          type="number" min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          autoFocus
          style={{ borderColor: accent }}
        />
        <button className="apPriceSaveBtn" onClick={handleSave} disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}>
          {saving ? "…" : "Save"}
        </button>
        <button className="apPriceCancelBtn" onClick={handleCancel}>✕</button>
      </div>
    );
  }

  return (
    <button
      className="apPriceDisplay"
      onClick={e => { e.stopPropagation(); setEditing(true); setDraft(String(price)); }}
      title="Click to edit base price"
    >
      <span className="apSystemBasePrice">₱{price.toLocaleString()} base</span>
      {saved
        ? <span className="apPriceSavedTag">✓ saved</span>
        : <span className="apPriceEditHint">✎</span>
      }
    </button>
  );
}

// ── AddonPriceEditor — inline price editor per addon row ───────────────
function AddonPriceEditor({ addon, accent, onUpdated }: {
  addon: Addon; accent: string; onUpdated: (id: string, newPrice: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(addon.price));
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  async function handleSave() {
    const parsed = parseInt(draft.replace(/,/g, ""), 10);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    const ok = await updateAddonPrice(addon.id, parsed);
    if (ok) { onUpdated(addon.id, parsed); setSaved(true); setTimeout(() => setSaved(false), 2200); }
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() { setDraft(String(addon.price)); setEditing(false); }

  if (editing) {
    return (
      <div className="apAddonPriceEditor" onClick={e => e.stopPropagation()}>
        <span className="apPriceCurrency">₱</span>
        <input
          className="apPriceInput apPriceInputSmall"
          type="number" min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          autoFocus
          style={{ borderColor: accent }}
        />
        <button className="apPriceSaveBtn apPriceSaveBtnSmall" onClick={handleSave} disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}>
          {saving ? "…" : "Save"}
        </button>
        <button className="apPriceCancelBtn" onClick={handleCancel}>✕</button>
      </div>
    );
  }

  return (
    <button
      className="apAddonPriceDisplay"
      onClick={e => { e.stopPropagation(); setEditing(true); setDraft(String(addon.price)); }}
      title="Click to edit price"
    >
      {saved
        ? <span className="apPriceSavedTag">✓ saved</span>
        : <span className="apAddonPriceValue">+₱{addon.price.toLocaleString()}</span>
      }
      <span className="apPriceEditHintSmall apPriceEditHintVisible">✎</span>
    </button>
  );
}

// ── AddAddonForm — inline form to add a new addon to a system ──────────
function AddAddonForm({ systemId, accent, onAdded }: {
  systemId: string; accent: string; onAdded: (addon: Addon) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [label, setLabel]       = useState("");
  const [price, setPrice]       = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function handleAdd() {
    if (!label.trim() || !category.trim()) { setError("Label and category are required."); return; }
    const parsedPrice = parseInt(price.replace(/,/g, ""), 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError("Enter a valid price."); return; }
    setSaving(true);
    setError("");
    const addon = await createAddon(systemId, { label: label.trim(), price: parsedPrice, category: category.trim() });
    if (addon) {
      onAdded(addon);
      setLabel(""); setPrice(""); setCategory("");
      setOpen(false);
    } else {
      setError("Failed to save. Try again.");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        className="apAddAddonBtn"
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        style={{ borderColor: accent, color: accent }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Addon
      </button>
    );
  }

  return (
    <div className="apAddAddonForm" onClick={e => e.stopPropagation()}>
      <p className="apAddAddonFormTitle">New Addon</p>
      <div className="apAddAddonFormFields">
        <input
          className="apAddAddonInput"
          placeholder="Label (e.g. AI Chatbot)"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <input
          className="apAddAddonInput"
          placeholder="Category (e.g. AI)"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <input
          className="apAddAddonInput apAddAddonInputPrice"
          placeholder="Price (₱)"
          type="number"
          min="0"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>
      {error && <p className="apAddAddonError">{error}</p>}
      <div className="apAddAddonFormActions">
        <button className="apPriceCancelBtn" onClick={() => { setOpen(false); setError(""); }}>
          Cancel
        </button>
        <button
          className="apPriceSaveBtn"
          onClick={handleAdd}
          disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}
        >
          {saving ? "Saving…" : "Add Addon"}
        </button>
      </div>
    </div>
  );
}

// ── ProductsSection — legacy products table ────────────────────────────
function ProductsSection({
  products, onToggle, togglingId,
}: {
  products: Product[];
  onToggle: (id: string, current: boolean) => void;
  togglingId: string | null;
}) {
  const revealRef = useReveal();
  return (
    <div className="apCard apReveal" ref={revealRef}>
      <div className="apCardHeader">
        <h2 className="apCardTitle">Legacy Products</h2>
        <span className="apCardBadge">{products.length}</span>
      </div>
      <div className="apTable">
        <div className="apTableHead apGrid--products">
          <span>Name</span><span>Description</span><span>Price</span>
          <span>Status</span><span>Created</span><span>Action</span>
        </div>
        {products.length === 0 && (
          <div className="apEmpty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
            </svg>
            <p className="apEmptyTitle">No products yet</p>
            <p className="apEmptyHint">Legacy product entries will appear here.</p>
          </div>
        )}
        {products.map(p => (
          <div key={p.id} className="apTableRow apGrid--products">
            <span className="apCell apCellName">{p.name}</span>
            <span className="apCell apCellMuted">{p.description ?? <em className="apNone">—</em>}</span>
            <span className="apCell apCellMono">₱{(p.price / 100).toLocaleString()}</span>
            <span className="apCell">
              <span className={`apBadge ${p.isActive ? "apBadgeActive" : "apBadgeInactive"}`}>
                {p.isActive ? "Active" : "Inactive"}
              </span>
            </span>
            <span className="apCell apCellMuted">
              {new Date(p.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })}
            </span>
            <span className="apCell">
              <button
                className={`apActionBtn ${p.isActive ? "apActionBtnDeactivate" : "apActionBtnActivate"}`}
                onClick={() => onToggle(p.id, p.isActive)}
                disabled={togglingId === p.id}
              >
                {togglingId === p.id ? "…" : p.isActive ? "Deactivate" : "Activate"}
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SystemCard — single accordion card ────────────────────────────────
function SystemCard({ system, isExpanded, onToggleExpand }: {
  system: System; isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const revealRef = useReveal();
  const [addons, setAddons] = useState<Addon[]>(system.addons);

  // Group addons by category for organized display
  const groupedAddons = addons.reduce<Record<string, Addon[]>>((groups, addon) => {
    const cat = addon.category || "General";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(addon);
    return groups;
  }, {});

  function handleAddonPriceUpdated(addonId: string, newPrice: number) {
    setAddons(prev => prev.map(a => a.id === addonId ? { ...a, price: newPrice } : a));
  }

  function handleAddonAdded(newAddon: Addon) {
    setAddons(prev => [...prev, newAddon]);
  }

  return (
    <div className="apSystemCard apReveal" ref={revealRef}>

      {/* ── Header row — click to expand/collapse ── */}
      <div
        className="apSystemHeader"
        onClick={onToggleExpand}
        style={{ borderLeft: `3px solid ${system.accent}` }}
      >
        <div className="apSystemHeaderLeft">
          <span className="apSystemTag" style={{ color: system.accent, borderColor: system.accent }}>
            {system.tag}
          </span>
          <span className="apSystemTitle">{system.title}</span>
          <span className={`apBadge ${system.isActive ? "apBadgeActive" : "apBadgeInactive"}`}>
            {system.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="apSystemHeaderRight">
          <SystemBasePriceEditor
            systemId={system.id}
            initialPrice={system.basePrice}
            accent={system.accent}
          />
          <span className="apSystemAddonCount">
            {addons.length} add-on{addons.length !== 1 ? "s" : ""}
          </span>
          <svg
            className={`apExpandIcon ${isExpanded ? "apExpandIconOpen" : ""}`}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* ── Expanded panel ─────────────────────── */}
      {isExpanded && (
        <div className="apSystemBody">
          <p className="apSystemDesc">{system.description}</p>

          {/* Addon groups */}
          {Object.keys(groupedAddons).length === 0 ? (
            <div className="apEmpty apEmptySmall">
              <p className="apEmptyTitle">No addons configured</p>
              <p className="apEmptyHint">Add the first addon below.</p>
            </div>
          ) : (
            Object.entries(groupedAddons).map(([category, categoryAddons]) => (
              <div key={category} className="apAddonGroup">
                <p className="apAddonGroupLabel">{category}</p>
                <div className="apAddonList">
                  {categoryAddons.map(addon => (
                    <div key={addon.id} className="apAddonRow">
                      <span className="apAddonLabel">{addon.label}</span>
                      <AddonPriceEditor
                        addon={addon}
                        accent={system.accent}
                        onUpdated={handleAddonPriceUpdated}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Add new addon */}
          <div className="apAddAddonWrap">
            <AddAddonForm
              systemId={system.id}
              accent={system.accent}
              onAdded={handleAddonAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export default function ProductsClient({ products, systems }: Props) {
  const [productList, setProductList]   = useState<Product[]>(products);
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const headerRef                       = useReveal();

  async function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    const ok = await toggleProductActive(id, current);
    if (ok) setProductList(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
    setTogglingId(null);
  }

  return (
    <div className="apPage">

      {/* ── Page header ──────────────────────────── */}
      <div className="apPageHeader apReveal" ref={headerRef}>
        <div>
          <span className="apPageEyebrow">Admin</span>
          <h1 className="apPageTitle">Products & Systems</h1>
          <p className="apPageSubtitle">
            {products.length} product{products.length !== 1 ? "s" : ""} &middot; {systems.length} system catalog{systems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <p className="apPageDate">
          {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Legacy Products ───────────────────────── */}
      <ProductsSection
        products={productList}
        onToggle={handleToggleActive}
        togglingId={togglingId}
      />

      {/* ── Systems Catalog ───────────────────────── */}
      <div className="apSectionHeader apReveal">
        <span className="apSectionEyebrow">Catalog</span>
        <h2 className="apSectionTitle">Systems</h2>
      </div>

      <div className="apSystemsList">
        {systems.map(sys => (
          <SystemCard
            key={sys.id}
            system={sys}
            isExpanded={expandedSystem === sys.id}
            onToggleExpand={() => setExpandedSystem(prev => prev === sys.id ? null : sys.id)}
          />
        ))}
        {systems.length === 0 && (
          <div className="apEmpty">
            <p className="apEmptyTitle">No systems in catalog</p>
            <p className="apEmptyHint">Run the seed script to populate systems.</p>
          </div>
        )}
      </div>

    </div>
  );
}