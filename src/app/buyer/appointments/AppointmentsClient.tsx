// AppointmentsClient.tsx — Buyer's appointment list.
// Shows each appointment as a card: system name, quoted price, date, status badge.
// Auto-refreshes every 30s to pick up admin status updates.
// Status timeline shows progress: Pending → Scheduled → Completed.
// Comment thread: buyer can post multiple notes; buyer can reply to admin comments.
// Buyer can delete PENDING appointments with a 2-step confirm.

"use client";

import { useEffect, useCallback, useState } from "react";
import "./appointments.css";
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

interface AppointmentItem {
  id:             string;
  referenceNo:    string;
  systemTitle:    string;
  basePrice:      number;
  quotedPrice:    number;
  selectedAddons: AddonSnapshot[];
  scheduledDate:  string;
  message:        string | null;
  adminNote:      string | null;
  status:         AppointmentStatus;
  createdAt:      string;
  comments:       ApptComment[];
}

interface Props {
  appointments: AppointmentItem[];
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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; desc: string }> = {
  PENDING:   { label: "Pending",   color: "#f6ad55", desc: "Awaiting confirmation from Matthew Studio." },
  SCHEDULED: { label: "Scheduled", color: "#63b3ed", desc: "Consultation confirmed. Check your preferred date." },
  COMPLETED: { label: "Completed", color: "#68d391", desc: "Consultation done. Development may now begin." },
  CANCELLED: { label: "Cancelled", color: "#fc8181", desc: "This appointment was cancelled." },
};

// Status timeline steps (excludes CANCELLED)
const TIMELINE_STEPS: AppointmentStatus[] = ["PENDING", "SCHEDULED", "COMPLETED"];

