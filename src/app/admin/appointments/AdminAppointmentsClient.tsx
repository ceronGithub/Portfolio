// AdminAppointmentsClient.tsx — Admin appointments management.
// Task 2: Shows buyer-removed appointments with a "Removed by buyer" badge.
// Task 3: Bi-directional threaded comments — admin posts root comments or
//         replies to buyer root comments; buyer can do same on their side.
// Filter tabs: All / Pending / Scheduled / Completed / Cancelled.

"use client";

import { useState, useCallback } from "react";
import "./admin-appointments.css";

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface AddonSnapshot { id: string; label: string; price: number; }

interface CommentItem {
  id:        string;
  role:      string;
  content:   string;
  parentId:  string | null;
  createdAt: string;
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
  deletedAt:      string | null;
  createdAt:      string;
  user:           { name: string | null; email: string };
  comments:       CommentItem[];
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

const STATUS_CYCLE: Record<AppointmentStatus, AppointmentStatus> = {
  PENDING:   "SCHEDULED",
  SCHEDULED: "COMPLETED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

// ── Admin Comment Thread ───────────────────────────────────────────────────
interface AdminCommentThreadProps {
  appointmentId:  string;
  comments:       CommentItem[];
  onCommentAdded: (apId: string, comment: CommentItem) => void;
}

function AdminCommentThread({ appointmentId, comments, onCommentAdded }: AdminCommentThreadProps) {
  const [newRootText,      setNewRootText]      = useState("");
  const [replyText,        setReplyText]        = useState<Record<string, string>>({});
  const [replyOpen,        setReplyOpen]        = useState<Record<string, boolean>>({});
  const [submitting,       setSubmitting]       = useState(false);
  const [replySubmitting,  setReplySubmitting]  = useState<Record<string, boolean>>({});

  const roots      = comments.filter(c => c.parentId === null);
  const repliesFor = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const postComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return null;
    const res = await fetch(`/api/admin/appointments/${appointmentId}/comments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content: content.trim(), parentId: parentId ?? null }),
    });
    if (!res.ok) return null;
    const { comment } = await res.json();
    return comment as CommentItem;
  };

  const handleRootSubmit = async () => {
    if (!newRootText.trim()) return;
    setSubmitting(true);
    const comment = await postComment(newRootText);
    if (comment) onCommentAdded(appointmentId, comment);
    setNewRootText("");
    setSubmitting(false);
  };

  const handleReplySubmit = async (parentId: string) => {
    const text = replyText[parentId] ?? "";
    if (!text.trim()) return;
    setReplySubmitting(prev => ({ ...prev, [parentId]: true }));
    const comment = await postComment(text, parentId);
    if (comment) onCommentAdded(appointmentId, comment);
    setReplyText(prev => ({ ...prev, [parentId]: "" }));
    setReplyOpen(prev => ({ ...prev, [parentId]: false }));
    setReplySubmitting(prev => ({ ...prev, [parentId]: false }));
  };

  return (
    <div className="adminApComments">
      <p className="adminApCommentsTitle">Discussion</p>

      {roots.length === 0 && (
        <p className="adminApCommentsEmpty">No comments yet.</p>
      )}

      {roots.map(root => {
        const replies     = repliesFor(root.id);
        const isBuyerRoot = root.role === "BUYER";
        const canReply    = isBuyerRoot; // admin replies to buyer root comments
        return (
          <div key={root.id} className="adminApCommentRoot">
            <div className={`adminApCommentBubble ${root.role === "ADMIN" ? "adminApCommentBubbleAdmin" : "adminApCommentBubbleBuyer"}`}>
              <span className="adminApCommentRole">{root.role === "ADMIN" ? "You (Admin)" : "Buyer"}</span>
              <p className="adminApCommentContent">{root.content}</p>
              <span className="adminApCommentTime">
                {new Date(root.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {replies.map(reply => (
              <div key={reply.id} className={`adminApCommentReply adminApCommentBubble ${reply.role === "ADMIN" ? "adminApCommentBubbleAdmin" : "adminApCommentBubbleBuyer"}`}>
                <span className="adminApCommentRole">{reply.role === "ADMIN" ? "You (Admin)" : "Buyer"}</span>
                <p className="adminApCommentContent">{reply.content}</p>
                <span className="adminApCommentTime">
                  {new Date(reply.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {canReply && (
              <div className="adminApCommentReplyArea">
                {replyOpen[root.id] ? (
                  <div className="adminApCommentInputRow">
                    <textarea
                      className="adminApCommentInput"
                      rows={2}
                      placeholder="Reply to buyer…"
                      value={replyText[root.id] ?? ""}
                      onChange={e => setReplyText(prev => ({ ...prev, [root.id]: e.target.value }))}
                    />
                    <div className="adminApCommentActions">
                      <button
                        className="adminApCommentSend"
                        disabled={!!replySubmitting[root.id] || !(replyText[root.id] ?? "").trim()}
                        onClick={() => handleReplySubmit(root.id)}
                      >
                        {replySubmitting[root.id] ? "Sending…" : "Reply"}
                      </button>
                      <button
                        className="adminApCommentCancel"
                        onClick={() => setReplyOpen(prev => ({ ...prev, [root.id]: false }))}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="adminApCommentReplyBtn"
                    onClick={() => setReplyOpen(prev => ({ ...prev, [root.id]: true }))}
                  >
                    ↳ Reply to buyer
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Admin root comment */}
      <div className="adminApCommentNewRoot">
        <textarea
          className="adminApCommentInput"
          rows={2}
          placeholder="Post a comment to the buyer…"
          value={newRootText}
          onChange={e => setNewRootText(e.target.value)}
        />
        <div className="adminApCommentActions">
          <button
            className="adminApCommentSend"
            disabled={submitting || !newRootText.trim()}
            onClick={handleRootSubmit}
          >
            {submitting ? "Sending…" : "Post Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Client ──────────────────────────────────────────────────────
export default function AdminAppointmentsClient({ appointments: initial }: Props) {
  const [appointments,    setAppointments]    = useState<AppointmentRow[]>(initial);
  const [filterStatus,    setFilterStatus]    = useState<AppointmentStatus | "ALL">("ALL");
  const [editingNote,     setEditingNote]     = useState<Record<string, string>>({});
  const [savingNote,      setSavingNote]      = useState<Record<string, boolean>>({});
  const [updatingStatus,  setUpdatingStatus]  = useState<Record<string, boolean>>({});
  const [expandComments,  setExpandComments]  = useState<Record<string, boolean>>({});

  const filtered = filterStatus === "ALL"
    ? appointments
    : appointments.filter(a => a.status === filterStatus);

  const countFor = (s: AppointmentStatus | "ALL") =>
    s === "ALL" ? appointments.length : appointments.filter(a => a.status === s).length;

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

  // Task 3 — add comment to local state
  const handleCommentAdded = useCallback((apId: string, comment: CommentItem) => {
    setAppointments(prev => prev.map(a =>
      a.id === apId ? { ...a, comments: [...a.comments, comment] } : a
    ));
  }, []);

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

      {filtered.length === 0 && (
        <div className="adminApEmpty">No appointments in this category.</div>
      )}

      <div className="adminApList">
        {filtered.map(a => {
          const statusConfig  = STATUS_CONFIG[a.status];
          const nextStatus    = STATUS_CYCLE[a.status];
          const canAdvance    = nextStatus !== a.status;
          const isUpdating    = !!updatingStatus[a.id];
          const isDirty       = editingNote[a.id] !== undefined && editingNote[a.id] !== (a.adminNote ?? "");
          const isRemoved     = !!a.deletedAt;
          const commentsOpen  = !!expandComments[a.id];
          const commentCount  = a.comments.length;

          return (
            <div key={a.id} className={`adminApCard ${isRemoved ? "adminApCardRemoved" : ""}`}>

              {/* Task 2 — Removed by buyer badge */}
              {isRemoved && (
                <div className="adminApRemovedBadge">
                  Removed by buyer on {new Date(a.deletedAt!).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              )}

              {/* Card header */}
              <div className="adminApCardHeader">
                <div className="adminApCardHeaderLeft">
                  <p className="adminApCardRef">{a.referenceNo}</p>
                  <p className="adminApCardSystem">{a.systemTitle}</p>
                </div>
                <div className="adminApCardHeaderRight">
                  <button
                    className="adminApStatusBadge"
                    style={{ color: statusConfig.color, borderColor: statusConfig.color + "44", background: statusConfig.color + "12" }}
                    onClick={() => canAdvance && !isUpdating && handleStatusUpdate(a.id, nextStatus)}
                    title={canAdvance ? `Advance to ${STATUS_CONFIG[nextStatus].label}` : "Final status"}
                    disabled={!canAdvance || isUpdating}
                  >
                    {isUpdating ? "…" : statusConfig.label}
                  </button>
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

              {/* Task 3 — Comments toggle */}
              <div className="adminApCardDivider" />
              <button
                className="adminApCommentsToggle"
                onClick={() => setExpandComments(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {commentsOpen ? "Hide Discussion" : "Discussion"}
                {commentCount > 0 && <span className="adminApCommentsCount">{commentCount}</span>}
              </button>

              {commentsOpen && (
                <AdminCommentThread
                  appointmentId={a.id}
                  comments={a.comments}
                  onCommentAdded={handleCommentAdded}
                />
              )}

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
