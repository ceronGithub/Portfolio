// AppointmentsClient.tsx — Buyer's appointment list.
// Task 2: Buyer can remove PENDING appointments (soft-delete).
// Task 3: Bi-directional threaded comments — buyer posts root comments or
//         replies to admin root comments; admin can do the same.
// Auto-refreshes every 30s to pick up admin status / comment updates.

"use client";

import { useEffect, useCallback, useState } from "react";
import "./appointments.css";

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface AddonSnapshot { id: string; label: string; price: number; }

interface CommentItem {
  id:        string;
  role:      string;       // "ADMIN" | "BUYER"
  content:   string;
  parentId:  string | null;
  createdAt: string;
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
  comments:       CommentItem[];
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

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; desc: string }> = {
  PENDING:   { label: "Pending",   color: "#f6ad55", desc: "Awaiting confirmation from Matthew Studio." },
  SCHEDULED: { label: "Scheduled", color: "#63b3ed", desc: "Consultation confirmed. Check your preferred date." },
  COMPLETED: { label: "Completed", color: "#68d391", desc: "Consultation done. Development may now begin." },
  CANCELLED: { label: "Cancelled", color: "#fc8181", desc: "This appointment was cancelled." },
};

const TIMELINE_STEPS: AppointmentStatus[] = ["PENDING", "SCHEDULED", "COMPLETED"];