function StatusTimeline({ status }: { status: AppointmentStatus }) {
  if (status === "CANCELLED") return null;
  const currentIdx = TIMELINE_STEPS.indexOf(status);
  return (
    <div className="apBuyerTimeline">
      {TIMELINE_STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        const cfg     = STATUS_CONFIG[step];
        return (
          <div key={step} className="apBuyerTimelineStep">
            <div className="apBuyerTimelineTrack">
              <div
                className={`apBuyerTimelineDot ${done ? "apBuyerTimelineDotDone" : active ? "apBuyerTimelineDotActive" : "apBuyerTimelineDotIdle"}`}
                style={active ? { borderColor: cfg.color, background: cfg.color + "22" } : done ? { background: cfg.color, borderColor: cfg.color } : {}}
              />
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`apBuyerTimelineLine ${done ? "apBuyerTimelineLineDone" : ""}`} />
              )}
            </div>
            <span
              className={`apBuyerTimelineLabel ${active ? "apBuyerTimelineLabelActive" : done ? "apBuyerTimelineLabelDone" : ""}`}
              style={active ? { color: cfg.color } : {}}
            >
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── AdminCommentBlock — one admin comment + buyer replies + reply form ────────
function AdminCommentBlock({ appointmentId, comment, onReplyPosted, showToast }: {
  appointmentId: string;
  comment:       ApptComment;
  onReplyPosted: (parentId: string, reply: Omit<ApptComment, "replies">) => void;
  showToast:     (msg: string, type: "success" | "error" | "warning") => void;
}) {
  const [replying,  setReplying]  = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting,   setPosting]   = useState(false);

  async function handlePostReply() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/buyer/appointments/${appointmentId}/reply`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ parentId: comment.id, content: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        onReplyPosted(comment.id, data.comment);
        setReplyText("");
        setReplying(false);
        showToast("✓ Reply sent.", "success");
      } else {
        showToast("✕ Failed to send reply.", "error");
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="apBuyerCommentBlock">
      {/* Admin comment */}
      <div className="apBuyerCommentItem apBuyerCommentItemAdmin">
        <div className="apBuyerCommentMeta">
          <span className="apBuyerCommentRoleBadge apBuyerCommentRoleBadgeAdmin">Admin</span>
          <span className="apBuyerCommentTime">{formatCommentTime(comment.createdAt)}</span>
        </div>
        <p className="apBuyerCommentText">{comment.content}</p>
        {!replying && (
          <button className="apBuyerCommentReplyBtn" onClick={() => { setReplying(true); setReplyText(""); }}>
            Reply
          </button>
        )}
      </div>

      {/* Buyer replies to this admin comment */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="apBuyerReplyList">
          {comment.replies.map(reply => (
            <div key={reply.id} className="apBuyerCommentItem apBuyerCommentItemBuyer">
              <div className="apBuyerCommentMeta">
                <span className="apBuyerCommentRoleBadge apBuyerCommentRoleBadgeBuyer">You</span>
                <span className="apBuyerCommentTime">{formatCommentTime(reply.createdAt)}</span>
              </div>
              <p className="apBuyerCommentText">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inline reply form */}
      {replying && (
        <div className="apBuyerReplyForm">
          <textarea
            className="apBuyerReplyTextarea"
            autoFocus
            value={replyText}
            disabled={posting}
            placeholder="Write your reply…"
            rows={2}
            onChange={e => setReplyText(sanitize(e.target.value))}
          />
          <div className="apBuyerReplyActions">
            <button className="apBuyerReplySend" onClick={handlePostReply} disabled={posting || !replyText.trim()}>
              {posting ? "Sending…" : "Send Reply"}
            </button>
            <button className="apBuyerReplyCancel" onClick={() => setReplying(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BuyerNoteThread — buyer posts multiple standalone notes ───────────────────
function BuyerNoteThread({ appointmentId, buyerNotes, onNoteAdded, showToast }: {
  appointmentId: string;
  buyerNotes:    ApptComment[];
  onNoteAdded:   (note: ApptComment) => void;
  showToast:     (msg: string, type: "success" | "error" | "warning") => void;
}) {
  const [addingNote,  setAddingNote]  = useState(false);
  const [noteText,    setNoteText]    = useState("");
  const [postingNote, setPostingNote] = useState(false);

  async function handlePostNote() {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    setPostingNote(true);
    try {
      const res = await fetch(`/api/buyer/appointments/${appointmentId}/note`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        onNoteAdded(data.comment);
        setNoteText("");
        setAddingNote(false);
        showToast("✓ Note added.", "success");
      } else {
        showToast("✕ Failed to post note.", "error");
      }
    } finally {
      setPostingNote(false);
    }
  }

  return (
    <div className="apBuyerNoteThread">
      {/* Section header */}
      <div className="apBuyerNoteThreadHeader">
        <span className="apBuyerNoteThreadLabel">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Your Notes
        </span>
        {!addingNote && (
          <button className="apBuyerNoteAddBtn" onClick={() => { setAddingNote(true); setNoteText(""); }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Note
          </button>
        )}
      </div>

      {/* Existing buyer notes */}
      {buyerNotes.length > 0 ? (
        <div className="apBuyerNoteList">
          {buyerNotes.map(note => (
            <div key={note.id} className="apBuyerNoteBlock">
              <div className="apBuyerCommentItem apBuyerCommentItemBuyer">
                <div className="apBuyerCommentMeta">
                  <span className="apBuyerCommentRoleBadge apBuyerCommentRoleBadgeBuyer">You</span>
                  <span className="apBuyerCommentTime">{formatCommentTime(note.createdAt)}</span>
                </div>
                <p className="apBuyerCommentText">{note.content}</p>
              </div>
              {/* Admin replies to this buyer note */}
              {note.replies && note.replies.length > 0 && (
                <div className="apBuyerReplyList">
                  {note.replies.map(reply => (
                    <div key={reply.id} className="apBuyerCommentItem apBuyerCommentItemAdmin">
                      <div className="apBuyerCommentMeta">
                        <span className="apBuyerCommentRoleBadge apBuyerCommentRoleBadgeAdmin">Admin</span>
                        <span className="apBuyerCommentTime">{formatCommentTime(reply.createdAt)}</span>
                      </div>
                      <p className="apBuyerCommentText">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="apBuyerNoteEmpty">No notes yet.</p>
      )}

      {/* Add note form */}
      {addingNote && (
        <div className="apBuyerReplyForm">
          <textarea
            className="apBuyerReplyTextarea"
            autoFocus
            value={noteText}
            disabled={postingNote}
            placeholder="Add a note to your appointment…"
            rows={3}
            onChange={e => setNoteText(sanitize(e.target.value))}
          />
          <div className="apBuyerReplyActions">
            <button className="apBuyerReplySend" onClick={handlePostNote} disabled={postingNote || !noteText.trim()}>
              {postingNote ? "Posting…" : "Post Note"}
            </button>
            <button className="apBuyerReplyCancel" onClick={() => { setAddingNote(false); setNoteText(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AppointmentsClient({ appointments: initial }: Props) {
  const { toasts, showToast, dismissToast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initial);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);

  // ── Delete PENDING appointment ────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? "✕ Failed to remove appointment.", "error");
        return;
      }
      setAppointments(prev => prev.filter(a => a.id !== id));
      setConfirmDelete(null);
      showToast("✓ Appointment removed.", "success");
    } finally {
      setDeletingId(null);
    }
  }
  function handleUpdateComments(id: string, updater: (prev: ApptComment[]) => ApptComment[]) {
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, comments: updater(a.comments) } : a
    ));
  }

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/appointments", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments.map((a: any) => ({
        id:             a.id,
        referenceNo:    a.referenceNo,
        systemTitle:    a.systemTitle,
        basePrice:      a.basePrice,
        quotedPrice:    a.quotedPrice,
        selectedAddons: a.selectedAddons ?? [],
        scheduledDate:  a.scheduledDate,
        message:        a.message ?? null,
        adminNote:      a.adminNote ?? null,
        status:         a.status,
        createdAt:      a.createdAt,
        comments:       a.comments ?? [],
      })));
      setLastRefreshed(new Date());
    } catch { /* silent */ }
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  if (appointments.length === 0) {
    return (
      <div className="apBuyerPage">
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
        <div className="apBuyerHeader">
          <p className="apBuyerEyebrow">Consultation History</p>
          <h1 className="apBuyerTitle">Appointments</h1>
        </div>
        <div className="apBuyerEmpty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="apBuyerEmptyTitle">No appointments yet</p>
          <p className="apBuyerEmptySub">Schedule a consultation from the Systems page to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apBuyerPage">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="apBuyerHeader">
        <p className="apBuyerEyebrow">Consultation History</p>
        <h1 className="apBuyerTitle">Appointments</h1>
        <p className="apBuyerSub">{appointments.length} {appointments.length === 1 ? "request" : "requests"} total</p>
        <p className="apBuyerRefreshed">
          Last updated {lastRefreshed.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
          <button className="apBuyerRefreshBtn" onClick={refresh}>↻ Refresh</button>
        </p>
      </div>

      <div className="apBuyerList">
        {appointments.map(a => {
          const statusConfig = STATUS_CONFIG[a.status];
          // Separate admin root comments from buyer root notes
          const adminComments = (a.comments as ApptComment[]).filter(c => c.role === "ADMIN" && !c.parentId);
          const buyerNotes    = (a.comments as ApptComment[]).filter(c => c.role === "BUYER" && !c.parentId);

          return (
            <div key={a.id} className="apBuyerCard">

              {/* Card top row */}
              <div className="apBuyerCardTop">
                <div className="apBuyerCardLeft">
                  <p className="apBuyerCardSystem">{a.systemTitle}</p>
                  <p className="apBuyerCardRef">{a.referenceNo}</p>
                </div>
                <div className="apBuyerCardTopRight">
                  <span
                    className="apBuyerCardStatus"
                    style={{ color: statusConfig.color, borderColor: statusConfig.color + "33", background: statusConfig.color + "0f" }}
                  >
                    {statusConfig.label}
                  </span>
                  {/* Delete — only available on PENDING appointments */}
                  {a.status === "PENDING" && (
                    confirmDelete === a.id ? (
                      <div className="apBuyerDeleteConfirm">
                        <span className="apBuyerDeleteConfirmText">Remove?</span>
                        <button
                          className="apBuyerDeleteConfirmYes"
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                        >
                          {deletingId === a.id ? "…" : "Yes"}
                        </button>
                        <button className="apBuyerDeleteConfirmNo" onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button className="apBuyerDeleteBtn" onClick={() => setConfirmDelete(a.id)} title="Remove appointment">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Status timeline */}
              <StatusTimeline status={a.status} />

              {/* Status description */}
              <p className="apBuyerStatusDesc" style={{ color: statusConfig.color + "bb" }}>
                {statusConfig.desc}
              </p>

              {/* Divider */}
              <div className="apBuyerCardDivider" />

              {/* Price breakdown */}
              <div className="apBuyerCardPrices">
                <div className="apBuyerCardPriceRow">
                  <span className="apBuyerCardPriceLabel">Base</span>
                  <span className="apBuyerCardPriceValue">{fmt(a.basePrice)}</span>
                </div>
                {a.selectedAddons.length > 0 && a.selectedAddons.map(ad => (
                  <div key={ad.id} className="apBuyerCardPriceRow apBuyerCardPriceRowAddon">
                    <span className="apBuyerCardPriceLabel">+ {ad.label}</span>
                    <span className="apBuyerCardPriceValue" style={{ color: "#22c55e" }}>+{fmt(ad.price)}</span>
                  </div>
                ))}
                <div className="apBuyerCardPriceRow apBuyerCardPriceRowTotal">
                  <span className="apBuyerCardPriceLabel">Quoted Total</span>
                  <span className="apBuyerCardPriceValue apBuyerCardPriceTotal">{fmt(a.quotedPrice)}</span>
                </div>
              </div>

              {/* Date + message */}
              <div className="apBuyerCardMeta">
                <div className="apBuyerCardMetaItem">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>Preferred date — {formatDate(a.scheduledDate)}</span>
                </div>
                <div className="apBuyerCardMetaItem">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Submitted — {new Date(a.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                {a.message && (
                  <div className="apBuyerCardMetaItem">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="apBuyerCardMessage">{a.message}</span>
                  </div>
                )}
              </div>

              {/* Admin comments thread — admin root comments buyer can reply to */}
              {adminComments.length > 0 && (
                <div className="apBuyerCommentThread">
                  <span className="apBuyerCommentThreadLabel">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Admin Comments
                  </span>
                  {adminComments.map((comment: ApptComment) => (
                    <AdminCommentBlock
                      key={comment.id}
                      appointmentId={a.id as string}
                      comment={comment}
                      showToast={showToast}
                      onReplyPosted={(parentId, reply) => {
                        handleUpdateComments(a.id, prev => prev.map(c =>
                          c.id === parentId
                            ? { ...c, replies: [...(c.replies ?? []), reply] }
                            : c
                        ));
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Buyer note thread — multiple standalone notes */}
              <BuyerNoteThread
                appointmentId={a.id}
                buyerNotes={buyerNotes}
                showToast={showToast}
                onNoteAdded={(note) => {
                  handleUpdateComments(a.id, prev => [...prev, note]);
                }}
              />

            </div>
          );
        })}
      </div>
    </div>
  );
}
