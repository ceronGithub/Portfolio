// app/admin/loading.tsx — Admin dashboard loading skeleton.
// Shown while admin Server Components fetch DB data (products, orders, users).
// Skeleton reflects the admin shell: sidebar + header + table/card rows.

export default function AdminLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#faf9f7",
      display: "flex",
      fontFamily: "inherit",
      overflow: "hidden",
    }}>

      {/* Skeleton sidebar */}
      <div style={{
        width: "220px",
        flexShrink: 0,
        background: "#f3f1ee",
        borderRight: "1px solid #e8e4de",
        padding: "1.5rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}>
        <div style={shimmer("140px", "20px", "6px")} />
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={shimmer("100%", "34px", "7px")} />
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div style={{
        flex: 1,
        padding: "2.5rem 2.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: "1100px",
      }}>

        {/* Page header skeleton */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={shimmer("50px", "10px", "4px")} />
            <div style={shimmer("200px", "26px", "6px")} />
            <div style={shimmer("140px", "12px", "4px")} />
          </div>
          <div style={shimmer("120px", "12px", "4px")} />
        </div>

        {/* Stats row skeleton */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              background: "#fff",
              border: "1px solid #e8e4de",
              borderRadius: "10px",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}>
              <div style={shimmer("50%", "11px", "4px")} />
              <div style={shimmer("70%", "22px", "5px")} />
              <div style={shimmer("40%", "10px", "4px")} />
            </div>
          ))}
        </div>

        {/* Table card skeleton */}
        <div style={{
          background: "#fff",
          border: "1px solid #e8e4de",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          {/* Table header row */}
          <div style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #f0ede8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={shimmer("140px", "16px", "5px")} />
            <div style={shimmer("28px", "28px", "7px")} />
          </div>
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              padding: "1rem 1.5rem",
              borderBottom: i < 5 ? "1px solid #f5f3f0" : "none",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}>
              <div style={shimmer("160px", "12px", "4px")} />
              <div style={shimmer("80px", "12px", "4px")} />
              <div style={shimmer("60px", "12px", "4px")} />
              <div style={{ marginLeft: "auto" }}>
                <div style={shimmer("70px", "26px", "6px")} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes adminShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
      `}</style>
    </div>
  );
}

// shimmer — returns inline style for an animated light-theme skeleton block.
function shimmer(
  width: string, height: string, borderRadius: string
): React.CSSProperties {
  return {
    width,
    height,
    borderRadius,
    background: "linear-gradient(90deg, #ede9e3 25%, #e5e0d8 50%, #ede9e3 75%)",
    backgroundSize: "600px 100%",
    animation: "adminShimmer 1.6s ease-in-out infinite",
    flexShrink: 0,
  };
}
