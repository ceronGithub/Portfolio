// ProfileClient.tsx — Buyer profile page.
// Task 2: Added system/owned history section.
// Task 3: Removed back link + sign out button (navbar handles nav/signout).
// Task 4: Scrollable order history + system history (max-height + overflow-y).

"use client";

import { useState, useEffect } from "react";
import DeliveryTracker         from "./DeliveryTracker";
import { sanitize }            from "@/lib/utils";
import "./profile.css";

interface Order {
  id:           string;
  productName:  string;
  amount:       number;
  status:       string;
  deliveryNote: string | null;
  estimatedAt:  string | null;
  deliveredAt:  string | null;
  createdAt:    string;
  isGranted:    boolean;
}

interface OwnedItem {
  productId:   string;
  productName: string;
  grantedAt:   string;
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
  ownedItems: OwnedItem[];
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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PAID:           { label: "Paid",         color: "#22c55e" },
  PENDING:        { label: "Pending",      color: "#f6ad55" },
  IN_DEVELOPMENT: { label: "In Dev",       color: "#63b3ed" },
  IN_TESTING:     { label: "In Testing",   color: "#b794f4" },
  DELIVERED:      { label: "Delivered",    color: "#c9a96e" },
  FAILED:         { label: "Failed",       color: "#fc8181" },
  GRANTED:        { label: "Admin Grant",  color: "#68d391" },
};

