// SystemsInfoSections.tsx — Six informational sections rendered below the systems carousel.
// Sections: How We Build | Compare Options | What Drives Cost | Built with Confidence |
//           Maintenance & Support | FAQ.
// Each section is fully self-contained and statically rendered (no data fetching needed).

"use client";

import { useState } from "react";
import "./systems-info.css";

/* ─── How We Build ───────────────────────────────────────────────────── */
const BUILD_STEPS = [
  {
    number: "01",
    title: "Discovery & Scoping",
    body:
      "We start with a deep-dive call to understand your workflow, pain points, and goals. No templates, no guesswork — just your actual business logic mapped out before a single line of code is written.",
  },
  {
    number: "02",
    title: "Architecture & Stack Selection",
    body:
      "We choose the right technology for the job — not the trendiest one. Each system is built on a proven, maintainable stack with a clean separation of frontend, backend, and database layers.",
  },
  {
    number: "03",
    title: "Iterative Builds with Check-ins",
    body:
      "Development happens in sprints. You get regular check-ins with live previews so you can give feedback early, not after months of work. Changes are cheap when caught early.",
  },
  {
    number: "04",
    title: "QA, Staging & Handoff",
    body:
      "Before delivery, every system goes through structured testing on a staging environment. You receive full source code, documentation, and a walkthrough session so your team can take ownership immediately.",
  },
];