function StatusTimeline({ status }: { status: AppointmentStatus }) {
  if (status === "CANCELLED") return null;
  const currentIdx = TIMELINE_STEPS.indexOf(status);
  return (
    <div className="apBuyerTimeline">
      {TIMELINE_STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const cfg    = STATUS_CONFIG[step];
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

// ── Comment Thread ─────────────────────────────────────────────────────────
interface CommentThreadProps {
  appointmentId: string;
  comments:      CommentItem[];
  onCommentAdded: (apId: string, comment: CommentItem) => void;
}

function CommentThread({ appointmentId, comments, onCommentAdded }: CommentThreadProps) {
  const [newRootText,  setNewRootText]  = useState("");
  const [replyText,    setReplyText]    = useState<Record<string, string>>({});
  const [replyOpen,    setReplyOpen]    = useState<Record<string, boolean>>({});
  const [submitting,   setSubmitting]   = useState(false);
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({});

  // Root-level: all comments without a parent
  const roots = comments.filter(c => c.parentId === null);
  // Replies by parentId
  const repliesFor = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const postComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return;
    const res = await fetch(`/api/appointments/${appointmentId}/comments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ content: content.trim(), parentId: parentId ?? null }),
    });
    if (!res.ok) return;
    const { comment } = await res.json();
    onCommentAdded(appointmentId, comment);
  };

  const handleRootSubmit = async () => {
    if (!newRootText.trim()) return;
    setSubmitting(true);
    await postComment(newRootText);
    setNewRootText("");
    setSubmitting(false);
  };

  const handleReplySubmit = async (parentId: string) => {
    const text = replyText[parentId] ?? "";
    if (!text.trim()) return;
    setReplySubmitting(prev => ({ ...prev, [parentId]: true }));
    await postComment(text, parentId);
    setReplyText(prev => ({ ...prev, [parentId]: "" }));
    setReplyOpen(prev => ({ ...prev, [parentId]: false }));
    setReplySubmitting(prev => ({ ...prev, [parentId]: false }));
  };

  return (
    <div className="apBuyerComments">
      <p className="apBuyerCommentsTitle">Discussion</p>

      {/* Root comments */}
      {roots.length === 0 && (
        <p className="apBuyerCommentsEmpty">No comments yet. Start the discussion below.</p>
      )}

      {roots.map(root => {
        const replies       = repliesFor(root.id);
        const isAdminRoot   = root.role === "ADMIN";
        const canReply      = isAdminRoot; // buyer can reply to admin root comments
        return (
          <div key={root.id} className="apBuyerCommentRoot">
            {/* Root comment */}
            <div className={`apBuyerCommentBubble ${root.role === "ADMIN" ? "apBuyerCommentBubbleAdmin" : "apBuyerCommentBubbleBuyer"}`}>
              <span className="apBuyerCommentRole">{root.role === "ADMIN" ? "Studio" : "You"}</span>
              <p className="apBuyerCommentContent">{root.content}</p>
              <span className="apBuyerCommentTime">
                {new Date(root.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Replies to this root */}
            {replies.map(reply => (
              <div key={reply.id} className={`apBuyerCommentReply apBuyerCommentBubble ${reply.role === "ADMIN" ? "apBuyerCommentBubbleAdmin" : "apBuyerCommentBubbleBuyer"}`}>
                <span className="apBuyerCommentRole">{reply.role === "ADMIN" ? "Studio" : "You"}</span>
                <p className="apBuyerCommentContent">{reply.content}</p>
                <span className="apBuyerCommentTime">
                  {new Date(reply.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {/* Reply input — only to admin root comments */}
            {canReply && (
              <div className="apBuyerCommentReplyArea">
                {replyOpen[root.id] ? (
                  <div className="apBuyerCommentInputRow">
                    <textarea
                      className="apBuyerCommentInput"
                      rows={2}
                      placeholder="Write a reply…"
                      value={replyText[root.id] ?? ""}
                      onChange={e => setReplyText(prev => ({ ...prev, [root.id]: e.target.value }))}
                    />
                    <div className="apBuyerCommentActions">
                      <button
                        className="apBuyerCommentSend"
                        disabled={!!replySubmitting[root.id] || !(replyText[root.id] ?? "").trim()}
                        onClick={() => handleReplySubmit(root.id)}
                      >
                        {replySubmitting[root.id] ? "Sending…" : "Reply"}
                      </button>
                      <button
                        className="apBuyerCommentCancel"
                        onClick={() => setReplyOpen(prev => ({ ...prev, [root.id]: false }))}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="apBuyerCommentReplyBtn"
                    onClick={() => setReplyOpen(prev => ({ ...prev, [root.id]: true }))}
                  >
                    ↳ Reply
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* New root comment — buyer can always post root comments */}
      <div className="apBuyerCommentNewRoot">
        <textarea
          className="apBuyerCommentInput"
          rows={2}
          placeholder="Add a comment or question…"
          value={newRootText}
          onChange={e => setNewRootText(e.target.value)}
        />
        <div className="apBuyerCommentActions">
          <button
            className="apBuyerCommentSend"
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

// ── Main Component ─────────────────────────────────────────────────────────
export default function AppointmentsClient({ appointments: initial }: Props) {
  const [appointments,   setAppointments]   = useState<AppointmentItem[]>(initial);
  const [lastRefreshed,  setLastRefreshed]  = useState<Date>(new Date());
  const [removing,       setRemoving]       = useState<Record<string, boolean>>({});
  const [confirmRemove,  setConfirmRemove]  = useState<string | null>(null);
  const [expandComments, setExpandComments] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  // Task 2 — soft-delete appointment
  const handleRemove = useCallback(async (id: string) => {
    setRemoving(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setAppointments(prev => prev.filter(a => a.id !== id));
    } finally {
      setRemoving(prev => ({ ...prev, [id]: false }));
      setConfirmRemove(null);
    }
  }, []);

  // Task 3 — add a comment locally (optimistic + from POST response)
  const handleCommentAdded = useCallback((apId: string, comment: CommentItem) => {
    setAppointments(prev => prev.map(a =>
      a.id === apId ? { ...a, comments: [...a.comments, comment] } : a
    ));
  }, []);

  if (appointments.length === 0) {
    return (
      <div className="apBuyerPage">
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
          const statusConfig   = STATUS_CONFIG[a.status];
          const canRemove      = a.status === "PENDING";
          const isRemoving     = !!removing[a.id];
          const isConfirming   = confirmRemove === a.id;
          const commentsOpen   = !!expandComments[a.id];
          const commentCount   = a.comments.length;

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
                    style={{ color: statusConfig.color, borderColor: statusConfig.color + "44", background: statusConfig.color + "12" }}
                  >
                    {statusConfig.label}
                  </span>

                  {/* Task 2 — Remove button (PENDING only) */}
                  {canRemove && (
                    isConfirming ? (
                      <div className="apBuyerRemoveConfirm">
                        <span className="apBuyerRemoveConfirmText">Remove this appointment?</span>
                        <button
                          className="apBuyerRemoveConfirmYes"
                          disabled={isRemoving}
                          onClick={() => handleRemove(a.id)}
                        >
                          {isRemoving ? "Removing…" : "Yes, remove"}
                        </button>
                        <button
                          className="apBuyerRemoveConfirmNo"
                          onClick={() => setConfirmRemove(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="apBuyerRemoveBtn"
                        onClick={() => setConfirmRemove(a.id)}
                        title="Remove this appointment"
                      >
                        Remove
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
                {a.adminNote && (
                  <div className="apBuyerCardMetaItem apBuyerCardAdminNote">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                    <span className="apBuyerCardAdminNoteText">{a.adminNote}</span>
                  </div>
                )}
              </div>

              {/* Task 3 — Comments toggle */}
              <div className="apBuyerCardDivider" />
              <button
                className="apBuyerCommentsToggle"
                onClick={() => setExpandComments(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {commentsOpen ? "Hide" : "Discussion"}
                {commentCount > 0 && <span className="apBuyerCommentsCount">{commentCount}</span>}
              </button>

              {commentsOpen && (
                <CommentThread
                  appointmentId={a.id}
                  comments={a.comments}
                  onCommentAdded={handleCommentAdded}
                />
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
