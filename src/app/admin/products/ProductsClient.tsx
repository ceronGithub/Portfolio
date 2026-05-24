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
  price: number; isActive: boolean; isLatest: boolean;
  category: string;
  previewVideoUrl: string | null; facePngUrl: string | null;
  threeDUrl: string | null; actionOneUrl: string | null;
  actionTwoUrl: string | null; actionThreeUrl: string | null;
  // Tier prices
  priceMesh:     number | null; priceStandard: number | null; priceFull: number | null;
  // Downloadable mesh files
  fileKeyObj: string | null; fileKeyFbx: string | null; fileKeyGlb: string | null;
  // Animation clips
  animIdleUrl: string | null; animWalkUrl: string | null; animRunUrl: string | null;
  animAttackOneUrl: string | null; animAttackTwoUrl: string | null;
  animDeathUrl: string | null; animHitUrl: string | null;
  createdAt: Date;
}

interface Addon {
  id: string; addonKey: string; label: string;
  price: number; category: string; description: string | null;
}

interface System {
  id: string; tag: string; title: string; basePrice: number;
  accent: string; timeline: string; deploy: string;
  description: string; features: string[]; isActive: boolean;
  bgVideoUrl: string | null; demoVideoUrl: string | null;
  addons: Addon[];
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

// Deletes a product with cascade handling for orders and ownership.
async function deleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.ok;
}

// Toggles the isLatest flag on a product.
async function toggleProductLatest(id: string, current: boolean): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isLatest: !current }),
  });
  return res.ok;
}

// Updates a single media URL field (or null) on a product.
async function patchProductMedia(
  id: string,
  field: string,
  value: string | null
): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [field]: value }),
  });
  return res.ok;
}

// Creates a new product record.
async function createProduct(data: {
  name: string; price: number; category: string;
  description?: string; isLatest?: boolean;
  previewVideoUrl?: string; facePngUrl?: string; threeDUrl?: string;
  actionOneUrl?: string; actionTwoUrl?: string; actionThreeUrl?: string;
  priceMesh?: number | null; priceStandard?: number | null; priceFull?: number | null;
  fileKeyObj?: string | null; fileKeyFbx?: string | null; fileKeyGlb?: string | null;
  animIdleUrl?: string | null; animWalkUrl?: string | null; animRunUrl?: string | null;
  animAttackOneUrl?: string | null; animAttackTwoUrl?: string | null;
  animDeathUrl?: string | null; animHitUrl?: string | null;
}): Promise<Product | null> {
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.product ?? null;
}

async function updateSystemBasePrice(id: string, basePrice: number): Promise<boolean> {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basePrice }),
  });
  return res.ok;
}

