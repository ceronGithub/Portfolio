// AdminAppointmentsClient.tsx — Admin appointments management.
// Lists all consultation requests. Admin can update status and add internal notes.
// Filter tabs: All / Pending / Scheduled / Completed / Cancelled.

"use client";

import { useState, useCallback } from "react";
import "./admin-appointments.css";

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface AddonSnapshot { id: string; label: string; price: number; }

interface AppointmentRow {
  id:             string;
  referenceNo:    string;
  buyerName:      string;
  buyerEmail:     string;
  systemTitle:    string;
  basePrice:      number;
  quotedPrice:    number;
  selectedAddons: AddonSnapshot[];
  scheduledDate:  string;
  message:        string | null;
  status:         AppointmentStatus;
  adminNote:      string | null;
  createdAt:      string;
  user:           { name: string | null; email: string };
}

interface Props {
  appointments: AppointmentRow[];
}

const fmt = (p: number) =>
  "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "#f6ad55" },
  SCHEDULED: { label: "Scheduled", color: "#63b3ed" },
  COMPLETED: { label: "Completed", color: "#68d391" },
  CANCELLED: { label: "Cancelled", color: "#fc8181" },
};

const ALL_STATUSES: AppointmentStatus[] = ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"];

// ── Status cycle — click to advance ──────────────────────────────────────
const STATUS_CYCLE: Record<AppointmentStatus, AppointmentStatus> = {
  PENDING:   "SCHEDULED",
  SCHEDULED: "COMPLETED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export default function AdminAppointmentsClient({ appointments: initial }: Props) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>(initial);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [editingNote,  setEditingNote]  = useState<Record<string, string>>({});
  const [savingNote,   setSavingNote]   = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  // Filter by status tab
  const filtered = filterStatus === "ALL"
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  // Counts per tab
  const countFor = (s: AppointmentStatus | "ALL") =>
    s === "ALL" ? appointments.length : appointments.filter(a => a.status === s).length;

  // ── Update status ─────────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async (id: string, newStatus: AppointmentStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }));
    }
  }, []);

  // ── Save admin note ───────────────────────────────────────────────────
  const handleSaveNote = useCallback(async (id: string) => {
    const note = editingNote[id] ?? "";
    setSavingNote(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) return;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, adminNote: note } : a));
      setEditingNote(prev => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setSavingNote(prev => ({ ...prev, [id]: false }));
    }
  }, [editingNote]);

  return (
    <div className="adminApPage">
      <div className="adminApHeader">
        <p className="adminApEyebrow">Consultation Management</p>
        <h1 className="adminApTitle">Appointments</h1>
      </div>

      {/* Filter tabs */}
      <div className="adminApTabs">
        {(["ALL", ...ALL_STATUSES] as (AppointmentStatus | "ALL")[]).map(s => (
          <button
            key={s}
            className={"adminApTab" + (filterStatus === s ? " adminApTabActive" : "")}
            onClick={() => setFilterStatus(s)}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s].label}
            <span className="adminApTabCount">{countFor(s)}</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="adminApEmpty">No appointments in this category.</div>
      )}

      {/* Appointment rows */}
      <div className="adminApList">
        {filtered.map(a => {
          const statusConfig   = STATUS_CONFIG[a.status];
          const nextStatus     = STATUS_CYCLE[a.status];
          const canAdvance     = nextStatus !== a.status;
          const isUpdating     = !!updatingStatus[a.id];
          const isDirty        = editingNote[a.id] !== undefined && editingNote[a.id] !== (a.adminNote ?? "");

          return (
            <div key={a.id} className="adminApCard">
              {/* Card header */}
              <div className="adminApCardHeader">
                <div className="adminApCardHeaderLeft">
                  <p className="adminApCardRef">{a.referenceNo}</p>
                  <p className="adminApCardSystem">{a.systemTitle}</p>
                </div>
                <div className="adminApCardHeaderRight">
                  {/* Status badge — click to cycle */}
                  <button
                    className="adminApStatusBadge"
                    style={{ color: statusConfig.color, borderColor: statusConfig.color + "44", background: statusConfig.color + "12" }}
                    onClick={() => canAdvance && !isUpdating && handleStatusUpdate(a.id, nextStatus)}
                    title={canAdvance ? `Advance to ${STATUS_CONFIG[nextStatus].label}` : "Final status"}
                    disabled={!canAdvance || isUpdating}
                  >
                    {isUpdating ? "…" : statusConfig.label}
                  </button>
                  {/* Cancel button */}
                  {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                    <button
                      className="adminApCancelBtn"
                      onClick={() => !isUpdating && handleStatusUpdate(a.id, "CANCELLED")}
                      disabled={isUpdating}
                      title="Cancel appointment"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="adminApCardDivider" />

              {/* Buyer + schedule info */}
              <div className="adminApCardInfo">
                <div className="adminApCardInfoItem">
                  <span className="adminApCardInfoLabel">Buyer</span>
                  <span className="adminApCardInfoValue">{a.buyerName}</span>
                </div>
                <div className="adminApCardInfoItem">
                  <span className="adminApCardInfoLabel">Email</span>
                  <a className="adminApCardInfoLink" href={`mailto:${a.buyerEmail}`}>{a.buyerEmail}</a>
                </div>
                <div className="adminApCardInfoItem">
                  <span className="adminApCardInfoLabel">Preferred Date</span>
                  <span className="adminApCardInfoValue">{formatDate(a.scheduledDate)}</span>
                </div>
                <div className="adminApCardInfoItem">
                  <span className="adminApCardInfoLabel">Quoted Price</span>
                  <span className="adminApCardInfoValue adminApCardPrice">{fmt(a.quotedPrice)}</span>
                </div>
              </div>

              {/* Add-ons */}
              {a.selectedAddons.length > 0 && (
                <div className="adminApCardAddons">
                  <p className="adminApCardAddonsLabel">Add-ons selected</p>
                  <div className="adminApCardAddonsList">
                    {a.selectedAddons.map(ad => (
                      <div key={ad.id} className="adminApCardAddonRow">
                        <span>{ad.label}</span>
                        <span>+{fmt(ad.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buyer message */}
              {a.message && (
                <div className="adminApCardMessage">
                  <p className="adminApCardMessageLabel">Buyer note</p>
                  <p className="adminApCardMessageText">{a.message}</p>
                </div>
              )}

              {/* Admin note */}
              <div className="adminApCardNoteSection">
                <p className="adminApCardNoteLabel">Admin note</p>
                <textarea
                  className="adminApCardNoteInput"
                  rows={2}
                  placeholder="Internal note visible only to admin…"
                  value={editingNote[a.id] ?? (a.adminNote ?? "")}
                  onChange={e => setEditingNote(prev => ({ ...prev, [a.id]: e.target.value }))}
                />
                {isDirty && (
                  <button
                    className="adminApCardNoteSave"
                    onClick={() => handleSaveNote(a.id)}
                    disabled={!!savingNote[a.id]}
                  >
                    {savingNote[a.id] ? "Saving…" : "Save Note"}
                  </button>
                )}
              </div>

              {/* Footer */}
              <p className="adminApCardDate">
                Submitted {new Date(a.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
