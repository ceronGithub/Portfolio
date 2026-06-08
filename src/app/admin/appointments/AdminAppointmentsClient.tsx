// AdminAppointmentsClient.tsx — Admin appointments management.
// Lists all consultation requests. Admin can update status, save notes,
// post threaded comments, reply to buyer notes, and delete appointments.
// Filter tabs: All / Pending / Scheduled / Completed / Cancelled.

"use client";

import { useState, useCallback } from "react";
import "./admin-appointments.css";
import { sanitize }  from "@/lib/utils";
import { useToast }  from "@/app/buyer/shared/useToast";
import ToastStack    from "@/app/buyer/shared/ToastStack";

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface AddonSnapshot { id: string; label: string; price: number; }

interface ApptComment {
  id:        string;
  role:      "ADMIN" | "BUYER";
  content:   string;
  parentId:  string | null;
  createdAt: string;
  replies:   Omit<ApptComment, "replies">[];
}

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
  comments:       ApptComment[];
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

function formatCommentTime(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "#f6ad55" },
  SCHEDULED: { label: "Scheduled", color: "#63b3ed" },
  COMPLETED: { label: "Completed", color: "#68d391" },
  CANCELLED: { label: "Cancelled", color: "#fc8181" },
};

const ALL_STATUSES: AppointmentStatus[] = ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"];

