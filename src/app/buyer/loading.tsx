// app/buyer/loading.tsx — Buyer dashboard loading skeleton.
// Shown while the buyer page Server Component fetches session + owned assets.
// Skeleton reflects the actual buyer dashboard layout: navbar + hero + cards.

export default function BuyerLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      fontFamily: "inherit",
      overflow: "hidden",
    }}>

      {/* Skeleton navbar */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: "64px",
        background: "rgba(13,13,13,0.9)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2.5rem",
        zIndex: 100,
      }}>
        <div style={shimmer("120px", "14px", "6px")} />
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={shimmer("60px", "10px", "4px")} />
          <div style={shimmer("60px", "10px", "4px")} />
          <div style={shimmer("80px", "32px", "8px")} />
        </div>
      </div>

      {/* Hero skeleton */}
      <div style={{
        paddingTop: "64px",
        minHeight: "60vh",
        background: "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "120px 2rem 80px",
      }}>
        <div style={shimmer("80px", "12px", "999px")} />
        <div style={shimmer("clamp(260px,55vw,520px)", "42px", "8px")} />
        <div style={shimmer("clamp(200px,40vw,380px)", "16px", "6px")} />
        <div style={shimmer("clamp(180px,35vw,340px)", "14px", "6px")} />
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <div style={shimmer("140px", "44px", "10px")} />
          <div style={shimmer("120px", "44px", "10px")} />
        </div>
      </div>

      {/* Cards row skeleton */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "3rem 2rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.25rem",
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}>
            <div style={shimmer("100%", "140px", "8px")} />
            <div style={shimmer("70%", "14px", "4px")} />
            <div style={shimmer("45%", "12px", "4px")} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
              <div style={shimmer("30%", "12px", "4px")} />
              <div style={shimmer("25%", "30px", "6px")} />
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes buyerShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
      `}</style>
    </div>
  );
}

// shimmer — returns inline style for an animated skeleton block.
function shimmer(
  width: string, height: string, borderRadius: string
): React.CSSProperties {
  return {
    width,
    height,
    borderRadius,
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "600px 100%",
    animation: "buyerShimmer 1.6s ease-in-out infinite",
    flexShrink: 0,
  };
}
