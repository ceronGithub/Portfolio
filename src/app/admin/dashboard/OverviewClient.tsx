// OverviewClient.tsx — Admin Overview. Real data. Beautiful layout.
// Row 1: 4 KPI cards (Revenue, Orders, Users, Products)
// Row 2: Monthly revenue bar chart + Donut (revenue by system) + Stat column
// Row 3: Order breakdown bar chart + Systems list
// Parallax on scroll. Inter font.
"use client";

import { useEffect } from "react";
import "./dashboard.css";

const COLORS = ["#6c8af5", "#b57bee", "#f5b86c", "#f5d46c", "#6ee7b7", "#f87171"];

interface Stats {
  visitorsRegistered: number;
  visitors:           number;
  notActive:          number;
  activeUsers:        number;
  totalUsers:         number;
  productCount:       number;
  systemCount:        number;
  totalRevenue:       number;
  orderCount:         number;
  paidCount:          number;
  pendingCount:       number;
  failedCount:        number;
}

interface Props {
  stats:           Stats;
  revenueBySystem: { name: string; value: number; color: string }[];
  monthlyRevenue:  { label: string; value: number; color: string }[];
  orderBreakdown:  { label: string; value: number; color: string }[];
  topProducts:     { label: string; value: number; color: string }[];
}

// ── KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ value, label, sub, color, icon }: {
  value: string | number; label: string; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="ovKpiCard">
      <div className="ovKpiTop">
        <div className="ovKpiIcon" style={{ background: `${color}18`, color }}>{icon}</div>
      </div>
      <div className="ovKpiValue" style={{ color }}>{value}</div>
      <div className="ovKpiLabel">{label}</div>
      {sub && <div className="ovKpiSub">{sub}</div>}
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────
function BarChart({ bars, height = 140 }: {
  bars: { label: string; value: number; color: string }[];
  height?: number;
}) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="ovBarWrap" style={{ height }}>
      <div className="ovBarYAxis">
        {[100, 75, 50, 25, 0].map(pct => (
          <span key={pct}>{Math.round((pct / 100) * max)}</span>
        ))}
      </div>
      <div className="ovBarBars">
        {bars.map((b, i) => (
          <div key={i} className="ovBarGroup">
            <div className="ovBar" style={{ height: `${(b.value / max) * 100}%`, background: b.color }} />
            <span className="ovBarLabel">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────────────
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 80; const cy = 80; const r = 60; const stroke = 18;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  const arcs = data.map(d => {
    const pct = d.value / total;
    const dash = pct * circ;
    const offset = -cum * circ;
    cum += pct;
    return { ...d, pct, dash, gap: circ - dash, offset };
  });
  return (
    <div className="ovDonutWrap">
      <svg viewBox="0 0 160 160" className="ovDonutSvg">
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={a.color} strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={a.offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        ))}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="var(--shell-bg,#0d0d0d)" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#e8e4de" fontSize="18" fontWeight="800" fontFamily="Inter,sans-serif">
          {data.length}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#888" fontSize="9" fontFamily="Inter,sans-serif">
          systems
        </text>
      </svg>
      <ul className="ovDonutLegend">
        {arcs.map((a, i) => (
          <li key={i} className="ovDonutLegendItem">
            <span className="ovDonutDot" style={{ background: a.color }} />
            <span className="ovDonutName">{a.name}</span>
            <span className="ovDonutPct">{Math.round(a.pct * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Stat Row ──────────────────────────────────────────────────────────
function StatRow({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="ovStatRow">
      <span className="ovStatRowLabel">{label}</span>
      <span className="ovStatRowValue" style={{ color: color ?? "#e8e4de" }}>{value}</span>
    </div>
  );
}

// ── Parallax ──────────────────────────────────────────────────────────
function useParallax() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-depth]");
    function onScroll() {
      const y = window.scrollY;
      els.forEach((el, i) => {
        const d = parseFloat(el.dataset.depth ?? "0.05");
        el.style.transform = `translateY(${y * d * (i % 2 === 0 ? 1 : -1)}px)`;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

// ── Main ──────────────────────────────────────────────────────────────
export default function OverviewClient({ stats, revenueBySystem, monthlyRevenue, orderBreakdown, topProducts }: Props) {
  useParallax();

  const donutData = revenueBySystem.length > 0
    ? revenueBySystem
    : [
        { name: "No systems yet", value: 1, color: "#333" },
      ];

  return (
    <div className="ovPage">

      {/* ── Header ────────────────────────────────── */}
      <div className="ovHeader">
        <h1 className="ovTitle">Overview</h1>
        <p className="ovSubtitle">Real-time shop data</p>
      </div>

      {/* ── Row 1: KPI cards ──────────────────────── */}
      <div className="ovKpiRow" data-depth="0.03">
        <KpiCard
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          label="Total Revenue"
          sub={`${stats.paidCount} paid orders`}
          color="#6ee7b7"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <KpiCard
          value={stats.orderCount}
          label="Total Orders"
          sub={`${stats.pendingCount} pending · ${stats.failedCount} failed`}
          color="#6c8af5"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
        />
        <KpiCard
          value={stats.totalUsers}
          label="Total Users"
          sub={`${stats.activeUsers} active · ${stats.notActive} inactive`}
          color="#b57bee"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.85"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <KpiCard
          value={stats.productCount}
          label="Active Products"
          sub={`${stats.systemCount} systems`}
          color="#f5b86c"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
        />
      </div>

      {/* ── Row 2: Monthly revenue + Donut + Stats ── */}
      <div className="ovRow2" data-depth="0.05">

        {/* Monthly revenue bar chart */}
        <div className="ovChartCard ovChartCardWide">
          <p className="ovChartLabel">Monthly Revenue (₱)</p>
          <BarChart bars={monthlyRevenue} height={160} />
        </div>

        {/* Donut — revenue by system */}
        <div className="ovChartCard">
          <p className="ovChartLabel">Revenue by System</p>
          <DonutChart data={donutData} />
        </div>

        {/* Stat column */}
        <div className="ovStatPanel">
          <p className="ovStatPanelTitle">Snapshot</p>
          <StatRow label="Visitors who registered" value={stats.visitorsRegistered} color="#63b3ed" />
          <StatRow label="Est. visitors"            value={stats.visitors}           />
          <StatRow label="Active users"             value={stats.activeUsers}        color="#68d391" />
          <StatRow label="Inactive users"           value={stats.notActive}          color="#fc8181" />
          <StatRow label="Paid orders"              value={stats.paidCount}          color="#6ee7b7" />
          <StatRow label="Pending orders"           value={stats.pendingCount}       color="#f5b86c" />
          <StatRow label="Failed orders"            value={stats.failedCount}        color="#f87171" />
          <StatRow label="Products"                 value={stats.productCount}       color="#f5b86c" />
          <StatRow label="Systems"                  value={stats.systemCount}        color="#c9a96e" />
        </div>
      </div>

      {/* ── Row 3: Order breakdown bar ─────────────── */}
      <div className="ovRow3" data-depth="0.07">
        <div className="ovChartCard ovChartCardWide">
          <p className="ovChartLabel">Order Status Breakdown</p>
          <BarChart bars={orderBreakdown} height={130} />
        </div>

        <div className="ovChartCard ovChartCardWide">
          <p className="ovChartLabel">Top Products by Sales (orders)</p>
          <BarChart
            bars={topProducts.length > 0
              ? topProducts
              : [{ label: "No data", value: 0, color: "#333" }]}
            height={130}
          />
        </div>
      </div>

    </div>
  );
}