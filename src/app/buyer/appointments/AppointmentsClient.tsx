// AppointmentsClient.tsx — Buyer's appointment list.
// Shows each appointment as a card: system name, quoted price, date, status badge.

"use client";

import "./appointments.css";

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface AddonSnapshot { id: string; label: string; price: number; }

interface AppointmentItem {
  id:             string;
  referenceNo:    string;
  systemTitle:    string;
  basePrice:      number;
  quotedPrice:    number;
  selectedAddons: AddonSnapshot[];
  scheduledDate:  string;
  message:        string | null;
  status:         AppointmentStatus;
  createdAt:      string;
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

// Status display config
const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "#f6ad55" },
  SCHEDULED: { label: "Scheduled", color: "#63b3ed" },
  COMPLETED: { label: "Completed", color: "#68d391" },
  CANCELLED: { label: "Cancelled", color: "#fc8181" },
};

export default function AppointmentsClient({ appointments }: Props) {
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
      </div>

      <div className="apBuyerList">
        {appointments.map(a => {
          const statusConfig = STATUS_CONFIG[a.status];
          return (
            <div key={a.id} className="apBuyerCard">

              {/* Card top row */}
              <div className="apBuyerCardTop">
                <div className="apBuyerCardLeft">
                  <p className="apBuyerCardSystem">{a.systemTitle}</p>
                  <p className="apBuyerCardRef">{a.referenceNo}</p>
                </div>
                <span
                  className="apBuyerCardStatus"
                  style={{ color: statusConfig.color, borderColor: statusConfig.color + "44", background: statusConfig.color + "12" }}
                >
                  {statusConfig.label}
                </span>
              </div>

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
                {a.message && (
                  <div className="apBuyerCardMetaItem">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="apBuyerCardMessage">{a.message}</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