export default function ProfileClient({ user, orders, ownedCount, ownedItems }: Props) {
  const [name,         setName]         = useState(user.name);
  const [editing,      setEditing]      = useState(false);
  const [editVal,      setEditVal]      = useState(user.name);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");
  const [mounted,      setMounted]      = useState(false);

  // Email editing state
  const [email,        setEmail]        = useState(user.email);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailVal,     setEmailVal]     = useState(user.email);
  const [savingEmail,  setSavingEmail]  = useState(false);
  const [emailMsg,     setEmailMsg]     = useState("");
  const [emailError,   setEmailError]   = useState("");

  // Password section state
  const [showPassword,   setShowPassword]   = useState(false);
  // Hero password row — show/hide the masked dots
  const [showHeroPw,     setShowHeroPw]     = useState(false);
  const [editingPw,      setEditingPw]      = useState(false);
  const [currentPw,      setCurrentPw]      = useState("");
  const [newPw,          setNewPw]          = useState("");
  const [confirmPw,      setConfirmPw]      = useState("");
  const [showCurrentPw,  setShowCurrentPw]  = useState(false);
  const [showNewPw,      setShowNewPw]      = useState(false);
  const [showConfirmPw,  setShowConfirmPw]  = useState(false);
  const [savingPw,       setSavingPw]       = useState(false);
  const [pwMsg,          setPwMsg]          = useState("");
  const [pwError,        setPwError]        = useState("");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const initials   = getInitials(name, user.email);
  const totalSpent = orders
    .filter(o => o.status === "PAID" || o.status === "DELIVERED")
    .reduce((s, o) => s + o.amount, 0);
  const memberYear = new Date(user.memberSince).getFullYear();

  // activeOrders — include PENDING so tracker is visible from order placement, not just after payment
  const activeOrders = orders.filter(o =>
    o.status === "PENDING" || o.status === "PAID" || o.status === "IN_DEVELOPMENT" || o.status === "IN_TESTING" || o.status === "DELIVERED"
  );

  async function saveName() {
    if (!editVal.trim() || editVal === name) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update-name", {
        method:  "PATCH",
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

  /**
   * Save updated email — validates format client-side, then calls PATCH /api/profile/update-email
   */
  async function saveEmail() {
    const trimmed = emailVal.trim().toLowerCase();
    if (!trimmed || trimmed === email) { setEditingEmail(false); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Invalid email format");
      return;
    }

    setSavingEmail(true);
    setEmailError("");
    try {
      const res  = await fetch("/api/profile/update-email", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail(trimmed);
        setEmailMsg("Email updated");
        setEditingEmail(false);
        setTimeout(() => setEmailMsg(""), 2500);
      } else {
        setEmailError(data.error ?? "Failed to update email");
      }
    } finally {
      setSavingEmail(false);
    }
  }

  /**
   * Save new password — validates match + length, then calls PATCH /api/profile/update-password
   */
  async function savePassword() {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("All fields are required");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }

    setSavingPw(true);
    try {
      const res  = await fetch("/api/profile/update-password", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg("Password updated");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setEditingPw(false);
        setTimeout(() => setPwMsg(""), 3000);
      } else {
        setPwError(data.error ?? "Failed to update password");
      }
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className={"profilePage" + (mounted ? " profilePageMounted" : "")}>

      {/* ── Hero identity card ── */}
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
                onChange={e => setEditVal(sanitize(e.target.value))}
                onKeyDown={e => {
                  if (e.key === "Enter")  saveName();
                  if (e.key === "Escape") setEditing(false);
                }}
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

        {/* Editable email row */}
        <div className="profileEmailRow">
          {editingEmail ? (
            <div className="profileEmailEdit">
              <input
                className="profileEmailInput"
                type="email"
                value={emailVal}
                onChange={e => { setEmailVal(e.target.value); setEmailError(""); }}
                onKeyDown={e => {
                  if (e.key === "Enter")  saveEmail();
                  if (e.key === "Escape") { setEditingEmail(false); setEmailError(""); }
                }}
                autoFocus
                maxLength={120}
              />
              <button className="profileNameSaveBtn" onClick={saveEmail} disabled={savingEmail}>
                {savingEmail ? "…" : "Save"}
              </button>
              <button className="profileNameCancelBtn" onClick={() => { setEditingEmail(false); setEmailError(""); }}>✕</button>
            </div>
          ) : (
            <button className="profileEmailBtn" onClick={() => { setEmailVal(email); setEditingEmail(true); }}>
              <p className="profileEmail">{email}</p>
              <span className="profileEmailEditIcon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </span>
            </button>
          )}
          {emailError && <span className="profileEmailError">{emailError}</span>}
          {emailMsg   && <span className="profileSaveMsg">{emailMsg}</span>}
        </div>

        {/* Masked password row */}
        <div className="profilePasswordRow">
          {editingPw ? (
            <div className="profilePasswordHeroEdit">
              {/* Current */}
              <div className="profilePwHeroFields">
                <div className="profilePwInputWrap">
                  <input
                    className="profilePwHeroInput"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    placeholder="Current password"
                    autoComplete="current-password"
                  />
                  <button className="profilePwToggle" onClick={() => setShowCurrentPw(p => !p)} type="button">
                    {showCurrentPw
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <div className="profilePwInputWrap">
                  <input
                    className="profilePwHeroInput"
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="New password (min 8)"
                    autoComplete="new-password"
                  />
                  <button className="profilePwToggle" onClick={() => setShowNewPw(p => !p)} type="button">
                    {showNewPw
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <div className="profilePwInputWrap">
                  <input
                    className="profilePwHeroInput"
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button className="profilePwToggle" onClick={() => setShowConfirmPw(p => !p)} type="button">
                    {showConfirmPw
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              {pwError   && <span className="profileEmailError">{pwError}</span>}
              {pwMsg     && <span className="profileSaveMsg">{pwMsg}</span>}
              <div className="profilePwHeroActions">
                <button className="profileNameSaveBtn" onClick={() => { savePassword(); setEditingPw(false); }} disabled={savingPw}>
                  {savingPw ? "…" : "Save"}
                </button>
                <button className="profileNameCancelBtn" onClick={() => { setEditingPw(false); setPwError(""); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}>✕</button>
              </div>
            </div>
          ) : (
            <div className="profilePasswordDisplay">
              <span className="profilePasswordDots">••••••••</span>
              <button className="profileEmailBtn profilePwEditBtn" onClick={() => { setEditingPw(true); setPwError(""); setPwMsg(""); }} title="Update password">
                <span className="profileEmailEditIcon">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </span>
              </button>
            </div>
          )}
          {pwMsg && !editingPw && <span className="profileSaveMsg">{pwMsg}</span>}
        </div>

        <div className="profileRoleBadge">{user.role}</div>
      </div>

      {/* ── Stats strip ── */}
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

      {/* ── Delivery Tracker ── */}
      {activeOrders.length > 0 && (
        <DeliveryTracker
          orders={orders.filter(o => !o.isGranted).map(o => ({
            id:           o.id,
            productName:  o.productName,
            status:       o.status as "PENDING"|"PAID"|"IN_DEVELOPMENT"|"IN_TESTING"|"DELIVERED"|"FAILED",
            deliveryNote: o.deliveryNote,
            estimatedAt:  o.estimatedAt,
            deliveredAt:  o.deliveredAt,
            createdAt:    o.createdAt,
            amount:       o.amount,
          }))}
        />
      )}

      {/* ── Order History ── */}
      <div className="profileSection">
        <div className="profileSectionHeader">
          <p className="profileSectionLabel">Order History</p>
          <span className="profileSectionCount">{orders.length}</span>
        </div>

        {orders.length === 0 ? (
          <div className="profileEmpty">
            <span className="profileEmptyIcon">📦</span>
            <p className="profileEmptyText">No orders yet</p>
            <p className="profileEmptySub">Browse systems and assets from the dashboard.</p>
          </div>
        ) : (
          <div className="profileOrderList profileOrderListScroll">
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
                  <span className="profileOrderAmount">
                    {order.isGranted ? <em style={{ opacity: 0.35, fontStyle: "normal" }}>—</em> : fmt(order.amount)}
                  </span>
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

    </div>
  );
}