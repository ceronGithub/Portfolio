// ProductsClient.tsx — Client component for Admin Products page.
// Displays Product table with toggle active/inactive buttons.
// Displays Systems catalog with add-on breakdown.
"use client";

import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

interface Addon {
  id: string;
  addonKey: string;
  label: string;
  price: number;
  category: string;
  description: string | null;
}

interface System {
  id: string;
  tag: string;
  title: string;
  basePrice: number;
  accent: string;
  timeline: string;
  deploy: string;
  description: string;
  isActive: boolean;
  addons: Addon[];
}

interface Props {
  products: Product[];
  systems: System[];
}

// Sends PATCH to toggle isActive on a product
async function toggleProductActive(productId: string, currentActive: boolean): Promise<boolean> {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: !currentActive }),
  });
  return response.ok;
}

export default function ProductsClient({ products, systems }: Props) {
  const [productList, setProductList] = useState<Product[]>(products);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  // Toggles a product's isActive status and updates local state
  async function handleToggleActive(productId: string, currentActive: boolean) {
    setTogglingId(productId);
    const success = await toggleProductActive(productId, currentActive);
    if (success) {
      setProductList(prev =>
        prev.map(p => p.id === productId ? { ...p, isActive: !currentActive } : p)
      );
    }
    setTogglingId(null);
  }

  function toggleSystemExpand(systemId: string) {
    setExpandedSystem(prev => prev === systemId ? null : systemId);
  }

  return (
    <div className="adminProductsContent">

      {/* ── Products table ─────────────────────────── */}
      <section className="adminProductsSection">
        <h2 className="adminProductsSectionTitle">Legacy Products</h2>
        <div className="adminProductsTableWrap">
          <div className="adminProductsTableHeader">
            <span>Name</span>
            <span>Description</span>
            <span>Price</span>
            <span>Status</span>
            <span>Created</span>
            <span>Toggle</span>
          </div>

          {productList.length === 0 && (
            <p className="adminEmptyNote">No products found.</p>
          )}

          {productList.map(product => (
            <div key={product.id} className="adminProductsTableRow">
              <span className="adminProductsCell adminProductsCellName">{product.name}</span>
              <span className="adminProductsCell adminProductsCellMuted">
                {product.description ?? <span className="adminCellEmpty">—</span>}
              </span>
              <span className="adminProductsCell adminProductsCellMono">
                &#8369;{(product.price / 100).toLocaleString()}
              </span>
              <span className="adminProductsCell">
                <span className={`adminActiveBadge ${product.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <span className="adminProductsCell adminProductsCellMuted">
                {new Date(product.createdAt).toLocaleDateString("en-PH", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
              <span className="adminProductsCell">
                <button
                  className={`adminToggleBtn ${product.isActive ? "adminToggleBtnDeactivate" : "adminToggleBtnActivate"}`}
                  onClick={() => handleToggleActive(product.id, product.isActive)}
                  disabled={togglingId === product.id}
                >
                  {togglingId === product.id
                    ? "..."
                    : product.isActive ? "Deactivate" : "Activate"}
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
          {systems.map(system => (
            <div key={system.id} className="adminSystemCard">

              {/* System header row */}
              <div
                className="adminSystemCardHeader"
                onClick={() => toggleSystemExpand(system.id)}
                style={{ borderLeft: `3px solid ${system.accent}` }}
              >
                <div className="adminSystemCardHeaderLeft">
                  <span
                    className="adminSystemTag"
                    style={{ color: system.accent, borderColor: system.accent }}
                  >
                    {system.tag}
                  </span>
                  <span className="adminSystemTitle">{system.title}</span>
                  <span className={`adminActiveBadge ${system.isActive ? "adminActiveBadgeOn" : "adminActiveBadgeOff"}`}>
                    {system.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="adminSystemCardHeaderRight">
                  <span className="adminSystemBasePrice">
                    &#8369;{system.basePrice.toLocaleString()} base
                  </span>
                  <span className="adminSystemAddonCount">
                    {system.addons.length} add-on{system.addons.length !== 1 ? "s" : ""}
                  </span>
                  <span className="adminSystemExpandIcon">
                    {expandedSystem === system.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded: add-ons list */}
              {expandedSystem === system.id && (
                <div className="adminSystemAddons">
                  <p className="adminSystemDesc">{system.description}</p>
                  <div className="adminAddonsGrid">
                    {system.addons.map(addon => (
                      <div key={addon.id} className="adminAddonRow">
                        <span className="adminAddonCategory">{addon.category}</span>
                        <span className="adminAddonLabel">{addon.label}</span>
                        <span className="adminAddonPrice">+&#8369;{addon.price.toLocaleString()}</span>
                      </div>
                    ))}
                    {system.addons.length === 0 && (
                      <p className="adminEmptyNote">No add-ons configured.</p>
                    )}
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
