// OverviewClient.tsx — Admin Overview page client component.
// Task 1 : Stat cards are position:sticky — they do NOT move on scroll.
// Task 2 : Overview nav item already uses IconAdmin (star) in Navbar.tsx.
// Task 3 : Overview page content is centered (max-width + margin:auto).
// Task 4 : Graph data comes from real DB via props passed from page.tsx.
// Task 5 : totalProducts and totalSystems are shown in dedicated stat cards.
"use client";

import React from "react";
import "./dashboard.css";

// ── Types ────────────────────────────────────────────────────────────

interface StatCardData {
  label: string;
  value: string | number;
  type: "registeredVisitors" | "visitors" | "notActiveUsers" | "activeUsers" | "totalUsers" | "totalProducts" | "totalSystems";
}

interface OverviewClientProps {
  visitorsWhoRegistered: number;
  visitors: number;
  notActiveUsers: number;
  activeUsers: number;
  totalUsers: number;
  totalProducts: number;
  totalSystems: number;
  departmentRevenue: { label: string; percent: number; color: string }[];
  seasonalRevenue: { label: string; value: number; color: string }[];
  productsReview: { month: string; heating: number; water: number; electricity: number }[];
  systemsReview: { month: string; heating: number; water: number; electricity: number }[];
}

// ── Donut Chart (SVG) ─────────────────────────────────────────────────
// Renders a pie/donut chart. Each slice is drawn as an SVG path arc.

