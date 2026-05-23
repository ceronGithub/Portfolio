// admin/inquiries/InquiriesClient.tsx — Inquiries admin UI.
// Two tabs: Custom Requests + Contact Messages.
// Each row shows date, type, description/message, estimated quote, status badge + status changer.

"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type CustomRequest = {
  id:             string;
  assetType:      string;
  description:    string;
  animCount:      number | null;
  polyBudget:     string | null;
  reference:      string | null;
  deliverySpeed:  string;
  estimatedQuote: number | null;
  status:         string;
  createdAt:      string;
  buyerName:      string;
  email:          string;
};

type ContactMessage = {
  id:          string;
  contactName: string;
  email:       string;
  subject:     string;
  message:     string;
  status:      string;
  createdAt:   string;
};

type Tab = "Custom Requests" | "Contact Messages";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── Status badge + dropdown ───────────────────────────────────────────────────

const CUSTOM_STATUSES  = ["pending", "read", "replied"] as const;
const CONTACT_STATUSES = ["new", "read", "replied"] as const;

function statusColor(s: string) {
  if (s === "pending" || s === "new") return { color: "#d69e2e", bg: "#d69e2e1a", border: "#d69e2e44" };
  if (s === "read")    return { color: "#7eb8d4", bg: "#7eb8d41a", border: "#7eb8d444" };
  if (s === "replied") return { color: "#38a169", bg: "#38a1691a", border: "#38a16944" };
  return { color: "#888", bg: "#8881a", border: "#88888844" };
}

function StatusBadge({ status, id, type, onUpdate }: {
  status:   string;
  id:       string;
  type:     "custom" | "contact";
  onUpdate: (id: string, newStatus: string) => void;
}) {
  const [changing, setChanging] = useState(false);
  const c = statusColor(status);
  const options = type === "custom" ? CUSTOM_STATUSES : CONTACT_STATUSES;

  async function handleChange(newStatus: string) {
    if (newStatus === status) return;
    setChanging(true);
    try {
      const res = await fetch(`/api/admin/inquiries?id=${id}&type=${type}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onUpdate(id, newStatus);
    } finally {
      setChanging(false);
    }
  }

  return (
    <select
      className="adminInquiriesStatusSelect"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}
      value={status}
      disabled={changing}
      onChange={e => handleChange(e.target.value)}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
      ))}
    </select>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InquiriesClient({
  customRequests: initialRequests,
  contactMessages: initialContacts,
}: {
  customRequests:  CustomRequest[];
  contactMessages: ContactMessage[];
}) {
  const [customRequests,  setCustomRequests]  = useState<CustomRequest[]>(initialRequests);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(initialContacts);
  const [activeTab,       setActiveTab]       = useState<Tab>("Custom Requests");

  // ── Status update handlers ──────────────────────────────────────────────
  function updateCustomStatus(id: string, newStatus: string) {
    setCustomRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  }

  function updateContactStatus(id: string, newStatus: string) {
    setContactMessages(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  }

  const pendingCount = customRequests.filter(r => r.status === "pending").length;
  const unreadCount  = contactMessages.filter(c => c.status === "new").length;

  return (
    <div className="adminInquiriesContent">

      {/* Tabs */}
      <div className="adminInquiriesTabs">
        {(["Custom Requests", "Contact Messages"] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`adminInquiriesTab ${activeTab === tab ? "adminInquiriesTabActive" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span className="adminInquiriesTabCount">
              {tab === "Custom Requests" ? customRequests.length : contactMessages.length}
            </span>
            {tab === "Custom Requests" && pendingCount > 0 && (
              <span className="adminInquiriesTabDot" />
            )}
            {tab === "Contact Messages" && unreadCount > 0 && (
              <span className="adminInquiriesTabDot" />
            )}
          </button>
        ))}
      </div>

      {/* ── Custom Requests table ──────────────────────────────────────────── */}
      {activeTab === "Custom Requests" && (
        customRequests.length === 0 ? (
          <div className="adminInquiriesEmpty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
            </svg>
            <p>No custom requests yet.</p>
          </div>
        ) : (
          <div className="adminInquiriesTable">
            <div className="adminInquiriesTableHeaderCustom">
              <span>Buyer</span>
              <span>Asset Type</span>
              <span>Description</span>
              <span>Quote</span>
              <span>Speed</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            {customRequests.map(r => (
              <div key={r.id} className="adminInquiriesTableRowCustom">
                <div className="adminInquiriesBuyerCell">
                  <span className="adminInquiriesBuyerName">{r.buyerName}</span>
                  <span className="adminInquiriesBuyerEmail">{r.email}</span>
                </div>
                <span className="adminInquiriesTag">{r.assetType}</span>
                <span className="adminInquiriesDescription">{r.description}</span>
                <span className="adminInquiriesQuote">
                  {r.estimatedQuote ? fmt(r.estimatedQuote) : "—"}
                </span>
                <span className="adminInquiriesSpeed">{r.deliverySpeed}</span>
                <span className="adminInquiriesDate">{formatDate(r.createdAt)}</span>
                <StatusBadge
                  status={r.status}
                  id={r.id}
                  type="custom"
                  onUpdate={updateCustomStatus}
                />
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Contact Messages table ─────────────────────────────────────────── */}
      {activeTab === "Contact Messages" && (
        contactMessages.length === 0 ? (
          <div className="adminInquiriesEmpty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <p>No contact messages yet.</p>
          </div>
        ) : (
          <div className="adminInquiriesTable">
            <div className="adminInquiriesTableHeaderContact">
              <span>From</span>
              <span>Subject</span>
              <span>Message</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            {contactMessages.map(c => (
              <div key={c.id} className="adminInquiriesTableRowContact">
                <div className="adminInquiriesBuyerCell">
                  <span className="adminInquiriesBuyerName">{c.contactName}</span>
                  <span className="adminInquiriesBuyerEmail">{c.email}</span>
                </div>
                <span className="adminInquiriesSubject">{c.subject || "—"}</span>
                <span className="adminInquiriesDescription">{c.message}</span>
                <span className="adminInquiriesDate">{formatDate(c.createdAt)}</span>
                <StatusBadge
                  status={c.status}
                  id={c.id}
                  type="contact"
                  onUpdate={updateContactStatus}
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}