// app/checkout/success/page.tsx — PayMongo redirects here after successful payment.
// Shows confirmation and links to buyer downloads.
import Link from "next/link";
import "../../globals.css";

export default function CheckoutSuccessPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "3rem 2.5rem",
        textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#fff",
          marginBottom: "0.75rem",
        }}>
          Payment Confirmed
        </h1>

        {/* Description */}
        <p style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          marginBottom: "2rem",
        }}>
          Your downpayment was received. Your downloads will be unlocked automatically — check your library now.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link
            href="/buyer/downloads"
            style={{
              display: "block",
              padding: "0.85rem 1.5rem",
              background: "#22c55e",
              color: "#000",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            Go to Downloads →
          </Link>
          <Link
            href="/buyer/orders"
            style={{
              display: "block",
              padding: "0.85rem 1.5rem",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: "10px",
              fontWeight: 500,
              fontSize: "0.9rem",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            View Order Status
          </Link>
        </div>
      </div>
    </div>
  );
}