// admin/inquiries/InquiriesClient.tsx — Inquiries admin UI.
// Two tabs: Custom Requests + Contact Messages.
// Custom Requests: status pipeline, editable adminQuote, threaded comments (admin posts; buyer replies per comment).
// Contact Messages: status (new → read → replied).

"use client";

import { useState, useRef } from "react";
import { sanitize } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type InquiryComment = {
  id:        string;
  role:      "ADMIN" | "BUYER";
  content:   string;
  parentId:  string | null;
  createdAt: string;
  replies:   InquiryComment[];
};

type CustomRequest = {
  id:             string;
  assetType:      string;
  description:    string;
  animCount:      number | null;
  polyBudget:     string | null;
  reference:      string | null;
  deliverySpeed:  string;
  estimatedQuote: number | null;
  adminQuote:     number | null;
  adminComment:   string | null;
  buyerComment:   string | null;
  status:         string;
  createdAt:      string;
  buyerName:      string;
  email:          string;
  comments:       InquiryComment[];
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

// ── Status badge + dropdown ───────────────────────────────────────────────────

const CUSTOM_STATUSES  = ["pending", "read", "quoted", "replied"] as const;
const CONTACT_STATUSES = ["new", "read", "replied"] as const;

function statusColor(s: string) {
  if (s === "pending" || s === "new") return { color: "#d69e2e", bg: "#d69e2e1a", border: "#d69e2e44" };
  if (s === "read")    return { color: "#7eb8d4", bg: "#7eb8d41a", border: "#7eb8d444" };
  if (s === "quoted")  return { color: "#a78bfa", bg: "#a78bfa1a", border: "#a78bfa44" };
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
      onChange={e => handleChange(sanitize(e.target.value))}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
      ))}
    </select>
  );
}

// ── AdminQuoteEditor ──────────────────────────────────────────────────────────

function AdminQuoteEditor({ inquiryId, currentQuote, onSave }: {
  inquiryId:    string;
  currentQuote: number | null;
  onSave:       (id: string, newQuote: number | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentQuote ? String(currentQuote) : "");
  const [saving,    setSaving]     = useState(false);

  async function handleSave() {
    setSaving(true);
    const parsedQuote = inputValue.trim() === "" ? null : parseInt(inputValue.replace(/[^0-9]/g, ""), 10);
    try {
      const res = await fetch(`/api/admin/inquiries?id=${inquiryId}&type=custom`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminQuote: parsedQuote }),
      });
      if (res.ok) {
        onSave(inquiryId, parsedQuote);
        setInputValue(parsedQuote ? String(parsedQuote) : "");
      }
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="adminInquiriesQuoteEditor">
        <span className="adminInquiriesQuoteCurrency">₱</span>
        <input
          className="adminInquiriesQuoteInput"
          type="text"
          inputMode="numeric"
          autoFocus
          value={inputValue}
          disabled={saving}
          onChange={e => setInputValue(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="0"
        />
      </div>
    );
  }

  return (
    <button
      className={`adminInquiriesQuoteBtn ${currentQuote ? "adminInquiriesQuoteBtnSet" : ""}`}
      onClick={() => setIsEditing(true)}
      title="Click to set official quote"
    >
      {currentQuote ? fmt(currentQuote) : "Set quote"}
    </button>
  );
}

// ── BuyerNotesList — shows buyer's standalone notes; admin can reply to each ──

