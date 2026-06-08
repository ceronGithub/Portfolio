// OverviewClient.tsx — Admin Overview dashboard.
// Single scrollable page layout. No scroll-snap panels.
// Row 1: Page header + KPI stat cards (horizontal strip).
// Row 2: 2x2 chart grid — monthly systems, monthly products, weekly systems, weekly products.
// Entrance animations via IntersectionObserver. GPU-accelerated transforms only.

"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminNotifications } from "@/app/admin/hooks/useAdminNotifications";

// ── Types ──────────────────────────────────────────────────────────────────
interface RevenuePoint { label: string; value: number; }

interface Stats {
  visitorsRegistered: number; visitors: number; notActive: number;
  activeUsers: number; totalUsers: number; totalRevenue: number;
  productCount: number; orderCount: number; systemCount: number;
  appointmentCount: number;
}

interface ConversionFunnel { visits: number; registered: number; paid: number; }

interface PendingAppointment {
  id: string; referenceNo: string; buyerName: string;
  systemTitle: string; quotedPrice: number; scheduledDate: string; status: string;
}

interface OverviewClientProps {
  stats: Stats;
  monthlyRevenueSystems:  RevenuePoint[];
  monthlyRevenueProducts: RevenuePoint[];
  weeklyRevenueSystems:   RevenuePoint[];
  weeklyRevenueProducts:  RevenuePoint[];
  dailySiteVisits:        RevenuePoint[];
  conversionFunnel:       ConversionFunnel;
  pendingAppointments:    PendingAppointment[];
}

// ── Color tokens ───────────────────────────────────────────────────────────
// COLOR_SYSTEMS / COLOR_PRODUCTS are always vibrant — theme-independent.
// COLOR_GRID / COLOR_LABEL / COLOR_VALUE reference SVG fill strings;
// these are resolved at render time via CSS vars injected on the SVG element.
const COLOR_SYSTEMS  = "#6c8af5";
const COLOR_PRODUCTS = "#f5b86c";
const COLOR_GRID     = "var(--ov-grid)";
const COLOR_LABEL    = "var(--ov-label)";
const COLOR_VALUE    = "var(--ov-value)";

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

// ── Analytics helpers ─────────────────────────────────────────────────────
function computeChartAnalytics(data: RevenuePoint[]): {
  total: number; average: number; peakValue: number; peakLabel: string; growth: number | null;
} {
  if (data.length === 0) return { total: 0, average: 0, peakValue: 0, peakLabel: "—", growth: null };
  const total   = data.reduce((s, d) => s + d.value, 0);
  const average = Math.round(total / data.length);
  const peak    = data.reduce((best, d) => d.value > best.value ? d : best, data[0]);
  let growth: number | null = null;
  if (data.length >= 2) {
    const last = data[data.length - 1].value;
    const prev = data[data.length - 2].value;
    if (prev > 0)       growth = Math.round(((last - prev) / prev) * 100);
    else if (last > 0)  growth = 100;
    else                growth = 0;
  }
  return { total, average, peakValue: peak.value, peakLabel: peak.label, growth };
}

