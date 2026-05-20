// ProductsClient.tsx — Admin Products page client component.
// Product table: toggle active/inactive.
// Systems catalog: accordion with inline basePrice editor.
"use client";

import { useState } from "react";

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

// ── API helpers ───────────────────────────────────────────────────────
async function toggleProductActive(id: string, current: boolean): Promise<boolean> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: !current }),
  });
  return res.ok;
}

async function updateSystemPrice(id: string, basePrice: number): Promise<boolean> {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basePrice }),
  });
  return res.ok;
}

// ── System price editor ───────────────────────────────────────────────
function SystemPriceEditor({
  systemId, initialPrice, accent,
}: {
  systemId: string; initialPrice: number; accent: string;
}) {
  const [price, setPrice]       = useState(initialPrice);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(String(initialPrice));
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  async function handleSave() {
    const parsed = parseInt(draft.replace(/,/g, ""), 10);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    const ok = await updateSystemPrice(systemId, parsed);
    if (ok) {
      setPrice(parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(String(price));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="sysPriceEditor" onClick={e => e.stopPropagation()}>
        <span className="sysPriceCurrency">₱</span>
        <input
          className="sysPriceInput"
          type="number"
          min="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
          autoFocus
          style={{ borderColor: accent }}
        />
        <button className="sysPriceSave" onClick={handleSave} disabled={saving}
          style={{ background: accent, color: "#fff" }}>
          {saving ? "…" : "Save"}
        </button>
        <button className="sysPriceCancel" onClick={handleCancel}>✕</button>
      </div>
    );
  }

  return (
    <button
      className="sysPriceDisplay"
      onClick={e => { e.stopPropagation(); setEditing(true); setDraft(String(price)); }}
      title="Click to edit price"
    >
      <span className="adminSystemBasePrice">
        ₱{price.toLocaleString()} base
      </span>
      {saved
        ? <span className="sysPriceSavedTag">✓ saved</span>
        : <span className="sysPriceEditIcon">✎</span>
      }
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ProductsClient({ products, systems }: Props) {
  const [productList, setProductList] = useState<Product[]>(products);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  async function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    const ok = await toggleProductActive(id, current);
    if (ok) setProductList(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p));
    setTogglingId(null);
  }

  return (
    <div className="adminProductsContent">

      {/* ── Products table ─────────────────────────── */}
      <section className="adminProductsSection">
        <h2 className="adminProductsSectionTitle">Legacy Products</h2>
        <div className="adminProductsTableWrap">
          <div className="adminProductsTableHeader">
            <span>Name</span><span>Description</span><span>Price</span>
            <span>Status</span><span>Created</span><span>Toggle</span>
          </div>
          {productList.length === 0 && <p className="adminEmptyNote">No products found.</p>}
          {productList.map(p => (
            <div key={p.id} className="adminProductsTableRow">
              <span className="adminProductsCell adminProductsCellName">{p.name}</span>
              <span className="adminProductsCell adminProductsCellMuted">
                {p.description ?? <span className="adminCellEmpty">—</span>}
              </span>
              <span className="adminProductsCell adminProductsCellMono">
                ₱{(p.price / 100).toLocaleString()}
              </span>
              <span className="adminProductsCell">
                <span className={`adminActiveBadge ${p.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <span className="adminProductsCell adminProductsCellMuted">
                {new Date(p.createdAt).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })}
              </span>
              <span className="adminProductsCell">
                <button
                  className={`adminToggleBtn ${p.isActive ? "adminToggleBtnDeactivate" : "adminToggleBtnActivate"}`}
                  onClick={() => handleToggleActive(p.id, p.isActive)}
                  disabled={togglingId === p.id}
                >
                  {togglingId === p.id ? "..." : p.isActive ? "Deactivate" : "Activate"}
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Systems catalog ────────────────────────── */}
      <section className="adminProductsSection">
        <h2 className="adminProductsSectionTitle">Systems Catalog</h2>
        <div className="adminSystemsList">
          {systems.map(sys => (
            <div key={sys.id} className="adminSystemCard">

              {/* Header row */}
              <div
                className="adminSystemCardHeader"
                onClick={() => setExpandedSystem(prev => prev === sys.id ? null : sys.id)}
                style={{ borderLeft: `3px solid ${sys.accent}` }}
              >
                <div className="adminSystemCardHeaderLeft">
                  <span className="adminSystemTag" style={{ color: sys.accent, borderColor: sys.accent }}>
                    {sys.tag}
                  </span>
                  <span className="adminSystemTitle">{sys.title}</span>
                  <span className={`adminActiveBadge ${sys.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
                    {sys.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="adminSystemCardHeaderRight">
                  {/* Inline price editor — stops click propagation to avoid toggling accordion */}
                  <SystemPriceEditor
                    systemId={sys.id}
                    initialPrice={sys.basePrice}
                    accent={sys.accent}
                  />
                  <span className="adminSystemAddonCount">
                    {sys.addons.length} add-on{sys.addons.length !== 1 ? "s" : ""}
                  </span>
                  <span className="adminSystemExpandIcon">
                    {expandedSystem === sys.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded add-ons */}
              {expandedSystem === sys.id && (
                <div className="adminSystemAddons">
                  <p className="adminSystemDesc">{sys.description}</p>
                  <div className="adminAddonsGrid">
                    {sys.addons.map(addon => (
                      <div key={addon.id} className="adminAddonRow">
                        <span className="adminAddonCategory">{addon.category}</span>
                        <span className="adminAddonLabel">{addon.label}</span>
                        <span className="adminAddonPrice">+₱{addon.price.toLocaleString()}</span>
                      </div>
                    ))}
                    {sys.addons.length === 0 && <p className="adminEmptyNote">No add-ons configured.</p>}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </section>

    </div>
  );
}