// ── Status cycle — click to advance ──────────────────────────────────────────
const STATUS_CYCLE: Record<AppointmentStatus, AppointmentStatus> = {
  PENDING:   "SCHEDULED",
  SCHEDULED: "COMPLETED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export default function AdminAppointmentsClient({ appointments: initial }: Props) {
  const { toasts, showToast, dismissToast } = useToast();
  const [appointments,   setAppointments]   = useState<AppointmentRow[]>(initial);
  const [filterStatus,   setFilterStatus]   = useState<AppointmentStatus | "ALL">("ALL");
  const [editingNote,    setEditingNote]     = useState<Record<string, string>>({});
  const [savingNote,     setSavingNote]      = useState<Record<string, boolean>>({});
  const [updatingStatus, setUpdatingStatus]  = useState<Record<string, boolean>>({});
  const [deletingId,     setDeletingId]      = useState<string | null>(null);
  const [confirmDelete,  setConfirmDelete]   = useState<string | null>(null);
  // Per-card new comment text + sending state
  const [commentText,    setCommentText]     = useState<Record<string, string>>({});
  const [postingComment, setPostingComment]  = useState<Record<string, boolean>>({});

  // Filter by status tab
  const filtered = filterStatus === "ALL"
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  // Counts per tab
  const countFor = (s: AppointmentStatus | "ALL") =>
    s === "ALL" ? appointments.length : appointments.filter(a => a.status === s).length;

  // Helper — merge comment changes into one appointment
  function updateComments(id: string, updater: (prev: ApptComment[]) => ApptComment[]) {
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, comments: updater(a.comments) } : a
    ));
  }

  // ── Update status ─────────────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async (id: string, newStatus: AppointmentStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { showToast("✕ Failed to update status.", "error"); return; }
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      showToast(`✓ Status updated to ${STATUS_CONFIG[newStatus].label}.`, "success");
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [id]: false }));
    }
  }, []);

  // ── Save admin note ───────────────────────────────────────────────────────
  const handleSaveNote = useCallback(async (id: string) => {
    const note = editingNote[id] ?? "";
    setSavingNote(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminNote: note }),
      });
      if (!res.ok) { showToast("✕ Note failed to save.", "error"); return; }
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, adminNote: note } : a));
      setEditingNote(prev => { const n = { ...prev }; delete n[id]; return n; });
      showToast("✓ Admin note saved.", "success");
    } finally {
      setSavingNote(prev => ({ ...prev, [id]: false }));
    }
  }, [editingNote]);

  // ── Post admin comment ────────────────────────────────────────────────────
  // parentId null = new root admin comment; parentId = reply to buyer note
  const handlePostComment = useCallback(async (id: string, parentId: string | null = null) => {
    const key     = parentId ? `${id}_reply_${parentId}` : id;
    const content = (commentText[key] ?? "").trim();
    if (!content) return;
    setPostingComment(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content, parentId }),
      });
      if (!res.ok) { showToast("✕ Comment failed to post.", "error"); return; }
      const data = await res.json();
      updateComments(id, prev => {
        if (!parentId) {
          // New root admin comment
          return [...prev, { ...data.comment, replies: [] }];
        } else {
          // Append as reply to the buyer note with parentId
          return prev.map(c =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies ?? []), data.comment] }
              : c
          );
        }
      });
      setCommentText(prev => { const n = { ...prev }; delete n[key]; return n; });
      showToast("✓ Comment posted.", "success");
    } finally {
      setPostingComment(prev => ({ ...prev, [key]: false }));
    }
  }, [commentText]);

  // ── Delete appointment ────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("✕ Delete failed.", "error"); return; }
      setAppointments(prev => prev.filter(a => a.id !== id));
      setConfirmDelete(null);
      showToast("✓ Appointment deleted.", "success");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="adminApPage">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

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
          const statusConfig = STATUS_CONFIG[a.status];
          const nextStatus   = STATUS_CYCLE[a.status];
          const canAdvance   = nextStatus !== a.status;
          const isUpdating   = !!updatingStatus[a.id];
          const isDirty      = editingNote[a.id] !== undefined && editingNote[a.id] !== (a.adminNote ?? "");
          const isDeleting   = deletingId === a.id;
          const confirmingDel = confirmDelete === a.id;

          // Separate admin root comments from buyer root notes
          const adminRootComments = (a.comments ?? []).filter(c => c.role === "ADMIN" && !c.parentId);
          const buyerRootNotes    = (a.comments ?? []).filter(c => c.role === "BUYER" && !c.parentId);

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
                  {/* Delete button */}
                  {!confirmingDel ? (
                    <button
                      className="adminApDeleteBtn"
                      onClick={() => setConfirmDelete(a.id)}
                      title="Delete appointment"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  ) : (
                    <div className="adminApDeleteConfirm">
                      <span className="adminApDeleteConfirmText">Delete?</span>
                      <button
                        className="adminApDeleteConfirmYes"
                        onClick={() => handleDelete(a.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "…" : "Yes"}
                      </button>
                      <button className="adminApDeleteConfirmNo" onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
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

              {/* Admin note (legacy single field) */}
              <div className="adminApCardNoteSection">
                <p className="adminApCardNoteLabel">Admin note (internal)</p>
                <textarea
                  className="adminApCardNoteInput"
                  rows={2}
                  placeholder="Internal note visible only to admin…"
                  value={editingNote[a.id] ?? (a.adminNote ?? "")}
                  onChange={e => setEditingNote(prev => ({ ...prev, [a.id]: sanitize(e.target.value) }))}
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

              {/* ── Comment thread — admin posts visible to buyer ──────────── */}
              <div className="adminApCommentSection">
                <p className="adminApCommentSectionLabel">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Comments (visible to buyer)
                </p>

                {/* Existing admin root comments + buyer replies */}
                {adminRootComments.map(c => (
                  <div key={c.id} className="adminApCommentBlock">
                    <div className="adminApCommentItem adminApCommentItemAdmin">
                      <div className="adminApCommentMeta">
                        <span className="adminApCommentBadge adminApCommentBadgeAdmin">Admin</span>
                        <span className="adminApCommentTime">{formatCommentTime(c.createdAt)}</span>
                      </div>
                      <p className="adminApCommentText">{c.content}</p>
                    </div>
                    {(c.replies ?? []).map(r => (
                      <div key={r.id} className="adminApCommentItem adminApCommentItemBuyer">
                        <div className="adminApCommentMeta">
                          <span className="adminApCommentBadge adminApCommentBadgeBuyer">Buyer</span>
                          <span className="adminApCommentTime">{formatCommentTime(r.createdAt)}</span>
                        </div>
                        <p className="adminApCommentText">{r.content}</p>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Buyer standalone notes + admin can reply */}
                {buyerRootNotes.length > 0 && (
                  <div className="adminApBuyerNoteList">
                    <p className="adminApBuyerNotesHeader">Buyer Notes</p>
                    {buyerRootNotes.map(note => {
                      const replyKey = `${a.id}_reply_${note.id}`;
                      return (
                        <div key={note.id} className="adminApCommentBlock">
                          <div className="adminApCommentItem adminApCommentItemBuyer">
                            <div className="adminApCommentMeta">
                              <span className="adminApCommentBadge adminApCommentBadgeBuyer">Buyer</span>
                              <span className="adminApCommentTime">{formatCommentTime(note.createdAt)}</span>
                            </div>
                            <p className="adminApCommentText">{note.content}</p>
                          </div>
                          {(note.replies ?? []).map(r => (
                            <div key={r.id} className="adminApCommentItem adminApCommentItemAdmin">
                              <div className="adminApCommentMeta">
                                <span className="adminApCommentBadge adminApCommentBadgeAdmin">Admin</span>
                                <span className="adminApCommentTime">{formatCommentTime(r.createdAt)}</span>
                              </div>
                              <p className="adminApCommentText">{r.content}</p>
                            </div>
                          ))}
                          {/* Admin reply form for this buyer note */}
                          <div className="adminApReplyForm">
                            <textarea
                              className="adminApCardNoteInput"
                              rows={2}
                              placeholder="Reply to buyer note…"
                              value={commentText[replyKey] ?? ""}
                              onChange={e => setCommentText(prev => ({ ...prev, [replyKey]: sanitize(e.target.value) }))}
                            />
                            {(commentText[replyKey] ?? "").trim() && (
                              <button
                                className="adminApCardNoteSave"
                                onClick={() => handlePostComment(a.id, note.id)}
                                disabled={!!postingComment[replyKey]}
                              >
                                {postingComment[replyKey] ? "Posting…" : "Reply"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* New admin comment form */}
                <div className="adminApNewComment">
                  <textarea
                    className="adminApCardNoteInput"
                    rows={2}
                    placeholder="Post a comment to the buyer…"
                    value={commentText[a.id] ?? ""}
                    onChange={e => setCommentText(prev => ({ ...prev, [a.id]: sanitize(e.target.value) }))}
                  />
                  {(commentText[a.id] ?? "").trim() && (
                    <button
                      className="adminApCardNoteSave"
                      onClick={() => handlePostComment(a.id, null)}
                      disabled={!!postingComment[a.id]}
                    >
                      {postingComment[a.id] ? "Posting…" : "Post Comment"}
                    </button>
                  )}
                </div>
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
