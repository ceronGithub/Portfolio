// ProfileClient.tsx — Buyer profile page, client component.
// Sections: identity hero, stats strip, delivery tracker, order history.

"use client";

import { useState, useEffect } from "react";
import { signOut }             from "next-auth/react";
import Link                    from "next/link";
import DeliveryTracker         from "./DeliveryTracker";
import "./profile.css";

interface Order {
  id:           string;
  productName:  string;
  amount:       number;
  status:       "PENDING" | "PAID" | "IN_DEVELOPMENT" | "IN_TESTING" | "DELIVERED" | "FAILED";
  deliveryNote: string | null;
  estimatedAt:  string | null;
  deliveredAt:  string | null;
  createdAt:    string;
}

interface Props {
  user: {
    id:          string;
    name:        string;
    email:       string;
    role:        string;
    memberSince: string;
  };
  orders:     Order[];
  ownedCount: number;
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function getInitials(name: string, email: string): string {
  if (name.trim()) {
    return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  }
  return email[0].toUpperCase();
}

const STATUS_CONFIG = {
  PAID:           { label: "Paid",        color: "#22c55e" },
  PENDING:        { label: "Pending",     color: "#f59e0b" },
  IN_DEVELOPMENT: { label: "In Dev",      color: "#3b82f6" },
  IN_TESTING:     { label: "Testing",     color: "#a855f7" },
  DELIVERED:      { label: "Delivered",   color: "#22c55e" },
  FAILED:         { label: "Cancelled",   color: "#ef4444" },
};

export default function ProfileClient({ user, orders, ownedCount }: Props) {
  const [name,    setName]    = useState(user.name);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(user.name);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const initials   = getInitials(name, user.email);
  const totalSpent = orders.filter(o => o.status === "PAID" || o.status === "DELIVERED")
    .reduce((s, o) => s + o.amount, 0);
  const memberYear = new Date(user.memberSince).getFullYear();

  // Active = anything that is in progress (not just PAID or PENDING)
  const activeOrders = orders.filter(o =>
    o.status === "PAID" || o.status === "IN_DEVELOPMENT" || o.status === "IN_TESTING"
  );

  async function saveName() {
    if (!editVal.trim() || editVal === name) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update-name", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: editVal.trim() }),
      });
      if (res.ok) {
        setName(editVal.trim());
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(""), 2000);
      }
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  return (
    <div className={"profilePage" + (mounted ? " profilePageMounted" : "")}>

      {/* Back link */}
      <Link href="/buyer" className="profileBackLink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Dashboard
      </Link>

      {/* Hero identity card */}
      <div className="profileHero">
        <div className="profileAvatarGlow" />
        <div className="profileAvatar">
          <span className="profileAvatarInitials">{initials}</span>
        </div>

        <div className="profileNameRow">
          {editing ? (
            <div className="profileNameEdit">
              <input
                className="profileNameInput"
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                autoFocus
                maxLength={60}
              />
              <button className="profileNameSaveBtn" onClick={saveName} disabled={saving}>
                {saving ? "…" : "Save"}
              </button>
              <button className="profileNameCancelBtn" onClick={() => setEditing(false)}>✕</button>
            </div>
          ) : (
            <button className="profileNameBtn" onClick={() => { setEditVal(name); setEditing(true); }}>
              <h1 className="profileName">{name || user.email.split("@")[0]}</h1>
              <span className="profileNameEditIcon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </span>
            </button>
          )}
          {saveMsg && <span className="profileSaveMsg">{saveMsg}</span>}
        </div>

        <p className="profileEmail">{user.email}</p>
        <div className="profileRoleBadge">{user.role}</div>
      </div>

      {/* Stats strip */}
      <div className="profileStats">
        <div className="profileStat">
          <span className="profileStatNum">{orders.length}</span>
          <span className="profileStatLabel">Orders</span>
        </div>
        <div className="profileStatDivider" />
        <div className="profileStat">
          <span className="profileStatNum">{ownedCount}</span>
          <span className="profileStatLabel">Owned</span>
        </div>
        <div className="profileStatDivider" />
        <div className="profileStat">
          <span className="profileStatNum">{activeOrders.length}</span>
          <span className="profileStatLabel">In Progress</span>
        </div>
        <div className="profileStatDivider" />
        <div className="profileStat">
          <span className="profileStatNum">{fmt(totalSpent)}</span>
          <span className="profileStatLabel">Total Spent</span>
        </div>
        <div className="profileStatDivider" />
        <div className="profileStat">
          <span className="profileStatNum">{memberYear}</span>
          <span className="profileStatLabel">Member Since</span>
        </div>
      </div>

      {/* Delivery Tracker — only show if there are in-progress orders */}
      {activeOrders.length > 0 && (
        <DeliveryTracker
          orders={orders.map(o => ({
            id:           o.id,
            productName:  o.productName,
            status:       o.status,
            deliveryNote: o.deliveryNote,
            estimatedAt:  o.estimatedAt,
            deliveredAt:  o.deliveredAt,
            createdAt:    o.createdAt,
            amount:       o.amount,
          }))}
        />
      )}

      {/* Order history */}
      <div className="profileSection">
        <div className="profileSectionHeader">
          <p className="profileSectionLabel">Order History</p>
          <span className="profileSectionCount">{orders.length}</span>
        </div>

        {orders.length === 0 ? (
          <div className="profileEmpty">
            <span className="profileEmptyIcon">📦</span>
            <p className="profileEmptyText">No orders yet</p>
            <p className="profileEmptySub">Head back to the dashboard to browse available systems and assets.</p>
            <Link href="/buyer" className="profileEmptyLink">Browse now →</Link>
          </div>
        ) : (
          <div className="profileOrderList">
            <div className="profileOrderHeader">
              <span>Product</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {orders.map((order, i) => {
              const sc = STATUS_CONFIG[order.status] ?? { label: order.status, color: "#888" };
              return (
                <div
                  key={order.id}
                  className="profileOrderRow"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className="profileOrderProduct">{order.productName}</span>
                  <span className="profileOrderDate">{fmtDate(order.createdAt)}</span>
                  <span className="profileOrderAmount">{fmt(order.amount)}</span>
                  <span
                    className="profileOrderStatus"
                    style={{ color: sc.color, borderColor: sc.color + "33", background: sc.color + "10" }}
                  >
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Account actions */}
      <div className="profileActions">
        <button
          className="profileSignOutBtn"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>

    </div>
  );
}