function BuyerNotesList({ inquiryId, buyerNotes, onBuyerNotesChange }: {
  inquiryId:          string;
  buyerNotes:         InquiryComment[];
  onBuyerNotesChange: (id: string, notes: InquiryComment[]) => void;
}) {
  const [notes,           setNotes]           = useState<InquiryComment[]>(buyerNotes);
  const [replyingToNoteId, setReplyingToNoteId] = useState<string | null>(null);
  const [replyText,       setReplyText]       = useState("");
  const [postingReply,    setPostingReply]    = useState(false);

  if (notes.length === 0) return null;

  // Post admin reply to a buyer note
  async function postAdminReplyToNote(parentId: string) {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setPostingReply(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: "ADMIN", content: trimmed, parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = notes.map(n =>
          n.id === parentId
            ? { ...n, replies: [...n.replies, data.comment] }
            : n
        );
        setNotes(updated);
        onBuyerNotesChange(inquiryId, updated);
        setReplyText("");
        setReplyingToNoteId(null);
      }
    } finally {
      setPostingReply(false);
    }
  }

  return (
    <div className="adminInquiriesBuyerNotesSection">
      <span className="adminInquiriesBuyerNotesLabel">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Buyer Notes ({notes.length})
      </span>
      <div className="adminInquiriesBuyerNoteList">
        {notes.map(note => (
          <div key={note.id} className="adminInquiriesBuyerNoteBlock">
            {/* Buyer note */}
            <div className="adminInquiriesCommentItem adminInquiriesCommentItemBuyer">
              <div className="adminInquiriesCommentMeta">
                <span className="adminInquiriesCommentRoleBadge adminInquiriesCommentRoleBadgeBuyer">Buyer</span>
                <span className="adminInquiriesCommentTime">{formatTime(note.createdAt)}</span>
              </div>
              <p className="adminInquiriesCommentText">{note.content}</p>
              <div className="adminInquiriesCommentItemActions">
                <button
                  className="adminInquiriesCommentReplyBtn"
                  onClick={() => { setReplyingToNoteId(note.id); setReplyText(""); }}
                >
                  Reply
                </button>
              </div>
            </div>
            {/* Admin replies to this buyer note */}
            {note.replies.length > 0 && (
              <div className="adminInquiriesReplyList">
                {note.replies.map(reply => (
                  <div key={reply.id} className="adminInquiriesCommentItem adminInquiriesCommentItemAdmin">
                    <div className="adminInquiriesCommentMeta">
                      <span className="adminInquiriesCommentRoleBadge adminInquiriesCommentRoleBadgeAdmin">Admin</span>
                      <span className="adminInquiriesCommentTime">{formatTime(reply.createdAt)}</span>
                    </div>
                    <p className="adminInquiriesCommentText">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
            {/* Inline admin reply form for this buyer note */}
            {replyingToNoteId === note.id && (
              <div className="adminInquiriesReplyForm">
                <textarea
                  className="adminInquiriesCommentTextarea"
                  autoFocus
                  value={replyText}
                  disabled={postingReply}
                  placeholder="Reply to buyer note…"
                  onChange={e => setReplyText(sanitize(e.target.value))}
                  rows={2}
                />
                <div className="adminInquiriesCommentActions">
                  <button
                    className="adminInquiriesCommentSave"
                    onClick={() => postAdminReplyToNote(note.id)}
                    disabled={postingReply || !replyText.trim()}
                  >
                    {postingReply ? "Posting…" : "Post Reply"}
                  </button>
                  <button
                    className="adminInquiriesCommentCancel"
                    onClick={() => setReplyingToNoteId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CommentThread — threaded comment UI on a custom request ──────────────────
// Admin can add multiple comments. Each admin comment shows a "Reply" button.
// Buyer replies are shown indented beneath the admin comment they reply to.

function CommentThread({ inquiryId, initialComments, onCommentsChange }: {
  inquiryId:        string;
  initialComments:  InquiryComment[];
  onCommentsChange: (id: string, comments: InquiryComment[]) => void;
}) {
  // Separate admin root comments from buyer root notes
  const adminComments = initialComments.filter(c => c.role === "ADMIN" && !c.parentId);
  const buyerNotes    = initialComments.filter(c => c.role === "BUYER" && !c.parentId);
  const [comments,      setComments]      = useState<InquiryComment[]>(adminComments);
  const [buyerNoteList, setBuyerNoteList] = useState<InquiryComment[]>(buyerNotes);
  const [newAdminText,  setNewAdminText]  = useState("");
  const [postingAdmin,  setPostingAdmin]  = useState(false);
  const [replyingToId,  setReplyingToId]  = useState<string | null>(null);
  const [replyText,     setReplyText]     = useState("");
  const [postingReply,  setPostingReply]  = useState(false);
  const [isExpanded,    setIsExpanded]    = useState(comments.length > 0);
  const commentListRef = useRef<HTMLDivElement>(null);

  // ── Post new admin comment ────────────────────────────────────────────────
  async function postAdminComment() {
    const trimmed = newAdminText.trim();
    if (!trimmed) return;
    setPostingAdmin(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: "ADMIN", content: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = [...comments, { ...data.comment, replies: [] }];
        setComments(updated);
        onCommentsChange(inquiryId, [...updated, ...buyerNoteList]);
        setNewAdminText("");
        setIsExpanded(true);
        setTimeout(() => {
          commentListRef.current?.scrollTo({ top: commentListRef.current.scrollHeight, behavior: "smooth" });
        }, 50);
      }
    } finally {
      setPostingAdmin(false);
    }
  }

  // ── Post buyer reply to a specific admin comment ──────────────────────────
  async function postBuyerReply(parentId: string) {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setPostingReply(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ role: "BUYER", content: trimmed, parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = comments.map(c =>
          c.id === parentId
            ? { ...c, replies: [...c.replies, data.comment] }
            : c
        );
        setComments(updated);
        onCommentsChange(inquiryId, [...updated, ...buyerNoteList]);
        setReplyText("");
        setReplyingToId(null);
      }
    } finally {
      setPostingReply(false);
    }
  }

  // ── Delete a comment ──────────────────────────────────────────────────────
  async function deleteComment(commentId: string, parentId: string | null) {
    const res = await fetch(`/api/admin/inquiries/${inquiryId}/comments?commentId=${commentId}`, { method: "DELETE" });
    if (!res.ok) return;
    let updated: InquiryComment[];
    if (!parentId) {
      updated = comments.filter(c => c.id !== commentId);
    } else {
      updated = comments.map(c =>
        c.id === parentId
          ? { ...c, replies: c.replies.filter(r => r.id !== commentId) }
          : c
      );
    }
    setComments(updated);
    onCommentsChange(inquiryId, [...updated, ...buyerNoteList]);
  }

  const rootComments = comments.filter(c => !c.parentId);

  return (
    <div className="adminInquiriesThread">
      {/* Thread header + toggle */}
      <button
        className="adminInquiriesThreadToggle"
        onClick={() => setIsExpanded(prev => !prev)}
        title={isExpanded ? "Collapse thread" : "Expand thread"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {rootComments.length > 0 ? `${rootComments.length} comment${rootComments.length !== 1 ? "s" : ""}` : "Add comment"}
        <svg className={`adminInquiriesThreadChevron ${isExpanded ? "adminInquiriesThreadChevronOpen" : ""}`}
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="adminInquiriesThreadBody">
          {/* Existing comment thread */}
          {rootComments.length > 0 && (
            <div className="adminInquiriesCommentList" ref={commentListRef}>
              {rootComments.map(comment => (
                <div key={comment.id} className="adminInquiriesCommentBlock">
                  {/* Admin comment */}
                  <div className="adminInquiriesCommentItem adminInquiriesCommentItemAdmin">
                    <div className="adminInquiriesCommentMeta">
                      <span className="adminInquiriesCommentRoleBadge adminInquiriesCommentRoleBadgeAdmin">Admin</span>
                      <span className="adminInquiriesCommentTime">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="adminInquiriesCommentText">{comment.content}</p>
                    <div className="adminInquiriesCommentItemActions">
                      <button
                        className="adminInquiriesCommentReplyBtn"
                        onClick={() => { setReplyingToId(comment.id); setReplyText(""); }}
                      >
                        Reply as Buyer
                      </button>
                      <button
                        className="adminInquiriesCommentDeleteBtn"
                        onClick={() => deleteComment(comment.id, null)}
                        title="Delete this comment"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Buyer replies to this comment */}
                  {comment.replies.length > 0 && (
                    <div className="adminInquiriesReplyList">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="adminInquiriesCommentItem adminInquiriesCommentItemBuyer">
                          <div className="adminInquiriesCommentMeta">
                            <span className="adminInquiriesCommentRoleBadge adminInquiriesCommentRoleBadgeBuyer">Buyer</span>
                            <span className="adminInquiriesCommentTime">{formatTime(reply.createdAt)}</span>
                          </div>
                          <p className="adminInquiriesCommentText">{reply.content}</p>
                          <div className="adminInquiriesCommentItemActions">
                            <button
                              className="adminInquiriesCommentDeleteBtn"
                              onClick={() => deleteComment(reply.id, comment.id)}
                              title="Delete reply"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline reply form */}
                  {replyingToId === comment.id && (
                    <div className="adminInquiriesReplyForm">
                      <textarea
                        className="adminInquiriesCommentTextarea"
                        autoFocus
                        value={replyText}
                        disabled={postingReply}
                        placeholder="Write buyer reply…"
                        onChange={e => setReplyText(sanitize(e.target.value))}
                        rows={2}
                      />
                      <div className="adminInquiriesCommentActions">
                        <button
                          className="adminInquiriesCommentSave"
                          onClick={() => postBuyerReply(comment.id)}
                          disabled={postingReply || !replyText.trim()}
                        >
                          {postingReply ? "Posting…" : "Post Reply"}
                        </button>
                        <button
                          className="adminInquiriesCommentCancel"
                          onClick={() => setReplyingToId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Buyer standalone notes — admin can reply to each */}
          <BuyerNotesList
            inquiryId={inquiryId}
            buyerNotes={buyerNoteList}
            onBuyerNotesChange={(id, updatedNotes) => {
              setBuyerNoteList(updatedNotes);
              onCommentsChange(id, [...comments, ...updatedNotes]);
            }}
          />

          {/* New admin comment form */}
          <div className="adminInquiriesNewCommentForm">
            <textarea
              className="adminInquiriesCommentTextarea"
              value={newAdminText}
              disabled={postingAdmin}
              placeholder="Write a comment for the buyer…"
              onChange={e => setNewAdminText(sanitize(e.target.value))}
              rows={3}
            />
            <div className="adminInquiriesCommentActions">
              <button
                className="adminInquiriesCommentSave"
                onClick={postAdminComment}
                disabled={postingAdmin || !newAdminText.trim()}
              >
                {postingAdmin ? "Posting…" : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DeleteRowBtn — single trash icon; requires one confirm click before deleting ──
function DeleteRowBtn({ onConfirmDelete }: { onConfirmDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="adminInquiriesDeleteConfirm">
        <span className="adminInquiriesDeleteConfirmLabel">Delete?</span>
        <button
          className="adminInquiriesDeleteConfirmYes"
          onClick={() => { setConfirming(false); onConfirmDelete(); }}
        >
          Yes
        </button>
        <button
          className="adminInquiriesDeleteConfirmNo"
          onClick={() => setConfirming(false)}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      className="adminInquiriesDeleteBtn"
      onClick={() => setConfirming(true)}
      title="Delete this entry"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4h6v2"/>
      </svg>
    </button>
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
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function updateCustomStatus(id: string, newStatus: string) {
    setCustomRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    showToast(`Status updated to "${newStatus}".`, "ok");
  }

  function updateContactStatus(id: string, newStatus: string) {
    setContactMessages(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    showToast(`Status updated to "${newStatus}".`, "ok");
  }

  function updateAdminQuote(id: string, newQuote: number | null) {
    setCustomRequests(prev => prev.map(r => r.id === id ? { ...r, adminQuote: newQuote } : r));
    showToast(newQuote ? `Quote set to ₱${newQuote.toLocaleString()}.` : "Quote cleared.", "ok");
  }

  function updateComments(id: string, comments: InquiryComment[]) {
    setCustomRequests(prev => prev.map(r => r.id === id ? { ...r, comments } : r));
  }

  // ── Delete handlers ───────────────────────────────────────────────────────

  async function deleteCustomRequest(id: string) {
    const res = await fetch(`/api/admin/inquiries?id=${id}&type=custom`, { method: "DELETE" });
    if (res.ok) {
      setCustomRequests(prev => prev.filter(r => r.id !== id));
      showToast("✓ Custom request deleted.", "ok");
    } else {
      showToast("✕ Failed to delete request.", "err");
    }
  }

  async function deleteContactMessage(id: string) {
    const res = await fetch(`/api/admin/inquiries?id=${id}&type=contact`, { method: "DELETE" });
    if (res.ok) {
      setContactMessages(prev => prev.filter(c => c.id !== id));
      showToast("✓ Contact message deleted.", "ok");
    } else {
      showToast("✕ Failed to delete message.", "err");
    }
  }

  const pendingCount = customRequests.filter(r => r.status === "pending").length;
  const unreadCount  = contactMessages.filter(c => c.status === "new").length;

  return (
    <div className="adminInquiriesContent">

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          background: toast.type === "ok" ? "#22c55e" : "#ef4444",
          color: "#fff", padding: "0.75rem 1.25rem", borderRadius: "10px",
          fontWeight: 700, fontSize: "0.85rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)", pointerEvents: "none",
        }}>{toast.msg}</div>
      )}

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
              <span>Est. Quote</span>
              <span>Official Quote</span>
              <span>Comment Thread</span>
              <span>Speed</span>
              <span>Date</span>
              <span>Status</span>
              <span></span>
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
                <AdminQuoteEditor
                  inquiryId={r.id}
                  currentQuote={r.adminQuote}
                  onSave={updateAdminQuote}
                />
                <CommentThread
                  inquiryId={r.id}
                  initialComments={r.comments ?? []}
                  onCommentsChange={updateComments}
                />
                <span className="adminInquiriesSpeed">{r.deliverySpeed}</span>
                <span className="adminInquiriesDate">{formatDate(r.createdAt)}</span>
                <StatusBadge
                  status={r.status}
                  id={r.id}
                  type="custom"
                  onUpdate={updateCustomStatus}
                />
                <DeleteRowBtn onConfirmDelete={() => deleteCustomRequest(r.id)} />
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
              <span></span>
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
                <DeleteRowBtn onConfirmDelete={() => deleteContactMessage(c.id)} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}