function DonutChart({ slices }: { slices: { label: string; percent: number; color: string }[] }) {
  const radius      = 70;
  const cx          = 100;
  const cy          = 100;
  const strokeWidth = 30;

  let cumulativePercent = 0;
  const paths = slices.map((slice) => {
    const startAngle = cumulativePercent * 3.6 - 90;
    cumulativePercent += slice.percent;
    const endAngle = cumulativePercent * 3.6 - 90;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(endAngle));
    const y2 = cy + radius * Math.sin(toRad(endAngle));
    const largeArc = slice.percent > 50 ? 1 : 0;

    return (
      <path
        key={slice.label}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={slice.color}
        className="donutSlice"
      />
    );
  });

  return (
    <svg viewBox="0 0 200 200" width="200" height="200" className="donutSvg">
      {paths}
      <circle cx={cx} cy={cy} r={radius - strokeWidth} fill="var(--shell-bg, #0d0d0d)" />
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────
// Renders a vertical bar chart for seasonal revenue data.

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div className="barChartWrapper">
      <div className="barChartYAxis">
        {[80, 60, 40, 20, 0].map((v) => (
          <span key={v} className="barChartYLabel">{v}</span>
        ))}
      </div>
      <div className="barChartBars">
        {data.map((item) => (
          <div key={item.label} className="barChartBarGroup">
            <div
              className="barChartBar"
              style={{ height: `${(item.value / 80) * 100}%`, background: item.color }}
            />
            <span className="barChartXLabel">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stacked Bar Chart ─────────────────────────────────────────────────
// Renders a stacked vertical bar chart. Each bar = heating + water + electricity.

function StackedBarChart({
  data,
}: {
  data: { month: string; heating: number; water: number; electricity: number }[];
}) {
  const maxTotal = Math.max(...data.map((d) => d.heating + d.water + d.electricity));
  const chartMax = Math.ceil(maxTotal / 10) * 10 || 50;

  return (
    <div className="stackedBarWrapper">
      <div className="stackedBarYAxis">
        {[50, 40, 30, 20, 10, 0].map((v) => (
          <span key={v} className="stackedBarYLabel">{v}</span>
        ))}
      </div>
      <div className="stackedBarBars">
        {data.map((item) => {
          const total = item.heating + item.water + item.electricity;
          return (
            <div key={item.month} className="stackedBarGroup">
              <div className="stackedBar" style={{ height: `${(total / chartMax) * 100}%` }}>
                <div className="stackedSegment stackedSegmentHeating"     style={{ flex: item.heating     }} />
                <div className="stackedSegment stackedSegmentWater"       style={{ flex: item.water       }} />
                <div className="stackedSegment stackedSegmentElectricity" style={{ flex: item.electricity }} />
              </div>
              <span className="stackedBarXLabel">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────
// Displays a single metric with an icon, value, and label.

function StatCard({ label, value, type }: StatCardData) {
  const iconMap: Record<StatCardData["type"], React.ReactNode> = {
    registeredVisitors: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.85" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    visitors: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    notActiveUsers: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    activeUsers: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    totalUsers: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-4-4H19" /><path d="M17 3.34a4 4 0 0 1 0 7.32" />
      </svg>
    ),
    totalProducts: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    totalSystems: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="9" height="9" rx="2" /><rect x="13" y="3" width="9" height="9" rx="2" />
        <rect x="2" y="13" width="9" height="9" rx="2" /><rect x="13" y="13" width="9" height="9" rx="2" />
      </svg>
    ),
  };

  return (
    <div className={`overviewStatCard overviewStatCard--${type}`}>
      <div className="overviewStatCardIcon">{iconMap[type]}</div>
      <div className="overviewStatCardBody">
        <p className="overviewStatCardValue">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="overviewStatCardLabel">{label}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function OverviewClient({
  visitorsWhoRegistered,
  visitors,
  notActiveUsers,
  activeUsers,
  totalUsers,
  totalProducts,
  totalSystems,
  departmentRevenue,
  seasonalRevenue,
  productsReview,
  systemsReview,
}: OverviewClientProps) {

  // Task 5 — all 7 stat cards including live product + system counts
  const statCards: StatCardData[] = [
    { label: "visitors who registered", value: visitorsWhoRegistered, type: "registeredVisitors" },
    { label: "visitors",                value: visitors,               type: "visitors"           },
    { label: "Not-active users",        value: notActiveUsers,         type: "notActiveUsers"     },
    { label: "Active Users",            value: activeUsers,            type: "activeUsers"        },
    { label: "total users",             value: totalUsers,             type: "totalUsers"         },
    { label: "registered products",     value: totalProducts,          type: "totalProducts"      },
    { label: "registered systems",      value: totalSystems,           type: "totalSystems"       },
  ];

  return (
    // Task 3 — centered with max-width + auto margins
    <div className="newOverviewPage">

      {/* ── Page header ── */}
      <div className="newOverviewHeader">
        <h1 className="newOverviewTitle">Overview</h1>
        <p className="newOverviewSubtitle">Your shop at a glance</p>
      </div>

      {/* ── Main chart + stat cards row ── */}
      <div className="newOverviewMainRow">

        {/* Left: donut + seasonal bar chart */}
        <div className="newOverviewChartsPanel">

          <div className="newChartCard newChartCardDonut">
            <div className="donutChartArea">
              <DonutChart slices={departmentRevenue} />
              <ul className="donutLegend">
                {departmentRevenue.map((slice) => (
                  <li key={slice.label} className="donutLegendItem">
                    <span className="donutLegendDot" style={{ background: slice.color }} />
                    <span className="donutLegendLabel">{slice.label}</span>
                    <span className="donutLegendPercent">{slice.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="newChartTitle">Monthly Revenue from systems and products</p>
          </div>

          <div className="newChartCard newChartCardBar">
            <BarChart data={seasonalRevenue} />
            <p className="newChartTitle">Weekly revenue from systems and products</p>
          </div>
        </div>

        {/* Right: stat cards — Task 1: position sticky, does NOT scroll */}
        <div className="newOverviewStatCards">
          {statCards.map((card) => (
            <StatCard key={card.type} {...card} />
          ))}
        </div>
      </div>

      {/* ── Stacked bar charts row — live from DB ── */}
      <div className="newOverviewStackedRow">

        <div className="newChartCard">
          <div className="stackedLegend">
            <span className="stackedLegendItem"><span className="stackedLegendDot stackedLegendDotHeating" /> Heating</span>
            <span className="stackedLegendItem"><span className="stackedLegendDot stackedLegendDotWater" /> Water</span>
            <span className="stackedLegendItem"><span className="stackedLegendDot stackedLegendDotElectricity" /> Electricity</span>
          </div>
          <StackedBarChart data={productsReview} />
          <p className="newChartTitle">Products review</p>
        </div>

        <div className="newChartCard">
          <div className="stackedLegend">
            <span className="stackedLegendItem"><span className="stackedLegendDot stackedLegendDotHeating" /> Heating</span>
            <span className="stackedLegendItem"><span className="stackedLegendDot stackedLegendDotWater" /> Water</span>
            <span className="stackedLegendItem"><span className="stackedLegendDot stackedLegendDotElectricity" /> Electricity</span>
          </div>
          <StackedBarChart data={systemsReview} />
          <p className="newChartTitle">Systems review</p>
        </div>
      </div>

    </div>
  );
}