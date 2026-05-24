// Visitor landing page — cinematic premium enterprise aesthetic.
// Apple x Linear x Stripe x luxury architecture studio.
// Sections: Hero, Trust, Systems, Process, About, CTA, Footer.
"use client";

import "./visitor.css";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";
import { ArchitectureIntroSection, ArchitectureVideosSection } from "./architecture";
import { ModelingIntro, ModelingMagazine } from "./modeling";
import { sanitize } from "@/lib/utils";

/* ─── Data ─────────────────────────────────────────────────────────── */

const techStack = [
  "Next.js", "PostgreSQL", "Prisma ORM", "GSAP", "Framer Motion",
  "AI Visual Systems", "Enterprise Infrastructure", "TypeScript",
];

const systems = [
  {
    tag: "Warehouse", title: "Warehouse Management System", price: "₱37,500", accent: "#7dc9a0",
    desc: "Industrial-grade stock control built for warehouse scale.",
    timeline: "8–10 weeks", deploy: "Web / IIS",
    features: ["Stock in / stock out with quantity tracking", "Product catalog with SKU & categories", "Basic supplier records & contact info", "Manual low-stock alert thresholds", "Stock movement history log", "Warehouse Staff & Admin user roles"],
  },
  {
    tag: "Construction", title: "Construction Project System", price: "₱45,000", accent: "#7eb8d4",
    desc: "Full project oversight engineered for construction enterprises.",
    timeline: "10–12 weeks", deploy: "Web / IIS",
    features: ["Project creation with start/end dates", "Task assignment & milestone tracking", "Basic budget input & expenditure logging", "Team & worker roster management", "Project status board (Kanban-style)", "Admin & Project Manager user roles"],
  },
  {
    tag: "Inventory", title: "Inventory Control System", price: "₱27,000", accent: "#8fc99a",
    desc: "Real-time stock visibility in one unified platform.",
    timeline: "6–8 weeks", deploy: "Web / Desktop",
    features: ["Real-time stock level tracking", "Product records with unit & category", "Low-stock alert with threshold setting", "Manual purchase order creation", "Stock adjustment & variance logging", "Admin & Staff user roles"],
  },
  {
    tag: "Finance", title: "Invoice & Emailing System", price: "₱18,000", accent: "#c4b5fd",
    desc: "Generate, send, and track invoices all in one flow.",
    timeline: "5–6 weeks", deploy: "Web",
    features: ["Professional invoice creation & numbering", "Manual email sending to clients", "Payment status tracking (Paid/Pending/Overdue)", "Client records & billing info", "Invoice line items with tax computation", "Admin user role with full access"],
  },
  {
    tag: "E-commerce", title: "POS + Mini E-commerce", price: "₱42,000", accent: "#f9a8d4",
    desc: "Sell in-store and online from one dashboard.",
    timeline: "9–11 weeks", deploy: "Web",
    features: ["In-store POS terminal (touch-friendly)", "Product catalog with categories & variants", "Cash & manual payment transactions", "Order history & receipt printing", "Stock deduction per sale", "Cashier & Admin user roles"],
  },
  {
    tag: "HR", title: "Payroll & HR System", price: "₱33,000", accent: "#67e8f9",
    desc: "BIR-compliant payroll and HR management in one place.",
    timeline: "8–11 weeks", deploy: "Web / IIS",
    features: ["Payroll computation (daily/monthly/weekly)", "Employee records & 201 file", "Payslip generation & printing", "Basic attendance & time logging", "Government deduction tracking (SSS/PhilHealth/Pag-IBIG)", "User roles: HR Admin & Employee view"],
  },
  {
    tag: "CRM", title: "CRM System", price: "₱30,000", accent: "#fcd34d",
    desc: "Manage leads and clients from pipeline to close.",
    timeline: "7–9 weeks", deploy: "Web",
    features: ["Lead & prospect record management", "Contact profiles with interaction history", "Follow-up notes & task reminders", "Deal status & stage tracking", "Basic lead source tagging", "Sales Rep & Admin user roles"],
  },
  {
    tag: "Booking", title: "Booking & Appointment System", price: "₱22,500", accent: "#b8a0d4",
    desc: "Online scheduling built for clinics and salons.",
    timeline: "5–7 weeks", deploy: "Web",
    features: ["Online booking form (web-accessible)", "Staff calendar & schedule management", "Client records & appointment history", "Manual booking confirmation", "Service catalog with duration & pricing", "Staff & Admin user roles"],
  },
  {
    tag: "Education", title: "School & Enrollment System", price: "₱37,500", accent: "#86efac",
    desc: "Complete enrollment and grade management for schools.",
    timeline: "9–12 weeks", deploy: "Web / IIS",
    features: ["Student enrollment & profile management", "Section & year-level management", "Basic grade encoding per subject", "School year & semester setup", "Tuition fee structure setup", "Admin & Registrar user roles"],
  },
  {
    tag: "Restaurant", title: "Restaurant Ordering System", price: "₱27,000", accent: "#fdba74",
    desc: "QR ordering and kitchen management for F&B operations.",
    timeline: "6–8 weeks", deploy: "Web",
    features: ["QR code menu (scan to order)", "Table-based order taking", "Basic kitchen order display (KDS)", "Daily sales log & shift summary", "Menu management with pricing", "Cashier & Admin user roles"],
  },
];

const process = [
  { step: "01", title: "Discover", desc: "Deep dive into your operations. We map every workflow, constraint, and growth objective before writing a line of code." },
  { step: "02", title: "Architect", desc: "System design with precision. Database schemas, API contracts, and UI frameworks defined before build begins." },
  { step: "03", title: "Build", desc: "Engineered with enterprise-grade standards. Clean code, full test coverage, and cinematic UI execution." },
  { step: "04", title: "Deploy", desc: "Zero-downtime deployments on global edge infrastructure. Monitored from day one." },
  { step: "05", title: "Scale", desc: "Systems that grow with your business. Architecture built for the next decade, not just the next quarter." },
];

const DRIVE_INTERIOR = "https://drive.google.com/drive/folders/1TWaOJivk0HuAfGZY9qcYZL6agqHNibtr?usp=drive_link";
const DRIVE_EXTERIOR = "https://drive.google.com/drive/folders/1qsx8USrcKU37ljmD2WoABr2uyYCsri0_?usp=drive_link";
const DRIVE_WEAPONS  = ""; // files delivered via email after purchase — not publicly accessible

/* ─── Google Drive /preview — only reliable embeddable video src ─────── */
const drivePreview = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

/* ── Section 3: 3D Animation — Blender axe animations ───────────────── */
const animationCards = [
  {
    id: "anim-1",
    title: "Battle Axe I",
    category: "3D Animation",
    desc: "Full Blender animation of a hand-modelled battle axe — cinematic camera orbit, studio lighting, and procedural metal shading.",
    accent: "#4ade80",
    gradient: "linear-gradient(135deg, #061a0e 0%, #0e2a18 40%, #0d0c0b 100%)",
    videoFileId: "1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8",
  },
  {
    id: "anim-2",
    title: "Battle Axe II",
    category: "3D Animation",
    desc: "Viking battle axe with knotwork engravings — slow 360° turntable render with HDRI environment and subsurface metal material.",
    accent: "#4ade80",
    gradient: "linear-gradient(135deg, #061a0e 0%, #0e2a18 40%, #0d0c0b 100%)",
    videoFileId: "1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67",
  },
  {
    id: "anim-3",
    title: "Battle Axe III",
    category: "3D Animation",
    desc: "Precision-modelled poll axe with dynamic lighting pass — edge highlights, shadow casting, and cinematic depth of field.",
    accent: "#4ade80",
    gradient: "linear-gradient(135deg, #061a0e 0%, #0e2a18 40%, #0d0c0b 100%)",
    videoFileId: "1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld",
  },
];

/* ── Section 4: ORC 3D Animation — Blender orc animations ──────────── */
const orcCards = [
  {
    id: "orc-1",
    title: "ORC Character I",
    category: "3D Character Animation",
    desc: "Full Blender character animation of an orc model — cinematic lighting, procedural skin shader, and dynamic camera movement.",
    accent: "#86efac",
    gradient: "linear-gradient(135deg, #061a0a 0%, #0e2a12 40%, #0d0c0b 100%)",
    videoFileId: "1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP",
  },
  {
    id: "orc-2",
    title: "ORC Character II",
    category: "3D Character Animation",
    desc: "Orc warrior with detailed armor and weapon — slow orbit render with dramatic rim lighting and subsurface skin scattering.",
    accent: "#86efac",
    gradient: "linear-gradient(135deg, #061a0a 0%, #0e2a12 40%, #0d0c0b 100%)",
    videoFileId: "1SaHl7fGvD2uoy34clB1p2UWT-knWENwl",
  },
  {
    id: "orc-3",
    title: "ORC Character III",
    category: "3D Character Animation",
    desc: "High-poly orc sculpt animated with cinematic depth of field, HDRI environment lighting, and full shadow pass.",
    accent: "#86efac",
    gradient: "linear-gradient(135deg, #061a0a 0%, #0e2a12 40%, #0d0c0b 100%)",
    videoFileId: "1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i",
  },
];

/* ─── Mixed carousel — interior + exterior interleaved ──────────────── */
const carouselVideos = [
  { id: "1MJR8A38OCNRDxb_jRheBdRgexnAOugZf", label: "Interior" },
  { id: "1QKCGiJCNzSbpkVsQPN073ws6WbZMwrZC", label: "Exterior" },
  { id: "1cHTTgKBilMBXIrIGuSqB2tAb4A9WdobJ", label: "Interior" },
  { id: "1hIAB7FrCEnn8cfrGSCplccHkZ4Gonnxu", label: "Exterior" },
  { id: "1A9sgWrWpi_Jq2NWZIH5mkh2XP491_2Ce", label: "Interior" },
  { id: "1kp23x5YBnWovDamPDT2FS00d1ID9SB0k", label: "Exterior" },
  { id: "1sr1O1HBL-q0oFZ2mfhgI3Zf3Y_AWmOzl", label: "Interior" },
  { id: "10CfcifgZBQMoxK2L_ANH8TJ8vUj7v26T", label: "Exterior" },
  { id: "1wQtULgqst4SX2imqwdEhnqYRgzcPWJiu", label: "Interior" },
  { id: "1uK7a0BedMTfGWeZ17WxJt-YYKAJL3bZJ", label: "Exterior" },
  { id: "16IlbksfqFgAsIUlIbSnfG1k0miktYC0d", label: "Interior" },
  { id: "1On-oICTEgx81tNSRyW7DZYk3IOEDBiAT", label: "Exterior" },
  { id: "1iqOFR1-0gO4v-Wk7PzBKZ2TsSeL0qoOW", label: "Interior" },
  { id: "1p34uCYAykKSH9c5fHXh1PuRn_S5XS3sG", label: "Interior" },
  { id: "1NrTbKznn-3pcIC9q-BqBa2lUfMUsGKa8", label: "Animation" },
  { id: "1db1EOrzdG2phPiaJ8DJV9Tz1-bfYwB67", label: "Animation" },
  { id: "1ZPhiN56sAU9EQIlrrTPY3OSDBhijtHld", label: "Animation" },
  { id: "1ApEQgnNAza_uRL9NRRPtCMOurPqKj1VP", label: "Character" },
  { id: "1SaHl7fGvD2uoy34clB1p2UWT-knWENwl", label: "Character" },
  { id: "1L_mshqNnDK3rfTHrcds3yApBiY-Wt55i", label: "Character" },
];






