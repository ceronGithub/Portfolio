/**
 * FILE: visitor/lib/visitorData.ts
 * ROLE: Visitor — public, no auth required
 *
 * PURPOSE:
 * Shared static data and type definitions used across the visitor
 * landing page sections (Hero carousel, Systems showcase). Split out
 * of page.tsx so each section component can import only what it needs
 * instead of everything living in one 2,000+ line file.
 */

/* ─── Data ─────────────────────────────────────────────────────────── */

export const techStack = [
  "Next.js", "PostgreSQL", "Prisma ORM", "GSAP", "Framer Motion",
  "AI Visual Systems", "Enterprise Infrastructure", "TypeScript",
];

// Systems data is now fetched from DB inside SystemsCarousel via /api/systems.
// This type is used for the carousel cards and the configurator modal.
export type DesignTierEntry = {
  id: string; name: string; slug: string; tagline: string;
  priceModifier: number; pricingType: "one-time" | "monthly" | "installment";
  basePrice: number | null; setupFee: number | null; monthlyFee: number | null; minMonthsLock: number | null;
  installmentAmount: number | null; installmentMonths: number | null;
  features: string[];
  demoVideoUrl: string | null; liveUrl: string | null; sortOrder: number;
};
// pricingType "fixed" → use `price` only, exact amount.
// pricingType "range" → use `priceMin`/`priceMax` (quote-based, e.g. complex custom integrations).
//   priceMax = null means open-ended, displayed as "₱X+".
export type VisitorSystemAddon = {
  id: string; addonKey: string; label: string; category: string; description: string | null;
  pricingType: "fixed" | "range"; price: number; priceMin: number | null; priceMax: number | null;
};
export type VisitorSystemEntry = {
  id: string; tag: string; title: string; basePrice: number; accent: string;
  // Subscription pricing — null on either field means this system has no subscription option.
  setupFee: number | null; monthlyFee: number | null;
  description: string; timeline: string; deploy: string;
  features: string[]; displayStatus: string;
  addons: VisitorSystemAddon[];
  designTiers: DesignTierEntry[];
};
// Informational-only service tier (Basic/Standard/Premium) shown inside Systems Showcase.
// priceLabel is free-text display only — never used in checkout math.
export type ServiceTierEntry = {
  id: string; name: string; tagline: string | null; priceLabel: string | null;
  features: string[]; sortOrder: number;
};

export const process = [
  { step: "01", title: "Discover", desc: "Deep dive into your operations. We map every workflow, constraint, and growth objective before writing a line of code." },
  { step: "02", title: "Architect", desc: "System design with precision. Database schemas, API contracts, and UI frameworks defined before build begins." },
  { step: "03", title: "Build", desc: "Engineered with enterprise-grade standards. Clean code, full test coverage, and cinematic UI execution." },
  { step: "04", title: "Deploy", desc: "Zero-downtime deployments on global edge infrastructure. Monitored from day one." },
  { step: "05", title: "Scale", desc: "Systems that grow with your business. Architecture built for the next decade, not just the next quarter." },
];

export const DRIVE_INTERIOR = "https://drive.google.com/drive/folders/1TWaOJivk0HuAfGZY9qcYZL6agqHNibtr?usp=drive_link";
export const DRIVE_EXTERIOR = "https://drive.google.com/drive/folders/1qsx8USrcKU37ljmD2WoABr2uyYCsri0_?usp=drive_link";
export const DRIVE_WEAPONS  = ""; // files delivered via email after purchase — not publicly accessible

/* ─── Google Drive /preview — only reliable embeddable video src ─────── */
export const drivePreview = (id: string) => `https://drive.google.com/file/d/${id}/preview?autoplay=1&rm=minimal`;

/* ─── Mixed carousel — interior + exterior interleaved ──────────────── */
export const carouselVideos = [
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






