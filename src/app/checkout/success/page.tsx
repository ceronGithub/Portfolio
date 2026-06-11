"use client";

import Link             from "next/link";
import "../../globals.css";
import { useEffect, useRef, useState } from "react";
import { useSearchParams }             from "next/navigation";

type FulfillState = "polling" | "fulfilled" | "timeout" | "error";

const POLL_INTERVAL_MS = 4000;   // check every 4 seconds
const MAX_ATTEMPTS     = 30;     // 30 × 4s = 2 minutes max

export default function CheckoutSuccessPage() {
  const searchParams              = useSearchParams();
  const [state, setState]         = useState<FulfillState>("polling");
  const [attempts, setAttempts]   = useState(0);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const fulfilledRef              = useRef(false);

  useEffect(() => {
    const raw      = searchParams.get("orders") ?? "";
    const orderIds = raw.split(",").map(s => s.trim()).filter(Boolean);
    const type     = searchParams.get("type") ?? "";
    if (orderIds.length === 0) { setState("error"); return; }

    const isMaint = type === "maintenance";
    setIsMaintenance(isMaint);

    async function tryFulfill(): Promise<boolean> {
      try {
        const endpoint = isMaint
          ? "/api/maintenance/fulfill"
          : "/api/fulfill";
        const body = isMaint
          ? JSON.stringify({ orderId: orderIds[0] })
          : JSON.stringify({ orderIds });
        const res = await fetch(endpoint, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (res.ok) return true;
        if (res.status !== 402) { setState("error"); return true; }
        return false;
      } catch {
        return false;
      }
    }

    let attempt = 0;

    intervalRef.current = setInterval(async () => {
      if (fulfilledRef.current) return;
      attempt++;
      setAttempts(attempt);

      const done = await tryFulfill();
      if (done && !fulfilledRef.current) {
        fulfilledRef.current = true;
        clearInterval(intervalRef.current!);
        setState("fulfilled");
        // Maintenance → go to maintenance page; assets → go to buyer dashboard
        const redirectTarget = isMaint ? "/buyer/maintenance" : "/buyer";
        setTimeout(() => { window.location.href = redirectTarget; }, 3000);
      } else if (attempt >= MAX_ATTEMPTS) {
        clearInterval(intervalRef.current!);
        setState("timeout");
      }
    }, POLL_INTERVAL_MS);

    // Run immediately on mount too
    tryFulfill().then(done => {
      if (done && !fulfilledRef.current) {
        fulfilledRef.current = true;
        clearInterval(intervalRef.current!);
        setState("fulfilled");
        const redirectTarget = isMaint ? "/buyer/maintenance" : "/buyer";
        setTimeout(() => { window.location.href = redirectTarget; }, 3000);
      }
    });

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [searchParams]);

  return (
    <div style={{
      minHeight:"100vh", background:"#0a0a0a",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem",
    }}>
      <div style={{
        maxWidth:"480px", width:"100%",
        background:"rgba(255,255,255,0.03)",
        border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:"20px", padding:"3rem 2.5rem", textAlign:"center",
      }}>

        {/* ── Polling ── */}
        {state === "polling" && (
          <>
            <div style={{
              width:"64px", height:"64px", borderRadius:"50%",
              background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 1.5rem",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation:"spin 1.2s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1.5rem", fontWeight:700, color:"#fff", marginBottom:"0.75rem" }}>
              Verifying Payment…
            </h1>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem", lineHeight:1.6 }}>
              Checking with PayMongo — this takes a few seconds.
              {attempts > 2 && <><br/><span style={{ fontSize:"0.75rem" }}>Still checking… ({attempts}/{MAX_ATTEMPTS})</span></>}
            </p>
          </>
        )}

        {/* ── Fulfilled ── */}
        {state === "fulfilled" && (
          <>
            <div style={{
              width:"64px", height:"64px", borderRadius:"50%",
              background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 1.5rem",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1.75rem", fontWeight:700, color:"#fff", marginBottom:"0.75rem" }}>
              Payment Confirmed
            </h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.9rem", lineHeight:1.6, marginBottom:"2rem" }}>
              {isMaintenance
                ? "Your maintenance package is now active. Redirecting to Maintenance…"
                : "Your assets are now unlocked and ready to download. Redirecting to your dashboard in 3 seconds…"
              }
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {isMaintenance ? (
                <Link href="/buyer/maintenance" style={{
                  display:"block", padding:"0.85rem 1.5rem",
                  background:"#22c55e", color:"#000", borderRadius:"10px",
                  fontWeight:700, fontSize:"0.9rem", textDecoration:"none",
                }}>
                  Go to Maintenance →
                </Link>
              ) : (
                <Link href="/buyer/downloads" style={{
                  display:"block", padding:"0.85rem 1.5rem",
                  background:"#22c55e", color:"#000", borderRadius:"10px",
                  fontWeight:700, fontSize:"0.9rem", textDecoration:"none",
                }}>
                  Go to Downloads →
                </Link>
              )}
              <Link href="/buyer/orders" style={{
                display:"block", padding:"0.85rem 1.5rem",
                background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.7)",
                borderRadius:"10px", fontWeight:500, fontSize:"0.9rem",
                textDecoration:"none", border:"1px solid rgba(255,255,255,0.08)",
              }}>
                View Orders
              </Link>
            </div>
          </>
        )}

        {/* ── Timeout — payment may still be processing ── */}
        {state === "timeout" && (
          <>
            <div style={{
              width:"64px", height:"64px", borderRadius:"50%",
              background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 1.5rem",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1.5rem", fontWeight:700, color:"#fff", marginBottom:"0.75rem" }}>
              Payment Still Processing
            </h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.85rem", lineHeight:1.6, marginBottom:"2rem" }}>
              Your payment may still be on its way. Check your orders in a few minutes — your download will unlock automatically once confirmed.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              <Link href="/buyer/orders" style={{
                display:"block", padding:"0.85rem 1.5rem",
                background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.8)",
                borderRadius:"10px", fontWeight:600, fontSize:"0.9rem",
                textDecoration:"none", border:"1px solid rgba(255,255,255,0.12)",
              }}>
                Check My Orders
              </Link>
              <Link href="/buyer" style={{
                display:"block", padding:"0.85rem 1.5rem",
                background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.4)",
                borderRadius:"10px", fontWeight:500, fontSize:"0.85rem",
                textDecoration:"none", border:"1px solid rgba(255,255,255,0.06)",
              }}>
                Back to Dashboard
              </Link>
            </div>
          </>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1.5rem", fontWeight:700, color:"#fff", marginBottom:"0.75rem" }}>
              Something went wrong
            </h1>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.85rem", marginBottom:"2rem" }}>
              Contact support if payment was deducted.
            </p>
            <Link href="/buyer/orders" style={{
              display:"block", padding:"0.85rem 1.5rem",
              background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.7)",
              borderRadius:"10px", fontWeight:500, fontSize:"0.9rem", textDecoration:"none",
            }}>
              View Orders
            </Link>
          </>
        )}

      </div>
    </div>
  );
}