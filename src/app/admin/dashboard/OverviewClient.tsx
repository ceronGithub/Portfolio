// OverviewClient.tsx — Admin Overview dashboard.
// Single scrollable page layout. No scroll-snap panels.
// Row 1: Page header + KPI stat cards (horizontal strip).
// Row 2: 2x2 chart grid — monthly systems, monthly products, weekly systems, weekly products.
// Entrance animations via IntersectionObserver. GPU-accelerated transforms only.

"use client";

import { useEffect, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface RevenuePoint { label: string; value: number; }

interface Stats {
  visitorsRegistered: number; visitors: number; notActive: number;
  activeUsers: number; totalUsers: number; totalRevenue: number;
  productCount: number; orderCount: number; systemCount: number;
}

interface OverviewClientProps {
  stats: Stats;
  monthlyRevenueSystems:  RevenuePoint[];
  monthlyRevenueProducts: RevenuePoint[];
  weeklyRevenueSystems:   RevenuePoint[];
  weeklyRevenueProducts:  RevenuePoint[];
}

// ── Color tokens ───────────────────────────────────────────────────────────
const COLOR_SYSTEMS  = "#6c8af5";
const COLOR_PRODUCTS = "#f5b86c";
const COLOR_GRID     = "rgba(255,255,255,0.06)";
const COLOR_LABEL    = "rgba(255,255,255,0.32)";
const COLOR_VALUE    = "rgba(255,255,255,0.72)";

// ── formatPeso — compact peso string (e.g. 12500 → "₱12.5k") ──────────────
function formatPeso(value: number): string {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `₱${(value / 1_000).toFixed(1)}k`;
  return `₱${value.toLocaleString("en-PH")}`;
}

// ── useReveal — IntersectionObserver entrance animation ────────────────────
// Adds "ovVisible" class when the element enters the viewport.
function useReveal() {
  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("ovVisible"); },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return elementRef;
}