/* ─── Reveal wrapper ────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Marquee ───────────────────────────────────────────────────────── */
function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="vMarqueeOuter">
      <div className="vMarqueeTrack">
        {doubled.map((t, i) => (
          <span key={i} className="vMarqueeItem">
            {t} <span className="vMarqueeDot">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Single video player — controlled by active card ───────────────── */
function ActiveVideoPlayer({ videoFileId, gradient, accent }: {
  videoFileId: string; gradient: string; accent: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = drivePreview(videoFileId);
    v.currentTime = 0;
    v.play().catch(() => { });
  }, [videoFileId]);

  return (
    <div className="vAiPreview" style={{ background: gradient }}>
      <video
        ref={videoRef}
        className="vAiDriveEmbed"
        muted loop playsInline autoPlay
      />
      <div className="vAiVideoGrade" />
      <div className="vAiCornerMark">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M1 19V1h18" stroke={accent} strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      </div>
    </div>
  );
}

/* ─── Vertical sliding stack — top card always active ───────────────── */
type SlideCard = {
  id: string; title: string; category: string;
  desc: string; accent: string; gradient: string; videoFileId: string;
};

function SlideStack({ cards, accent }: { cards: SlideCard[]; accent: string }) {
  const [order, setOrder] = useState(cards.map((_, i) => i));

  // Rotates the entire order array — down shifts top to bottom, up shifts bottom to top
  const rotate = (direction: "up" | "down") => {
    setOrder((prev) => {
      const next = [...prev];
      if (direction === "down") {
        const top = next.shift()!;
        next.push(top);
      } else {
        const bottom = next.pop()!;
        next.unshift(bottom);
      }
      return next;
    });
  };

  const activeCard = cards[order[0]];

  return (
    <div className="vSlideStack">

      {/* Up arrow — sits ABOVE the active card, outside */}
      <div className="vSlideOuterArrow vSlideOuterArrowTop">
        <button
          className="vSlideArrowBtn"
          onClick={() => rotate("up")}
          aria-label="Previous video"
          style={{ color: accent, borderColor: accent + "44" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10L7 4L12 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="vSlideArrowCount" style={{ color: accent }}>
          {order[0] + 1} / {cards.length}
        </span>
      </div>

      {/* Active — top card */}
      <motion.div
        key={`active-${activeCard.id}`}
        layout
        className="vSlideCard vSlideCardActive"
        style={{ borderColor: accent + "40" }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="vSlideCardThumb" style={{ background: activeCard.gradient }}>
          {/* iframe /preview — only reliable Drive video playback */}
          <iframe
            key={activeCard.videoFileId}
            src={drivePreview(activeCard.videoFileId)}
            className="vAiDriveEmbed"
            allow="autoplay"
            allowFullScreen
            title={activeCard.title}
          />
          <span className="vSlideActiveBadge" style={{ color: accent, borderColor: accent + "44" }}>
            Now Playing
          </span>
          {/* Overlay covers Drive's external-link icon in the top-right corner of the iframe */}
          <div className="vDriveIconOverlay">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="vDriveOverlayLogo" />
          </div>
        </div>
        <div className="vSlideCardInfo">
          <span className="vAiCardCategory" style={{ color: accent }}>{activeCard.category}</span>
          <p className="vSlideCardTitle">{activeCard.title}</p>
          <p className="vSlideCardDesc">{activeCard.desc}</p>
        </div>
      </motion.div>

      {/* Down arrow — sits below the active card */}
      <div className="vSlideOuterArrow vSlideOuterArrowBottom">
        <button
          className="vSlideArrowBtn"
          onClick={() => rotate("down")}
          aria-label="Next video"
          style={{ color: accent, borderColor: accent + "44" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4L7 10L12 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

    </div>
  );
}

/* ─── Magazine split section — text left, slide stack right ─────────── */
function MagazineSection({
  label, labelAccent, title, titleAccent, italicLine,
  desc, accent, gradient, cards, ctaLabel, delay,
}: {
  label: string; labelAccent: string; title: string;
  titleAccent: string; italicLine: string;
  desc: string; accent: string; gradient: string;
  cards: SlideCard[]; ctaLabel: string; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="vMagSection"
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left — text + steps + CTA */}
      <div className="vMagLeft" style={{ background: gradient }}>
        <div className="vMagLeftInner">
          <span className="vAiCardCategory" style={{ color: accent }}>{label}</span>
          <h3 className="vMagTitle">
            {title}<br />
            <em className="vMagItalic" style={{ color: accent }}>{italicLine}</em>
          </h3>
          <p className="vMagDesc">{desc}</p>
          <div className="vAiSteps">
            <div className="vAiStep">
              <span className="vAiStepNum" style={{ color: accent }}>01</span>
              <div>
                <strong>Create an account</strong>
                <p>Register with your email. Free, 30 seconds.</p>
              </div>
            </div>
            <div className="vAiStep">
              <span className="vAiStepNum" style={{ color: accent }}>02</span>
              <div>
                <strong>Purchase the collection</strong>
                <p>One-time payment. No subscription, no renewal.</p>
              </div>
            </div>
            <div className="vAiStep">
              <span className="vAiStepNum" style={{ color: accent }}>03</span>
              <div>
                <strong>Download forever</strong>
                <p>Instant access. Re-download anytime from your dashboard.</p>
              </div>
            </div>
          </div>
          <a href="/register" className="vAiGetAccessBtn" style={{ background: accent }}>
            {ctaLabel}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>

      {/* Right — vertical slide stack */}
      <div className="vMagRight">
        <SlideStack cards={cards} accent={accent} />
      </div>
    </motion.div>
  );
}


/* ─── Systems Carousel ──────────────────────────────────────────────── */
/* ─── System Configurator ───────────────────────────────────────────── */

type AddOn = { id: string; label: string; price: number; weeks?: number; category: string; desc?: string };
type ConfigSystem = {
  tag: string; title: string; base: number; accent: string;
  baseFeatures: string[]; addons: AddOn[];
  timeline?: string;
  baseWeeksMin?: number;
  baseWeeksMax?: number;
};

const configuratorSystems: ConfigSystem[] = [
  {
    tag: "HR", title: "Payroll & HR System", base: 33000, accent: "#67e8f9",
    timeline: "8–11 weeks",
    baseFeatures: [
      "Payroll computation (daily/monthly/weekly)",
      "Employee records & 201 file",
      "Payslip generation & printing",
      "Basic attendance & time logging",
      "Government deduction tracking (SSS/PhilHealth/Pag-IBIG)",
      "User roles: HR Admin & Employee view",
    ],
    addons: [
      /* ── Core Payroll ── */
      { id: "hr1",  label: "Automated Payroll Processing",      price: 5000, category: "Payroll",      desc: "Auto-compute salary based on attendance, deductions, and allowances every cutoff." },
      { id: "hr2",  label: "Overtime Computation",              price: 2800, category: "Payroll",      desc: "Auto-calculate OT pay based on hours rendered and applicable multipliers." },
      { id: "hr3",  label: "Night Differential Computation",    price: 2500, category: "Payroll",      desc: "ND pay computation for hours worked between 10PM–6AM per DOLE guidelines." },
      { id: "hr4",  label: "Holiday Pay Computation",           price: 2800, category: "Payroll",      desc: "Automatic holiday pay rates — regular, special, and double holiday." },
      { id: "hr5",  label: "13th Month Pay Automation",         price: 2800, category: "Payroll",      desc: "Auto-compute 13th month pay based on basic pay and months worked." },
      { id: "hr6",  label: "Incentive & Bonus Management",      price: 3500, category: "Payroll",      desc: "Performance bonuses, commissions, and allowances added to payroll processing." },
      { id: "hr7",  label: "Final Pay Computation",             price: 3500, category: "Payroll",      desc: "Employee clearance payroll — last pay, unused leaves, and deduction settlement." },
      { id: "hr8",  label: "Payroll Approval Workflow",         price: 4000, category: "Payroll",      desc: "Multi-level payroll approval before disbursement — HR → Finance → GM." },
      { id: "hr9",  label: "Multi-Branch Payroll",              price: 5500, category: "Payroll",      desc: "Consolidated payroll management across multiple branches or departments." },
      { id: "hr10", label: "Payslip Generator (PDF + Email)",   price: 2500, category: "Payroll",      desc: "Auto-generate and email payslips to employees every cutoff." },
      /* ── Government Compliance ── */
      { id: "hr11", label: "BIR Tax Computation & Forms",       price: 6000, category: "Compliance",   desc: "Auto-compute withholding tax and generate BIR forms 2316, 1601C, Alphalist." },
      { id: "hr12", label: "SSS Contribution Automation",       price: 3500, category: "Compliance",   desc: "Auto-compute SSS contributions per current contribution schedule." },
      { id: "hr13", label: "PhilHealth Integration",            price: 3500, category: "Compliance",   desc: "Auto-compute PhilHealth monthly premiums based on salary brackets." },
      { id: "hr14", label: "Pag-IBIG (HDMF) Contribution",     price: 3500, category: "Compliance",   desc: "Auto-compute Pag-IBIG contributions and generate remittance reports." },
      { id: "hr15", label: "Government Remittance Reports",     price: 4000, category: "Compliance",   desc: "Printable SSS R3, PhilHealth RF-1, and HDMF remittance schedules per cutoff." },
      { id: "hr16", label: "Tax Table Auto Updates",            price: 2500, category: "Compliance",   desc: "Tax bracket auto-updates when BIR releases new TRAIN Law adjustments." },
      { id: "hr17", label: "Compliance Audit Reports",          price: 4500, category: "Compliance",   desc: "HR compliance monitoring with audit trail and government submission history." },
      /* ── Attendance & Timekeeping ── */
      { id: "hr18", label: "Biometric Integration",             price: 8000, category: "Attendance",   desc: "Connect fingerprint biometric devices for automatic time-in/time-out logging." },
      { id: "hr19", label: "RFID Attendance",                   price: 6000, category: "Attendance",   desc: "RFID tap-in attendance with card assignment and access log reporting." },
      { id: "hr20", label: "GPS Attendance Tracking",           price: 5000, category: "Attendance",   desc: "Location-based attendance for field employees with map view." },
      { id: "hr21", label: "Mobile Time Tracking",              price: 3500, category: "Attendance",   desc: "Employees clock in/out via mobile app with selfie verification." },
      { id: "hr22", label: "Shift Scheduling",                  price: 4500, category: "Attendance",   desc: "Build and assign shift schedules with conflict detection and rotation support." },
      { id: "hr23", label: "Break Time Monitoring",             price: 2500, category: "Attendance",   desc: "Track lunch and break durations with automatic undertime computation." },
      { id: "hr24", label: "Geo-Fencing Attendance",            price: 5000, category: "Attendance",   desc: "Restrict clock-in to a defined GPS radius — prevents buddy punching." },
      { id: "hr25", label: "Overtime Approval Workflow",        price: 2800, category: "Attendance",   desc: "Employees file OT requests, supervisors approve before OT pay is computed." },
      { id: "hr26", label: "Attendance Correction Requests",    price: 2500, category: "Attendance",   desc: "Employees file missed punch corrections with supporting reason and approver." },
      /* ── HR Management ── */
      { id: "hr27", label: "Employee Self-Service Portal",      price: 5500, category: "HR Mgmt",      desc: "Employees view payslips, file leaves, check attendance, and update info online." },
      { id: "hr28", label: "Leave Management",                  price: 3000, category: "HR Mgmt",      desc: "Track vacation, sick, emergency leave balances with approval workflow." },
      { id: "hr29", label: "Employee Onboarding",               price: 5000, category: "HR Mgmt",      desc: "Digital onboarding checklist — contracts, requirements, and orientation flow." },
      { id: "hr30", label: "Exit Management",                   price: 4000, category: "HR Mgmt",      desc: "Resignation and clearance workflow with final pay computation trigger." },
      { id: "hr31", label: "HR Document Management",            price: 5000, category: "HR Mgmt",      desc: "Digital 201 file — store contracts, IDs, certifications, and memos." },
      { id: "hr32", label: "Organizational Chart",              price: 2800, category: "HR Mgmt",      desc: "Visual company hierarchy with department and reporting line management." },
      { id: "hr33", label: "Employee Disciplinary Tracking",    price: 2800, category: "HR Mgmt",      desc: "Log violations, notices to explain, and corrective actions per employee." },
      { id: "hr34", label: "Digital Forms & Requests",          price: 3500, category: "HR Mgmt",      desc: "Online HR forms — COE requests, loan applications, and change of info." },
      /* ── Recruitment ── */
      { id: "hr35", label: "Applicant Tracking System (ATS)",   price: 7000, category: "Recruitment",  desc: "End-to-end recruitment pipeline — job posting, screening, interviews, and hiring." },
      { id: "hr36", label: "Resume Parser",                     price: 5000, category: "Recruitment",  desc: "Auto-extract candidate info from uploaded CVs into structured profile fields." },
      { id: "hr37", label: "Interview Scheduling",              price: 3500, category: "Recruitment",  desc: "Schedule and manage interview slots with email notifications to candidates." },
      { id: "hr38", label: "AI Resume Screening",               price: 9000, category: "Recruitment",  desc: "AI ranks and filters applicants based on job requirements and keywords." },
      /* ── Performance & Training ── */
      { id: "hr39", label: "KPI Performance Tracking",          price: 5000, category: "Performance",  desc: "Set, monitor, and score employee KPIs per department or role." },
      { id: "hr40", label: "Performance Evaluation System",     price: 5000, category: "Performance",  desc: "360-degree appraisal forms with self-assessment and manager scoring." },
      { id: "hr41", label: "Learning Management System (LMS)",  price: 7000, category: "Performance",  desc: "Online training portal with course assignments, quizzes, and completion tracking." },
      { id: "hr42", label: "Certification Tracking",            price: 2500, category: "Performance",  desc: "Track employee certifications, expiry dates, and renewal reminders." },
      /* ── Dashboard & Analytics ── */
      { id: "hr43", label: "Payroll Dashboard",                 price: 4500, category: "Dashboard",    desc: "Live payroll KPIs — total payroll cost, headcount, deductions, and net pay." },
      { id: "hr44", label: "Attendance & Leave Reports",        price: 3000, category: "Data Analysis", desc: "Absence rates, late logs, leave balance summaries, and trend charts." },
      { id: "hr45", label: "Employee Turnover Reports",         price: 3500, category: "Data Analysis", desc: "Attrition rate by department, tenure band, and resignation reason analysis." },
      { id: "hr46", label: "Salary Forecasting",               price: 6000, category: "Data Analysis", desc: "Predict payroll budget for next quarter based on headcount and salary trends." },
      { id: "hr47", label: "Automated Scheduled Reports",       price: 2500, category: "Data Analysis", desc: "Auto-generate and email payroll, attendance, and HR reports on a schedule." },
      /* ── Accounting ── */
      { id: "hr48", label: "Payroll Journal Entries",           price: 4500, category: "Accounting",   desc: "Auto-post payroll to accounting — debit salaries, credit payables and tax." },
      { id: "hr49", label: "Cost Center Allocation",            price: 5000, category: "Accounting",   desc: "Allocate payroll costs to departments, projects, or cost centers." },
      { id: "hr50", label: "QuickBooks / Xero Sync",            price: 5000, category: "Accounting",   desc: "Two-way payroll sync with QuickBooks or Xero accounting software." },
      /* ── AI & Automation ── */
      { id: "hr51", label: "AI Payroll Assistant",              price: 7000, category: "AI",           desc: "AI flags anomalies, suggests corrections, and automates routine payroll tasks." },
      { id: "hr52", label: "AI Attendance Fraud Detection",     price: 9000, category: "AI",           desc: "Detect buddy punching, GPS spoofing, and pattern-based attendance fraud." },
      { id: "hr53", label: "AI Employee Performance Prediction",price: 9000, category: "AI",           desc: "AI scores flight risk, performance trajectory, and promotion readiness." },
      { id: "hr54", label: "Automated Workflow Engine",         price: 7500, category: "AI",           desc: "Auto-trigger onboarding, reminders, escalations, and approvals based on rules." },
    ],
  },
  {
    tag: "Construction", title: "Construction Project System", base: 45000, accent: "#7eb8d4",
    timeline: "10–12 weeks",
    baseWeeksMin: 8, baseWeeksMax: 10,
    baseFeatures: [
      "Project creation with start/end dates",
      "Task assignment & milestone tracking",
      "Basic budget input & expenditure logging",
      "Team & worker roster management",
      "Project status board (Kanban-style)",
      "Admin & Project Manager user roles",
    ],
    addons: [
      /* ── 1. Core Construction Modules ── */
      { id: "co1",  label: "Project Management",          price: 5000,  weeks: 1,   category: "Core Modules",    desc: "Tasks, milestones, and workflows for full project lifecycle management." },
      { id: "co2",  label: "Document Management",         price: 3500,  weeks: 1,   category: "Core Modules",    desc: "Centralized storage for drawings, contracts, and project files with version control." },
      { id: "co3",  label: "Client Portal",               price: 4500,  weeks: 1,   category: "Core Modules",    desc: "Customer-facing dashboard for project updates, approvals, and progress visibility." },
      { id: "co4",  label: "Contractor Portal",           price: 5000,  weeks: 1,   category: "Core Modules",    desc: "Subcontractor access for task updates, document sharing, and billing submissions." },
      { id: "co5",  label: "Daily Logs",                  price: 2500,  weeks: 0.5, category: "Core Modules",    desc: "Site activity tracking — manpower, weather, equipment, and work completed each day." },
      { id: "co6",  label: "Punch List Management",       price: 3000,  weeks: 0.5, category: "Core Modules",    desc: "Defect and snagging tracker with photo evidence, assignee, and close-out workflow." },
      { id: "co7",  label: "Change Order Management",     price: 5000,  weeks: 1,   category: "Core Modules",    desc: "Manage variation orders with client approval workflow, cost impact, and schedule update." },
      { id: "co8",  label: "RFI Management",              price: 4500,  weeks: 1,   category: "Core Modules",    desc: "Request for Information workflows with routing, deadlines, and response tracking." },
      { id: "co9",  label: "Submittal Tracking",          price: 5000,  weeks: 1,   category: "Core Modules",    desc: "Material and shop drawing approvals with revision history and approval status." },
      { id: "co10", label: "Quality Control System",      price: 7500,  weeks: 1.5, category: "Core Modules",    desc: "QA/QC inspection forms, checklist management, and non-conformance reporting." },
      { id: "co11", label: "Incident Reporting",          price: 3000,  weeks: 0.5, category: "Core Modules",    desc: "Safety incident and accident logging with investigation workflow and corrective actions." },
      /* ── 2. Estimation ── */
      { id: "co12", label: "Digital Takeoff",             price: 5000,  weeks: 1.5, category: "Estimation",      desc: "Measure plans digitally from uploaded drawings — area, length, count, and volume." },
      { id: "co13", label: "AI Cost Estimation",          price: 9000,  weeks: 2,   category: "Estimation",      desc: "AI-generated cost estimates based on project type, scope, and historical data." },
      { id: "co14", label: "Quantity Surveying Module",   price: 8000,  weeks: 2,   category: "Estimation",      desc: "Bill of quantities computation and material takeoff with cost buildup per trade." },
      { id: "co15", label: "Material Cost Database",      price: 5000,  weeks: 1,   category: "Estimation",      desc: "Real-time pricing database for construction materials with supplier comparison." },
      { id: "co16", label: "Labor Cost Calculator",       price: 3500,  weeks: 1,   category: "Estimation",      desc: "Wage and manpower estimation with daily, weekly, and project-based labor costing." },
      { id: "co17", label: "Equipment Cost Estimator",    price: 3000,  weeks: 0.5, category: "Estimation",      desc: "Equipment usage costing with rental rates and ownership cost computation." },
      { id: "co18", label: "Bid Management",              price: 7000,  weeks: 1.5, category: "Estimation",      desc: "Tender submission management with bid comparison, scoring, and award tracking." },
      { id: "co19", label: "Proposal Generator",          price: 4500,  weeks: 1,   category: "Estimation",      desc: "Auto-generate professional client proposals from estimate data with branding." },
      { id: "co20", label: "Auto BOQ Generator",          price: 8000,  weeks: 2,   category: "Estimation",      desc: "Automated Bill of Quantities generation from project scope and takeoff data." },
      { id: "co21", label: "AI Bid Optimization",         price: 12000, weeks: 2,   category: "Estimation",      desc: "AI suggests optimal pricing strategies to win bids while protecting margins." },
      /* ── 3. Scheduling & Planning ── */
      { id: "co22", label: "Gantt Chart Scheduler",       price: 4500,  weeks: 1,   category: "Scheduling",      desc: "Interactive timeline management with task dependencies and critical path highlighting." },
      { id: "co23", label: "CPM Scheduling",              price: 8000,  weeks: 2,   category: "Scheduling",      desc: "Critical Path Method scheduling with float analysis and schedule optimization." },
      { id: "co24", label: "Resource Scheduling",         price: 5500,  weeks: 1.5, category: "Scheduling",      desc: "Labor and equipment planning with capacity calendar and conflict detection." },
      { id: "co25", label: "Baseline Tracking",           price: 4500,  weeks: 1,   category: "Scheduling",      desc: "Compare planned vs. actual schedule with variance analysis and earned value metrics." },
      { id: "co26", label: "Delay Analysis",              price: 6000,  weeks: 1.5, category: "Scheduling",      desc: "Analyze project delays with cause classification and impact on critical path." },
      { id: "co27", label: "Lookahead Planning",          price: 3500,  weeks: 0.5, category: "Scheduling",      desc: "3–6 week rolling work plans for site supervisors with crew and material readiness." },
      { id: "co28", label: "AI Schedule Forecasting",     price: 12000, weeks: 2,   category: "Scheduling",      desc: "Predict delays and project completion dates using AI pattern recognition." },
      /* ── 4. BIM & Engineering ── */
      { id: "co29", label: "BIM Integration",             price: 15000, weeks: 3,   category: "BIM",             desc: "3D building model integration for clash detection, quantity extraction, and coordination." },
      { id: "co30", label: "Clash Detection",             price: 18000, weeks: 3,   category: "BIM",             desc: "Detect and report design conflicts between MEP, structural, and architectural models." },
      { id: "co31", label: "Revit Integration",           price: 6000,  weeks: 1.5, category: "BIM",             desc: "Sync model data and quantities directly from Autodesk Revit into the project system." },
      { id: "co32", label: "AutoCAD Integration",         price: 5000,  weeks: 1,   category: "BIM",             desc: "Import and annotate CAD drawings directly within the project platform." },
      { id: "co33", label: "Drone Mapping",               price: 18000, weeks: 2,   category: "BIM",             desc: "Site aerial scanning and orthophoto generation from drone survey data." },
      /* ── 5. Procurement & Vendor ── */
      { id: "co34", label: "Procurement System",          price: 6000,  weeks: 1.5, category: "Procurement",     desc: "Purchase management from requisition to PO to receiving with approval workflow." },
      { id: "co35", label: "Vendor Portal",               price: 5000,  weeks: 1,   category: "Procurement",     desc: "Supplier collaboration portal for quote submission, PO acknowledgment, and invoicing." },
      { id: "co36", label: "RFQ Automation",              price: 4500,  weeks: 1,   category: "Procurement",     desc: "Request-for-quote workflows with multi-vendor comparison and auto-award logic." },
      { id: "co37", label: "Purchase Orders",             price: 3500,  weeks: 0.5, category: "Procurement",     desc: "Generate and track material purchase orders with budget linkage and receiving confirmation." },
      { id: "co38", label: "Inventory Tracking",          price: 5000,  weeks: 1,   category: "Procurement",     desc: "Construction material inventory with site-level tracking and consumption reporting." },
      { id: "co39", label: "Equipment Rental Management", price: 5500,  weeks: 1,   category: "Procurement",     desc: "Rental equipment monitoring with utilization tracking and rental cost logging." },
      { id: "co40", label: "Subcontractor Management",    price: 7000,  weeks: 1.5, category: "Procurement",     desc: "Subcontractor tracking, compliance management, and performance scoring per project." },
      /* ── 6. Financial & Accounting ── */
      { id: "co41", label: "Job Costing",                 price: 6000,  weeks: 1.5, category: "Finance",         desc: "Real-time project cost tracking against budget with WBS cost code breakdown." },
      { id: "co42", label: "Budget Management",           price: 5000,  weeks: 1,   category: "Finance",         desc: "Budget forecasting with earned value tracking and cost-to-complete projections." },
      { id: "co43", label: "Progress Billing",            price: 5000,  weeks: 1,   category: "Finance",         desc: "Construction invoicing tied to percentage completion with client approval workflow." },
      { id: "co44", label: "Retention Tracking",          price: 3500,  weeks: 0.5, category: "Finance",         desc: "Retainage monitoring and automatic release calculation at project milestones." },
      { id: "co45", label: "Accounts Payable",            price: 5500,  weeks: 1,   category: "Finance",         desc: "Vendor payment workflows with three-way matching (PO, GR, invoice) and approval routing." },
      { id: "co46", label: "Accounts Receivable",         price: 5000,  weeks: 1,   category: "Finance",         desc: "Client receivables tracking with aging reports and collection follow-up automation." },
      { id: "co47", label: "Tax Management",              price: 3500,  weeks: 0.5, category: "Finance",         desc: "VAT/EVAT calculations, BIR compliance forms, and tax certificate generation." },
      { id: "co48", label: "Financial Forecasting",       price: 8000,  weeks: 1.5, category: "Finance",         desc: "Cashflow prediction with S-curve analysis and project financial health scoring." },
      /* ── 7. Workforce & HR ── */
      { id: "co49", label: "Time Tracking",               price: 3000,  weeks: 0.5, category: "Workforce",       desc: "Worker attendance and time logging with daily time record (DTR) generation." },
      { id: "co50", label: "Crew Management",             price: 4000,  weeks: 1,   category: "Workforce",       desc: "Labor coordination with gang/crew assignment, headcount tracking, and shift management." },
      { id: "co51", label: "GPS Attendance",              price: 3500,  weeks: 1,   category: "Workforce",       desc: "Geolocation-based check-in/check-out — workers can only clock in within site perimeter." },
      { id: "co52", label: "Biometric Attendance",        price: 9000,  weeks: 1.5, category: "Workforce",       desc: "Fingerprint or facial recognition attendance hardware integration for construction sites." },
      { id: "co53", label: "Payroll Automation",          price: 5500,  weeks: 1.5, category: "Workforce",       desc: "Automated salary computation with SSS/PhilHealth/Pag-IBIG deductions and payslip generation." },
      { id: "co54", label: "Safety Compliance",           price: 7000,  weeks: 1,   category: "Workforce",       desc: "DOLE/OSHA compliance documentation, toolbox talk logs, and safety officer dashboards." },
      { id: "co55", label: "Certification Tracking",      price: 3500,  weeks: 0.5, category: "Workforce",       desc: "Track worker licenses, TESDA certificates, and trade qualifications with expiry alerts." },
      /* ── 8. Field & Mobile ── */
      { id: "co56", label: "Mobile Site App",             price: 6000,  weeks: 2,   category: "Field & Mobile",  desc: "Android/iOS app for site engineers — daily logs, progress photos, and approvals on-site." },
      { id: "co57", label: "Offline Mode",                price: 4500,  weeks: 1.5, category: "Field & Mobile",  desc: "Full offline operation for remote sites with automatic sync when connectivity returns." },
      { id: "co58", label: "Site Photo Management",       price: 3000,  weeks: 0.5, category: "Field & Mobile",  desc: "Progress photo tracking with timestamps, geo-tags, and automatic album per work area." },
      { id: "co59", label: "Voice Notes",                 price: 2500,  weeks: 0.5, category: "Field & Mobile",  desc: "Record and attach voice memos to tasks, issues, and daily log entries from mobile." },
      { id: "co60", label: "Mobile Inspections",          price: 5000,  weeks: 1,   category: "Field & Mobile",  desc: "Mobile QA/QC inspection forms with photo capture, digital signature, and auto-report." },
      /* ── 9. AI & Automation ── */
      { id: "co61", label: "AI Cost Forecasting",         price: 12000, weeks: 2,   category: "AI & Automation", desc: "Predict future project costs using AI trained on historical construction cost data." },
      { id: "co62", label: "AI Risk Detection",           price: 10000, weeks: 2,   category: "AI & Automation", desc: "Detect project risks early using schedule, cost, and site activity pattern analysis." },
      { id: "co63", label: "AI Safety Monitoring",        price: 18000, weeks: 3,   category: "AI & Automation", desc: "PPE detection and hazard identification from site cameras using computer vision." },
      { id: "co64", label: "AI Document Analysis",        price: 8000,  weeks: 2,   category: "AI & Automation", desc: "Analyze contracts, RFIs, and submittals using AI to flag risks and extract key data." },
      { id: "co65", label: "ChatGPT-Style Assistant",     price: 6000,  weeks: 1.5, category: "AI & Automation", desc: "AI project assistant for answering questions about your project data and documents." },
      /* ── 10. Enterprise & Integration ── */
      { id: "co66", label: "API Access",                  price: 8000,  weeks: 2,   category: "Enterprise",      desc: "Full REST API with key authentication for integrating with ERP, BIM, or custom platforms." },
      { id: "co67", label: "QuickBooks Integration",      price: 3500,  weeks: 1,   category: "Enterprise",      desc: "Sync project financials, invoices, and payments with QuickBooks accounting." },
      { id: "co68", label: "Power BI Integration",        price: 5000,  weeks: 1,   category: "Enterprise",      desc: "Connect project data to Power BI for custom executive analytics dashboards." },
      { id: "co69", label: "Single Sign-On (SSO)",        price: 5000,  weeks: 1,   category: "Enterprise",      desc: "Enterprise SSO login via Google Workspace, Azure AD, or Okta for secure access." },
      { id: "co70", label: "White Label Branding",        price: 8000,  weeks: 1,   category: "Enterprise",      desc: "Custom logo, company name, and color scheme throughout the entire platform." },
      /* ── 11. Compliance & Safety ── */
      { id: "co71", label: "Permit Tracking",             price: 3500,  weeks: 0.5, category: "Compliance",      desc: "Track building permits, LGU clearances, and compliance documents with expiry alerts." },
      { id: "co72", label: "Inspection Scheduling",       price: 3000,  weeks: 0.5, category: "Compliance",      desc: "Schedule and track government and third-party inspections with checklist management." },
      { id: "co73", label: "Environmental Compliance",    price: 9000,  weeks: 1.5, category: "Compliance",      desc: "ESG and DENR environmental monitoring, waste management logging, and compliance reports." },
      { id: "co74", label: "OSHA Compliance",             price: 8000,  weeks: 1,   category: "Compliance",      desc: "OSHA/DOLE safety documentation, incident log forms, and safety officer compliance reports." },
      { id: "co75", label: "Audit Logs",                  price: 2500,  weeks: 0.5, category: "Compliance",      desc: "Full activity audit trail — who did what, when, and from which device across all modules." },
      /* ── 12. Construction CRM ── */
      { id: "co76", label: "Lead Management",             price: 4500,  weeks: 1,   category: "CRM",             desc: "Sales pipeline for construction prospects with lead scoring and follow-up scheduling." },
      { id: "co77", label: "Bid Tracking CRM",            price: 5000,  weeks: 1,   category: "CRM",             desc: "Tender opportunity tracking from inquiry to bid submission and project award." },
      { id: "co78", label: "Client Messaging Portal",     price: 4000,  weeks: 1,   category: "CRM",             desc: "Centralized client communication with message history, file sharing, and read receipts." },
      { id: "co79", label: "Sales Forecasting",           price: 5000,  weeks: 1,   category: "CRM",             desc: "Revenue projection from active bids and pipeline with win-rate probability scoring." },
      /* ── 13. Heavy Equipment & Machinery ── */
      { id: "co80", label: "Fleet Tracking",              price: 9000,  weeks: 1.5, category: "Equipment",       desc: "GPS equipment location monitoring and utilization tracking across all active sites." },
      { id: "co81", label: "Fuel Monitoring",             price: 6000,  weeks: 1,   category: "Equipment",       desc: "Fuel consumption analytics per machine with refueling log and theft detection alerts." },
      { id: "co82", label: "Equipment Maintenance",       price: 5000,  weeks: 1,   category: "Equipment",       desc: "Preventive maintenance scheduling with service history, parts inventory, and downtime log." },
      { id: "co83", label: "Equipment Utilization Reports",price: 4500, weeks: 1,   category: "Equipment",       desc: "Usage optimization reports showing idle time, over-utilization, and cost per hour." },
      /* ── 14. Smart Construction & IoT ── */
      { id: "co84", label: "Smart Sensors",               price: 15000, weeks: 2,   category: "IoT",             desc: "Site monitoring sensors for temperature, humidity, vibration, and structural health." },
      { id: "co85", label: "Worker Wearables",            price: 12000, weeks: 2,   category: "IoT",             desc: "Smart helmet or vest integration with GPS location and real-time safety alerts." },
      { id: "co86", label: "Smart Access Control",        price: 12000, weeks: 2,   category: "IoT",             desc: "Gate entry automation with badge, QR, or biometric access and visitor management." },
      { id: "co87", label: "Environmental Sensors",       price: 9000,  weeks: 1.5, category: "IoT",             desc: "Dust, noise, and air quality monitoring with automated alerts when limits are exceeded." },
    ],
  },
  {
    tag: "Education", title: "School & Enrollment System", base: 37500, accent: "#86efac",
    timeline: "9–12 weeks",
    baseFeatures: [
      "Student enrollment & profile management",
      "Section & year-level management",
      "Basic grade encoding per subject",
      "School year & semester setup",
      "Tuition fee structure setup",
      "Admin & Registrar user roles",
    ],
    addons: [
      { id: "ed1",  label: "Grade Management & GWA Computation", price: 4000, category: "Academic" },
      { id: "ed2",  label: "Tuition & Fee Payment Tracking",     price: 3500, category: "Finance" },
      { id: "ed3",  label: "Parent Portal",                      price: 5000, category: "Portal" },
      { id: "ed4",  label: "Report Card Generation",             price: 3000, category: "Academic" },
      { id: "ed5",  label: "Daily Attendance Monitoring",        price: 2500, category: "Operations" },
      { id: "ed6",  label: "Enrollment Analytics Dashboard",     price: 4000, category: "Dashboard" },
      { id: "ed7",  label: "Subject & Teacher Assignment",       price: 2500, category: "Academic" },
      { id: "ed8",  label: "Tuition Invoice Generation",         price: 2500, category: "Invoices" },
      { id: "ed9",  label: "Student Performance Reports",        price: 3500, category: "Data Analysis" },
      { id: "ed10", label: "SMS/Email Notifications",            price: 3000, category: "Automation" },
    ],
  },
  {
    tag: "E-commerce", title: "POS + Mini E-commerce", base: 42000, accent: "#f9a8d4",
    timeline: "9–11 weeks",
    baseFeatures: [
      "In-store POS terminal (touch-friendly)",
      "Product catalog with categories & variants",
      "Cash & manual payment transactions",
      "Order history & receipt printing",
      "Stock deduction per sale",
      "Cashier & Admin user roles",
    ],
    addons: [
      /* ── Core POS ── */
      { id: "pos1",  label: "Multi-Branch POS",               price: 6000,  category: "Core POS",     desc: "Manage multiple store locations from one dashboard with per-branch reporting." },
      { id: "pos2",  label: "Multi-Cashier System",           price: 3000,  category: "Core POS",     desc: "Multiple cashier accounts with individual session tracking and shift reports." },
      { id: "pos3",  label: "Barcode Scanning",               price: 2500,  category: "Core POS",     desc: "Barcode product scanning for fast checkout — USB and wireless scanner support." },
      { id: "pos4",  label: "Inventory Management",           price: 4500,  category: "Core POS",     desc: "Real-time stock monitoring with auto-deduction per sale and restock alerts." },
      { id: "pos5",  label: "Product Variants",               price: 2800,  category: "Core POS",     desc: "Size, color, and custom variation support with per-variant pricing and stock." },
      { id: "pos6",  label: "Purchase Management",            price: 3500,  category: "Core POS",     desc: "Supplier purchase orders, receiving, and landed cost tracking per product." },
      { id: "pos7",  label: "Stock Transfer",                 price: 3000,  category: "Core POS",     desc: "Inter-branch stock movement with transfer requests and approval workflow." },
      { id: "pos8",  label: "Offline POS Mode",               price: 5000,  category: "Core POS",     desc: "Continue processing sales when internet is down — auto-syncs when reconnected." },
      { id: "pos9",  label: "Loyalty Rewards System",         price: 5000,  category: "Core POS",     desc: "Points-based rewards — earn on every purchase, redeem on checkout." },
      { id: "pos10", label: "Customer Receipt / Invoice",     price: 2000,  category: "Core POS",     desc: "Thermal receipt printing and PDF invoice generation per transaction." },
      /* ── E-commerce ── */
      { id: "pos11", label: "Online Storefront",              price: 7000,  category: "E-commerce",   desc: "Full mini online shop — product listings, cart, and checkout flow." },
      { id: "pos12", label: "Shopping Cart & Checkout",       price: 4000,  category: "E-commerce",   desc: "Smooth cart experience with promo code application and order confirmation." },
      { id: "pos13", label: "Coupon & Promo Engine",          price: 2800,  category: "E-commerce",   desc: "Discount vouchers, percentage/fixed promos, and limited-time flash sales." },
      { id: "pos14", label: "Product Search & Filters",       price: 3500,  category: "E-commerce",   desc: "Smart search with category, price range, and attribute filters." },
      { id: "pos15", label: "Product Reviews & Ratings",      price: 2500,  category: "E-commerce",   desc: "Customer ratings and review system with moderation controls." },
      { id: "pos16", label: "Wishlists",                      price: 2000,  category: "E-commerce",   desc: "Customers save items for later — drives return visits and conversions." },
      { id: "pos17", label: "Affiliate / Referral Module",    price: 6000,  category: "E-commerce",   desc: "Track referral links, compute commissions, and manage affiliate payouts." },
      { id: "pos18", label: "Subscription Ecommerce",         price: 7000,  category: "E-commerce",   desc: "Membership-based billing with recurring product delivery or access." },
      /* ── Payments ── */
      { id: "pos19", label: "GCash Integration",              price: 4500,  category: "Payments",     desc: "Accept GCash QR and payment link transactions directly at checkout." },
      { id: "pos20", label: "Maya Integration",               price: 4500,  category: "Payments",     desc: "Maya payments linked to POS and online checkout with auto-confirmation." },
      { id: "pos21", label: "QR Payment Support",             price: 3000,  category: "Payments",     desc: "Universal QR code payments for in-store and online transactions." },
      { id: "pos22", label: "Installment Payments",           price: 5000,  category: "Payments",     desc: "Split payments into scheduled installments with automatic tracking." },
      { id: "pos23", label: "Auto Payment Reconciliation",    price: 7500,  category: "Payments",     desc: "Automatically match incoming payments to orders and close them." },
      /* ── Delivery & Logistics ── */
      { id: "pos24", label: "Delivery Tracking",              price: 5000,  category: "Delivery",     desc: "Real-time delivery status updates for customers and admin." },
      { id: "pos25", label: "Rider Management",               price: 5500,  category: "Delivery",     desc: "Assign deliveries to riders, track locations, and manage schedules." },
      { id: "pos26", label: "Shipping Fee Calculator",        price: 3000,  category: "Delivery",     desc: "Auto-compute delivery fees based on distance, weight, or flat rates." },
      { id: "pos27", label: "Courier API (LBC / J&T / NinjaVan)", price: 5500, category: "Delivery", desc: "Direct integration with courier APIs for booking, tracking, and label printing." },
      { id: "pos28", label: "Click & Collect / Pickup",       price: 3500,  category: "Delivery",     desc: "Let customers order online and pick up in-store at a scheduled time." },
      /* ── CRM & Marketing ── */
      { id: "pos29", label: "Customer Database",              price: 3000,  category: "CRM",          desc: "Full customer profiles with purchase history, contact info, and loyalty points." },
      { id: "pos30", label: "Gift Card System",               price: 4000,  category: "CRM",          desc: "Digital and physical gift cards — issue, track, and redeem at POS or online." },
      { id: "pos31", label: "SMS Marketing",                  price: 4000,  category: "CRM",          desc: "Bulk SMS promotions, birthday greetings, and reorder reminders." },
      { id: "pos32", label: "Email Marketing",                price: 4000,  category: "CRM",          desc: "Email campaigns for promotions, new arrivals, and win-back sequences." },
      { id: "pos33", label: "Push Notifications",             price: 3000,  category: "CRM",          desc: "Browser and mobile push alerts for promos, order updates, and restocks." },
      /* ── Dashboard & Analytics ── */
      { id: "pos34", label: "Sales Analytics Dashboard",      price: 4500,  category: "Dashboard",    desc: "Live KPIs — daily revenue, top products, cashier performance, and trends." },
      { id: "pos35", label: "Profit & Loss Reports",          price: 4000,  category: "Data Analysis", desc: "Revenue vs cost summaries per period, branch, or product category." },
      { id: "pos36", label: "Product Performance Reports",    price: 3000,  category: "Data Analysis", desc: "Best-sellers, slow movers, return rates, and margin analysis per SKU." },
      { id: "pos37", label: "Inventory Analytics",            price: 3500,  category: "Data Analysis", desc: "Stock movement reports, shrinkage tracking, and turnover rates." },
      { id: "pos38", label: "Customer Analytics",             price: 3500,  category: "Data Analysis", desc: "Customer segments, purchase frequency, average spend, and churn indicators." },
      { id: "pos39", label: "Employee Performance Reports",   price: 3000,  category: "Data Analysis", desc: "Cashier-level sales totals, transaction counts, and discount usage." },
      { id: "pos40", label: "Automated Scheduled Reports",    price: 2500,  category: "Data Analysis", desc: "Auto-generate and email sales, inventory, and financial reports on schedule." },
      /* ── Accounting ── */
      { id: "pos41", label: "VAT / Tax Calculation",          price: 3500,  category: "Accounting",   desc: "Automatic VAT computation per transaction with BIR-compliant sales reports." },
      { id: "pos42", label: "QuickBooks / Xero Sync",         price: 5000,  category: "Accounting",   desc: "Two-way sync of sales, inventory, and payments with accounting software." },
      { id: "pos43", label: "Expense Tracking",               price: 3500,  category: "Accounting",   desc: "Log and categorize business expenses against branches or cost centers." },
      { id: "pos44", label: "Purchase Order Automation",      price: 5000,  category: "Accounting",   desc: "Auto-generate POs when stock hits reorder points with supplier routing." },
      /* ── AI & Automation ── */
      { id: "pos45", label: "AI Product Recommendations",     price: 7000,  category: "AI",           desc: "Suggest related or frequently bought products to customers at checkout." },
      { id: "pos46", label: "AI Sales Forecasting",           price: 9000,  category: "AI",           desc: "Predict future sales by product, branch, and season using historical data." },
      { id: "pos47", label: "AI Inventory Forecasting",       price: 9000,  category: "AI",           desc: "Smart stock predictions to prevent overstock or stockouts before they happen." },
      { id: "pos48", label: "Dynamic Pricing Engine",         price: 8000,  category: "AI",           desc: "Auto-adjust prices based on demand, stock levels, or competitor pricing rules." },
      { id: "pos49", label: "Automated Workflow Engine",      price: 7500,  category: "AI",           desc: "Set rules to auto-trigger reorders, alerts, reports, and customer messages." },
    ],
  },
  {
    tag: "Warehouse", title: "Warehouse Management System", base: 37500, accent: "#7dc9a0",
    timeline: "8–10 weeks",
    baseFeatures: [
      "Stock in / stock out with quantity tracking",
      "Product catalog with SKU & categories",
      "Basic supplier records & contact info",
      "Manual low-stock alert thresholds",
      "Stock movement history log",
      "Warehouse Staff & Admin user roles",
    ],
    addons: [
      /* ── Inventory Management ── */
      { id: "wh1",  label: "Multi-Warehouse Support",         price: 5000, category: "Inventory",    desc: "Manage inventory across multiple warehouse locations from one unified dashboard." },
      { id: "wh2",  label: "Batch & Lot Tracking",            price: 3500, category: "Inventory",    desc: "Track production batches and lot numbers with full expiry and traceability per batch." },
      { id: "wh3",  label: "Serial Number Tracking",          price: 3000, category: "Inventory",    desc: "Assign and track unique serial numbers per unit — essential for electronics and equipment." },
      { id: "wh4",  label: "Expiry Date Monitoring",          price: 2500, category: "Inventory",    desc: "Get automated alerts before stock expires. Critical for food, pharma, and perishables." },
      { id: "wh5",  label: "Safety Stock Automation",         price: 3000, category: "Inventory",    desc: "Auto-compute reorder buffer levels and trigger purchase requests before stockout occurs." },
      { id: "wh6",  label: "Stock Reservation System",        price: 3000, category: "Inventory",    desc: "Reserve specific inventory for confirmed orders, preventing allocation conflicts." },
      { id: "wh7",  label: "Inventory Auditing Tools",        price: 2500, category: "Inventory",    desc: "Cycle count tools, variance reconciliation, and physical count management built in." },
      /* ── Barcode & Scanning ── */
      { id: "wh8",  label: "Barcode Scanning",                price: 3500, category: "Scanning",     desc: "Scan barcodes on receiving, picking, and dispatch to eliminate manual entry errors." },
      { id: "wh9",  label: "QR Code Label Generation",        price: 2000, category: "Scanning",     desc: "Generate and print QR code labels for products, bins, and shelving locations." },
      { id: "wh10", label: "Mobile Scanner App",              price: 3000, category: "Scanning",     desc: "Use any Android phone as a warehouse scanner — no dedicated hardware required." },
      /* ── Order Management ── */
      { id: "wh11", label: "Purchase Order System",           price: 3000, category: "Orders",       desc: "Create, send, and track purchase orders with supplier confirmation and receiving workflows." },
      { id: "wh12", label: "Returns Management (RMA)",        price: 3500, category: "Orders",       desc: "Handle customer and supplier returns with inspection, restocking, and credit note workflows." },
      { id: "wh13", label: "Backorder Management",            price: 2500, category: "Orders",       desc: "Track and fulfill orders automatically when out-of-stock items are replenished." },
      { id: "wh14", label: "Pick & Pack Workflow",            price: 3500, category: "Orders",       desc: "Guided picking lists, packing confirmation, and weight/dimension logging per shipment." },
      /* ── Shipping & Logistics ── */
      { id: "wh15", label: "Delivery & Dispatch Tracking",    price: 3500, category: "Logistics",    desc: "Log outbound deliveries with driver assignment, status updates, and proof of delivery." },
      { id: "wh16", label: "Shipping Label Automation",       price: 2500, category: "Logistics",    desc: "Auto-generate shipping labels with courier format (J&T, LBC, Lalamove) on dispatch." },
      { id: "wh17", label: "Freight Cost Calculator",         price: 2000, category: "Logistics",    desc: "Compute estimated shipping costs by weight, dimension, and destination before dispatch." },
      { id: "wh18", label: "Courier Integration",             price: 4000, category: "Logistics",    desc: "Live status sync with local couriers (J&T, LBC, Flash, Ninja Van) via API." },
      /* ── Reporting & Analytics ── */
      { id: "wh19", label: "Warehouse Analytics Dashboard",   price: 4500, category: "Analytics",    desc: "Real-time overview of stock levels, turnover rates, and warehouse performance KPIs." },
      { id: "wh20", label: "Stock Movement Reports",          price: 3000, category: "Analytics",    desc: "Full audit trail of every stock movement — inbound, outbound, transfers, and adjustments." },
      { id: "wh21", label: "Dead Stock & Aging Reports",      price: 3000, category: "Analytics",    desc: "Identify slow-moving and obsolete inventory to free up space and recover capital." },
      { id: "wh22", label: "Demand Forecasting Report",       price: 4000, category: "Analytics",    desc: "Predict future stock needs from historical consumption patterns and seasonal trends." },
      { id: "wh23", label: "Supplier Performance Report",     price: 3000, category: "Analytics",    desc: "Score suppliers on lead time, fill rate, and pricing accuracy over any date range." },
      { id: "wh24", label: "Stock Valuation Report (FIFO/AVG)", price: 3500, category: "Analytics", desc: "Calculate total inventory value using FIFO or weighted average cost methods." },
      { id: "wh25", label: "Excel / PDF Export on All Reports", price: 2000, category: "Analytics", desc: "Export any report or table to formatted Excel or branded PDF with one click." },
      /* ── Workforce & HR ── */
      { id: "wh26", label: "Employee Time & Attendance",      price: 3000, category: "Workforce",    desc: "Shift scheduling, DTR logging, and overtime tracking for warehouse staff." },
      { id: "wh27", label: "Task Assignment System",          price: 2500, category: "Workforce",    desc: "Assign warehouse jobs to specific workers with deadline tracking and completion status." },
      { id: "wh28", label: "Productivity Tracking",           price: 3000, category: "Workforce",    desc: "Measure picks-per-hour, error rates, and fulfillment speed per warehouse employee." },
      /* ── Integrations ── */
      { id: "wh29", label: "Shopee / Lazada Integration",     price: 5000, category: "Integrations", desc: "Sync product listings, orders, and inventory in real-time with Shopee and Lazada stores." },
      { id: "wh30", label: "Shopify / WooCommerce Sync",      price: 5000, category: "Integrations", desc: "Two-way inventory and order sync with your Shopify or WooCommerce online store." },
      { id: "wh31", label: "POS Integration",                 price: 4000, category: "Integrations", desc: "Connect to your retail POS system so in-store sales automatically deduct from warehouse stock." },
      { id: "wh32", label: "Accounting System Export",        price: 3500, category: "Integrations", desc: "Push purchase orders, invoices, and stock valuations directly to QuickBooks or Xero." },
      { id: "wh33", label: "API Access",                      price: 4500, category: "Integrations", desc: "Full REST API access to connect any external system — ERP, 3PL, or custom apps." },
      /* ── Security & Compliance ── */
      { id: "wh34", label: "Role-Based Access Control",       price: 2500, category: "Security",     desc: "Granular permission levels per user — restrict access to sensitive data by role." },
      { id: "wh35", label: "Audit Logs",                      price: 2000, category: "Security",     desc: "Full user activity history — every action logged with timestamp and user ID." },
      { id: "wh36", label: "Backup & Data Recovery",          price: 2500, category: "Security",     desc: "Automated daily backups with one-click restore — your data is never lost." },
      /* ── Mobile & Cloud ── */
      { id: "wh37", label: "Mobile Warehouse App",            price: 4000, category: "Mobile",       desc: "Dedicated Android/iOS app for warehouse staff — scan, receive, and dispatch on the go." },
      { id: "wh38", label: "Offline Mode",                    price: 3500, category: "Mobile",       desc: "Continue warehouse operations without internet — syncs automatically when reconnected." },
      { id: "wh39", label: "Multi-Language Support",          price: 2000, category: "Mobile",       desc: "Switch system language between Filipino, English, and other supported locales." },
      /* ── AI & Advanced ── */
      { id: "wh40", label: "AI Demand Forecasting",           price: 8000, category: "AI",           desc: "Machine learning model that predicts stock needs based on sales trends, seasonality, and lead times." },
      { id: "wh41", label: "AI Slotting Optimization",        price: 6000, category: "AI",           desc: "Intelligently suggest optimal product placement in the warehouse to minimize pick travel time." },
      { id: "wh42", label: "Predictive Restock Alerts",       price: 5000, category: "AI",           desc: "AI-powered alerts that flag which items will run out before manual thresholds are triggered." },
      /* ── Supplier Invoice ── */
      { id: "wh43", label: "Supplier Invoice Tracking",       price: 2500, category: "Finance",      desc: "Match supplier invoices to purchase orders and track payment status per delivery." },
      { id: "wh44", label: "Landed Cost Tracking",            price: 3000, category: "Finance",      desc: "Allocate freight, customs, and handling costs to the correct inventory items on import." },
    ],
  },
  {
    tag: "Inventory", title: "Inventory Control System", base: 27000, accent: "#8fc99a",
    timeline: "6–8 weeks",
    baseFeatures: [
      "Real-time stock level tracking",
      "Product records with unit & category",
      "Low-stock alert with threshold setting",
      "Manual purchase order creation",
      "Stock adjustment & variance logging",
      "Admin & Staff user roles",
    ],
    addons: [
      /* ── 1. Core Inventory Management ── */
      { id: "inv1",  label: "Multi-Warehouse Management",      price: 8000,  weeks: 1.5, category: "Core",          desc: "Manage multiple warehouse branches with per-location stock visibility and transfers." },
      { id: "inv2",  label: "Real-Time Inventory Sync",        price: 5000,  weeks: 1,   category: "Core",          desc: "Instant stock updates across all locations and channels as transactions occur." },
      { id: "inv3",  label: "Batch & Lot Tracking",            price: 6000,  weeks: 1,   category: "Core",          desc: "Track production batches and lot numbers for full traceability and recall management." },
      { id: "inv4",  label: "Serial Number Tracking",          price: 5000,  weeks: 1,   category: "Core",          desc: "Assign and track unique serial numbers per item for warranty and support management." },
      { id: "inv5",  label: "Expiry Date & Shelf-life Monitoring", price: 4000, weeks: 0.5, category: "Core",       desc: "Track expiry dates per batch. Auto-flag items approaching or past their shelf-life." },
      { id: "inv6",  label: "Inventory Forecasting",           price: 9000,  weeks: 2,   category: "Core",          desc: "AI-powered demand forecasting to predict restocking needs and reduce overstock." },
      { id: "inv7",  label: "Safety Stock Automation",         price: 4500,  weeks: 1,   category: "Core",          desc: "Automatically compute and maintain safety stock levels based on lead time and demand." },
      { id: "inv8",  label: "Inventory Auditing",              price: 4000,  weeks: 0.5, category: "Core",          desc: "Scheduled and ad-hoc stock verification with variance reporting and discrepancy logs." },
      { id: "inv9",  label: "Stock Reservation",               price: 4500,  weeks: 1,   category: "Core",          desc: "Reserve inventory for confirmed sales or production orders to prevent overselling." },
      { id: "inv10", label: "Consignment Inventory",           price: 6000,  weeks: 1,   category: "Core",          desc: "Manage supplier-owned stock on your premises with consignment accounting." },
      /* ── 2. Barcode & RFID ── */
      { id: "inv11", label: "Barcode Scanning",                price: 3500,  weeks: 0.5, category: "Barcode & RFID", desc: "Scan barcodes for fast receiving, picking, and inventory counting." },
      { id: "inv12", label: "Advanced Barcode Automation",     price: 7000,  weeks: 1.5, category: "Barcode & RFID", desc: "Automated scanning workflows for receiving, putaway, picking, and shipping." },
      { id: "inv13", label: "QR Code Management",              price: 3500,  weeks: 0.5, category: "Barcode & RFID", desc: "Generate and print QR labels for products, bins, and locations." },
      { id: "inv14", label: "Mobile Scanner App",              price: 4000,  weeks: 1,   category: "Barcode & RFID", desc: "Use a smartphone camera as a scanner for inventory operations on the floor." },
      /* ── 3. Order & Sales Management ── */
      { id: "inv15", label: "Order Management System",         price: 6000,  weeks: 1.5, category: "Orders",        desc: "Centralized order management from creation to fulfillment with status tracking." },
      { id: "inv16", label: "Pick & Pack Automation",          price: 7000,  weeks: 1.5, category: "Orders",        desc: "Automated packing workflow with pick lists, bin locations, and packing verification." },
      { id: "inv17", label: "Returns Management (RMA)",        price: 5000,  weeks: 1,   category: "Orders",        desc: "Product return handling with RMA numbers, inspection workflow, and restocking." },
      { id: "inv18", label: "Backorder Management",            price: 4000,  weeks: 0.5, category: "Orders",        desc: "Auto-manage out-of-stock orders with backorder queues and fulfillment scheduling." },
      { id: "inv19", label: "POS Integration",                 price: 5000,  weeks: 1,   category: "Orders",        desc: "Sync retail POS sales in real-time with inventory deduction and reconciliation." },
      /* ── 4. Shipping & Logistics ── */
      { id: "inv20", label: "Courier Integration (J&T/LBC/DHL)",price: 5000, weeks: 1,   category: "Shipping",      desc: "Connect with J&T, LBC, DHL — auto-book pickups and generate waybills." },
      { id: "inv21", label: "Real-Time Shipment Tracking",     price: 4500,  weeks: 1,   category: "Shipping",      desc: "Live delivery tracking synced from courier APIs into your order records." },
      { id: "inv22", label: "Shipping Label Automation",       price: 3500,  weeks: 0.5, category: "Shipping",      desc: "Auto-generate and print shipping labels with order data and courier barcodes." },
      { id: "inv23", label: "Freight Cost Calculator",         price: 3500,  weeks: 0.5, category: "Shipping",      desc: "Compute shipping cost at checkout or order creation based on weight and destination." },
      /* ── 5. Procurement & Purchasing ── */
      { id: "inv24", label: "Purchase Order System",           price: 4500,  weeks: 1,   category: "Procurement",   desc: "Full PO workflow — create, approve, receive, and match against invoices." },
      { id: "inv25", label: "Supplier Portal",                 price: 6000,  weeks: 1.5, category: "Procurement",   desc: "Vendor collaboration portal for quote submission, PO acknowledgment, and invoicing." },
      { id: "inv26", label: "Supplier Price Comparison",       price: 4000,  weeks: 1,   category: "Procurement",   desc: "Compare vendor quotations side-by-side to select the best price and lead time." },
      { id: "inv27", label: "Approval Workflow",               price: 3500,  weeks: 0.5, category: "Procurement",   desc: "Multi-level purchase approval routing with email notifications and audit trail." },
      { id: "inv28", label: "Vendor Performance Tracking",     price: 4000,  weeks: 1,   category: "Procurement",   desc: "Score suppliers on delivery, quality, and pricing with performance dashboards." },
      /* ── 6. Accounting & Financial ── */
      { id: "inv29", label: "Accounting Integration",          price: 6000,  weeks: 1.5, category: "Finance",       desc: "Sync inventory values and COGS with QuickBooks, Xero, or custom accounting." },
      { id: "inv30", label: "Cost Tracking",                   price: 4500,  weeks: 1,   category: "Finance",       desc: "Track landed costs, carrying costs, and COGS per product and category." },
      { id: "inv31", label: "Tax Management",                  price: 3500,  weeks: 0.5, category: "Finance",       desc: "VAT/EVAT computation on purchases and sales with BIR-compliant tax reports." },
      { id: "inv32", label: "Purchase Invoice Generation",     price: 3000,  weeks: 0.5, category: "Invoices",      desc: "Auto-generate supplier invoices from received POs with PDF export." },
      { id: "inv33", label: "Supplier Performance Report",     price: 3000,  weeks: 0.5, category: "Invoices",      desc: "Printable supplier KPI report with delivery accuracy, lead time, and pricing trends." },
      { id: "inv34", label: "Stock Valuation Report (FIFO/AVG)",price: 3500, weeks: 0.5, category: "Invoices",      desc: "Generate stock valuation reports using FIFO or weighted average costing methods." },
      { id: "inv35", label: "Excel / PDF Export on All Reports",price: 2000, weeks: 0.5, category: "Invoices",      desc: "One-click export of any report to Excel or PDF for sharing and archiving." },
      /* ── 7. E-commerce & Marketplace ── */
      { id: "inv36", label: "Shopee Integration",              price: 5000,  weeks: 1,   category: "E-commerce",    desc: "Sync Shopee orders and auto-deduct inventory upon order confirmation." },
      { id: "inv37", label: "Lazada Integration",              price: 5000,  weeks: 1,   category: "E-commerce",    desc: "Sync Lazada orders and inventory levels in real-time via Lazada API." },
      { id: "inv38", label: "TikTok Shop Integration",         price: 5000,  weeks: 1,   category: "E-commerce",    desc: "Connect TikTok Shop orders to inventory for live stock sync and fulfillment." },
      { id: "inv39", label: "Shopify / WooCommerce Integration",price: 5500, weeks: 1,   category: "E-commerce",    desc: "Bi-directional sync with Shopify or WooCommerce for orders and stock levels." },
      /* ── 8. Reporting & Analytics ── */
      { id: "inv40", label: "Inventory Analytics Dashboard",   price: 5000,  weeks: 1,   category: "Dashboard",     desc: "Real-time KPI dashboard — stock levels, turnover rate, and reorder status." },
      { id: "inv41", label: "Sales vs Stock Analytics",        price: 4000,  weeks: 0.5, category: "Data Analysis",  desc: "Compare sales velocity against current stock levels with trend charts." },
      { id: "inv42", label: "Custom BI Reports",               price: 7000,  weeks: 1.5, category: "Data Analysis",  desc: "Build custom inventory reports with filters, grouping, and chart types." },
      { id: "inv43", label: "Dead Stock & Slow-Mover Report",  price: 3000,  weeks: 0.5, category: "Data Analysis",  desc: "Identify products with no movement for a set period to reduce carrying costs." },
      { id: "inv44", label: "Automated Scheduled Reports",     price: 3000,  weeks: 0.5, category: "Data Analysis",  desc: "Schedule daily, weekly, or monthly reports to be auto-emailed to stakeholders." },
      /* ── 9. Security & Compliance ── */
      { id: "inv45", label: "Role-Based Access Control",       price: 3500,  weeks: 0.5, category: "Security",      desc: "Define granular permissions per user role — view, edit, approve, export." },
      { id: "inv46", label: "Full Audit Logs",                 price: 3000,  weeks: 0.5, category: "Security",      desc: "Track every inventory action — who did what, when, and on which item." },
      { id: "inv47", label: "Data Backup & Recovery",          price: 3500,  weeks: 0.5, category: "Security",      desc: "Automated daily backups with point-in-time recovery and export." },
      /* ── 10. Mobile & Cloud ── */
      { id: "inv48", label: "Mobile Inventory App",            price: 6000,  weeks: 1.5, category: "Mobile",        desc: "Android/iOS app for stock counting, receiving, and transfers on the warehouse floor." },
      { id: "inv49", label: "Offline Mode",                    price: 5000,  weeks: 1,   category: "Mobile",        desc: "Full offline inventory access with automatic sync when connectivity returns." },
      { id: "inv50", label: "API Access",                      price: 8000,  weeks: 1.5, category: "Mobile",        desc: "REST API with key auth for connecting with ERP, POS, or third-party platforms." },
    ],
  },
  {
    tag: "CRM", title: "CRM System", base: 30000, accent: "#fcd34d",
    timeline: "7–9 weeks",
    baseFeatures: [
      "Lead & prospect record management",
      "Contact profiles with interaction history",
      "Follow-up notes & task reminders",
      "Deal status & stage tracking",
      "Basic lead source tagging",
      "Sales Rep & Admin user roles",
    ],
    addons: [
      /* ── 1. Core CRM ── */
      { id: "crm_c1",  label: "Lead Management",                price: 3500,  category: "Core CRM" },
      { id: "crm_c2",  label: "Customer Database",              price: 3500,  category: "Core CRM" },
      { id: "crm_c3",  label: "Contact Management",             price: 2500,  category: "Core CRM" },
      { id: "crm_c4",  label: "Opportunity Management",         price: 6000,  category: "Core CRM" },
      { id: "crm_c5",  label: "Deal Tracking",                  price: 3500,  category: "Core CRM" },
      { id: "crm_c6",  label: "Customer Segmentation",          price: 3500,  category: "Core CRM" },
      { id: "crm_c7",  label: "Activity Timeline",              price: 3000,  category: "Core CRM" },
      { id: "crm_c8",  label: "Notes & Attachments",            price: 2000,  category: "Core CRM" },
      { id: "crm_c9",  label: "Task & Reminder System",         price: 2500,  category: "Core CRM" },
      { id: "crm_c10", label: "Calendar Integration",           price: 3500,  category: "Core CRM" },
      { id: "crm_c11", label: "Sales Pipeline Visualization",   price: 6000,  category: "Core CRM" },
      { id: "crm_c12", label: "Custom CRM Fields",              price: 3000,  category: "Core CRM" },
      { id: "crm_c13", label: "Duplicate Detection",            price: 2800,  category: "Core CRM" },
      { id: "crm_c14", label: "CRM Workflow Automation",        price: 7000,  category: "Core CRM" },
      { id: "crm_c15", label: "Customer 360 View",              price: 6000,  category: "Core CRM" },
      /* ── 2. Sales Automation ── */
      { id: "crm_s1",  label: "Sales Automation Engine",        price: 9000,  category: "Sales" },
      { id: "crm_s2",  label: "Quotation Generator",            price: 3500,  category: "Sales" },
      { id: "crm_s3",  label: "Invoice Integration",            price: 3000,  category: "Sales" },
      { id: "crm_s4",  label: "Proposal Management",            price: 5000,  category: "Sales" },
      { id: "crm_s5",  label: "Commission Tracking",            price: 5000,  category: "Sales" },
      { id: "crm_s6",  label: "Territory Management",           price: 5500,  category: "Sales" },
      { id: "crm_s7",  label: "Sales Forecasting",              price: 9000,  category: "Sales" },
      { id: "crm_s8",  label: "Sales KPI Tracking",             price: 4500,  category: "Sales" },
      { id: "crm_s9",  label: "Product Catalog Integration",    price: 3000,  category: "Sales" },
      { id: "crm_s10", label: "CPQ System",                     price: 18000, category: "Sales" },
      /* ── 3. Marketing Automation ── */
      { id: "crm_m1",  label: "Email Marketing",                price: 5000,  category: "Marketing" },
      { id: "crm_m2",  label: "SMS Marketing",                  price: 4500,  category: "Marketing" },
      { id: "crm_m3",  label: "WhatsApp Integration",           price: 5000,  category: "Marketing" },
      { id: "crm_m4",  label: "Social Media Integration",       price: 5000,  category: "Marketing" },
      { id: "crm_m5",  label: "Marketing Automation Workflows", price: 8000,  category: "Marketing" },
      { id: "crm_m6",  label: "Campaign Management",            price: 5000,  category: "Marketing" },
      { id: "crm_m7",  label: "Landing Page Builder",           price: 5000,  category: "Marketing" },
      { id: "crm_m8",  label: "Lead Capture Forms",             price: 2800,  category: "Marketing" },
      { id: "crm_m9",  label: "Pop-Up & Exit Intent Tools",     price: 2800,  category: "Marketing" },
      { id: "crm_m10", label: "Drip Email Campaigns",           price: 5000,  category: "Marketing" },
      { id: "crm_m11", label: "Newsletter System",              price: 3000,  category: "Marketing" },
      { id: "crm_m12", label: "Marketing Analytics",            price: 5000,  category: "Marketing" },
      /* ── 4. Customer Support ── */
      { id: "crm_h1",  label: "Ticketing System",               price: 5000,  category: "Support" },
      { id: "crm_h2",  label: "Live Chat Support",              price: 5000,  category: "Support" },
      { id: "crm_h3",  label: "Omnichannel Support",            price: 9000,  category: "Support" },
      { id: "crm_h4",  label: "Knowledge Base",                 price: 5000,  category: "Support" },
      { id: "crm_h5",  label: "SLA Management",                 price: 5000,  category: "Support" },
      { id: "crm_h6",  label: "Customer Satisfaction Surveys",  price: 3000,  category: "Support" },
      { id: "crm_h7",  label: "Call Center Integration",        price: 9000,  category: "Support" },
      { id: "crm_h8",  label: "Chatbot Integration",            price: 6000,  category: "Support" },
      { id: "crm_h9",  label: "Video Call Integration",         price: 5000,  category: "Support" },
      { id: "crm_h10", label: "Remote Assistance Tools",        price: 9000,  category: "Support" },
      /* ── 5. Ecommerce & POS ── */
      { id: "crm_e1",  label: "Shopify Integration",            price: 3500,  category: "E-commerce" },
      { id: "crm_e2",  label: "WooCommerce Integration",        price: 3500,  category: "E-commerce" },
      { id: "crm_e3",  label: "Lazada Integration",             price: 5000,  category: "E-commerce" },
      { id: "crm_e4",  label: "Shopee Integration",             price: 5000,  category: "E-commerce" },
      { id: "crm_e5",  label: "POS Integration",                price: 5000,  category: "E-commerce" },
      { id: "crm_e6",  label: "Customer Purchase Tracking",     price: 3000,  category: "E-commerce" },
      { id: "crm_e7",  label: "Abandoned Cart Recovery",        price: 5000,  category: "E-commerce" },
      { id: "crm_e8",  label: "Loyalty Rewards Integration",    price: 5000,  category: "E-commerce" },
      { id: "crm_e9",  label: "Ecommerce Analytics",            price: 4500,  category: "E-commerce" },
      /* ── 6. AI & Automation ── */
      { id: "crm_a1",  label: "AI CRM Assistant",               price: 7000,  category: "AI" },
      { id: "crm_a2",  label: "AI Lead Scoring",                price: 9000,  category: "AI" },
      { id: "crm_a3",  label: "AI Sales Prediction",            price: 12000, category: "AI" },
      { id: "crm_a4",  label: "AI Chatbot",                     price: 7000,  category: "AI" },
      { id: "crm_a5",  label: "AI Email Writer",                price: 5000,  category: "AI" },
      { id: "crm_a6",  label: "AI Sentiment Analysis",          price: 12000, category: "AI" },
      { id: "crm_a7",  label: "AI Recommendation Engine",       price: 9000,  category: "AI" },
      { id: "crm_a8",  label: "Workflow Automation Engine",     price: 8000,  category: "AI" },
      { id: "crm_a9",  label: "Predictive Customer Analytics",  price: 12000, category: "AI" },
      /* ── 7. Reporting & Analytics ── */
      { id: "crm_r1",  label: "CRM Dashboard",                  price: 4500,  category: "Analytics" },
      { id: "crm_r2",  label: "Sales Reports",                  price: 3000,  category: "Analytics" },
      { id: "crm_r3",  label: "Lead Conversion Reports",        price: 4500,  category: "Analytics" },
      { id: "crm_r4",  label: "Customer Lifetime Value Reports",price: 5000,  category: "Analytics" },
      { id: "crm_r5",  label: "Employee Performance Reports",   price: 4500,  category: "Analytics" },
      { id: "crm_r6",  label: "Marketing ROI Reports",          price: 4500,  category: "Analytics" },
      { id: "crm_r7",  label: "AI Predictive Analytics",        price: 12000, category: "Analytics" },
      { id: "crm_r8",  label: "Automated Reports",              price: 2800,  category: "Analytics" },
      { id: "crm_r9",  label: "Real-Time Monitoring",           price: 4500,  category: "Analytics" },
      /* ── 8. Accounting & ERP ── */
      { id: "crm_acc1",label: "Accounting Integration",         price: 5500,  category: "ERP" },
      { id: "crm_acc2",label: "QuickBooks Integration",         price: 3500,  category: "ERP" },
      { id: "crm_acc3",label: "Xero Integration",               price: 3500,  category: "ERP" },
      { id: "crm_acc4",label: "SAP Integration",                price: 25000, category: "ERP" },
      { id: "crm_acc5",label: "Oracle Integration",             price: 25000, category: "ERP" },
      { id: "crm_acc6",label: "Inventory Integration",          price: 5000,  category: "ERP" },
      { id: "crm_acc7",label: "Procurement Integration",        price: 5000,  category: "ERP" },
      /* ── 9. Mobile & Cloud ── */
      { id: "crm_mob1",label: "Mobile CRM App",                 price: 6000,  category: "Mobile" },
      { id: "crm_mob2",label: "Cloud Hosting",                  price: 5000,  category: "Mobile" },
      { id: "crm_mob3",label: "Offline CRM Mode",               price: 5000,  category: "Mobile" },
      { id: "crm_mob4",label: "API Access",                     price: 5500,  category: "Mobile" },
      { id: "crm_mob5",label: "White Label Branding",           price: 8000,  category: "Mobile" },
      { id: "crm_mob6",label: "Multi-Device Sync",              price: 2800,  category: "Mobile" },
      { id: "crm_mob7",label: "Custom Domain Setup",            price: 2500,  category: "Mobile" },
      /* ── 10. Security & Compliance ── */
      { id: "crm_sec1",label: "Role-Based Access Control",      price: 2500,  category: "Security" },
      { id: "crm_sec2",label: "Audit Logs",                     price: 2000,  category: "Security" },
      { id: "crm_sec3",label: "Data Encryption",                price: 5000,  category: "Security" },
      { id: "crm_sec4",label: "Two-Factor Authentication",      price: 3000,  category: "Security" },
      { id: "crm_sec5",label: "Backup & Disaster Recovery",     price: 5000,  category: "Security" },
      { id: "crm_sec6",label: "Electronic Signature Support",   price: 5000,  category: "Security" },
      { id: "crm_sec7",label: "GDPR/Data Privacy Compliance",   price: 12000, category: "Security" },
    ],
  },
  {
    tag: "Booking", title: "Booking & Appointment System", base: 22500, accent: "#b8a0d4",
    timeline: "5–7 weeks",
    baseFeatures: [
      "Online booking form (web-accessible)",
      "Staff calendar & schedule management",
      "Client records & appointment history",
      "Manual booking confirmation",
      "Service catalog with duration & pricing",
      "Staff & Admin user roles",
    ],
    addons: [
      { id: "bk1",  label: "SMS / Email Reminders",          price: 3000, category: "Automation" },
      { id: "bk2",  label: "Walk-in Queue Management",       price: 2500, category: "Operations" },
      { id: "bk3",  label: "Booking Analytics Dashboard",    price: 3500, category: "Dashboard" },
      { id: "bk4",  label: "Revenue & No-show Reports",      price: 2500, category: "Data Analysis" },
      { id: "bk5",  label: "Service Invoice Generation",     price: 2000, category: "Invoices" },
      { id: "bk6",  label: "Multi-staff / Multi-branch",     price: 4000, category: "Operations" },
      { id: "bk7",  label: "PayMongo Deposit Collection",    price: 3500, category: "Finance" },
      { id: "bk8",  label: "Client Loyalty Points",          price: 3000, category: "E-commerce" },
    ],
  },
  {
    tag: "Finance", title: "Invoice & Emailing System", base: 18000, accent: "#c4b5fd",
    timeline: "5–6 weeks",
    baseFeatures: [
      "Professional invoice creation & numbering",
      "Manual email sending to clients",
      "Payment status tracking (Paid/Pending/Overdue)",
      "Client records & billing info",
      "Invoice line items with tax computation",
      "Admin user role with full access",
    ],
    addons: [
      /* ── Core Invoice ── */
      { id: "fi1",  label: "Custom Invoice Templates",        price: 3500,  category: "Core Invoice",   desc: "Personalized invoice designs with your branding, logo, and color scheme." },
      { id: "fi2",  label: "PDF Export with Branding",        price: 2000,  category: "Core Invoice",   desc: "One-click PDF generation with your company header and signature field." },
      { id: "fi3",  label: "Recurring Invoice Schedules",     price: 2500,  category: "Core Invoice",   desc: "Auto-generate and send invoices on set intervals — weekly, monthly, or custom." },
      { id: "fi4",  label: "Quotation & Proforma Invoices",   price: 3000,  category: "Core Invoice",   desc: "Convert quotations and proforma invoices directly into finalized billing." },
      { id: "fi5",  label: "Credit & Debit Notes",            price: 2800,  category: "Core Invoice",   desc: "Refund and adjustment notes linked to original invoices for clean audit trails." },
      { id: "fi6",  label: "Discount & Promo Management",     price: 2000,  category: "Core Invoice",   desc: "Line-item discounts, percentage or fixed, with promo code support." },
      { id: "fi7",  label: "Multi-Currency Support",          price: 3500,  category: "Core Invoice",   desc: "Bill international clients in their currency with live exchange rate handling." },
      { id: "fi8",  label: "Purchase Invoice Tracking",       price: 3500,  category: "Core Invoice",   desc: "Log and track supplier invoices against purchase orders and delivery receipts." },
      { id: "fi9",  label: "Invoice Approval Workflow",       price: 5000,  category: "Core Invoice",   desc: "Multi-level approval routing before invoices are sent — department head, finance." },
      { id: "fi10", label: "Multi-Branch / Multi-Company",    price: 5500,  category: "Core Invoice",   desc: "Manage invoicing across multiple branches or business entities from one dashboard." },
      /* ── Email & Notifications ── */
      { id: "fi11", label: "Automated Invoice Emails",        price: 2500,  category: "Email",          desc: "Auto-send invoices immediately upon creation or on a scheduled trigger." },
      { id: "fi12", label: "Payment Reminder Emails",         price: 2000,  category: "Email",          desc: "Automatic follow-up emails on due date, 3 days after, and 7 days overdue." },
      { id: "fi13", label: "Custom Email Templates",          price: 2800,  category: "Email",          desc: "Branded email layouts for invoices, reminders, and receipts." },
      { id: "fi14", label: "SMS Notifications",               price: 3500,  category: "Email",          desc: "SMS alerts to clients for invoice sent, payment due, and payment received." },
      { id: "fi15", label: "Email Open & Click Tracking",     price: 4000,  category: "Email",          desc: "Know exactly when a client opened your invoice email and clicked payment links." },
      { id: "fi16", label: "WhatsApp Invoice Alerts",         price: 5000,  category: "Email",          desc: "Send invoice notifications and payment reminders directly via WhatsApp Business API." },
      { id: "fi17", label: "Bulk Email Sending",              price: 3500,  category: "Email",          desc: "Send invoices or reminders to hundreds of clients simultaneously." },
      /* ── Payments ── */
      { id: "fi18", label: "PayMongo Payment Links",          price: 3000,  category: "Payments",       desc: "Shareable payment URLs that let clients pay directly via GCash, Maya, or card." },
      { id: "fi19", label: "GCash Integration",               price: 4500,  category: "Payments",       desc: "Accept GCash payments directly linked to your invoices." },
      { id: "fi20", label: "Maya Integration",                price: 4500,  category: "Payments",       desc: "Accept Maya (PayMaya) payments with automatic payment status update." },
      { id: "fi21", label: "Bank Transfer Integration",       price: 5000,  category: "Payments",       desc: "Provide bank transfer details per invoice with payment confirmation uploads." },
      { id: "fi22", label: "Installment Billing",             price: 5500,  category: "Payments",       desc: "Split invoices into scheduled partial payments with automatic tracking." },
      { id: "fi23", label: "Subscription Billing",            price: 6000,  category: "Payments",       desc: "Recurring subscription charges with automatic invoice and payment collection." },
      { id: "fi24", label: "Auto Payment Reconciliation",     price: 8000,  category: "Payments",       desc: "Automatically match incoming payments to open invoices and close them." },
      /* ── Dashboard & Analytics ── */
      { id: "fi25", label: "Revenue Dashboard",               price: 3500,  category: "Dashboard",      desc: "Live KPI overview — total billed, collected, outstanding, and overdue at a glance." },
      { id: "fi26", label: "Sales & Tax Reports",             price: 3000,  category: "Data Analysis",  desc: "Invoice sales summaries and VAT/BIR-ready tax breakdown reports." },
      { id: "fi27", label: "Overdue & Aging Reports",         price: 2500,  category: "Data Analysis",  desc: "Aging buckets (0-30, 31-60, 61-90 days) for receivables collection management." },
      { id: "fi28", label: "Customer Payment Reports",        price: 3000,  category: "Data Analysis",  desc: "Client-level payment history, average payment days, and overdue frequency." },
      { id: "fi29", label: "Cash Flow Forecasting",           price: 6000,  category: "Data Analysis",  desc: "Revenue prediction based on outstanding invoices, payment patterns, and schedules." },
      { id: "fi30", label: "Scheduled Auto Reports",          price: 2500,  category: "Data Analysis",  desc: "Auto-generate and email financial reports weekly or monthly without manual action." },
      /* ── Portals & Access ── */
      { id: "fi31", label: "Client Payment Portal",           price: 4000,  category: "Portal",         desc: "Self-service portal where clients view invoices, payment history, and download receipts." },
      { id: "fi32", label: "Digital Signature Support",       price: 4500,  category: "Portal",         desc: "Clients can e-sign invoices and contracts directly in the portal." },
      { id: "fi33", label: "Role-Based Access Control",       price: 2500,  category: "Portal",         desc: "Separate access for Admin, Accountant, Sales, and View-only roles." },
      { id: "fi34", label: "Audit Logs",                      price: 2000,  category: "Portal",         desc: "Full history of every invoice action — created, edited, sent, paid, voided." },
      /* ── Accounting & Finance ── */
      { id: "fi35", label: "VAT / BIR Tax Filing Reports",    price: 5000,  category: "Accounting",     desc: "BIR-compliant VAT returns, 2550M/Q, and tax certificate generation." },
      { id: "fi36", label: "Expense Tracking",                price: 3500,  category: "Accounting",     desc: "Log and categorize business expenses against projects or cost centers." },
      { id: "fi37", label: "Profit & Loss Reports",           price: 4500,  category: "Accounting",     desc: "Simple P&L statements generated from invoiced revenue and tracked expenses." },
      { id: "fi38", label: "QuickBooks / Xero Sync",          price: 5000,  category: "Accounting",     desc: "Two-way sync of invoices, payments, and clients with QuickBooks or Xero." },
      /* ── AI & Automation ── */
      { id: "fi39", label: "AI Invoice Generator",            price: 8000,  category: "AI",             desc: "AI fills invoice details based on client history, past transactions, and templates." },
      { id: "fi40", label: "AI Payment Prediction",           price: 9000,  category: "AI",             desc: "Predict which clients are likely to pay late based on behavior patterns." },
      { id: "fi41", label: "Automated Workflow Engine",       price: 7500,  category: "AI",             desc: "Set rules to auto-send, auto-remind, auto-escalate, and auto-close invoices." },
    ],
  },
  {
    tag: "Restaurant", title: "Restaurant Ordering System", base: 27000, accent: "#fdba74",
    timeline: "6–8 weeks",
    baseFeatures: [
      "QR code menu (scan to order)",
      "Table-based order taking",
      "Basic kitchen order display (KDS)",
      "Daily sales log & shift summary",
      "Menu management with pricing",
      "Cashier & Admin user roles",
    ],
    addons: [
      { id: "re1",  label: "Advanced Kitchen Display (KDS)", price: 3000, category: "Operations" },
      { id: "re2",  label: "Table Management & Floor Plan",  price: 2500, category: "Operations" },
      { id: "re3",  label: "Restaurant Analytics Dashboard", price: 4000, category: "Dashboard" },
      { id: "re4",  label: "Best Seller & Menu Reports",     price: 2500, category: "Data Analysis" },
      { id: "re5",  label: "Customer Receipt / Invoice",     price: 1500, category: "Invoices" },
      { id: "re6",  label: "Online Ordering (Delivery)",     price: 5000, category: "E-commerce" },
      { id: "re7",  label: "Loyalty & Promo System",         price: 3000, category: "E-commerce" },
      { id: "re8",  label: "Inventory Integration",          price: 3500, category: "Operations" },
      { id: "re9",  label: "PayMongo QR Payment",            price: 3000, category: "Finance" },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Dashboard":      "#7eb8d4",
  "Data Analysis":  "#86efac",
  "Invoices":       "#c4b5fd",
  "Core Invoice":   "#c4b5fd",
  "Email":          "#fcd34d",
  "Payments":       "#f9a8d4",
  "Accounting":     "#67e8f9",
  "AI":             "#c4b5fd",
  "AI & Automation":"#fcd34d",
  "Automation":     "#fcd34d",
  "Finance":        "#f9a8d4",
  "Operations":     "#7dc9a0",
  "HR":             "#67e8f9",
  "Portal":         "#b8a0d4",
  "E-commerce":     "#fdba74",
  "Core POS":       "#fdba74",
  "Delivery":       "#67e8f9",
  "CRM":            "#fcd34d",
  "Core CRM":       "#fcd34d",
  "Sales":          "#fcd34d",
  "Marketing":      "#f9a8d4",
  "Support":        "#67e8f9",
  "Analytics":      "#86efac",
  "ERP":            "#7eb8d4",
  "Planning":       "#7eb8d4",
  "Core":           "#8fc99a",
  "Barcode & RFID": "#f9a8d4",
  "Orders":         "#67e8f9",
  "Shipping":       "#7eb8d4",
  "Procurement":    "#fcd34d",
  "Security":       "#c4b5fd",
  "Mobile":         "#fdba74",
  "Core Modules":   "#7dc9a0",
  "Estimation":     "#86efac",
  "Scheduling":     "#7eb8d4",
  "BIM":            "#f9a8d4",
  "Workforce":      "#67e8f9",
  "Field & Mobile": "#fdba74",
  "Enterprise":     "#c4b5fd",
  "Compliance":     "#b8a0d4",
  "Equipment":      "#7dc9a0",
  "IoT":            "#86efac",
  "Integrations":   "#f9a8d4",
  "Scanning":       "#fcd34d",
  "Logistics":      "#67e8f9",
  "Inventory":      "#8fc99a",
  "Payroll":        "#67e8f9",
  "Attendance":     "#7dc9a0",
  "HR Mgmt":        "#b8a0d4",
  "Recruitment":    "#fcd34d",
  "Performance":    "#86efac",
  "Academic":       "#86efac",
};

function SystemsCarousel() {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const total = systems.length;

  /* ── Modal state ─────────────────────────────────────────────────── */
  const [modalSys,  setModalSys]  = useState<ConfigSystem | null>(null);
  const [selected,  setSelected]  = useState<Record<string, boolean>>({});
  const [activeCat, setActiveCat] = useState("All");

  /* Open modal — match carousel system tag to configuratorSystems,
     then pre-check any add-on whose label fuzzy-matches a carousel feature */
  function openModal(s: typeof systems[0]) {
    const cfg = configuratorSystems.find(c => c.tag === s.tag) ?? null;
    if (!cfg) return;

    // Pre-check add-ons whose label matches any of the carousel card features
    const preChecked: Record<string, boolean> = {};
    cfg.addons.forEach(addon => {
      const addonLower = addon.label.toLowerCase();
      const matches = s.features.some(feat => {
        const featLower = feat.toLowerCase();
        // Match if either contains key words of the other
        return addonLower.includes(featLower) ||
               featLower.includes(addonLower) ||
               addonLower.split(" ").some(w => w.length > 3 && featLower.includes(w)) ||
               featLower.split(" ").some(w => w.length > 3 && addonLower.includes(w));
      });
      if (matches) preChecked[addon.id] = true;
    });

    setSelected(preChecked);
    setActiveCat("All");
    setModalSys(cfg);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setModalSys(null);
    document.body.style.overflow = "";
  }

  /* Escape key */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeModal(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Toggle add-on */
  function toggle(id: string) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  /* Live price */
  const addonsTotal  = modalSys ? modalSys.addons.filter(a => selected[a.id]).reduce((s, a) => s + a.price, 0) : 0;
  const totalPrice   = (modalSys?.base ?? 0) + addonsTotal;
  const selectedAddons = modalSys?.addons.filter(a => selected[a.id]) ?? [];
  const categories   = modalSys ? ["All", ...Array.from(new Set(modalSys.addons.map(a => a.category)))] : [];
  const visibleAddons = modalSys ? (activeCat === "All" ? modalSys.addons : modalSys.addons.filter(a => a.category === activeCat)) : [];

  /* Delivery estimate: pulled directly from system timeline, addons stack on top */
  const [baseMinWks, baseMaxWks] = modalSys?.timeline
    ? modalSys.timeline.replace(" weeks","").split("–").map(Number)
    : [6, 8];
  const addonWeeks = Math.round(selectedAddons.length * 0.3 * 2) / 2;
  const minWks = baseMinWks + addonWeeks;
  const maxWks = baseMaxWks + addonWeeks;
  const deliveryEst = `${minWks % 1 === 0 ? minWks : minWks.toFixed(1)}–${maxWks % 1 === 0 ? maxWks : maxWks.toFixed(1)} weeks`;

  /* Carousel navigation */
  const goTo = (idx: number) => {
    const wrapped = ((idx % total) + total) % total;
    setCurrent(wrapped);
  };

  useEffect(() => {
    if (!trackRef.current) return;
    const CARD_W = 380;
    const GAP = 24;
    trackRef.current.style.transform = `translateX(-${current * (CARD_W + GAP)}px)`;
  }, [current]);

  return (
    <>
      {/* ── Carousel ──────────────────────────────────────────────── */}
      <div className="vSysCarouselWrap">
        <div className="vSysCarouselViewport">
          <div className="vSysCarouselTrack" ref={trackRef}>
            {systems.map((s, i) => (
              <div
                key={s.tag}
                className={"vSysCarouselCard" + (i === current ? " vSysCarouselCardActive" : "")}
                onClick={() => goTo(i)}
                style={{ "--acc": s.accent } as React.CSSProperties}
              >
                {/* Top row */}
                <div className="vSysCardTopRow">
                  <span className="vSysCardNum">{String(i + 1).padStart(2, "0")}</span>
                  <span className="vSysCardDeployBadge" style={{ color: s.accent, borderColor: s.accent + "40", background: s.accent + "12" }}>
                    {s.deploy}
                  </span>
                </div>
                <div className="vSysCardRule" />
                <span className="vSysCardTag" style={{ color: s.accent }}>{s.tag}</span>
                <h3 className="vSysCardTitle">{s.title}</h3>
                <p className="vSysCardDesc">{s.desc}</p>
                <div className="vSysCardTimeline">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  <span>Est. delivery: <strong>{s.timeline}</strong></span>
                </div>
                <ul className="vSysCardFeatures">
                  {s.features.map((f, fi) => (
                    <li key={fi} className="vSysCardFeatureItem">
                      <span className="vSysCardFeatureDot" style={{ background: s.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {/* Price + Configure button */}
                <div className="vSysCardFooter">
                  <div className="vSysCardPriceBlock">
                    <span className="vSysCardPriceLabel">Starts at</span>
                    <span className="vSysCardPrice" style={{ color: s.accent }}>{s.price}</span>
                  </div>
                  <button
                    className="vSystemBtn vSystemBtnGreen"
                    onClick={(e) => { e.stopPropagation(); openModal(s); }}
                  >
                    Configure →
                  </button>
                </div>
                {/* Always included */}
                <div className="vSysCardIncluded">
                  <div className="vSysCardIncludedItem">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Domain deployment included
                  </div>
                  <div className="vSysCardIncludedItem">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Responsive design included
                  </div>
                </div>
                {/* Payment terms */}
                <div className="vSysCardTermsRow">
                  <div className="vSysCardTerm">
                    <span className="vSysCardTermNum" style={{ color: s.accent }}>30%</span>
                    <span className="vSysCardTermLabel">downpayment to start</span>
                  </div>
                  <div className="vSysCardTermDivider" />
                  <div className="vSysCardTerm">
                    <span className="vSysCardTermNum" style={{ color: s.accent }}>70%</span>
                    <span className="vSysCardTermLabel">on final delivery</span>
                  </div>
                  <div className="vSysCardTermDivider" />
                  <div className="vSysCardTerm">
                    <span className="vSysCardTermNum" style={{ color: s.accent }}>100%</span>
                    <span className="vSysCardTermLabel">source code yours</span>
                  </div>
                </div>
                <div className="vSysCardPolicy">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Live demo provided. Full access granted only upon complete payment.
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vSysCarouselControls">
          <button className="vSysCarouselArrow" onClick={() => goTo(current - 1)} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="vSysCarouselDots">
            {systems.map((s, i) => (
              <button
                key={i}
                className={"vSysCarouselDot" + (i === current ? " vSysCarouselDotActive" : "")}
                style={i === current ? { background: s.accent, boxShadow: `0 0 8px ${s.accent}88` } : {}}
                onClick={() => goTo(i)}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>
          <button className="vSysCarouselArrow" onClick={() => goTo(current + 1)} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <p className="vSysCarouselCount">{current + 1} / {total}</p>
      </div>

      {/* ── Configure & Price Live Modal ───────────────────────────── */}
      {modalSys && (
        <div className="vConfigModal" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="vConfigModalBox" style={{ "--acc": modalSys.accent } as React.CSSProperties}>

            {/* Header */}
            <div className="vConfigModalHeader">
              <div>
                <span className="vConfigModalTag" style={{ color: modalSys.accent, borderColor: modalSys.accent + "44", background: modalSys.accent + "15" }}>
                  {modalSys.tag}
                </span>
                <h2 className="vConfigModalTitle">Configure &amp; price live.</h2>
                <p className="vConfigModalSub">{modalSys.title} — Start with the base. Add only what you need.</p>
              </div>
              <button className="vConfigModalClose" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <div className="vConfigModalBody">

              {/* Left — base features + add-ons */}
              <div className="vConfigModalLeft">

                {/* Base features — locked/pre-checked */}
                <div className="vConfigModalSection">
                  <p className="vConfigModalSectionLabel">
                    Base package — ₱{modalSys.base.toLocaleString()} <span className="vConfigModalIncluded">included</span>
                  </p>
                  <div className="vConfigModalBaseList">
                    {modalSys.baseFeatures.map((f, i) => (
                      <div key={i} className="vConfigModalBaseItem">
                        <div className="vConfigModalCheck vConfigModalCheckLocked" style={{ background: modalSys.accent, borderColor: modalSys.accent }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="vConfigModalBaseLabel">{f}</span>
                        <span className="vConfigModalLockIcon">🔒</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div className="vConfigModalCats">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className={"vConfigModalCat" + (activeCat === cat ? " active" : "")}
                      style={activeCat === cat ? { borderColor: modalSys.accent, color: modalSys.accent } : {}}
                      onClick={() => setActiveCat(cat)}
                    >{cat}</button>
                  ))}
                </div>

                {/* Add-ons */}
                <div className="vConfigModalAddons">
                  {visibleAddons.map(addon => {
                    const isOn = !!selected[addon.id];
                    const catColor = CATEGORY_COLORS[addon.category] || "#fff";
                    return (
                      <button
                        key={addon.id}
                        className={"vConfigModalAddon" + (isOn ? " on" : "")}
                        style={isOn ? { borderColor: modalSys.accent + "60", background: modalSys.accent + "0d" } : {}}
                        onClick={() => toggle(addon.id)}
                      >
                        <div className="vConfigModalAddonLeft">
                          <div className={"vConfigModalCheck" + (isOn ? " on" : "")}
                            style={isOn ? { background: "#22c55e", borderColor: "#22c55e" } : {}}>
                            {isOn && (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="vConfigModalAddonLabel">{addon.label}</span>
                            <span className="vConfigModalAddonCat" style={{ color: catColor }}>{addon.category}</span>
                            {addon.desc && <span className="vConfigModalAddonDesc">{addon.desc}</span>}
                          </div>
                        </div>
                        <span className="vConfigModalAddonPrice">+₱{addon.price.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right — live price summary */}
              <div className="vConfigModalResult">

                {/* Scrollable content area */}
                <div className="vConfigModalResultScroll">
                  <div className="vConfigModalResultHead">
                    <span className="vConfigModalResultLabel">Your Build</span>
                    <span className="vConfigModalResultTag" style={{ color: modalSys.accent, borderColor: modalSys.accent + "40", background: modalSys.accent + "12" }}>{modalSys.tag}</span>
                  </div>
                  <div className="vConfigModalRow">
                    <span>Base system</span>
                    <span>₱{modalSys.base.toLocaleString()}</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="vConfigModalAddonRows">
                      {selectedAddons.map(a => (
                        <div key={a.id} className="vConfigModalRow vConfigModalRowAddon">
                          <span>+ {a.label}</span>
                          <span>₱{a.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAddons.length === 0 && (
                    <p className="vConfigModalEmpty">No add-ons yet.<br/>Select features on the left.</p>
                  )}
                  <div className="vConfigModalDivider" />
                  <div className="vConfigModalTotal">
                    <span>Total</span>
                    <span className="vConfigModalTotalPrice" style={{ color: modalSys.accent }}>
                      ₱{totalPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="vConfigModalTerms">30% downpayment · 70% on delivery</p>
                  <div className="vConfigModalDelivery">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <span className="vConfigModalDeliveryLabel">EST. DELIVERY</span>
                    <div className="vConfigModalDeliveryRow">
                      <span className="vConfigModalDeliveryVal" style={{ color: modalSys.accent }}>{deliveryEst}</span>
                      {/* +2 wks QA buffer badge with tooltip */}
                      <div className="vConfigModalQaBadge">
                        <span className="vConfigModalQaTag" style={{ color: modalSys.accent, borderColor: modalSys.accent + "44", background: modalSys.accent + "15" }}>
                          +2 wks
                        </span>
                        <div className="vConfigModalQaTooltip">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                          </svg>
                          <span className="vConfigModalQaTip">
                            +2 weeks already included for QA testing, debugging, and error trapping. Card shows base timeline; modal shows base + 2 wks QA.
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedAddons.length > 0 && (
                      <span className="vConfigModalDeliveryNote">+{(addonWeeks).toFixed(1)} wks from {selectedAddons.length} add-on{selectedAddons.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
                </div>{/* end vConfigModalResultScroll */}

                {/* Sticky footer — always visible */}
                <div className="vConfigModalResultFooter">
                  <a
                    href={`/register`}
                    className="vConfigModalCta"
                  >
                    Start This Build →
                  </a>
                  <p className="vConfigModalCtaSub">{selectedAddons.length} add-on{selectedAddons.length !== 1 ? "s" : ""} selected · +₱{addonsTotal.toLocaleString()}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* ─── Testimonials ──────────────────────────────────────────────────── */

type Testimonial = {
  id: string;
  name: string;
  project: string;
  rate: number;
  comment: string;
  initials: string;
  accent: string;
};

const accentColors = ["#7dc9a0", "#7eb8d4", "#c4b5fd", "#f9a8d4", "#67e8f9", "#fcd34d", "#fdba74", "#86efac"];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// Testimonials are now DB-backed via /api/testimonials.
// loadTestimonials and saveTestimonials removed — replaced by fetch calls.

function RateBar({ rate, accent }: { rate: number; accent: string }) {
  return (
    <div className="tRateWrap">
      <div className="tRateTrack">
        <div className="tRateFill" style={{ width: `${rate}%`, background: accent }} />
      </div>
      <span className="tRateNum" style={{ color: accent }}>{rate}%</span>
    </div>
  );
}

function PhoneCard({ t }: { t: Testimonial }) {
  return (
    <div className="tPhoneCard">
      <div className="tPhoneCardHeader">
        <div className="tPhoneAvatar" style={{ background: t.accent + "33", color: t.accent }}>
          {t.initials}
        </div>
        <div>
          <p className="tPhoneCardName">{t.name}</p>
          <p className="tPhoneCardProject">{t.project}</p>
        </div>
      </div>
      <RateBar rate={t.rate} accent={t.accent} />
      <p className="tPhoneCardComment">&ldquo;{t.comment}&rdquo;</p>
    </div>
  );
}

function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [active, setActive] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", project: "", rate: 80, comment: "" });
  const [submitted, setSubmitted] = useState(false);

  // ── Fetch approved testimonials from DB on mount ──────────────────────────
  useEffect(() => {
    fetch("/api/testimonials")
      .then(res => res.json())
      .then((data: Testimonial[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
        }
        // If DB has no approved testimonials yet, carousel stays empty — no fake seeds
      })
      .catch(() => {});
  }, []);

  const total = testimonials.length;

  const prev = () => setActive(a => ((a - 1) + total) % total);
  const next = () => setActive(a => (a + 1) % total);

  // ── Submit testimonial to DB (pending admin approval) ──────────────────────
  async function handleSubmit() {
    if (!form.name.trim() || !form.project.trim() || !form.comment.trim()) return;
    try {
      await fetch("/api/testimonials", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:    form.name.trim(),
          project: form.project.trim(),
          rate:    form.rate,
          comment: form.comment.trim(),
        }),
      });
    } catch { /* fire and forget — submission is best-effort */ }
    setForm({ name: "", project: "", rate: 80, comment: "" });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowForm(false); }, 2000);
  }

  if (total === 0) return null;

  const activeT = testimonials[active];

  // Compute indices for side cards
  const leftIdx = ((active - 1) + total) % total;
  const rightIdx = (active + 1) % total;
  const leftT = testimonials[leftIdx];
  const rightT = testimonials[rightIdx];

  return (
    <section className="vTestimonials" id="testimonials">
      <div className="vTestimonialsInner">

        <div className="vSprintHeader">
          <Reveal>
            <span className="vSectionEyebrow">Client Reviews</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">What clients say.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Real feedback from real clients. Every system. Every sprint.</p>
          </Reveal>
        </div>

        {/* ── Carousel ── */}
        <div className="tCarouselWrap">

          {/* Left side card */}
          {total > 1 && (
            <button className="tSideCard tSideCardLeft" onClick={prev} aria-label="Previous">
              <div className="tSideCardInner">
                <div className="tSideAvatar" style={{ background: leftT.accent + "33", color: leftT.accent }}>
                  {leftT.initials}
                </div>
                <div className="tSideInfo">
                  <p className="tSideName">{leftT.name}</p>
                  <p className="tSideProject">{leftT.project}</p>
                </div>
                <div className="tSideRate" style={{ color: leftT.accent }}>{leftT.rate}%</div>
              </div>
            </button>
          )}

          {/* Phone mockup */}
          <div className="tPhoneMockup">
            {/* Phone shell */}
            <div className="tPhoneShell">
              <div className="tPhoneNotch" />
              <div className="tPhoneScreen">
                {/* Instagram-style header */}
                <div className="tPhoneInstaHeader">
                  <div className="tPhoneInstaStories">
                    {testimonials.map((t, i) => (
                      <button
                        key={t.id}
                        className={"tPhoneInstaStory" + (i === active ? " tPhoneInstaStoryActive" : "")}
                        onClick={() => setActive(i)}
                        style={{ borderColor: i === active ? t.accent : "transparent" }}
                      >
                        <span style={{ background: t.accent + "44", color: t.accent, fontSize: 8, fontWeight: 700, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                          {t.initials}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Active card inside screen */}
                <div className="tPhoneScreenContent">
                  <motion.div
                    key={activeT.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <PhoneCard t={activeT} />
                  </motion.div>
                </div>
                {/* Instagram-style actions */}
                <div className="tPhoneInstaActions">
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>{activeT.rate}</span>
                  </div>
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <div className="tPhoneInstaAction">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>
              <div className="tPhoneHomeBar" />
            </div>
          </div>

          {/* Right side card */}
          {total > 1 && (
            <button className="tSideCard tSideCardRight" onClick={next} aria-label="Next">
              <div className="tSideCardInner">
                <div className="tSideAvatar" style={{ background: rightT.accent + "33", color: rightT.accent }}>
                  {rightT.initials}
                </div>
                <div className="tSideInfo">
                  <p className="tSideName">{rightT.name}</p>
                  <p className="tSideProject">{rightT.project}</p>
                </div>
                <div className="tSideRate" style={{ color: rightT.accent }}>{rightT.rate}%</div>
              </div>
            </button>
          )}

        </div>

        {/* Dot indicators */}
        <div className="tDots">
          {testimonials.map((_, i) => (
            <button key={i} className={"tDot" + (i === active ? " tDotActive" : "")}
              style={i === active ? { background: activeT.accent } : {}}
              onClick={() => setActive(i)} aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>

        {/* Add testimonial */}
        <div className="tAddWrap">
          {!showForm ? (
            <button className="tAddBtn" onClick={() => setShowForm(true)}>
              + Leave a review
            </button>
          ) : (
            <div className="tForm">
              <h3 className="tFormTitle">Share your experience</h3>
              <div className="tFormGrid">
                <div className="tFormField">
                  <label className="tFormLabel">Your name</label>
                  <input className="tFormInput" placeholder="e.g. Juan dela Cruz" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: sanitize(e.target.value) }))} />
                </div>
                <div className="tFormField">
                  <label className="tFormLabel">Project / System</label>
                  <input className="tFormInput" placeholder="e.g. Inventory Control System" value={form.project}
                    onChange={e => setForm(f => ({ ...f, project: sanitize(e.target.value) }))} />
                </div>
              </div>
              <div className="tFormField">
                <label className="tFormLabel">Satisfaction rate — <span style={{ color: accentColors[testimonials.length % accentColors.length] }}>{form.rate}%</span></label>
                <input type="range" min={1} max={100} value={form.rate} className="tFormRange"
                  onChange={e => setForm(f => ({ ...f, rate: Number(e.target.value) }))} />
              </div>
              <div className="tFormField">
                <label className="tFormLabel">Your comment</label>
                <textarea className="tFormTextarea" rows={3} placeholder="Tell us about your experience..."
                  value={form.comment} onChange={e => setForm(f => ({ ...f, comment: sanitize(e.target.value) }))} />
              </div>
              <div className="tFormActions">
                <button className="tFormCancel" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="tFormSubmit" onClick={handleSubmit}>
                  {submitted ? "✓ Submitted!" : "Submit Review"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────────── */

const faqs = [
  {
    category: "Timeline",
    accent: "#c9a96e",
    q: "How long does it take to build a system?",
    a: (<>Depends on scope, but most systems ship in <strong>4–8 weeks</strong> from discovery call to final deployment. Smaller systems (Booking, Invoice, CRM) typically land in 3–4 weeks. Larger builds (Payroll, POS + E-commerce, Warehouse) run 6–10 weeks. You'll see a sprint-by-sprint timeline — with exact delivery dates — before we write a single line of code.</>),
  },
  {
    category: "Revisions",
    accent: "#7dc9a0",
    q: "Do you do revisions?",
    a: (<>Yes — revisions are built into every sprint. After each sprint delivery, you review the working module and we address feedback before moving to the next one. Post-launch, we include <strong>2 rounds of revisions</strong> within 30 days. Anything beyond that is covered under a support agreement.</>),
  },
  {
    category: "Tech Stack",
    accent: "#7eb8d4",
    q: "What tech stack do you use?",
    a: (<>We build across multiple stacks depending on deployment target:<br /><br />
      <strong>Public / Web Deployment</strong> — <strong>Laravel</strong> (PHP) for backend APIs and server-side logic, <strong>ReactJS</strong> for the frontend. Hosted on cloud infrastructure with full source code handover.<br /><br />
      <strong>IIS / Enterprise Intranet Deployment</strong> — <strong>ASP.NET + C#</strong>, deployed on Windows Server via IIS. Ideal for companies running internal networks, government setups, or corporate environments that require on-premise hosting.<br /><br />
      <strong>Desktop Applications</strong> — <strong>C# Windows Forms (WFA)</strong> for standalone desktop systems. No browser required — runs directly on Windows machines.<br /><br />
      All systems are handed over with full source code, database schema, and deployment documentation. No lock-in, no recurring license fees.</>),
  },
  {
    category: "Payment",
    accent: "#c4b5fd",
    q: "What are the payment terms?",
    a: (<><strong>30% downpayment to start, 70% on final delivery.</strong> The 30% downpayment locks in your sprint schedule and covers the discovery call, full roadmap, architecture planning, and the first sprint. The remaining 70% is due upon delivery of the final system. <strong>Note:</strong> if full payment is not received within 3 days of delivery, the demo will be temporarily shut down until payment is settled. We accept GCash, Maya, bank transfer, and PayMongo.</>),
  },
  {
    category: "Ownership",
    accent: "#f9a8d4",
    q: "Do I own the source code?",
    a: (<>Yes — <strong>full source code ownership</strong> is transferred on final payment. You get the entire codebase, database schema, deployment configuration, and documentation. No license fees, no vendor lock-in. The system is yours to host, modify, and scale however you need.</>),
  },
  {
    category: "Support",
    accent: "#67e8f9",
    q: "What happens after launch?",
    a: (<>Every system includes <strong>30 days of post-launch support</strong> — bug fixes, minor tweaks, and deployment assistance. After that, we offer optional monthly support retainers for ongoing maintenance, feature additions, or priority response. Details are agreed per project.</>),
  },
  {
    category: "AI Visuals",
    accent: "#86efac",
    q: "What are the AI Visual files — what format and resolution?",
    a: (<>All AI interior, exterior, 3D animation, and character animation videos are delivered as <strong>MP4 files at 1080p full resolution</strong>, rendered at cinematic quality. Once purchased, they're available permanently in your dashboard — re-downloadable anytime. They're cleared for commercial use in presentations, proposals, and marketing.</>),
  },
];

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIdx(prev => (prev === i ? null : i));

  return (
    <section className="vFaq" id="faq">
      <div className="vFaqInner">
        <div className="vSectionHeader" style={{ textAlign: "left" }}>
          <Reveal>
            <span className="vSectionEyebrow">FAQ</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Common questions.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Everything you need to know before starting a project.</p>
          </Reveal>
        </div>

        <div className="vFaqList">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className={`vFaqItem${openIdx === i ? " vFaqOpen" : ""}`}>
                <button className="vFaqTrigger" onClick={() => toggle(i)}>
                  <span className="vFaqQ">{faq.q}</span>
                  <span className="vFaqIcon">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <div className="vFaqBody">
                  <div className="vFaqBodyInner">
                    <p className="vFaqA">{faq.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function VisitorPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="vPage">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="vHero" ref={heroRef}>
        <motion.div className="vHeroBg" style={{ y: heroY }}>
          <video
            className="vHeroVideo"
            src="/hero-bg.mp4"
            autoPlay muted loop playsInline
          />
          <div className="vHeroOverlay" />
          {/* Grain texture */}
          <div className="vHeroGrain" />
        </motion.div>

        <motion.div className="vHeroContent" style={{ opacity: heroOpacity }}>
          <motion.p
            className="vHeroEyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Digital Infrastructure · Enterprise Systems
          </motion.p>

          <motion.h1
            className="vHeroTitle"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            Systems built for<br />
            <em className="vHeroItalic">modern business.</em>
          </motion.h1>

          <motion.p
            className="vHeroSub"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            Warehouse, construction, inventory, and operational systems<br />
            engineered with cinematic precision.
          </motion.p>

          <motion.div
            className="vHeroActions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            <Link href="/register" className="vHeroBtnPrimary">Start a Project</Link>
            <Link href="#systems" className="vHeroBtnSecondary">
              Explore Systems
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          {/* <motion.div
            className="vScrollHint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <div className="vScrollLine" />
            <span>scroll</span>
          </motion.div> */}
        </motion.div>
      </section>

      {/* ── Trust marquee ───────────────────────────────────────────── */}
      <section className="vTrust">
        <Reveal>
          <p className="vTrustLabel">Built with enterprise-grade technology</p>
        </Reveal>
        <Marquee items={techStack} />
      </section>

      {/* ── Systems ─────────────────────────────────────────────────── */}
      <section className="vSystems" id="systems">
        <div className="vSectionHeader">
          <Reveal>
            <span className="vSectionEyebrow">Systems Showcase</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Choose your infrastructure.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Built once. Owned forever. Engineered to outlast your competition.</p>
          </Reveal>
        </div>

        <SystemsCarousel />

        {/* Sprint & Agile Methodology */}
        <div className="vSprintInner">


          <div className="vSprintHeader">
            <Reveal>
              <span className="vSectionEyebrow">How We Build</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">Sprint & Agile methodology.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                Every system we build follows a structured agile process — from your first call to your final approval before a single line of code is written.
              </p>
            </Reveal>
          </div>

          <div className="vSprintTrack">

            {/* Connector line */}
            <div className="vSprintLine" />

            {/* Step 1 */}
            <Reveal delay={0.0}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">01</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="currentColor" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Discovery Call (VC)</h3>
                  <p className="vSprintStepDesc">
                    We start with a video call — no forms, no guesswork. You walk us through your business, your pain points, and what you need the system to do. We listen, ask the right questions, and capture every requirement in detail.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Understand your business workflow</li>
                    <li>Identify pain points & bottlenecks</li>
                    <li>Record all feature requirements</li>
                    <li>Define scope and priorities</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 2 */}
            <Reveal delay={0.1}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">02</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Feature Recording & Backlog</h3>
                  <p className="vSprintStepDesc">
                    Every feature discussed in the call is documented into a structured backlog — broken down into user stories, modules, and sprint tasks. Nothing gets lost, nothing gets assumed.
                  </p>
                  <ul className="vSprintStepList">
                    <li>All features logged as user stories</li>
                    <li>Modules broken into sprint tasks</li>
                    <li>Priority ranking per feature</li>
                    <li>Effort estimation per task</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 3 */}
            <Reveal delay={0.2}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">03</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Full Project Roadmap</h3>
                  <p className="vSprintStepDesc">
                    We build a complete project roadmap — sprint by sprint, milestone by milestone. You see exactly what gets built, when it ships, and what the final system looks like before we write a single line of code.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Sprint-by-sprint delivery plan</li>
                    <li>Milestone & deadline mapping</li>
                    <li>Database & system architecture</li>
                    <li>UI/UX wireframe overview</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 4 */}
            <Reveal delay={0.3}>
              <div className="vSprintStep">
                <div className="vSprintStepNum">04</div>
                <div className="vSprintStepIcon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Client Approval</h3>
                  <p className="vSprintStepDesc">
                    The full roadmap is sent to you for review. You approve every feature, every sprint, and every milestone. No surprises, no scope creep. We don't start building until you sign off.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Roadmap sent via email & VC</li>
                    <li>Client reviews all features</li>
                    <li>Revisions handled before coding</li>
                    <li>Formal sign-off required</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Step 5 */}
            <Reveal delay={0.4}>
              <div className="vSprintStep vSprintStepLast">
                <div className="vSprintStepNum">05</div>
                <div className="vSprintStepIcon vSprintStepIconActive">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="vSprintStepBody">
                  <h3 className="vSprintStepTitle">Sprint Execution & Delivery</h3>
                  <p className="vSprintStepDesc">
                    Once approved, we execute — sprint by sprint, with regular progress updates. Each sprint delivers a working slice of the system. You see real progress every week, not just a final dump at the end.
                  </p>
                  <ul className="vSprintStepList">
                    <li>Agile sprint cycles (1–2 weeks)</li>
                    <li>Weekly progress updates</li>
                    <li>Testing per sprint before next</li>
                    <li>Final UAT & deployment</li>
                  </ul>
                </div>
              </div>
            </Reveal>

          </div>

          {/* Bottom CTA */}
          <Reveal delay={0.3}>
            <div className="vSprintCta">
              <p className="vSprintCtaText">Ready to start your discovery call?</p>
              <a href="/register" className="vHeroBtnPrimary">Book a VC Call</a>
            </div>
          </Reveal>


        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────────── */}
      <section className="vCompare" id="compare">
        <div className="vCompareInner">
          <div className="vSectionHeader">
            <Reveal><span className="vSectionEyebrow">Why Matthew Studio</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">Compare your options.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">Not all solutions are equal. Here's how we stack up against the alternatives.</p>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="vCompareTable">
              {/* Column headers */}
              <div className="vCompareHeader">
                <div className="vCompareHeaderCell vCompareFeatureCol">Feature</div>
                <div className="vCompareHeaderCell vCompareUs">
                  <span className="vCompareUsLabel">Matthew Studio</span>
                  <span className="vCompareUsBadge">Recommended</span>
                </div>
                <div className="vCompareHeaderCell">Agency</div>
                <div className="vCompareHeaderCell">Template</div>
              </div>

              {/* Rows */}
              {[
                { feature: "Custom to your business",  us: true,  agency: true,  template: false },
                { feature: "Fixed price upfront",       us: true,  agency: false, template: true  },
                { feature: "Source code ownership",     us: true,  agency: false, template: false },
                { feature: "1 month free support",      us: true,  agency: false, template: false },
                { feature: "Sprint-based delivery",     us: true,  agency: true,  template: false },
                { feature: "Lifetime access",           us: true,  agency: false, template: true  },
                { feature: "Philippine peso pricing",   us: true,  agency: false, template: false },
                { feature: "No monthly fees",           us: true,  agency: false, template: true  },
                { feature: "Dedicated project manager", us: true,  agency: true,  template: false },
                { feature: "Ready in 2–6 weeks",        us: true,  agency: false, template: true  },
                { feature: "Scalable architecture",     us: true,  agency: true,  template: false },
                { feature: "BIR / PH compliance built-in", us: true, agency: false, template: false },
              ].map((row, i) => (
                <div key={row.feature} className={"vCompareRow" + (i % 2 === 0 ? " vCompareRowAlt" : "")}>
                  <div className="vCompareCell vCompareFeatureCol">
                    <span className="vCompareFeatureText">{row.feature}</span>
                  </div>
                  <div className="vCompareCell vCompareUs">
                    {row.us
                      ? <span className="vCompareTick vCompareTickUs"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#7dc9a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                  <div className="vCompareCell">
                    {row.agency
                      ? <span className="vCompareTick"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                  <div className="vCompareCell">
                    {row.template
                      ? <span className="vCompareTick"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      : <span className="vCompareCross"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    }
                  </div>
                </div>
              ))}

              {/* Price row */}
              <div className="vCompareRow vComparePriceRow">
                <div className="vCompareCell vCompareFeatureCol">
                  <span className="vCompareFeatureText">Typical price range</span>
                </div>
                <div className="vCompareCell vCompareUs">
                  <span className="vComparePriceUs">₱2,999 – ₱15,000</span>
                </div>
                <div className="vCompareCell">
                  <span className="vComparePriceOther">₱50,000 – ₱300,000+</span>
                </div>
                <div className="vCompareCell">
                  <span className="vComparePriceOther">₱500 – ₱5,000 + monthly fees</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How We Build ─────────────────────────────────────────── */}
      {/* ── Process ─────────────────────────────────────────────────── */}
      <section className="vPriceSection" id="pricing">
        <div className="vPriceSectionInner">

          {/* Header */}
          <div className="vSectionHeader">
            <Reveal><span className="vSectionEyebrow">Pricing Transparency</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vSectionTitle">What actually drives cost.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                No hidden fees. No vague quotes. Here's exactly what moves the number up or down.
              </p>
            </Reveal>
          </div>

          {/* 3 factor cards */}
          <div className="vPriceFactors">
            {[
              {
                num: "01",
                label: "Complexity",
                accent: "#7dc9a0",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "The number of modules, user roles, and business rules directly determines how much architecture and engineering is required.",
                low: { label: "Simple", detail: "1–2 modules, single role, basic CRUD", price: "₱5,000 – ₱8,000" },
                high: { label: "Complex", detail: "5+ modules, multi-role, advanced logic", price: "₱15,000 – ₱35,000+" },
                factors: ["Number of modules", "User roles & permissions", "Business rule complexity", "Data relationships"],
              },
              {
                num: "02",
                label: "Integrations",
                accent: "#7eb8d4",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "Every third-party service — payment gateways, SMS APIs, email providers, government portals — adds development and maintenance overhead.",
                low: { label: "None", detail: "Standalone system, no external APIs", price: "No added cost" },
                high: { label: "Multiple", detail: "PayMongo, BIR, SMS, email, maps, etc.", price: "+₱3,000 – ₱8,000 each" },
                factors: ["Payment gateways (PayMongo)", "Government APIs (BIR, SSS)", "SMS & email providers", "Third-party data feeds"],
              },
              {
                num: "03",
                label: "Timeline",
                accent: "#c4b5fd",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                desc: "Rush projects require parallel sprint execution and dedicated resources. Standard timelines allow for proper planning, testing, and delivery.",
                low: { label: "Standard", detail: "4–8 weeks, planned sprints", price: "Base rate" },
                high: { label: "Rush", detail: "Under 2 weeks, expedited delivery", price: "+20% – +40% premium" },
                factors: ["Delivery deadline", "Sprint parallelism required", "Testing & QA time", "Client review cycles"],
              },
            ].map((f, i) => (
              <Reveal key={f.label} delay={i * 0.1}>
                <div className="vPriceCard" style={{ "--acc": f.accent } as React.CSSProperties}>
                  <div className="vPriceCardGlow" />
                  <div className="vPriceCardTop">
                    <span className="vPriceNum">{f.num}</span>
                    <div className="vPriceIcon" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "12" }}>
                      {f.icon}
                    </div>
                  </div>
                  <h3 className="vPriceLabel" style={{ color: f.accent }}>{f.label}</h3>
                  <p className="vPriceDesc">{f.desc}</p>

                  {/* Low / High range */}
                  <div className="vPriceRange">
                    <div className="vPriceRangeRow">
                      <span className="vPriceRangeBadge" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "10" }}>Low</span>
                      <div className="vPriceRangeBody">
                        <span className="vPriceRangeDetail">{f.low.detail}</span>
                        <span className="vPriceRangePrice" style={{ color: f.accent }}>{f.low.price}</span>
                      </div>
                    </div>
                    <div className="vPriceRangeDivider" />
                    <div className="vPriceRangeRow">
                      <span className="vPriceRangeBadge" style={{ color: f.accent, borderColor: f.accent + "33", background: f.accent + "10" }}>High</span>
                      <div className="vPriceRangeBody">
                        <span className="vPriceRangeDetail">{f.high.detail}</span>
                        <span className="vPriceRangePrice" style={{ color: f.accent }}>{f.high.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* What factors in */}
                  <div className="vPriceFactorList">
                    <span className="vPriceFactorLabel">Factors in:</span>
                    <ul className="vPriceFactorItems">
                      {f.factors.map((item) => (
                        <li key={item} className="vPriceFactorItem">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke={f.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Bottom note */}
          <Reveal delay={0.3}>
            <div className="vPriceNote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>
                Every project starts with a <strong>free discovery call</strong> where we scope your requirements and give you a fixed price — no surprises mid-build.{" "}
                <a href="/register" className="vPriceNoteLink">Book your call →</a>
              </p>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      {/* ── Testimonials — social proof while still warm ────────────── */}
      <TestimonialsSection />

      {/* ── About ───────────────────────────────────────────────────── */}
      <section className="vAbout" id="about">
        <div className="vAboutInner">
          <div className="vAboutLeft">
            <Reveal><span className="vSectionEyebrow">About</span></Reveal>
            <Reveal delay={0.1}>
              <h2 className="vAboutTitle">
                We architect systems that<br />
                <em>think ahead.</em>
              </h2>
            </Reveal>
          </div>
          <div className="vAboutRight">
            <Reveal delay={0.15}>
              <p className="vAboutP">
                Matthew Studio is a digital systems company operating at the intersection of enterprise infrastructure and cinematic design. We don't build templates — we engineer precision tools for businesses that demand more than off-the-shelf software.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="vAboutP">
                Every system we deliver is architected for scale, built with enterprise-grade standards, and designed with the kind of visual precision usually reserved for luxury products. The result is infrastructure that performs and impresses.
              </p>
            </Reveal>
            <Reveal delay={0.35}>
              <div className="vAboutStats">
                <div className="vAboutStat">
                  <span className="vAboutStatNum">3+</span>
                  <span className="vAboutStatLabel">System Types</span>
                </div>
                <div className="vAboutStat">
                  <span className="vAboutStatNum">100%</span>
                  <span className="vAboutStatLabel">Custom Built</span>
                </div>
                <div className="vAboutStat">
                  <span className="vAboutStatNum">∞</span>
                  <span className="vAboutStatLabel">Lifetime Access</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Guarantee ────────────────────────────────────────────── */}
      {/* ── Guarantee / Trust Badges ─────────────────────────────────── */}
      <section className="vTrustBadges" id="guarantee">
        <div className="vTrustBadgesInner">
          <Reveal>
            <span className="vSectionEyebrow">Our Guarantee</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vSectionTitle">Built with confidence. Backed by commitment.</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vSectionSub">Every system we deliver comes with these guarantees — no asterisks, no fine print.</p>
          </Reveal>

          <div className="vBadgeGrid">
            {[
              {
                accent: "#7dc9a0",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "1 Month Free Support",
                desc: "After delivery, we stay. Bug fixes, questions, and minor tweaks — all covered free for 30 days. No ticket system. Direct access.",
                tag: "Post-delivery",
              },
              {
                accent: "#7eb8d4",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Source Code Included",
                desc: "You own 100% of the codebase. Full repository access, no lock-in, no licensing fees. Take it anywhere, modify anything.",
                tag: "Full ownership",
              },
              {
                accent: "#c4b5fd",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Lifetime Access",
                desc: "Your dashboard, your assets, your system — forever. No subscriptions, no renewals, no expiry. One payment, infinite access.",
                tag: "No subscriptions",
              },
              {
                accent: "#fcd34d",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                title: "Fixed Price. No Surprises.",
                desc: "We quote before we build. Scope, timeline, and price are locked in writing before a single line of code is written.",
                tag: "Transparent billing",
              },
              {
                accent: "#86efac",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Dedicated Project Manager",
                desc: "A single point of contact throughout every sprint. Weekly updates, direct communication, and zero ambiguity on project status.",
                tag: "Dedicated contact",
              },
              {
                accent: "#fdba74",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Sprint-Based Delivery",
                desc: "You see working software every 1–2 weeks — not a mystery box at the end. Each sprint is reviewed, approved, and signed off by you.",
                tag: "Agile process",
              },
            ].map((b, i) => (
              <Reveal key={b.title} delay={i * 0.07}>
                <div className="vBadgeCard" style={{ "--acc": b.accent } as React.CSSProperties}>
                  <div className="vBadgeCardGlow" />
                  <div className="vBadgeTop">
                    <div className="vBadgeIcon" style={{ color: b.accent, background: b.accent + "14", borderColor: b.accent + "33" }}>
                      {b.icon}
                    </div>
                    <span className="vBadgeTag" style={{ color: b.accent, borderColor: b.accent + "33", background: b.accent + "10" }}>{b.tag}</span>
                  </div>
                  <h3 className="vBadgeTitle">{b.title}</h3>
                  <p className="vBadgeDesc">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Maintenance Fee ──────────────────────────────────────────── */}
      <section className="vMaintenance" id="maintenance">
        <div className="vMaintenanceInner">
          <div className="vSprintHeader">
            <Reveal><span className="vSectionEyebrow">Optional but Recommended</span></Reveal>
            <Reveal delay={0.1}><h2 className="vSectionTitle">Maintenance & Support.</h2></Reveal>
            <Reveal delay={0.2}>
              <p className="vSectionSub">
                Keep your system running at peak performance after launch. Most freelancers skip this — smart ones don&apos;t.
                This is where recurring income is built.
              </p>
            </Reveal>
          </div>

          {/* Tier cards */}
          <div className="vMaintenanceTiers">
            {[
              {
                label: "Basic",
                price: "₱4,500",
                period: "/month",
                color: "#7dc9a0",
                includes: ["Bug fixing & minor revisions", "Email support (48hr response)", "Monthly system health check", "Uptime monitoring"],
              },
              {
                label: "Priority Support",
                price: "₱8,500",
                period: "/month",
                color: "#7eb8d4",
                includes: ["Everything in Basic", "Priority response (24hrs)", "Security patches & updates", "Performance monitoring", "Database backups"],
                highlight: false,
              },
              {
                label: "Full Maintenance",
                price: "₱15,000",
                period: "/month",
                color: "#c4b5fd",
                includes: ["Everything in Priority", "Server monitoring & auto-backups", "Minor feature updates (up to 8hrs/month)", "Monthly performance report", "Dedicated support channel"],
                highlight: true,
              },
            ].map((tier, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={"vMaintenanceTier" + (tier.highlight ? " vMaintenanceTierHighlight" : "")}
                  style={{ "--mt-color": tier.color } as React.CSSProperties}>
                  <div className="vMtHeader">
                    <span className="vMtLabel" style={{ color: tier.color }}>{tier.label}</span>
                    <div className="vMtPrice">
                      <span className="vMtAmount">{tier.price}</span>
                      <span className="vMtPeriod">{tier.period}</span>
                    </div>
                  </div>
                  <ul className="vMtFeatures">
                    {tier.includes.map((f, fi) => (
                      <li key={fi} className="vMtFeature">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M1 7l3.5 3.5L12 2" stroke={tier.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href="/register" className="vMtBtn" style={{ background: tier.highlight ? tier.color : "transparent",
                    borderColor: tier.color, color: tier.highlight ? "#000" : tier.color }}>
                    Get Started
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Note */}
          <Reveal delay={0.3}>
            <div className="vMaintenanceNote vMaintenanceNoteEmphasis">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <span>
                Maintenance does <strong>not</strong> include major new features.{" "}
                <strong>New features are scoped and quoted separately as a new project.</strong>
              </span>
            </div>
          </Reveal>
        </div>
      </section>



      {/* ── AI Visual Systems ─────────────────────────────────────────────── */}
      {/* ── AI Visual Systems — Header only, contained ── */}
      <section className="vAiSection" id="ai-visuals">
        <div className="vAiSectionInner">
          <div className="vAiHeader">
            <Reveal>
              <span className="vSectionEyebrow">AI Visual Systems</span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="vAiMainTitle">
                Spaces that don&apos;t exist.<br />
                <em className="vHeroItalic">Until they do.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="vAiHeaderSub">
                AI-generated interior and exterior design films — cinematic, full-resolution,
                and ready to use. Purchase once. Download forever.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STANDALONE SECTION 1 — ARCHITECTURE
          Scroll-jacked intro → Interior + Exterior video sections
      ═══════════════════════════════════════════════════════════════ */}
      <ArchitectureIntroSection />
      <ArchitectureVideosSection />

      {/* ── Divider ── */}
      {/*
      <div className="vAiSectionDivider">
        <div className="vAiSectionDividerLine" />
        <span className="vAiSectionDividerLabel">3D Modeling</span>
        <div className="vAiSectionDividerLine" />
      </div>
      */}

      {/* ═══════════════════════════════════════════════════════════════
          STANDALONE SECTION 2 — MODELING
          Full-width sticky scroll-jacking: orcs → videos
      ═══════════════════════════════════════════════════════════════ */}
      {/* ── Modeling intro — standalone ── */}
      <ModelingIntro />

      {/* ── Modeling magazine — rendered directly after intro ── */}
      <ModelingMagazine>
        <MagazineSection
          label="3D Animation"
          labelAccent="#4ade80"
          title="3 Animations."
          titleAccent="#4ade80"
          italicLine="Rendered in Blender."
          desc="Hand-modelled 3D assets animated in Blender — cinematic camera orbits, HDRI lighting, and photorealistic metal shaders. Full resolution MP4, lifetime access."
          accent="#4ade80"
          gradient="linear-gradient(135deg, #061a0e 0%, #0e2a18 60%, #0d0c0b 100%)"
          cards={animationCards}
          ctaLabel="Get Animation Access"
          delay={0.1}
        />
        <div className="vObjNote">
          <div className="vObjNoteLeft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#4ade80", flexShrink: 0 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <p className="vObjNoteTitle"><span style={{ color: "#4ade80" }}>.OBJ source files included</span> with every 3D animation purchase.</p>
              <p className="vObjNoteDesc">Every weapon animation comes with the original <strong>.OBJ + .MTL source files</strong> — import directly into Blender, Maya, or Cinema 4D. Files are <strong>not publicly accessible</strong> — delivered privately to your email upon purchase.</p>
              <div className="vObjNoteBadges">
                {[".OBJ", ".MTL", "Blender", "Maya", "Cinema 4D"].map(b => <span key={b} className="vObjBadge">{b}</span>)}
                <span className="vObjBadgePrivate">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Once purchased, lifetime access.
                </span>
              </div>
            </div>
          </div>
        </div>
        <MagazineSection
          label="3D Character Animation"
          labelAccent="#86efac"
          title="3 Characters."
          titleAccent="#86efac"
          italicLine="Sculpted in Blender."
          desc="High-poly orc character animations rendered in Blender — cinematic camera orbits, HDRI environment lighting, procedural skin shaders, and full shadow passes. Full resolution MP4, lifetime access."
          accent="#86efac"
          gradient="linear-gradient(135deg, #061a0a 0%, #0e2a12 60%, #0d0c0b 100%)"
          cards={orcCards}
          ctaLabel="Get Character Access"
          delay={0.15}
        />
        <div className="vObjNote" style={{ borderColor: "rgba(134,239,172,0.18)", background: "rgba(134,239,172,0.05)" }}>
          <div className="vObjNoteLeft">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#86efac", flexShrink: 0 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div>
              <p className="vObjNoteTitle"><span style={{ color: "#86efac" }}>.OBJ source files included</span> with every 3D character animation purchase.</p>
              <p className="vObjNoteDesc">Every character animation comes with the original <strong>.OBJ + .MTL source files</strong> — import directly into Blender, Maya, or Cinema 4D. Modify the mesh, apply your own shaders, or re-render at any resolution. Files delivered privately to your email upon purchase.</p>
              <div className="vObjNoteBadges">
                {[".OBJ", ".MTL", "Blender", "Maya", "Cinema 4D"].map(b => (
                  <span key={b} className="vObjBadge" style={{ color: "#86efac", background: "rgba(134,239,172,0.1)", borderColor: "rgba(134,239,172,0.2)" }}>{b}</span>
                ))}
                <span className="vObjBadgePrivate">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Once purchased, lifetime access.
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModelingMagazine>

      {/* ── Final AI CTA — contained block ── */}
      <section className="vAiCtaSection">
        <div className="vAiSectionInner">
          <div className="vAiSectionBlock vAiCtaBlock">
            <p className="vAiCtaEyebrow">20 videos · .OBJ source files · Full resolution · Lifetime access</p>
            <h3 className="vAiCtaTitle">
              Own the collection.<br />
              <em style={{ color: "#7dc9a0", fontStyle: "italic" }}>Start today.</em>
            </h3>
            <p className="vAiCtaSub">Register free, then purchase. Your videos are waiting in your dashboard the moment payment clears.</p>
            <a href="/register" className="vAiGetAccessBtn vAiCtaBtn" style={{ background: "#7dc9a0" }}>
              Get Lifetime Access
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 12L12 1M12 1H6M12 1v6" stroke="#0d0c0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      {/* ── FAQ — last objection clearance before CTA ──────────────── */}
      <FaqSection />

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="vCta">
        <div className="vCtaBg" />
        <div className="vCtaContent">
          <Reveal>
            <span className="vSectionEyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Ready to build?</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="vCtaTitle">
              Build infrastructure<br />that outlasts trends.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="vCtaSub">
              Premium digital systems for modern operations.<br />
              Built once. Yours forever.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="vCtaActions">
              <Link href="/register" className="vCtaBtn">Start a Project</Link>
              <Link href="/systems" className="vCtaBtnGhost">Browse Systems</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="vFooter">
        <div className="vFooterTop">
          <div className="vFooterBrand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.png" alt="Matthew Studio" className="vNavLogoImg" />
            <span className="vFooterLogoText">Matthew Studio</span>
          </div>
          <nav className="vFooterNav">
            <Link href="#systems" className="vFooterLink">Systems</Link>
            <Link href="#process" className="vFooterLink">Process</Link>
            <Link href="#faq" className="vFooterLink">FAQ</Link>
            <Link href="#about" className="vFooterLink">About</Link>
            <Link href="/login" className="vFooterLink">Sign In</Link>
            <Link href="/register" className="vFooterLink">Sign Up</Link>
          </nav>
        </div>
        <div className="vFooterBottom">
          <p className="vFooterCopy">© {new Date().getFullYear()} Matthew Studio. All rights reserved.</p>
          <p className="vFooterTagline">System · Services · Digital Assets</p>
        </div>
      </footer>
    </div>
  );
}