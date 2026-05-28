// RequestTracker.tsx — Buyer-side tracker for submitted custom requests.
// Fetches GET /api/inquiry on mount and displays each inquiry as a collapsible card.
// Shows a 4-step status pipeline: Pending → Under Review → Quoted → Replied.
// Displays adminQuote when admin has set an official price.

"use client";

import { useState, useEffect } from "react";
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

function RequestCard({ request }: { request: TrackedRequest }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentStepIndex = STATUS_ORDER[request.status];

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
              const isDone    = index < currentStepIndex;
              const isActive  = index === currentStepIndex;
              const isFuture  = index > currentStepIndex;
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

          {/* Description */}
          <div className="rtDescriptionRow">
            <span className="rtDescriptionLabel">Description</span>
            <p className="rtDescriptionText">{request.description}</p>
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

        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function RequestTracker() {
  const [requests,   setRequests]   = useState<TrackedRequest[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Fetch buyer's inquiries on mount
  useEffect(() => {
    async function loadRequests() {
      try {
        const res  = await fetch("/api/inquiry");
        const data = await res.json();
        if (Array.isArray(data)) {
          setRequests(data);
        }
      } catch {
        setFetchError("Could not load your requests. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, []);

  // Don't render the section at all if no requests and not loading
  if (!isLoading && requests.length === 0 && !fetchError) return null;

  return (
    <section className="rtSection">
      <div className="rtInner">

        {/* Header */}
        <div className="rtHeader">
          <div className="rtHeaderLeft">
            <p className="rtEyebrow">Your Submissions</p>
            <h2 className="rtTitle">Request Tracker</h2>
          </div>
          <p className="rtHeaderSub">
            Track the status of your custom requests in real time.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="rtSkeletonList">
            {[1, 2].map(n => (
              <div key={n} className="rtSkeleton" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="rtError">{fetchError}</div>
        ) : (
          <div className="rtList">
            {requests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
