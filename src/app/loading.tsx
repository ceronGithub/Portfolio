// app/loading.tsx — Root loading state.
// Shown by Next.js during initial page load and route transitions at the root level.
// Displays a centered branded spinner on a dark background.

export default function RootLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1.25rem",
    }}>
      <div style={{
        width: "36px",
        height: "36px",
        border: "2.5px solid rgba(255,255,255,0.08)",
        borderTop: "2.5px solid rgba(255,255,255,0.55)",
        borderRadius: "50%",
        animation: "rootSpin 0.75s linear infinite",
        willChange: "transform",
      }} />
      <p style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: "0.78rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 500,
        fontFamily: "inherit",
      }}>
        Loading
      </p>
      <style>{`
        @keyframes rootSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