// Patches any combination of editable System fields in one PATCH call.
async function updateSystemFields(
  id: string,
  fields: Partial<{
    title: string; description: string; accent: string;
    timeline: string; deploy: string; features: string[];
    bgVideoUrl: string | null; demoVideoUrl: string | null;
  }>
): Promise<boolean> {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
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

// ── MEDIA_FIELD_GROUPS — grouped editable fields per product ──────────────
const MEDIA_FIELD_GROUPS: {
  group:  string;
  color:  string;
  fields: { field: string; label: string; type?: "url" | "number"; placeholder?: string }[];
}[] = [
  {
    group: "Preview",
    color: "#6c8af5",
    fields: [
      { field: "previewVideoUrl", label: "Preview Video URL",   placeholder: "GDrive /api/drive-video?id=…" },
      { field: "facePngUrl",      label: "Face PNG URL",        placeholder: "Image URL or Supabase path" },
      { field: "threeDUrl",       label: "3D Viewer URL",       placeholder: "Architecture only" },
    ],
  },
  {
    group: "Tier Prices",
    color: "#fbbf24",
    fields: [
      { field: "priceMesh",     label: "Mesh Only Price (₱)",     type: "number" as const, placeholder: "e.g. 699" },
      { field: "priceStandard", label: "Standard Pack Price (₱)", type: "number" as const, placeholder: "e.g. 1499" },
      { field: "priceFull",     label: "Full Pack Price (₱)",     type: "number" as const, placeholder: "Characters only — leave blank for weapons" },
    ],
  },
  {
    group: "Downloadable Files",
    color: "#34d399",
    fields: [
      { field: "fileKeyObj", label: "OBJ File Key (Supabase)", placeholder: "assets/characters/orc-01.obj" },
      { field: "fileKeyFbx", label: "FBX File Key (Supabase)", placeholder: "assets/characters/orc-01.fbx" },
      { field: "fileKeyGlb", label: "GLB File Key (Supabase)", placeholder: "Full Pack only — assets/characters/orc-01.glb" },
    ],
  },
  {
    group: "Animations",
    color: "#a78bfa",
    fields: [
      { field: "animIdleUrl",      label: "Idle",         placeholder: "Supabase key or URL" },
      { field: "animWalkUrl",      label: "Walk",         placeholder: "Supabase key or URL" },
      { field: "animRunUrl",       label: "Run",          placeholder: "Supabase key or URL" },
      { field: "animAttackOneUrl", label: "Attack 1",     placeholder: "Supabase key or URL" },
      { field: "animAttackTwoUrl", label: "Attack 2",     placeholder: "Full Pack only" },
      { field: "animDeathUrl",     label: "Death",        placeholder: "Supabase key or URL" },
      { field: "animHitUrl",       label: "Hit / Flinch", placeholder: "Full Pack only" },
    ],
  },
  {
    group: "Legacy Action Slots",
    color: "#94a3b8",
    fields: [
      { field: "actionOneUrl",   label: "Action 1 URL" },
      { field: "actionTwoUrl",   label: "Action 2 URL" },
      { field: "actionThreeUrl", label: "Action 3 URL" },
    ],
  },
];

const ALL_MEDIA_FIELDS = MEDIA_FIELD_GROUPS.flatMap(g => g.fields);

// ── MediaEditor ─────────────────────────────────────────────────────────────
function MediaEditor({ product, onFieldSaved }: {
  product: Product;
  onFieldSaved: (id: string, field: string, value: string | null) => void;
}) {
  const initialDrafts = Object.fromEntries(
    ALL_MEDIA_FIELDS.map(({ field }) => [
      field,
      (product[field as keyof Product] as string | number | null) != null
        ? String(product[field as keyof Product]) : ""
    ])
  );
  const [drafts, setDrafts] = useState<Record<string, string>>(initialDrafts);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved,  setSaved]  = useState<Record<string, boolean>>({});

  async function handleSaveField(field: string, type?: "url" | "number") {
    const raw   = drafts[field].trim();
    const value = raw === "" ? null : type === "number" ? String(parseInt(raw, 10)) : raw;
    setSaving(prev => ({ ...prev, [field]: true }));
    const ok = await patchProductMedia(product.id, field, value);
    if (ok) {
      onFieldSaved(product.id, field, value);
      setSaved(prev => ({ ...prev, [field]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [field]: false })), 2200);
    }
    setSaving(prev => ({ ...prev, [field]: false }));
  }

  return (
    <div className="apMediaEditor">
      {MEDIA_FIELD_GROUPS.map(({ group, color, fields }) => (
        <div key={group} className="apMediaGroup">
          <div className="apMediaGroupHeader" style={{ borderLeftColor: color }}>
            <span className="apMediaGroupLabel">{group}</span>
          </div>
          {fields.map(({ field, label, type, placeholder }) => {
            const currentVal = (product[field as keyof Product] as string | number | null);
            const isFilled   = currentVal !== null && currentVal !== "" && currentVal !== undefined;
            return (
              <div key={field} className={`apMediaRow${isFilled ? " apMediaRowFilled" : ""}`}>
                <span className="apMediaLabel">
                  {label}
                  {isFilled && <span className="apMediaFilledDot" />}
                </span>
                <input
                  className="apMediaInput"
                  type={type === "number" ? "number" : "text"}
                  placeholder={placeholder ?? "Paste URL or leave empty to clear"}
                  value={drafts[field]}
                  onChange={e => setDrafts(prev => ({ ...prev, [field]: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveField(field, type); }}
                />
                <button
                  className="apPriceSaveBtn"
                  onClick={() => handleSaveField(field, type)}
                  disabled={saving[field]}
                >
                  {saving[field] ? "…" : saved[field] ? "✓" : "Save"}
                </button>
                <button
                  className="apPriceCancelBtn"
                  onClick={() => { setDrafts(prev => ({ ...prev, [field]: "" })); handleSaveField(field, type); }}
                  title="Clear this field"
                >✕</button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}


// ── AddProductForm — create a new product from the Admin UI ───────────────
// Shown when the admin clicks "Add New Product" at the top of the table.
// On success, the new product is prepended to the list in local state.
function AddProductForm({ onProductCreated, onClose }: {
  onProductCreated: (product: Product) => void;
  onClose: () => void;
}) {
  const [name, setName]               = useState("");
  const [price, setPrice]             = useState("");
  const [category, setCategory]       = useState("character");
  const [description, setDescription] = useState("");
  const [isLatest, setIsLatest]       = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [facePngUrl, setFacePngUrl]           = useState("");
  const [threeDUrl, setThreeDUrl]             = useState("");
  const [actionOneUrl, setActionOneUrl]       = useState("");
  const [actionTwoUrl, setActionTwoUrl]       = useState("");
  const [actionThreeUrl, setActionThreeUrl]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function handleCreate() {
    if (!name.trim()) { setError("Name is required."); return; }
    const parsedPrice = parseInt(price.replace(/,/g, ""), 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError("Enter a valid price (₱)."); return; }
    setSaving(true);
    setError("");
    const product = await createProduct({
      name: name.trim(),
      price: parsedPrice,
      category,
      description: description.trim() || undefined,
      isLatest,
      previewVideoUrl: previewVideoUrl.trim() || undefined,
      facePngUrl:      facePngUrl.trim()      || undefined,
      threeDUrl:       threeDUrl.trim()        || undefined,
      actionOneUrl:    actionOneUrl.trim()    || undefined,
      actionTwoUrl:    actionTwoUrl.trim()    || undefined,
      actionThreeUrl:  actionThreeUrl.trim()  || undefined,
    });
    if (product) {
      onProductCreated(product);
      onClose();
    } else {
      setError("Failed to create product. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="apAddProductForm">
      <p className="apAddAddonFormTitle">New Product</p>
      <div className="apAddProductGrid">
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Name *</label>
          <input className="apMediaInput" placeholder="e.g. Orc 12 — Berserker" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Price (₱) *</label>
          <input className="apMediaInput" type="number" min="0" placeholder="5500" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Category *</label>
          <select className="apMediaInput apMediaSelect" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="character">Character</option>
            <option value="weapon">Weapon</option>
            <option value="interior">Interior</option>
            <option value="exterior">Exterior</option>
          </select>
        </div>
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Description</label>
          <input className="apMediaInput" placeholder="Short description…" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Preview Video URL</label>
          <input className="apMediaInput" placeholder="GDrive or /api/drive-video?id=…" value={previewVideoUrl} onChange={e => setPreviewVideoUrl(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Face PNG URL</label>
          <input className="apMediaInput" value={facePngUrl} onChange={e => setFacePngUrl(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">3D Model URL</label>
          <input className="apMediaInput" value={threeDUrl} onChange={e => setThreeDUrl(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Action 1 URL</label>
          <input className="apMediaInput" value={actionOneUrl} onChange={e => setActionOneUrl(e.target.value)} />
        </div>
        <div className="apAddProductField">
          <label className="apMediaLabel">Action 2 URL</label>
          <input className="apMediaInput" value={actionTwoUrl} onChange={e => setActionTwoUrl(e.target.value)} />
        </div>
        <div className="apAddProductField apAddProductFieldFull">
          <label className="apMediaLabel">Action 3 URL</label>
          <input className="apMediaInput" value={actionThreeUrl} onChange={e => setActionThreeUrl(e.target.value)} />
        </div>
        <div className="apAddProductField apAddProductFieldFull apAddProductLatestToggle">
          <label className="apLatestToggleLabel">
            <input type="checkbox" checked={isLatest} onChange={e => setIsLatest(e.target.checked)} />
            Mark as Latest Drop
          </label>
        </div>
      </div>
      {error && <p className="apAddAddonError">{error}</p>}
      <div className="apAddAddonFormActions">
        <button className="apPriceCancelBtn" onClick={onClose}>Cancel</button>
        <button className="apPriceSaveBtn" onClick={handleCreate} disabled={saving}
          style={{ background: "#22c55e", color: "#0d0d0d" }}>
          {saving ? "Creating…" : "Create Product"}
        </button>
      </div>
    </div>
  );
}

// ── ProductsSection — products table with media editing and add form ────
// Each row is expandable to reveal the MediaEditor and isLatest toggle.
// "Add New Product" button at top opens AddProductForm inline.
function ProductsSection({
  products, onToggle, togglingId, onToggleLatest, togglingLatestId, onDelete, deletingId, onProductCreated,
}: {
  products:         Product[];
  onToggle:         (id: string, current: boolean) => void;
  togglingId:       string | null;
  onToggleLatest:   (id: string, current: boolean) => void;
  togglingLatestId: string | null;
  onDelete:         (id: string, name: string) => void;
  deletingId:       string | null;
  onProductCreated: (p: Product) => void;
}) {
  const revealRef = useReveal();
  const [expandedRow, setExpandedRow]       = useState<string | null>(null);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [filterName, setFilterName]         = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus]     = useState("");

  // Filter products based on active filters
  const filteredProducts = products.filter(p => {
    const nameMatch     = filterName     === "" || p.name.toLowerCase().includes(filterName.toLowerCase());
    const categoryMatch = filterCategory === "" || p.category === filterCategory;
    const statusMatch   = filterStatus   === "" || (filterStatus === "active" ? p.isActive : !p.isActive);
    return nameMatch && categoryMatch && statusMatch;
  });

  // Get unique categories from products
  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="apCard apReveal" ref={revealRef}>
      <div className="apCardHeader">
        <div>
          <h2 className="apCardTitle">Products</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="apCardBadge">{products.length}</span>
          <button
            className="apPriceSaveBtn"
            onClick={() => setShowAddForm(prev => !prev)}
            style={{ background: showAddForm ? "rgba(255,255,255,0.08)" : "#22c55e", color: showAddForm ? "#aaa" : "#0d0d0d", fontSize: "0.78rem" }}
          >
            {showAddForm ? "✕ Cancel" : "+ Add New Product"}
          </button>
        </div>
      </div>

      {/* Add product inline form */}
      {showAddForm && (
        <AddProductForm
          onProductCreated={onProductCreated}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Filter Row */}
      <div className="apTableFilterRow">
        <input
          className="apTableFilterInput"
          type="text"
          placeholder="Filter by name…"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
        />
        <select
          className="apTableFilterSelect"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          className="apTableFilterSelect"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="apTable">
        <div className="apTableHead apGrid--productsV2">
          <span>Name</span><span>Category</span><span>Price</span>
          <span>Latest</span><span>Status</span><span>Actions</span>
        </div>
        {filteredProducts.length === 0 && (
          <div className="apEmpty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
            </svg>
            <p className="apEmptyTitle">No products found</p>
            <p className="apEmptyHint">{products.length === 0 ? 'Click "Add New Product" above to create one.' : "Try adjusting your filters."}</p>
          </div>
        )}
        {filteredProducts.map(p => (
          <div key={p.id}>
            <div className="apTableRow apGrid--productsV2">
              <span className="apCell apCellName">{p.name}</span>
              <span className="apCell apCellMuted" style={{ textTransform: "capitalize" }}>{p.category}</span>
              <span className="apCell apCellMono">₱{p.price.toLocaleString()}</span>
              <span className="apCell">
                <button
                  className={`apActionBtn ${p.isLatest ? "apActionBtnActivate" : "apActionBtnDeactivate"}`}
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => onToggleLatest(p.id, p.isLatest)}
                  disabled={togglingLatestId === p.id}
                  title="Toggle Latest Drop flag"
                >
                  {togglingLatestId === p.id ? "…" : p.isLatest ? "✦ Latest" : "Set Latest"}
                </button>
              </span>
              <span className="apCell">
                <span className={`apBadge ${p.isActive ? "apBadgeActive" : "apBadgeInactive"}`}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <span className="apCell" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <button
                  className={`apActionBtn ${p.isActive ? "apActionBtnDeactivate" : "apActionBtnActivate"}`}
                  onClick={() => onToggle(p.id, p.isActive)}
                  disabled={togglingId === p.id}
                >
                  {togglingId === p.id ? "…" : p.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  className={`apActionBtn ${expandedRow === p.id ? "apActionBtnDeactivate" : "apActionBtnActivate"}`}
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => setExpandedRow(prev => prev === p.id ? null : p.id)}
                >
                  {expandedRow === p.id ? "▲ Media" : "✎ Media"}
                </button>
                <button
                  className="apActionBtn apActionBtnDelete"
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => onDelete(p.id, p.name)}
                  disabled={deletingId === p.id}
                  title="Delete this product permanently"
                >
                  {deletingId === p.id ? "…" : "✕ Delete"}
                </button>
              </span>
            </div>
            {/* Expanded media editor row */}
            {expandedRow === p.id && (
              <div className="apMediaEditorWrap">
                <MediaEditor product={p} onFieldSaved={() => {}} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SystemFullEditor — expandable full-field editor for a System card ─
// Renders inside the accordion body when admin clicks "✎ Edit System".
// Saves each changed field via PATCH. Features is edited as a newline-
// separated textarea and split back to a string array on save.
function SystemFullEditor({ system, accent, onSaved }: {
  system: System;
  accent: string;
  onSaved: (fields: Partial<System>) => void;
}) {
  const [title, setTitle]           = useState(system.title);
  const [description, setDesc]      = useState(system.description);
  const [accentVal, setAccent]      = useState(system.accent);
  const [timeline, setTimeline]     = useState(system.timeline);
  const [deploy, setDeploy]         = useState(system.deploy);
  const [features, setFeatures]     = useState((system.features ?? []).join("\n"));
  const [bgVideoUrl, setBgVideo]    = useState(system.bgVideoUrl ?? "");
  const [demoVideoUrl, setDemoVideo]= useState(system.demoVideoUrl ?? "");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    const featuresList = features.split("\n").map(f => f.trim()).filter(Boolean);
    const ok = await updateSystemFields(system.id, {
      title:        title.trim(),
      description:  description.trim(),
      accent:       accentVal.trim(),
      timeline:     timeline.trim(),
      deploy:       deploy.trim(),
      features:     featuresList,
      bgVideoUrl:   bgVideoUrl.trim() || null,
      demoVideoUrl: demoVideoUrl.trim() || null,
    });
    if (ok) {
      onSaved({
        title:        title.trim(),
        description:  description.trim(),
        accent:       accentVal.trim(),
        timeline:     timeline.trim(),
        deploy:       deploy.trim(),
        features:     featuresList,
        bgVideoUrl:   bgVideoUrl.trim() || null,
        demoVideoUrl: demoVideoUrl.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError("Save failed. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="apSystemFullEditor" onClick={e => e.stopPropagation()}>
      <p className="apSystemEditorTitle">Edit System Fields</p>
      <div className="apSystemEditorGrid">

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Title</label>
          <input className="apMediaInput" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="apSystemEditorField">
          <label className="apMediaLabel">Accent Color (hex)</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              className="apMediaInput"
              value={accentVal}
              onChange={e => setAccent(e.target.value)}
              style={{ borderColor: accentVal }}
            />
            <span
              style={{
                width: "1.5rem", height: "1.5rem", borderRadius: "50%",
                background: accentVal, flexShrink: 0, border: "1px solid rgba(255,255,255,0.12)"
              }}
            />
          </div>
        </div>

        <div className="apSystemEditorField">
          <label className="apMediaLabel">Timeline (e.g. 4–6 weeks)</label>
          <input className="apMediaInput" value={timeline} onChange={e => setTimeline(e.target.value)} />
        </div>

        <div className="apSystemEditorField">
          <label className="apMediaLabel">Deploy (e.g. Cloud / On-premise)</label>
          <input className="apMediaInput" value={deploy} onChange={e => setDeploy(e.target.value)} />
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Description</label>
          <textarea
            className="apMediaInput apSystemEditorTextarea"
            rows={3}
            value={description}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Features (one per line)</label>
          <textarea
            className="apMediaInput apSystemEditorTextarea"
            rows={5}
            placeholder={"Feature A\nFeature B\nFeature C"}
            value={features}
            onChange={e => setFeatures(e.target.value)}
          />
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Background Video URL</label>
          <input
            className="apMediaInput"
            placeholder="Paste URL or leave empty to clear"
            value={bgVideoUrl}
            onChange={e => setBgVideo(e.target.value)}
          />
        </div>

        <div className="apSystemEditorField apSystemEditorFieldFull">
          <label className="apMediaLabel">Demo Video URL (#10)</label>
          <input
            className="apMediaInput"
            placeholder="Paste URL or leave empty — buyer sees 'Demo coming soon'"
            value={demoVideoUrl}
            onChange={e => setDemoVideo(e.target.value)}
          />
        </div>

      </div>
      {error && <p className="apAddAddonError">{error}</p>}
      <div className="apAddAddonFormActions">
        <button
          className="apPriceSaveBtn"
          onClick={handleSave}
          disabled={saving}
          style={{ background: accent, color: "#0d0d0d" }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
        </button>
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
  const [addons, setAddons]         = useState<Addon[]>(system.addons);
  const [localSystem, setLocal]     = useState<System>(system);
  const [editOpen, setEditOpen]     = useState(false);

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

  // Merges saved fields back into localSystem so header reflects changes immediately.
  function handleFieldsSaved(fields: Partial<System>) {
    setLocal(prev => ({ ...prev, ...fields }));
  }

  return (
    <div className="apSystemCard apReveal" ref={revealRef}>

      {/* ── Header row — click to expand/collapse ── */}
      <div
        className="apSystemHeader"
        onClick={onToggleExpand}
        style={{ borderLeft: `3px solid ${localSystem.accent}` }}
      >
        <div className="apSystemHeaderLeft">
          <span className="apSystemTag" style={{ color: localSystem.accent, borderColor: localSystem.accent }}>
            {localSystem.tag}
          </span>
          <span className="apSystemTitle">{localSystem.title}</span>
          <span className={`apBadge ${localSystem.isActive ? "apBadgeActive" : "apBadgeInactive"}`}>
            {localSystem.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="apSystemHeaderRight">
          <SystemBasePriceEditor
            systemId={localSystem.id}
            initialPrice={localSystem.basePrice}
            accent={localSystem.accent}
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
          <p className="apSystemDesc">{localSystem.description}</p>

          {/* ── Full editor toggle ── */}
          <div className="apSystemEditorToggleWrap">
            <button
              className={`apActionBtn ${editOpen ? "apActionBtnDeactivate" : "apActionBtnActivate"}`}
              style={{ fontSize: "0.72rem" }}
              onClick={e => { e.stopPropagation(); setEditOpen(prev => !prev); }}
            >
              {editOpen ? "▲ Close Editor" : "✎ Edit System"}
            </button>
          </div>

          {/* Full editor — title, description, features, accent, videos, timeline, deploy */}
          {editOpen && (
            <SystemFullEditor
              system={localSystem}
              accent={localSystem.accent}
              onSaved={handleFieldsSaved}
            />
          )}

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
                        accent={localSystem.accent}
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
              systemId={localSystem.id}
              accent={localSystem.accent}
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
  const [productList, setProductList]       = useState<Product[]>(products);
  const [togglingId, setTogglingId]         = useState<string | null>(null);
  const [togglingLatestId, setTogglingLatestId] = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const headerRef                           = useReveal();

  // Toggle isActive — single source of truth in parent
  async function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    const ok = await toggleProductActive(id, current);
    if (ok) {
      setProductList(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
    }
    setTogglingId(null);
  }

  // Toggle isLatest — clears siblings in same category when setting true
  async function handleToggleLatest(id: string, current: boolean) {
    setTogglingLatestId(id);
    const ok = await toggleProductLatest(id, current);
    if (ok) {
      setProductList(prev => {
        const target = prev.find(p => p.id === id);
        if (!target) return prev;
        return prev.map(p => {
          if (p.id === id) return { ...p, isLatest: !current };
          if (!current && p.category === target.category) return { ...p, isLatest: false };
          return p;
        });
      });
    }
    setTogglingLatestId(null);
  }

  // Delete product with cascade
  async function handleDeleteProduct(id: string, name: string) {
    if (!window.confirm(`Delete product "${name}"? This will also remove all associated orders and ownership records.`)) {
      return;
    }
    setDeletingId(id);
    const ok = await deleteProduct(id);
    if (ok) {
      setProductList(prev => prev.filter(p => p.id !== id));
    } else {
      alert("Failed to delete product. Try again.");
    }
    setDeletingId(null);
  }

  // Add new product to top of list
  function handleProductCreated(newProduct: Product) {
    setProductList(prev => [newProduct, ...prev]);
  }

  return (
    <div className="apPage">

      {/* ── Page header ──────────────────────────── */}
      <div className="apPageHeader apReveal" ref={headerRef}>
        <div>
          <span className="apPageEyebrow">Admin</span>
          <h1 className="apPageTitle">Products & Systems</h1>
          <p className="apPageSubtitle">
            {productList.length} product{productList.length !== 1 ? "s" : ""} &middot; {systems.length} system catalog{systems.length !== 1 ? "s" : ""}
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
        onToggleLatest={handleToggleLatest}
        togglingLatestId={togglingLatestId}
        onDelete={handleDeleteProduct}
        deletingId={deletingId}
        onProductCreated={handleProductCreated}
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