function HowWeBuildSection() {
  return (
    <section className="sysInfoSection sysInfoSectionBuild">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">Process</p>
        <h2 className="sysInfoTitle">How We Build</h2>
        <p className="sysInfoSub">
          Every system is built from scratch — no drag-and-drop builders, no recycled code. Here is exactly how we work.
        </p>
        <div className="sysInfoBuildGrid">
          {BUILD_STEPS.map((step) => (
            <div key={step.number} className="sysInfoBuildCard">
              <span className="sysInfoBuildNum">{step.number}</span>
              <h3 className="sysInfoBuildTitle">{step.title}</h3>
              <p className="sysInfoBuildBody">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Compare Options ────────────────────────────────────────────────── */
const COMPARE_ROWS = [
  { feature: "Custom-built to your workflow",       us: true,  saas: false, freelancer: "maybe" },
  { feature: "Full source code ownership",          us: true,  saas: false, freelancer: "maybe" },
  { feature: "No monthly subscription fees",        us: true,  saas: false, freelancer: true    },
  { feature: "Dedicated support after delivery",    us: true,  saas: "paid", freelancer: false  },
  { feature: "Scalable modular architecture",       us: true,  saas: "limited", freelancer: "maybe" },
  { feature: "Transparent pricing before you pay",  us: true,  saas: false, freelancer: "maybe" },
  { feature: "30 / 70 payment structure",           us: true,  saas: false, freelancer: false   },
];

function CompareCell({ value }: { value: boolean | string }) {
  if (value === true)    return <span className="sysInfoCmpYes">✓</span>;
  if (value === false)   return <span className="sysInfoCmpNo">✕</span>;
  if (value === "maybe") return <span className="sysInfoCmpMaybe">~</span>;
  return <span className="sysInfoCmpPartial">{value}</span>;
}

function CompareSection() {
  return (
    <section className="sysInfoSection sysInfoSectionCompare">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">Comparison</p>
        <h2 className="sysInfoTitle">Compare your options.</h2>
        <p className="sysInfoSub">
          See how a fully custom-built system stacks up against off-the-shelf SaaS tools and typical freelancers.
        </p>
        <div className="sysInfoCmpWrap">
          <table className="sysInfoCmpTable">
            <thead>
              <tr>
                <th className="sysInfoCmpThFeature">Feature</th>
                <th className="sysInfoCmpTh sysInfoCmpThUs">Us</th>
                <th className="sysInfoCmpTh">SaaS Tools</th>
                <th className="sysInfoCmpTh">Other Freelancers</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature} className="sysInfoCmpRow">
                  <td className="sysInfoCmpFeature">{row.feature}</td>
                  <td className="sysInfoCmpCell sysInfoCmpCellUs"><CompareCell value={row.us} /></td>
                  <td className="sysInfoCmpCell"><CompareCell value={row.saas} /></td>
                  <td className="sysInfoCmpCell"><CompareCell value={row.freelancer} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── What Drives Cost ───────────────────────────────────────────────── */
const COST_FACTORS = [
  {
    icon: "⚙️",
    title: "Complexity of Logic",
    body:
      "The more conditional rules, roles, workflows, and business logic your system needs, the longer it takes to build correctly and securely.",
  },
  {
    icon: "🔌",
    title: "Third-Party Integrations",
    body:
      "Connecting to payment gateways, SMS APIs, email services, government systems, or external databases adds scoping and testing time.",
  },
  {
    icon: "👥",
    title: "Number of User Roles",
    body:
      "Each distinct account type — admin, staff, client, driver — requires its own views, permissions, and logic. More roles, more work.",
  },
  {
    icon: "📊",
    title: "Reporting & Analytics",
    body:
      "Dashboards with real-time charts, exportable reports, and filtered views require significant backend and frontend investment.",
  },
  {
    icon: "📱",
    title: "Mobile Responsiveness",
    body:
      "A system designed to work perfectly on phones and tablets requires additional layout work and cross-device testing.",
  },
  {
    icon: "🔒",
    title: "Security Requirements",
    body:
      "Role-based access control, audit logs, encryption at rest, and two-factor authentication all add meaningful development scope.",
  },
];

function CostSection() {
  return (
    <section className="sysInfoSection sysInfoSectionCost">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">Pricing Transparency</p>
        <h2 className="sysInfoTitle">What actually drives cost.</h2>
        <p className="sysInfoSub">
          No hidden fees, no vague quotes. Here are the real factors that determine what your system will cost.
        </p>
        <div className="sysInfoCostGrid">
          {COST_FACTORS.map((factor) => (
            <div key={factor.title} className="sysInfoCostCard">
              <span className="sysInfoCostIcon">{factor.icon}</span>
              <h3 className="sysInfoCostTitle">{factor.title}</h3>
              <p className="sysInfoCostBody">{factor.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Built with Confidence ──────────────────────────────────────────── */
const COMMITMENTS = [
  { stat: "30 / 70", label: "Payment Structure", note: "Only 30% upfront. The remaining 70% is due on final delivery." },
  { stat: "100%",    label: "Source Code Ownership", note: "You get everything — repository, database schema, documentation." },
  { stat: "Live",    label: "Demo Before You Pay", note: "You can interact with a working demo before committing to purchase." },
  { stat: "Direct",  label: "Builder Communication", note: "You talk directly to the person building your system — no account managers." },
];

function ConfidenceSection() {
  return (
    <section className="sysInfoSection sysInfoSectionConfidence">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">Our Commitment</p>
        <h2 className="sysInfoTitle">Built with confidence.<br />Backed by commitment.</h2>
        <p className="sysInfoSub">
          Every system we deliver comes with guarantees built into the process — not just in the contract.
        </p>
        <div className="sysInfoConfidenceGrid">
          {COMMITMENTS.map((item) => (
            <div key={item.label} className="sysInfoConfidenceCard">
              <span className="sysInfoConfidenceStat">{item.stat}</span>
              <h3 className="sysInfoConfidenceLabel">{item.label}</h3>
              <p className="sysInfoConfidenceNote">{item.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Maintenance & Support ──────────────────────────────────────────── */
const SUPPORT_TIERS = [
  {
    name: "Included",
    duration: "14 days post-delivery",
    accent: "#22c55e",
    perks: [
      "Bug fixes from our side",
      "Deployment assistance",
      "Minor configuration adjustments",
      "Direct messaging support",
    ],
  },
  {
    name: "Retainer",
    duration: "Monthly — custom rate",
    accent: "#66e3ff",
    perks: [
      "Priority bug resolution",
      "Feature additions & updates",
      "Database management",
      "Dedicated support channel",
    ],
  },
  {
    name: "One-Time Fix",
    duration: "Per issue",
    accent: "#c9935e",
    perks: [
      "Scoped to a specific problem",
      "Quoted before work begins",
      "No retainer commitment needed",
      "Turnaround within agreed timeline",
    ],
  },
];

function SupportSection() {
  return (
    <section className="sysInfoSection sysInfoSectionSupport">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">After Delivery</p>
        <h2 className="sysInfoTitle">Maintenance &amp; Support</h2>
        <p className="sysInfoSub">
          Delivery is not the end. Here is what happens after your system goes live.
        </p>
        <div className="sysInfoSupportGrid">
          {SUPPORT_TIERS.map((tier) => (
            <div key={tier.name} className="sysInfoSupportCard" style={{ "--tierAccent": tier.accent } as React.CSSProperties}>
              <div className="sysInfoSupportCardTop">
                <h3 className="sysInfoSupportName" style={{ color: tier.accent }}>{tier.name}</h3>
                <span className="sysInfoSupportDuration">{tier.duration}</span>
              </div>
              <ul className="sysInfoSupportPerks">
                {tier.perks.map((perk) => (
                  <li key={perk} className="sysInfoSupportPerk">
                    <span className="sysInfoSupportPerkDot" style={{ background: tier.accent }} />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    question: "Do I really get the full source code?",
    answer:
      "Yes. Once full payment is completed, you receive the entire project repository — frontend, backend, database migrations, and any configuration files. No license restrictions, no lock-in.",
  },
  {
    question: "Can I request changes after delivery?",
    answer:
      "Minor changes within scope are covered during the 14-day post-delivery window. Larger additions or new features can be handled as a one-time fix or under a retainer arrangement.",
  },
  {
    question: "What happens if the project takes longer than estimated?",
    answer:
      "Delivery timelines are set based on scope. If we ever need to extend due to something on our end, we communicate early and adjust accordingly — you are never left in the dark.",
  },
  {
    question: "Can I add features that are not in the base system?",
    answer:
      "Absolutely. That is exactly what the add-ons in the Configure modal are for. If you need something not listed, contact us and we will scope it out.",
  },
  {
    question: "Is this system hosted, or do I host it myself?",
    answer:
      "The system is built for your own hosting. We assist with deployment, but the infrastructure is yours — no monthly fees paid to us for keeping it running.",
  },
  {
    question: "Do you work with clients outside the Philippines?",
    answer:
      "Yes. We work remotely with clients internationally. Communication is handled through direct messaging, and payments can be arranged in your preferred currency.",
  },
  {
    question: "What tech stack do you use?",
    answer:
      "Primarily Next.js / React for the frontend, Node.js or C# for the backend, and PostgreSQL or MySQL for the database — chosen based on what fits your project best.",
  },
  {
    question: "How do I get started?",
    answer:
      "Browse the systems above, hit Configure on the one that fits, select your add-ons, and place your order. You can also reach us through the inquiry section below if you have questions first.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggleItem(index: number) {
    setOpenIndex(prev => (prev === index ? null : index));
  }

  return (
    <section className="sysInfoSection sysInfoSectionFaq">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">FAQ</p>
        <h2 className="sysInfoTitle">Frequently Asked Questions</h2>
        <p className="sysInfoSub">
          Everything you need to know before placing an order.
        </p>
        <div className="sysInfoFaqList">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className={"sysInfoFaqItem" + (isOpen ? " sysInfoFaqItemOpen" : "")}>
                <button
                  className="sysInfoFaqQuestion"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span className={"sysInfoFaqChevron" + (isOpen ? " sysInfoFaqChevronOpen" : "")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="sysInfoFaqAnswer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Composite Export ───────────────────────────────────────────────── */
// Renders all six informational sections in order below the systems carousel.
export default function SystemsInfoSections() {
  return (
    <>
      <HowWeBuildSection />
      <CompareSection />
      <CostSection />
      <ConfidenceSection />
      <SupportSection />
      <FaqSection />
    </>
  );
}
