// OverviewClient.tsx — Admin Overview.
// Panel 1: Monthly revenue on Systems + Monthly revenue on Products.
// Panel 2: Weekly revenue on Systems  + Weekly revenue on Products.
// All charts use real DB data. Sticky stat cards on right.
"use client";

import { useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────
interface RevenuePoint { label: string; value: number; }

interface Stats {
  visitorsRegistered: number; visitors: number; notActive: number;
  activeUsers: number; totalUsers: number; totalRevenue: number;
  productCount: number; orderCount: number; systemCount: number;
}

interface Props {
  stats: Stats;
  monthlyRevenueSystems:  RevenuePoint[];
  monthlyRevenueProducts: RevenuePoint[];
  weeklyRevenueSystems:   RevenuePoint[];
  weeklyRevenueProducts:  RevenuePoint[];
}

const COLORS = {
  systems:  "#6c8af5",  // blue
  products: "#f5b86c",  // amber
  grid:     "rgba(255,255,255,0.07)",
  label:    "rgba(255,255,255,0.35)",
  value:    "rgba(255,255,255,0.7)",
};

// ── Bar Chart ─────────────────────────────────────────────────────────
// Renders a single-color bar chart with value labels above bars.
function BarChart({
  data, color, title, prefix = "₱",
}: {
  data: RevenuePoint[]; color: string; title: string; prefix?: string;
}) {
  const maxVal  = Math.max(...data.map(d => d.value), 1);
  const chartH  = 160;
  const barW    = 36;
  const gap     = 20;
  const padL    = 36;
  const totalW  = padL + data.length * (barW + gap) - gap + 10;

  // Nice grid: 4 lines
  const gridStep = Math.ceil(maxVal / 4 / 100) * 100 || 1;
  const gridVals = [0, gridStep, gridStep * 2, gridStep * 3, gridStep * 4].filter(v => v <= maxVal * 1.1);

  const hasData = data.some(d => d.value > 0);

  return (
    <div className="ovBarCard">
      <p className="ovBarTitle">{title}</p>
      {!hasData ? (
        <p className="ovBarEmpty">No data yet</p>
      ) : (
        <svg viewBox={`0 0 ${totalW} ${chartH + 44}`} className="ovBarSvg">
          {/* Grid lines + Y labels */}
          {gridVals.map(v => {
            const y = chartH - (v / (gridStep * 4)) * chartH;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={totalW} y2={y}
                  stroke={COLORS.grid} strokeWidth="1" />
                <text x={padL - 4} y={y + 3} textAnchor="end"
                  fill={COLORS.label} fontSize="8.5">
                  {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const barH = (d.value / (gridStep * 4)) * chartH;
            const x    = padL + i * (barW + gap);
            const y    = chartH - barH;
            return (
              <g key={i}>
                {/* Bar */}
                <rect x={x} y={y} width={barW} height={barH} rx="5" fill={color}
                  opacity={barH < 2 ? 0.2 : 0.85} />
                {/* Value above bar */}
                {d.value > 0 && (
                  <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                    fill={COLORS.value} fontSize="8.5" fontWeight="600">
                    {d.value >= 1000 ? `${(d.value/1000).toFixed(1)}k` : d.value}
                  </text>
                )}
                {/* X label */}
                <text x={x + barW / 2} y={chartH + 16} textAnchor="middle"
                  fill={COLORS.label} fontSize="10">{d.label}</text>
              </g>
            );
          })}
        </svg>
      )}
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

// ── Main ──────────────────────────────────────────────────────────────
export default function OverviewClient({
  stats,
  monthlyRevenueSystems,
  monthlyRevenueProducts,
  weeklyRevenueSystems,
  weeklyRevenueProducts,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panel2Y, setPanel2Y] = useState(50);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onScroll = () => {
      const progress = c.scrollTop / Math.max(c.scrollHeight - c.clientHeight, 1);
      setPanel2Y(50 - progress * 90);
    };
    c.addEventListener("scroll", onScroll, { passive: true });
    return () => c.removeEventListener("scroll", onScroll);
  }, []);

  const statCards = (
    <div className="overviewStatsColumn">
      <StatCard value={stats.visitorsRegistered} label="visitors who registered" />
      <StatCard value={stats.visitors}           label="visitors" />
      <StatCard value={stats.notActive}          label="not-active users" />
      <StatCard value={stats.activeUsers}        label="active users" />
      <StatCard value={stats.totalUsers}         label="total users" />
      <StatCard value={stats.productCount}       label="products" />
      <StatCard value={stats.systemCount}        label="systems" />
    </div>
  );

  return (
    <div className="overviewContainer" ref={containerRef}>

      {/* ── PANEL 1 — Monthly revenue ─────────────────────── */}
      <section className="overviewPanel overviewPanel1">
        <div className="overviewPanelInner">
          <div className="overviewChartsArea">
            <div className="overviewChartsRow">
              <BarChart
                data={monthlyRevenueSystems}
                color={COLORS.systems}
                title="Monthly Revenue on Systems"
              />
              <BarChart
                data={monthlyRevenueProducts}
                color={COLORS.products}
                title="Monthly Revenue on Products"
              />
            </div>
          </div>
          {statCards}
        </div>
        <div className="overviewScrollHint">
          <span>scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── PANEL 2 — Weekly revenue ──────────────────────── */}
      <section className="overviewPanel overviewPanel2">
        <div className="overviewPanelInner">
          <div
            className="overviewChartsArea"
            style={{ transform: `translateY(${panel2Y}px)`, transition: "transform 0.12s linear" }}
          >
            <div className="overviewChartsRow">
              <BarChart
                data={weeklyRevenueSystems}
                color={COLORS.systems}
                title="Weekly Revenue on Systems"
              />
              <BarChart
                data={weeklyRevenueProducts}
                color={COLORS.products}
                title="Weekly Revenue on Products"
              />
            </div>
          </div>
          {statCards}
        </div>
      </section>

    </div>
  );
}