// ── BarChart ───────────────────────────────────────────────────────────────
// SVG bar chart. Shows Y-grid, value labels above bars, X labels below.
// Ghost track behind each bar for depth. Top glow cap on filled bars.
function BarChart({
  data, color, title, subtitle,
}: {
  data: RevenuePoint[]; color: string; title: string; subtitle: string;
}) {
  const revealRef   = useReveal();
  const maximumValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight  = 140;
  const barWidth     = 32;
  const barGap       = 16;
  const paddingLeft  = 38;
  const totalWidth   = paddingLeft + data.length * (barWidth + barGap) - barGap + 8;

  // Round grid step to nearest 100 for clean Y-axis labels
  const gridStep = Math.ceil(maximumValue / 4 / 100) * 100 || 1;
  const gridValues = [0, gridStep, gridStep * 2, gridStep * 3, gridStep * 4]
    .filter(v => v <= maximumValue * 1.15);

  const hasData = data.some(d => d.value > 0);

  return (
    <div className="ovChartCard ovReveal" ref={revealRef}>
      {/* Card header */}
      <div className="ovChartCardHeader">
        <div>
          <p className="ovChartCardTitle">{title}</p>
          <p className="ovChartCardSub">{subtitle}</p>
        </div>
        <div className="ovChartColorDot" style={{ background: color }} />
      </div>

      {/* Chart body */}
      {!hasData ? (
        <div className="ovChartEmpty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M18 20V10M12 20V4M6 20v-6"
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="ovChartEmptyText">No revenue recorded yet</span>
        </div>
      ) : (
        <div className="ovChartSvgWrap">
          <svg viewBox={`0 0 ${totalWidth} ${chartHeight + 44}`} className="ovBarSvg">

            {/* Y-axis grid lines + labels */}
            {gridValues.map(gridValue => {
              const yPos = chartHeight - (gridValue / (gridStep * 4)) * chartHeight;
              return (
                <g key={gridValue}>
                  <line
                    x1={paddingLeft} y1={yPos} x2={totalWidth} y2={yPos}
                    stroke={COLOR_GRID} strokeWidth="1"
                  />
                  <text x={paddingLeft - 6} y={yPos + 3.5}
                    textAnchor="end" fill={COLOR_LABEL} fontSize="7.5">
                    {gridValue >= 1000 ? `${(gridValue / 1000).toFixed(0)}k` : gridValue}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((point, i) => {
              const barHeight = Math.max((point.value / (gridStep * 4)) * chartHeight, 0);
              const xPos      = paddingLeft + i * (barWidth + barGap);
              const yPos      = chartHeight - barHeight;
              return (
                <g key={i}>
                  {/* Ghost track */}
                  <rect x={xPos} y={0} width={barWidth} height={chartHeight}
                    rx="4" fill="rgba(255,255,255,0.025)" />
                  {/* Main bar */}
                  <rect x={xPos} y={yPos} width={barWidth} height={barHeight}
                    rx="4" fill={color} opacity={barHeight < 2 ? 0.12 : 0.78} />
                  {/* Top glow cap */}
                  {barHeight > 8 && (
                    <rect x={xPos} y={yPos} width={barWidth} height={5}
                      rx="4" fill={color} opacity={0.38} />
                  )}
                  {/* Value label */}
                  {point.value > 0 && (
                    <text x={xPos + barWidth / 2} y={yPos - 6}
                      textAnchor="middle" fill={COLOR_VALUE} fontSize="8" fontWeight="600">
                      {point.value >= 1000
                        ? `${(point.value / 1000).toFixed(1)}k`
                        : point.value}
                    </text>
                  )}
                  {/* X label */}
                  <text x={xPos + barWidth / 2} y={chartHeight + 17}
                    textAnchor="middle" fill={COLOR_LABEL} fontSize="9">
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

// ── KpiCard — single metric tile ───────────────────────────────────────────
// Large value, small label, left accent color bar.
function KpiCard({
  value, label, accentColor, index,
}: {
  value: string | number; label: string; accentColor: string; index: number;
}) {
  const revealRef = useReveal();
  return (
    <div
      className="ovKpiCard ovReveal"
      ref={revealRef}
      style={{ transitionDelay: `${index * 0.06}s` }}
    >
      <div className="ovKpiAccentBar" style={{ background: accentColor }} />
      <span className="ovKpiValue">{value}</span>
      <span className="ovKpiLabel">{label}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
// Single-scroll page. KPI strip at top. 2x2 chart grid below.
export default function OverviewClient({
  stats,
  monthlyRevenueSystems,
  monthlyRevenueProducts,
  weeklyRevenueSystems,
  weeklyRevenueProducts,
}: OverviewClientProps) {
  const headerRef = useReveal();

  const kpiItems = [
    { value: stats.activeUsers,           label: "active users",       accentColor: COLOR_SYSTEMS  },
    { value: stats.totalUsers,            label: "total registered",   accentColor: "rgba(255,255,255,0.18)" },
    { value: stats.notActive,             label: "not yet active",     accentColor: "rgba(248,113,113,0.55)" },
    { value: stats.productCount,          label: "products",           accentColor: COLOR_PRODUCTS },
    { value: stats.systemCount,           label: "systems",            accentColor: "#a78bfa"      },
    { value: formatPeso(stats.totalRevenue), label: "total revenue",   accentColor: "#34d399"      },
  ];

  return (
    <div className="ovPage">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="ovPageHeader ovReveal" ref={headerRef}>
        <div>
          <span className="ovPageEyebrow">Admin</span>
          <h1 className="ovPageTitle">Overview</h1>
        </div>
        <p className="ovPageDate">
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* ── KPI strip — 6 cards horizontal ──────────────────────────── */}
      <div className="ovKpiStrip">
        {kpiItems.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            value={kpi.value}
            label={kpi.label}
            accentColor={kpi.accentColor}
            index={i}
          />
        ))}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="ovDivider" />

      {/* ── Chart grid: 2 columns × 2 rows ──────────────────────────── */}
      <div className="ovChartSection">
        <div className="ovChartSectionHeader">
          <span className="ovChartSectionEyebrow">Revenue</span>
          <h2 className="ovChartSectionTitle">Monthly performance</h2>
        </div>
        <div className="ovChartGrid">
          <BarChart
            data={monthlyRevenueSystems}
            color={COLOR_SYSTEMS}
            title="Systems"
            subtitle="Monthly revenue"
          />
          <BarChart
            data={monthlyRevenueProducts}
            color={COLOR_PRODUCTS}
            title="Products"
            subtitle="Monthly revenue"
          />
        </div>
      </div>

      <div className="ovChartSection">
        <div className="ovChartSectionHeader">
          <span className="ovChartSectionEyebrow">Breakdown</span>
          <h2 className="ovChartSectionTitle">Last 6 weeks</h2>
        </div>
        <div className="ovChartGrid">
          <BarChart
            data={weeklyRevenueSystems}
            color={COLOR_SYSTEMS}
            title="Systems"
            subtitle="Weekly revenue"
          />
          <BarChart
            data={weeklyRevenueProducts}
            color={COLOR_PRODUCTS}
            title="Products"
            subtitle="Weekly revenue"
          />
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div className="ovLegend">
        <div className="ovLegendItem">
          <div className="ovLegendDot" style={{ background: COLOR_SYSTEMS }} />
          <span>Systems</span>
        </div>
        <div className="ovLegendItem">
          <div className="ovLegendDot" style={{ background: COLOR_PRODUCTS }} />
          <span>Products</span>
        </div>
      </div>

    </div>
  );
}