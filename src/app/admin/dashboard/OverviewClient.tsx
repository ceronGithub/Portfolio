// OverviewClient.tsx — Admin Overview. Single page layout (no duplicate panels).
// Left: Donut + Bar chart. Right: single stat card column.
// Below: two stacked bar charts side by side.
// Parallax on scroll. Inter font.
"use client";

import { useEffect, useRef } from "react";
import "./dashboard.css";

const COLORS = ["#6c8af5", "#b57bee", "#f5b86c", "#f5d46c"];

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
}

interface Props {
  stats:           Stats;
  revenueBySystem: { name: string; value: number }[];
}

// ── Donut ─────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 90; const cy = 90; const r = 68; const stroke = 22;
  const circ = 2 * Math.PI * r;
  let cum = 0;
  const arcs = data.map(d => {
    const pct = d.value / total;
    const dash = pct * circ;
    const offset = -cum * circ;
    cum += pct;
    return { ...d, dash, gap: circ - dash, offset };
  });
  return (
    <div className="ovDonutWrap">
      <svg viewBox="0 0 180 180" className="ovDonutSvg">
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={a.color} strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={a.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt" />
        ))}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="var(--shell-bg,#0d0d0d)" />
      </svg>
      <ul className="ovDonutLegend">
        {data.map((d, i) => (
          <li key={i} className="ovDonutLegendItem">
            <span className="ovDonutDot" style={{ background: d.color }} />
            <span className="ovDonutName">{d.name}</span>
            <span className="ovDonutPct">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────
function BarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="ovBarWrap">
      <div className="ovBarYAxis">
        {[80, 60, 40, 20, 0].map(v => <span key={v}>{v}</span>)}
      </div>
      <div className="ovBarBars">
        {bars.map((b, i) => (
          <div key={i} className="ovBarGroup">
            <div className="ovBar" style={{ height: `${(b.value / 80) * 100}%`, background: b.color }} />
            <span className="ovBarLabel">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stacked Bar Chart ─────────────────────────────────────────────────
function StackedBarChart({
  bars, title, legend,
}: {
  bars:   { label: string; segments: { value: number; color: string }[] }[];
  title:  string;
  legend: { label: string; color: string }[];
}) {
  const max = Math.max(...bars.map(b => b.segments.reduce((s, sg) => s + sg.value, 0)), 1);
  return (
    <div className="ovStackedWrap">
      <div className="ovStackedLegend">
        {legend.map((l, i) => (
          <span key={i} className="ovStackedLegendItem">
            <span className="ovStackedDot" style={{ background: l.color }} />{l.label}
          </span>
        ))}
      </div>
      <div className="ovStackedBars">
        <div className="ovStackedYAxis">
          {[50, 40, 30, 20, 10, 0].map(v => <span key={v}>{v}</span>)}
        </div>
        <div className="ovStackedBarArea">
          {bars.map((b, i) => {
            const total = b.segments.reduce((s, sg) => s + sg.value, 0);
            return (
              <div key={i} className="ovStackedBarGroup">
                <div className="ovStackedBar" style={{ height: `${(total / max) * 100}%` }}>
                  {[...b.segments].reverse().map((sg, j) => (
                    <div key={j} className="ovStackedSeg"
                      style={{ flex: sg.value, background: sg.color }} />
                  ))}
                </div>
                <span className="ovStackedLabel">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="ovStackedTitle">{title}</p>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ value, label, color = "#e8e4de" }: {
  value: string | number; label: string; color?: string;
}) {
  return (
    <div className="ovStatCard">
      <span className="ovStatValue" style={{ color }}>{value}</span>
      <span className="ovStatLabel">{label}</span>
    </div>
  );
}

// ── Parallax ──────────────────────────────────────────────────────────
function useParallax() {
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-parallax]");
    function onScroll() {
      const y = window.scrollY;
      sections.forEach((el, i) => {
        const depth = parseFloat(el.dataset.parallax ?? "0.06");
        el.style.transform = `translateY(${y * depth * (i % 2 === 0 ? 1 : -1)}px)`;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

// ── Main ──────────────────────────────────────────────────────────────
export default function OverviewClient({ stats, revenueBySystem }: Props) {
  useParallax();

  const donutData = revenueBySystem.length > 0
    ? revenueBySystem.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))
    : [
        { name: "Sales",     value: 55, color: COLORS[0] },
        { name: "Finance",   value: 25, color: COLORS[1] },
        { name: "Marketing", value: 15, color: COLORS[2] },
        { name: "HR",        value:  5, color: COLORS[3] },
      ];

  const seasonalBars = [
    { label: "Winter", value: 60, color: COLORS[0] },
    { label: "Spring", value: 45, color: COLORS[1] },
    { label: "Summer", value: 78, color: COLORS[2] },
    { label: "Fall",   value: 30, color: COLORS[3] },
  ];

  const legend = [
    { label: "Heating",     color: COLORS[0] },
    { label: "Water",       color: COLORS[1] },
    { label: "Electricity", color: COLORS[2] },
  ];

  const productBars = [
    { label: "Jan", segments: [{ value: 24, color: COLORS[0] }, { value: 15, color: COLORS[1] }, { value: 8,  color: COLORS[2] }] },
    { label: "Feb", segments: [{ value: 16, color: COLORS[0] }, { value: 14, color: COLORS[1] }, { value: 10, color: COLORS[2] }] },
    { label: "Mar", segments: [{ value: 12, color: COLORS[0] }, { value: 10, color: COLORS[1] }, { value: 8,  color: COLORS[2] }] },
    { label: "Apr", segments: [{ value: 8,  color: COLORS[0] }, { value: 7,  color: COLORS[1] }, { value: 5,  color: COLORS[2] }] },
  ];

  const systemBars = [
    { label: "Jan", segments: [{ value: 24, color: COLORS[0] }, { value: 16, color: COLORS[1] }, { value: 7,  color: COLORS[2] }] },
    { label: "Feb", segments: [{ value: 16, color: COLORS[0] }, { value: 14, color: COLORS[1] }, { value: 10, color: COLORS[2] }] },
    { label: "Mar", segments: [{ value: 11, color: COLORS[0] }, { value: 11, color: COLORS[1] }, { value: 8,  color: COLORS[2] }] },
    { label: "Apr", segments: [{ value: 8,  color: COLORS[0] }, { value: 7,  color: COLORS[1] }, { value: 5,  color: COLORS[2] }] },
  ];

  return (
    <div className="ovPage">

      {/* Header */}
      <div className="ovHeader">
        <h1 className="ovTitle">Overview</h1>
        <p className="ovSubtitle">Your shop at a glance</p>
      </div>

      {/* Main row: charts + stat column */}
      <div className="ovMainRow" data-parallax="0.04">

        {/* Charts side */}
        <div className="ovChartsCol">
          <div className="ovChartCard">
            <DonutChart data={donutData} />
            <p className="ovChartTitle">Monthly Revenue from systems and products</p>
          </div>
          <div className="ovChartCard">
            <BarChart bars={seasonalBars} />
            <p className="ovChartTitle">Weekly revenue from systems and products</p>
          </div>
        </div>

        {/* Single stat column */}
        <div className="ovStatCol">
          <StatCard value={stats.visitorsRegistered} label="visitors who registered" color="#63b3ed" />
          <StatCard value={stats.visitors}           label="visitors"                color="#e8e4de" />
          <StatCard value={stats.notActive}          label="Not-active users"        color="#fc8181" />
          <StatCard value={stats.activeUsers}        label="Active Users"            color="#68d391" />
          <StatCard value={stats.totalUsers}         label="total users"             color="#e8e4de" />
          <StatCard value={stats.productCount}       label="Products"                color="#f6ad55" />
          <StatCard value={stats.systemCount}        label="Systems"                 color="#c9a96e" />
        </div>
      </div>

      {/* Stacked bar row */}
      <div className="ovStackedRow" data-parallax="0.07">
        <div className="ovChartCard">
          <StackedBarChart bars={productBars} title="Products review" legend={legend} />
        </div>
        <div className="ovChartCard">
          <StackedBarChart bars={systemBars} title="Systems review" legend={legend} />
        </div>
      </div>

    </div>
  );
}