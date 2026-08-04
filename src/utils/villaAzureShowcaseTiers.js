/**
 * FILE: utils/villaAzureShowcaseTiers.js
 * ROLE: Shared data — consumed by the visitor showcase system
 *
 * PURPOSE:
 * Holds the four Villa Azure service tiers (Managed Rental, Full
 * Buyout, Build-to-Own, Full Custom) plus each tier's own package
 * details. Sourced directly from the signed Service Agreement
 * Section 2 (tier pricing) and Section 2A (what's included per tier).
 * Each tier owns its own packageDetails list — there is no shared
 * "included in every tier" block, since the tiers genuinely differ
 * in what they deliver.
 *
 * Kept as a plain data module (not a database table) because this
 * content changes only when the agreement itself is amended, not
 * per-booking — a Prisma table would be overkill for four static rows.
 */

export const VILLA_AZURE_SHOWCASE_TIERS = [
  {
    id: "managed-rental",
    name: "Tier 1 — Managed rental",
    priceLabel: "₱15,000/mo",
    priceNote: "+₱15,000 setup · month-to-month after 3-month lock-in",
    summary: "Vic-hosted, fastest way to launch.",
    packageDetails: [
      "Full deployment & hosting setup — Vercel, Supabase, R2, Drive, EmailJS",
      "Custom branding — logo, colors, resort name",
      "Content population — rooms, images, pricing",
      "Full admin dashboard access",
      "24/7 automated security monitoring",
      "Uptime monitoring — 99% SLA target",
      "10 hours/week of developer support",
    ],
  },
  {
    id: "full-buyout",
    name: "Tier 2 — Full buyout",
    priceLabel: "₱350,000",
    priceNote: "One-time · ₱175,000 deposit + ₱175,000 on delivery",
    summary: "Complete ownership handover after launch.",
    packageDetails: [
      "Complete customization — logo, colors, fonts, branding",
      "Content population — rooms, images, pricing, amenities",
      "Full admin dashboard, every feature included",
      "Enterprise security features",
      "Email automation & invoice generation",
      "Supabase setup with Row Level Security",
      "GitHub repository & full source code transferred",
      "2-week free post-launch support",
    ],
  },
  {
    id: "build-to-own",
    name: "Tier 3 — Build-to-own",
    priceLabel: "₱20,000/mo × 36",
    priceNote: "₱400,000+ total project value, scales with complexity",
    summary: "Custom build, own everything after 36 payments.",
    packageDetails: [
      "Fully custom design — not a resellable template",
      "All features built to your specifications",
      "Admin dashboard customized to your workflow",
      "Content population — rooms, images, pricing",
      "Email automation & invoice system",
      "Security monitoring & intrusion detection",
      "Complete source code documentation",
      "2-week free post-launch support",
    ],
  },
  {
    id: "full-custom",
    name: "Tier 4 — Full custom",
    priceLabel: "₱400,000+",
    priceNote: "One-time · 50% deposit + 50% on delivery",
    summary: "Built from scratch, full IP from day one.",
    packageDetails: [
      "Fully custom design — zero template code",
      "Custom database design & schema",
      "All features from your Scope Document",
      "Mobile-responsive design",
      "Completely custom admin dashboard layout",
      "Email system & automation",
      "Full ownership transfer on delivery",
      "2-week free post-launch support",
    ],
  },
];
