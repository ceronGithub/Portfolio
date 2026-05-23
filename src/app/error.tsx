// app/error.tsx — Global error boundary.
// Replaces the default Next.js white error screen.
// "use client" is required — error boundaries must be Client Components.
// Receives error + reset() from Next.js automatically.

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log to console for dev visibility — remove or swap with Sentry in prod.
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      textAlign: "center",
      fontFamily: "inherit",
    }}>

      {/* Icon */}
      <div style={{
        width: "52px",
        height: "52px",
        borderRadius: "14px",
        background: "rgba(252,129,129,0.08)",
        border: "1px solid rgba(252,129,129,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "1.5rem",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="#fc8181" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", letterSpacing: "0.1em",
        textTransform: "uppercase", fontWeight: 600, marginBottom: "0.6rem" }}>
        Something went wrong
      </p>

      <h1 style={{ color: "#fff", fontSize: "1.35rem", fontWeight: 700,
        letterSpacing: "-0.02em", marginBottom: "0.6rem" }}>
        Unexpected Error
      </h1>

      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.88rem",
        lineHeight: 1.6, maxWidth: "380px", marginBottom: "2rem" }}>
        Something broke on our end. You can try again — if it keeps happening, contact support.
      </p>

      {/* Error digest — shown in prod for reporting, hidden if absent */}
      {error.digest && (
        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.72rem",
          fontFamily: "monospace", marginBottom: "1.75rem" }}>
          Error ID: {error.digest}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            background: "#fff",
            color: "#0a0a0a",
            border: "none",
            borderRadius: "8px",
            padding: "0.65rem 1.5rem",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 0.18s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = "#e8e4de")}
          onMouseOut={e => (e.currentTarget.style.background = "#fff")}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "0.65rem 1.5rem",
            fontSize: "0.88rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
}
