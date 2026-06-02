// app/checkout/success/page.tsx — PayMongo redirects here after successful payment.
// Shows confirmation and links to buyer downloads.
// Renders a toast-style success banner via client component on mount.
"use client";

import Link from "next/link";
import "../../globals.css";
import { useEffect, useState } from "react";

// ToastBanner — auto-appears on mount and fades after 4 s.
// Styled to match the buyer ToastStack palette.
function ToastBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Brief delay so the animation is perceivable after page load
    const showTimer = setTimeout(() => setVisible(true), 300);
    const hideTimer = setTimeout(() => setVisible(false), 4500);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: "1.5rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: "0.65rem",
      padding: "0.7rem 0.9rem",
      background: "rgba(10,22,14,0.95)",
      border: "1px solid rgba(34,197,94,0.25)",
      borderRadius: "12px",
      backdropFilter: "blur(8px)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      animation: "toastIn 0.25s cubic-bezier(0.32,0,0.15,1)",
      minWidth: "240px",
      maxWidth: "340px",
    }}>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)      scale(1);   }
        }
      `}</style>
      {/* Icon */}
      <span style={{
        width: "26px", height: "26px", borderRadius: "8px",
        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)",
        color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.65)", flex: 1, lineHeight: 1.4 }}>
        Payment successful! Your downloads are ready.
      </span>
    </div>
  );
}

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
      <ToastBanner />

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
          <Link
            href="/buyer/dashboard"
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
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}