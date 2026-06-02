// RequestTracker.tsx — Buyer-side tracker for submitted custom requests.
// Fetches GET /api/inquiry on mount and displays each inquiry as a collapsible card.
// Shows a 4-step status pipeline: Pending → Under Review → Quoted → Replied.
// Displays adminQuote and adminComment when set.
// Buyer can: delete their request, edit description, add/edit their own comment.

"use client";

import { useState, useEffect } from "react";
import { sanitize } from "@/lib/utils";
import "./request-tracker.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type RequestStatus = "pending" | "read" | "quoted" | "replied";

interface TrackedRequest {
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
  status:         RequestStatus;
  createdAt:      string;
}

// ── Pipeline steps — 4 stages ─────────────────────────────────────────────────

const PIPELINE_STEPS: { key: RequestStatus; label: string; description: string }[] = [
  { key: "pending",  label: "Submitted",    description: "Request received — awaiting review" },
  { key: "read",     label: "Under Review", description: "Admin is reviewing your request" },
  { key: "quoted",   label: "Quoted",       description: "Official price has been set" },
  { key: "replied",  label: "Replied",      description: "Admin has responded — check your email" },
];

const STATUS_ORDER: Record<RequestStatus, number> = {
  pending: 0,
  read:    1,
  quoted:  2,
  replied: 3,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(p: number) {
  return "₱" + p.toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ── Single request card ───────────────────────────────────────────────────────

function RequestCard({
  request,
  onDelete,
  onUpdate,
}: {
  request:  TrackedRequest;
  onDelete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<TrackedRequest>) => void;
}) {
  const [isExpanded,       setIsExpanded]       = useState(false);
  const [confirmDelete,    setConfirmDelete]     = useState(false);
  const [isDeleting,       setIsDeleting]        = useState(false);
  const [editingDesc,      setEditingDesc]       = useState(false);
  const [descValue,        setDescValue]         = useState(request.description);
  const [savingDesc,       setSavingDesc]        = useState(false);
  const [editingComment,   setEditingComment]    = useState(false);
  const [commentValue,     setCommentValue]      = useState(request.buyerComment ?? "");
  const [savingComment,    setSavingComment]     = useState(false);

  const currentStepIndex = STATUS_ORDER[request.status];

  // ── Delete handler ────────────────────────────────────────────────────────
  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/buyer/inquiry/${request.id}`, { method: "DELETE" });
      if (res.ok) onDelete(request.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  // ── Save description handler ───────────────────────────────────────────────
  async function handleSaveDescription() {
    if (!descValue.trim()) return;
    setSavingDesc(true);
    try {
      const res = await fetch(`/api/buyer/inquiry/${request.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ description: descValue.trim() }),
      });
      if (res.ok) {
        onUpdate(request.id, { description: descValue.trim() });
        setEditingDesc(false);
      }
    } finally {
      setSavingDesc(false);
    }
  }

  // ── Save buyer comment handler ─────────────────────────────────────────────
  async function handleSaveComment() {
    setSavingComment(true);
    try {
      const trimmed = commentValue.trim() || null;
      const res = await fetch(`/api/buyer/inquiry/${request.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ buyerComment: trimmed }),
      });
      if (res.ok) {
        onUpdate(request.id, { buyerComment: trimmed });
        setEditingComment(false);
      }
    } finally {
      setSavingComment(false);
    }
  }

  return (
    <div className={`rtCard ${isExpanded ? "rtCardExpanded" : ""}`}>

      {/* Card header — always visible */}
      <button className="rtCardHeader" onClick={() => setIsExpanded(prev => !prev)}>
        <div className="rtCardHeaderLeft">
          <span className="rtCardAssetType">{request.assetType}</span>
          <span className="rtCardDate">{formatDate(request.createdAt)}</span>
        </div>
        <div className="rtCardHeaderRight">
          {/* Current status label */}
          <span className={`rtStatusPill rtStatusPill--${request.status}`}>
            {PIPELINE_STEPS[currentStepIndex].label}
          </span>
          {/* Admin quote badge — shown if set */}
          {request.adminQuote && (
            <span className="rtQuoteBadge">{fmt(request.adminQuote)}</span>
          )}
          {/* Expand chevron */}
          <svg
            className={`rtChevron ${isExpanded ? "rtChevronOpen" : ""}`}
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="rtCardBody">

          {/* 4-step pipeline */}
          <div className="rtPipeline">
            {PIPELINE_STEPS.map((step, index) => {
              const isDone   = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isFuture = index > currentStepIndex;
              return (
                <div key={step.key} className="rtPipelineStep">
                  {/* Connector line before step (not first) */}
                  {index > 0 && (
                    <div className={`rtPipelineLine ${isDone || isActive ? "rtPipelineLineFilled" : ""}`} />
                  )}
                  <div className={`rtPipelineDot ${isDone ? "rtPipelineDotDone" : isActive ? "rtPipelineDotActive" : "rtPipelineDotFuture"}`}>
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="rtPipelineLabel">
                    <span className={`rtPipelineLabelText ${isActive ? "rtPipelineLabelActive" : isFuture ? "rtPipelineLabelFuture" : ""}`}>
                      {step.label}
                    </span>
                    {isActive && (
                      <span className="rtPipelineDescription">{step.description}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quote row — estimated vs admin */}
          <div className="rtQuoteRow">
            <div className="rtQuoteItem">
              <span className="rtQuoteLabel">Your estimate</span>
              <span className="rtQuoteValue">
                {request.estimatedQuote ? fmt(request.estimatedQuote) : "—"}
              </span>
            </div>
            <div className="rtQuoteDivider" />
            <div className="rtQuoteItem">
              <span className="rtQuoteLabel">Official quote</span>
              <span className={`rtQuoteValue ${request.adminQuote ? "rtQuoteValueOfficial" : ""}`}>
                {request.adminQuote ? fmt(request.adminQuote) : "Pending"}
              </span>
            </div>
            <div className="rtQuoteDivider" />
            <div className="rtQuoteItem">
              <span className="rtQuoteLabel">Delivery speed</span>
              <span className="rtQuoteValue">{request.deliverySpeed}</span>
            </div>
          </div>

          {/* Description — editable by buyer */}
          <div className="rtDescriptionRow">
            <div className="rtDescriptionHeader">
              <span className="rtDescriptionLabel">Description</span>
              {!editingDesc && (
                <button
                  className="rtEditBtn"
                  onClick={() => { setEditingDesc(true); setDescValue(request.description); }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="rtEditBlock">
                <textarea
                  className="rtEditTextarea"
                  autoFocus
                  value={descValue}
                  disabled={savingDesc}
                  onChange={e => setDescValue(sanitize(e.target.value))}
                  rows={4}
                />
                <div className="rtEditActions">
                  <button className="rtEditSave" onClick={handleSaveDescription} disabled={savingDesc || !descValue.trim()}>
                    {savingDesc ? "Saving…" : "Save"}
                  </button>
                  <button className="rtEditCancel" onClick={() => { setEditingDesc(false); setDescValue(request.description); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="rtDescriptionText">{request.description}</p>
            )}
          </div>

          {/* Admin comment — read-only for buyer */}
          {request.adminComment && (
            <div className="rtAdminCommentRow">
              <span className="rtAdminCommentLabel">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Admin Comment
              </span>
              <p className="rtAdminCommentText">{request.adminComment}</p>
            </div>
          )}

          {/* Buyer comment — editable */}
          <div className="rtBuyerCommentRow">
            <div className="rtDescriptionHeader">
              <span className="rtDescriptionLabel">
                {request.adminComment ? "Your Reply" : "Add a Note"}
              </span>
              {!editingComment && (
                <button
                  className="rtEditBtn"
                  onClick={() => { setEditingComment(true); setCommentValue(request.buyerComment ?? ""); }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  {request.buyerComment ? "Edit" : "Add"}
                </button>
              )}
            </div>
            {editingComment ? (
              <div className="rtEditBlock">
                <textarea
                  className="rtEditTextarea"
                  autoFocus
                  value={commentValue}
                  disabled={savingComment}
                  placeholder={request.adminComment ? "Reply to admin…" : "Add a note to your request…"}
                  onChange={e => setCommentValue(sanitize(e.target.value))}
                  rows={3}
                />
                <div className="rtEditActions">
                  <button className="rtEditSave" onClick={handleSaveComment} disabled={savingComment}>
                    {savingComment ? "Saving…" : "Save"}
                  </button>
                  <button className="rtEditCancel" onClick={() => { setEditingComment(false); setCommentValue(request.buyerComment ?? ""); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              request.buyerComment ? (
                <p className="rtDescriptionText">{request.buyerComment}</p>
              ) : (
                <p className="rtNoneText">No note added yet.</p>
              )
            )}
          </div>

          {/* Optional detail chips */}
          {(request.animCount || request.polyBudget || request.reference) && (
            <div className="rtDetailChips">
              {request.animCount && (
                <span className="rtChip">{request.animCount} animations</span>
              )}
              {request.polyBudget && (
                <span className="rtChip">{request.polyBudget}</span>
              )}
              {request.reference && (
                <span className="rtChip rtChipLink">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Reference
                </span>
              )}
            </div>
          )}

          {/* Replied note */}
          {request.status === "replied" && (
            <div className="rtRepliedNote">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              A reply has been sent to your email. Check your inbox.
            </div>
          )}

          {/* Delete action row */}
          <div className="rtDeleteRow">
            {confirmDelete ? (
              <div className="rtDeleteConfirm">
                <span className="rtDeleteConfirmText">Delete this request?</span>
                <button
                  className="rtDeleteConfirmYes"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button className="rtDeleteConfirmNo" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="rtDeleteBtn" onClick={() => setConfirmDelete(true)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Delete request
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface RequestTrackerProps {
  // When true, strips the outer section wrapper (rendered inside a modal instead)
  isModal?: boolean;
}

export default function RequestTracker({ isModal = false }: RequestTrackerProps) {
  const [requests,   setRequests]   = useState<TrackedRequest[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Fetch buyer's inquiries on mount
  useEffect(() => {
    async function loadRequests() {
      try {
        const res  = await fetch("/api/inquiry");
        const data = await res.json();
        if (Array.isArray(data)) setRequests(data);
      } catch {
        setFetchError("Could not load your requests. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, []);

  // Remove a deleted request from local state
  function handleDeleteRequest(id: string) {
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  // Merge partial updates into local state
  function handleUpdateRequest(id: string, changes: Partial<TrackedRequest>) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r));
  }

  // Don't render the section at all if no requests and not loading (only in standalone section mode)
  if (!isModal && !isLoading && requests.length === 0 && !fetchError) return null;

  // Content block — shared between section and modal rendering
  const content = (
    <>
      {/* Header — hidden when rendered inside modal (modal has its own header) */}
      {!isModal && (
        <div className="rtHeader">
          <div className="rtHeaderLeft">
            <p className="rtEyebrow">Your Submissions</p>
            <h2 className="rtTitle">Request Tracker</h2>
          </div>
          <p className="rtHeaderSub">
            Track the status of your custom requests in real time.
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="rtSkeletonList">
          {[1, 2].map(n => (
            <div key={n} className="rtSkeleton" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="rtError">{fetchError}</div>
      ) : requests.length === 0 ? (
        <div className="rtEmpty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="rtEmptyIcon">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p className="rtEmptyTitle">No requests yet</p>
          <p className="rtEmptyDesc">Submit a custom request below and track it here.</p>
        </div>
      ) : (
        <div className="rtList">
          {requests.map((request: TrackedRequest) => (
            <RequestCard
              key={request.id}
              request={request}
              onDelete={handleDeleteRequest}
              onUpdate={handleUpdateRequest}
            />
          ))}
        </div>
      )}
    </>
  );

  // When rendered inside modal — no outer section wrapper
  if (isModal) {
    return <div className="rtInner">{content}</div>;
  }

  return (
    <section className="rtSection">
      <div className="rtInner">{content}</div>
    </section>
  );
}
