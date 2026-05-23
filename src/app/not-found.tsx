// app/not-found.tsx — Custom 404 page.
// Replaces the default Next.js "404 | This page could not be found." screen.
// Shown for any unmatched route across the entire app.

export default function NotFound() {
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

      {/* Large 404 */}
      <p style={{
        fontSize: "clamp(5rem, 18vw, 10rem)",
        fontWeight: 800,
        color: "rgba(255,255,255,0.04)",
        lineHeight: 1,
        letterSpacing: "-0.04em",
        marginBottom: "0",
        userSelect: "none",
      }}>
        404
      </p>

      {/* Icon */}
      <div style={{
        width: "52px",
        height: "52px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "1.5rem",
        marginTop: "-1.5rem",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", letterSpacing: "0.1em",
        textTransform: "uppercase", fontWeight: 600, marginBottom: "0.6rem" }}>
        Page not found
      </p>

      <h1 style={{ color: "#fff", fontSize: "1.35rem", fontWeight: 700,
        letterSpacing: "-0.02em", marginBottom: "0.6rem" }}>
        This page doesn&apos;t exist
      </h1>

      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.88rem",
        lineHeight: 1.6, maxWidth: "360px", marginBottom: "2rem" }}>
        The link might be broken, or the page may have been moved or removed.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <a
          href="/"
          style={{
            background: "#fff",
            color: "#0a0a0a",
            borderRadius: "8px",
            padding: "0.65rem 1.5rem",
            fontSize: "0.88rem",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-block",
            fontFamily: "inherit",
          }}
        >
          Go home
        </a>
        <a
          href="/buyer"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "0.65rem 1.5rem",
            fontSize: "0.88rem",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
            fontFamily: "inherit",
          }}
        >
          Browse assets
        </a>
      </div>
    </div>
  );
}
