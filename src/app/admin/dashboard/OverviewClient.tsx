// OverviewClient.tsx — Client component for Admin Overview.
// Two full-viewport parallax panels.
// Panel 1: Donut chart (revenue by system) + Bar chart (seasonal) + stat cards.
// Panel 2: Two stacked bar charts (products review + systems review) + stat cards.
// Parallax: scroll drives a translateY effect between panels.
"use client";

import { useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────

interface RevenueBySystem { name: string; value: number; }

interface Stats {
  visitorsRegistered: number;
  visitors: number;
  notActive: number;
  activeUsers: number;
  totalUsers: number;
  totalRevenue: number;
  productCount: number;
  orderCount: number;
}

interface Props {
  stats: Stats;
  revenueBySystem: RevenueBySystem[];
}

// ── Color palette (matches design) ───────────────────────────────────
const CHART_COLORS = ["#6c8af5", "#b57bee", "#f5b86c", "#f5d46c"];

// ── Donut Chart ───────────────────────────────────────────────────────
// Pure SVG donut. Accepts slices with name/value/color.

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total   = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 110; const cy = 110; const r = 80; const innerR = 52;
  const circumference = 2 * Math.PI * r;

  // Build arcs via stroke-dasharray/offset technique on a circle
  let cumulative = 0;
  const arcs = data.map(d => {
    const pct   = d.value / total;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const offset = -cumulative * circumference;
    cumulative += pct;
    return { ...d, dash, gap, offset };
  });

  return (
    <div className="overviewDonutWrap">
      <svg viewBox="0 0 220 220" className="overviewDonutSvg">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="28"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={arc.offset}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        {/* Inner hole */}
        <circle cx={cx} cy={cy} r={innerR} fill="#1a1a2e" />
      </svg>

      {/* Labels outside */}
      <div className="overviewDonutLabels">
        {data.map((d, i) => (
          <div key={i} className="overviewDonutLabel">
            <span className="overviewDonutDot" style={{ background: d.color }} />
            <span className="overviewDonutName">{d.name}</span>
            <span className="overviewDonutPct">{Math.round((d.value / (data.reduce((s,x)=>s+x.value,0)||1))*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────
// Simple SVG bar chart for seasonal revenue.

function BarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const chartH = 160; const barW = 44; const gap = 24;
  const totalW = bars.length * (barW + gap) - gap + 20;

  return (
    <div className="overviewBarWrap">
      <svg viewBox={`0 0 ${totalW} ${chartH + 40}`} className="overviewBarSvg">
        {/* Horizontal grid lines */}
        {[0, 20, 40, 60, 80].map(v => (
          <g key={v}>
            <line
              x1="0" y1={chartH - (v / 80) * chartH}
              x2={totalW} y2={chartH - (v / 80) * chartH}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1"
            />
            <text x="0" y={chartH - (v / 80) * chartH - 4} fill="rgba(255,255,255,0.3)" fontSize="9">{v}</text>
          </g>
        ))}

        {bars.map((bar, i) => {
          const barH = (bar.value / maxVal) * chartH;
          const x    = i * (barW + gap) + 10;
          const y    = chartH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="6" fill={bar.color}
                style={{ transition: `height 0.7s ease ${i * 0.1}s, y 0.7s ease ${i * 0.1}s` }} />
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Stacked Bar Chart ─────────────────────────────────────────────────
// SVG stacked bar chart for products/systems review.

interface StackedBar {
  label: string;
  segments: { value: number; color: string }[];
}

function StackedBarChart({ bars, title, legend }: {
  bars: StackedBar[];
  title: string;
  legend: { label: string; color: string }[];
}) {
  const maxVal = Math.max(...bars.map(b => b.segments.reduce((s, seg) => s + seg.value, 0)), 1);
  const chartH = 180; const barW = 44; const gap = 30;
  const totalW = bars.length * (barW + gap) - gap + 20;

  return (
    <div className="overviewStackedWrap">
      {/* Legend */}
      <div className="overviewStackedLegend">
        {legend.map((l, i) => (
          <div key={i} className="overviewStackedLegendItem">
            <span className="overviewStackedLegendDot" style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${totalW} ${chartH + 40}`} className="overviewStackedSvg">
        {/* Grid */}
        {[0, 10, 20, 30, 40, 50].map(v => (
          <g key={v}>
            <line x1="0" y1={chartH - (v / 50) * chartH} x2={totalW} y2={chartH - (v / 50) * chartH}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x="0" y={chartH - (v / 50) * chartH - 3} fill="rgba(255,255,255,0.3)" fontSize="9">{v}</text>
          </g>
        ))}

        {bars.map((bar, i) => {
          const x = i * (barW + gap) + 10;
          let yOffset = chartH;
          return (
            <g key={i}>
              {bar.segments.map((seg, j) => {
                const segH = (seg.value / maxVal) * chartH;
                yOffset -= segH;
                const isTop    = j === bar.segments.length - 1;
                const isBottom = j === 0;
                const rx = isTop ? 6 : 0;
                return (
                  <rect key={j} x={x} y={yOffset} width={barW} height={segH}
                    rx={isBottom ? 0 : 0}
                    style={{ transition: `height 0.7s ease ${i * 0.12}s` }}
                    fill={seg.color}
                  />
                );
              })}
              {/* Top rounded cap */}
              <rect x={x} y={chartH - bars[i].segments.reduce((s, seg) => s + (seg.value / maxVal) * chartH, 0)}
                width={barW} height={8} rx="4" fill={bar.segments[bar.segments.length - 1]?.color} />
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle"
                fill="rgba(255,255,255,0.5)" fontSize="11">{bar.label}</text>
            </g>
          );
        })}
      </svg>

      <p className="overviewStackedTitle">{title}</p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="overviewStatCard">
      <span className="overviewStatValue">{value}</span>
      <span className="overviewStatLabel">{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function OverviewClient({ stats, revenueBySystem }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panel2Ref    = useRef<HTMLDivElement>(null);
  const [panel2Y, setPanel2Y] = useState(60); // parallax offset in px

  // Parallax: as user scrolls, panel 2 content drifts on Y axis
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleScroll() {
      const scrollTop = container!.scrollTop;
      const scrollH   = container!.scrollHeight - container!.clientHeight;
      const progress  = scrollH > 0 ? scrollTop / scrollH : 0;
      // Panel 2 content travels from +60px (bottom) to -40px (top) as you scroll down
      setPanel2Y(60 - progress * 100);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Build donut data — use real system revenue or placeholder
  const donutData = revenueBySystem.length > 0
    ? revenueBySystem.map((d, i) => ({ name: d.name, value: d.value, color: CHART_COLORS[i % CHART_COLORS.length] }))
    : [
        { name: "Sales",     value: 55, color: CHART_COLORS[0] },
        { name: "Finance",   value: 25, color: CHART_COLORS[1] },
        { name: "Marketing", value: 15, color: CHART_COLORS[2] },
        { name: "HR",        value:  5, color: CHART_COLORS[3] },
      ];

  // Seasonal bar chart (static demo data — replace with real query when available)
  const seasonalBars = [
    { label: "Winter", value: 60, color: CHART_COLORS[0] },
    { label: "Spring", value: 45, color: CHART_COLORS[1] },
    { label: "Summer", value: 78, color: CHART_COLORS[2] },
    { label: "Fall",   value: 30, color: CHART_COLORS[3] },
  ];

  // Stacked bars legend
  const stackedLegend = [
    { label: "Heating",     color: CHART_COLORS[0] },
    { label: "Water",       color: CHART_COLORS[1] },
    { label: "Electricity", color: CHART_COLORS[2] },
  ];

  // Products review stacked bars
  const productReviewBars: StackedBar[] = [
    { label: "Jan", segments: [{ value: 24, color: CHART_COLORS[0] }, { value: 15, color: CHART_COLORS[1] }, { value: 8, color: CHART_COLORS[2] }] },
    { label: "Feb", segments: [{ value: 16, color: CHART_COLORS[0] }, { value: 14, color: CHART_COLORS[1] }, { value: 10, color: CHART_COLORS[2] }] },
    { label: "Mar", segments: [{ value: 12, color: CHART_COLORS[0] }, { value: 10, color: CHART_COLORS[1] }, { value: 8,  color: CHART_COLORS[2] }] },
    { label: "Apr", segments: [{ value: 8,  color: CHART_COLORS[0] }, { value: 7,  color: CHART_COLORS[1] }, { value: 5,  color: CHART_COLORS[2] }] },
  ];

  // Systems review stacked bars (same shape, different emphasis)
  const systemReviewBars: StackedBar[] = [
    { label: "Jan", segments: [{ value: 24, color: CHART_COLORS[0] }, { value: 16, color: CHART_COLORS[1] }, { value: 7, color: CHART_COLORS[2] }] },
    { label: "Feb", segments: [{ value: 16, color: CHART_COLORS[0] }, { value: 14, color: CHART_COLORS[1] }, { value: 10, color: CHART_COLORS[2] }] },
    { label: "Mar", segments: [{ value: 11, color: CHART_COLORS[0] }, { value: 11, color: CHART_COLORS[1] }, { value: 8,  color: CHART_COLORS[2] }] },
    { label: "Apr", segments: [{ value: 8,  color: CHART_COLORS[0] }, { value: 7,  color: CHART_COLORS[1] }, { value: 5,  color: CHART_COLORS[2] }] },
  ];

  return (
    <div className="overviewContainer" ref={containerRef}>

      {/* ── PANEL 1 ────────────────────────────────────────────── */}
      <section className="overviewPanel overviewPanel1">
        <div className="overviewPanelInner">

          {/* Charts area */}
          <div className="overviewChartsRow">
            {/* Donut chart */}
            <div className="overviewChartCard">
              <DonutChart data={donutData} />
              <p className="overviewChartTitle">Monthly Revenue from systems and products</p>
            </div>

            {/* Bar chart */}
            <div className="overviewChartCard">
              <BarChart bars={seasonalBars} />
              <p className="overviewChartTitle">Weekly revenue from systems and products</p>
            </div>
          </div>

          {/* Stat cards column */}
          <div className="overviewStatsColumn">
            <StatCard value={stats.visitorsRegistered} label="visitors who registered" />
            <StatCard value={stats.visitors}           label="visitors" />
            <StatCard value={stats.notActive}          label="Not-active users" />
            <StatCard value={stats.activeUsers}        label="Active Users" />
            <StatCard value={stats.totalUsers}         label="total users" />
          </div>

        </div>

        {/* Scroll hint */}
        <div className="overviewScrollHint">
          <span>scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── PANEL 2 ────────────────────────────────────────────── */}
      <section className="overviewPanel overviewPanel2">
        <div
          className="overviewPanelInner"
          ref={panel2Ref}
          style={{ transform: `translateY(${panel2Y}px)`, transition: "transform 0.1s linear" }}
        >

          {/* Charts area */}
          <div className="overviewChartsRow">
            <div className="overviewChartCard">
              <StackedBarChart bars={productReviewBars} title="Products review" legend={stackedLegend} />
            </div>
            <div className="overviewChartCard">
              <StackedBarChart bars={systemReviewBars} title="Systems review" legend={stackedLegend} />
            </div>
          </div>

          {/* Stat cards column */}
          <div className="overviewStatsColumn">
            <StatCard value={stats.visitorsRegistered} label="visitors who registered" />
            <StatCard value={stats.visitors}           label="visitors" />
            <StatCard value={stats.notActive}          label="Not-active users" />
            <StatCard value={stats.activeUsers}        label="Active Users" />
            <StatCard value={stats.totalUsers}         label="total users" />
          </div>

        </div>
      </section>

    </div>
  );
}