function formatPesoCompact(v: number): string {
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₱${(v / 1_000).toFixed(1)}k`;
  return `₱${v.toLocaleString("en-PH")}`;
}

// ── AnalyticsBar — summary strip shown above the SVG chart ────────────────
function AnalyticsBar({ data, color }: { data: RevenuePoint[]; color: string }) {
  const { total, average, peakValue, peakLabel, growth } = computeChartAnalytics(data);
  const hasData = total > 0;

  return (
    <div className="ovAnalyticsBar">
      <div className="ovAnalyticsStat">
        <span className="ovAnalyticsLabel">Total</span>
        <span className="ovAnalyticsValue" style={{ color: hasData ? color : undefined }}>
          {hasData ? formatPesoCompact(total) : "—"}
        </span>
      </div>
      <div className="ovAnalyticsDivider" />
      <div className="ovAnalyticsStat">
        <span className="ovAnalyticsLabel">Average</span>
        <span className="ovAnalyticsValue">{hasData ? formatPesoCompact(average) : "—"}</span>
      </div>
      <div className="ovAnalyticsDivider" />
      <div className="ovAnalyticsStat">
        <span className="ovAnalyticsLabel">Peak</span>
        <span className="ovAnalyticsValue">
          {hasData ? `${formatPesoCompact(peakValue)} (${peakLabel})` : "—"}
        </span>
      </div>
      {growth !== null && (
        <>
          <div className="ovAnalyticsDivider" />
          <div className="ovAnalyticsStat">
            <span className="ovAnalyticsLabel">vs last period</span>
            <span
              className="ovAnalyticsValue"
              style={{ color: growth >= 0 ? "#68d391" : "#fc8181" }}
            >
              {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
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

      {/* Analytics summary strip */}
      <AnalyticsBar data={data} color={color} />

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
// ── NotifFeed — actionable notification summary card ──────────────────────
// Shows counts for pending orders, unread messages, pending inquiries, new reviews.
// Each row is a link to the relevant admin page.
function NotifFeed({ counts }: { counts: ReturnType<typeof useAdminNotifications> }) {
  const revealRef = useReveal();

  const items = [
    { label: "Pending orders",      count: counts.orders,    href: "/admin/orders",       color: "#f5b86c" },
    { label: "Unread messages",     count: counts.messages,  href: "/admin/inquiries",    color: "#6c8af5" },
    { label: "Pending inquiries",   count: counts.inquiries, href: "/admin/inquiries",    color: "#a78bfa" },
    { label: "New reviews (7 days)", count: counts.reviews,  href: "/admin/reviews",      color: "#34d399" },
  ];

  return (
    <div className="ovNotifCard ovReveal" ref={revealRef}>
      <div className="ovNotifHeader">
        <div>
          <span className="ovPageEyebrow">Attention</span>
          <h2 className="ovNotifTitle">Notifications</h2>
        </div>
        {counts.total > 0 && (
          <span className="ovNotifTotalBadge">{counts.total} unread</span>
        )}
      </div>
      <div className="ovNotifList">
        {items.map(item => (
          <a key={item.label} href={item.href} className="ovNotifRow">
            <span className="ovNotifDot" style={{ background: item.color }} />
            <span className="ovNotifLabel">{item.label}</span>
            <span
              className="ovNotifCount"
              style={{ color: item.count > 0 ? item.color : "var(--ov-label)" }}
            >
              {item.count}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: 0.3, flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── LineChart — SVG line chart for daily site visits ──────────────────────
// Renders a smooth polyline with area fill, Y-grid, X labels.
function LineChart({
  data, color, title, subtitle,
}: {
  data: RevenuePoint[]; color: string; title: string; subtitle: string;
}) {
  const revealRef    = useReveal();
  const chartHeight  = 120;
  const paddingLeft  = 38;
  const paddingRight = 8;
  const pointGap     = 36;
  const totalWidth   = paddingLeft + (data.length - 1) * pointGap + paddingRight;
  const maxValue     = Math.max(...data.map(d => d.value), 1);
  const gridStep     = Math.ceil(maxValue / 4) || 1;
  const gridValues   = [0, gridStep, gridStep * 2, gridStep * 3, gridStep * 4]
    .filter(v => v <= maxValue * 1.2);
  const hasData      = data.some(d => d.value > 0);

  // Convert data points to SVG coordinates
  const points = data.map((d, i) => ({
    x: paddingLeft + i * pointGap,
    y: chartHeight - (d.value / (gridStep * 4)) * chartHeight,
    value: d.value,
    label: d.label,
  }));

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(" ");
  const areaPoints = [
    `${points[0].x},${chartHeight}`,
    ...points.map(p => `${p.x},${p.y}`),
    `${points[points.length - 1].x},${chartHeight}`,
  ].join(" ");

  // Only show every 3rd label to avoid crowding
  const showLabel = (i: number) => i % 3 === 0 || i === data.length - 1;

  return (
    <div className="ovChartCard ovReveal" ref={revealRef}>
      <div className="ovChartCardHeader">
        <div>
          <p className="ovChartCardTitle">{title}</p>
          <p className="ovChartCardSub">{subtitle}</p>
        </div>
        <div className="ovChartColorDot" style={{ background: color }} />
      </div>

      <AnalyticsBar data={data} color={color} />

      {!hasData ? (
        <div className="ovChartEmpty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 3v18h18" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M7 16l4-4 4 4 4-6" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ovChartEmptyText">No visit data yet</span>
        </div>
      ) : (
        <div className="ovChartSvgWrap">
          <svg viewBox={`0 0 ${totalWidth} ${chartHeight + 44}`} className="ovBarSvg">
            <defs>
              <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Y-grid */}
            {gridValues.map(gridValue => {
              const yPos = chartHeight - (gridValue / (gridStep * 4)) * chartHeight;
              return (
                <g key={gridValue}>
                  <line x1={paddingLeft} y1={yPos} x2={totalWidth} y2={yPos}
                    stroke={COLOR_GRID} strokeWidth="1" />
                  <text x={paddingLeft - 6} y={yPos + 3.5}
                    textAnchor="end" fill={COLOR_LABEL} fontSize="7.5">
                    {gridValue}
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <polygon points={areaPoints} fill="url(#lineAreaGrad)" />

            {/* Line */}
            <polyline points={polylinePoints}
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill={color} opacity={p.value > 0 ? 0.9 : 0.2} />
                {p.value > 0 && (
                  <text x={p.x} y={p.y - 7}
                    textAnchor="middle" fill={COLOR_VALUE} fontSize="7.5" fontWeight="600">
                    {p.value}
                  </text>
                )}
                {showLabel(i) && (
                  <text x={p.x} y={chartHeight + 17}
                    textAnchor="middle" fill={COLOR_LABEL} fontSize="8">
                    {p.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

// ── ConversionFunnelCard — visits → registered → paid funnel ──────────────
// Shows 3 stages with bar widths proportional to count, drop-off % between stages.
function ConversionFunnelCard({ funnel }: { funnel: ConversionFunnel }) {
  const revealRef = useReveal();
  const stages = [
    { label: "Site Visits",   value: funnel.visits,     color: "#60a5fa" },
    { label: "Registered",    value: funnel.registered, color: "#a78bfa" },
    { label: "Paid Orders",   value: funnel.paid,       color: "#34d399" },
  ];
  const maxValue = Math.max(funnel.visits, 1);

  return (
    <div className="ovChartCard ovFunnelCard ovReveal" ref={revealRef}>
      <div className="ovChartCardHeader">
        <div>
          <p className="ovChartCardTitle">Conversion Funnel</p>
          <p className="ovChartCardSub">Visits → Registered → Paid</p>
        </div>
        <div className="ovChartColorDot" style={{ background: "#34d399" }} />
      </div>

      <div className="ovFunnelBody">
        {stages.map((stage, i) => {
          const widthPct  = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const prevValue = i > 0 ? stages[i - 1].value : null;
          const dropOff   = prevValue != null && prevValue > 0
            ? Math.round(((prevValue - stage.value) / prevValue) * 100)
            : null;

          return (
            <div key={stage.label} className="ovFunnelRow">
              {dropOff !== null && (
                <div className="ovFunnelDropOff">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M2 6l3 3 3-3" stroke="rgba(255,255,255,0.2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="ovFunnelDropLabel">−{dropOff}% drop-off</span>
                </div>
              )}
              <div className="ovFunnelStage">
                <div className="ovFunnelBarWrap">
                  <div
                    className="ovFunnelBar"
                    style={{ width: `${widthPct}%`, background: stage.color }}
                  />
                </div>
                <div className="ovFunnelMeta">
                  <span className="ovFunnelLabel">{stage.label}</span>
                  <span className="ovFunnelValue" style={{ color: stage.color }}>
                    {stage.value.toLocaleString("en-PH")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Conversion rate summary */}
        <div className="ovFunnelRate">
          <span className="ovFunnelRateLabel">Overall conversion</span>
          <span className="ovFunnelRateValue" style={{ color: "#34d399" }}>
            {funnel.visits > 0
              ? `${((funnel.paid / funnel.visits) * 100).toFixed(1)}%`
              : "—"
            }
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OverviewClient({
  stats,
  monthlyRevenueSystems,
  monthlyRevenueProducts,
  weeklyRevenueSystems,
  weeklyRevenueProducts,
  dailySiteVisits,
  conversionFunnel,
  pendingAppointments,
}: OverviewClientProps) {
  const headerRef = useReveal();
  const notif = useAdminNotifications(true);

  const kpiItems = [
    { value: stats.visitors,              label: "website visitors",   accentColor: "#60a5fa"      },
    { value: stats.activeUsers,           label: "active users",       accentColor: COLOR_SYSTEMS  },
    { value: stats.totalUsers,            label: "total registered",   accentColor: "rgba(255,255,255,0.18)" },
    { value: stats.notActive,             label: "not yet active",     accentColor: "rgba(248,113,113,0.55)" },
    { value: stats.productCount,          label: "products",           accentColor: COLOR_PRODUCTS },
    { value: stats.systemCount,           label: "systems",            accentColor: "#a78bfa"      },
    { value: stats.appointmentCount,      label: "appointments",       accentColor: "#f6ad55"      },
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

      {/* ── Notification feed ─────────────────────────────────────────── */}
      <NotifFeed counts={notif} />

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

      {/* ── Site visits trend — last 14 days ──────────────────────── */}
      <div className="ovChartSection">
        <div className="ovChartSectionHeader">
          <span className="ovChartSectionEyebrow">Traffic</span>
          <h2 className="ovChartSectionTitle">Site visits — last 14 days</h2>
        </div>
        <div className="ovChartGrid ovChartGridSingle">
          <LineChart
            data={dailySiteVisits}
            color="#60a5fa"
            title="Daily Unique Visitors"
            subtitle="Fingerprinted by IP + UA"
          />
        </div>
      </div>

      {/* ── Conversion funnel ─────────────────────────────────────── */}
      <div className="ovChartSection">
        <div className="ovChartSectionHeader">
          <span className="ovChartSectionEyebrow">Funnel</span>
          <h2 className="ovChartSectionTitle">Visitor → Buyer conversion</h2>
        </div>
        <div className="ovChartGrid ovChartGridSingle">
          <ConversionFunnelCard funnel={conversionFunnel} />
        </div>
      </div>

      {/* ── Pending Appointments ──────────────────────────────────── */}
      {pendingAppointments.length > 0 && (
        <div className="ovChartSection">
          <div className="ovChartSectionHeader">
            <span className="ovChartSectionEyebrow">Consultations</span>
            <h2 className="ovChartSectionTitle">Pending appointments</h2>
          </div>
          <div className="ovAppointmentList">
            {pendingAppointments.map(a => {
              const [year, month, day] = a.scheduledDate.split("-").map(Number);
              const dateLabel = new Date(year, month - 1, day).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
              return (
                <div key={a.id} className="ovAppointmentRow">
                  <div className="ovAppointmentLeft">
                    <span className="ovAppointmentSystem">{a.systemTitle}</span>
                    <span className="ovAppointmentBuyer">{a.buyerName}</span>
                  </div>
                  <div className="ovAppointmentRight">
                    <span className="ovAppointmentDate">{dateLabel}</span>
                    <span className="ovAppointmentPrice">{"₱" + a.quotedPrice.toLocaleString("en-PH")}</span>
                    <span className="ovAppointmentRef">{a.referenceNo}</span>
                  </div>
                </div>
              );
            })}
            <a href="/admin/appointments" className="ovAppointmentViewAll">View all appointments →</a>
          </div>
        </div>
      )}

    </div>
  );
}