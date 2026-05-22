// SystemsInfoSections.tsx — Six informational sections rendered below the systems carousel.
// Sections: How We Build | Compare Options | What Drives Cost | Built with Confidence |
//           Maintenance & Support | FAQ.
// Each section is fully self-contained and statically rendered (no data fetching needed).

"use client";

import { useState, useEffect, useRef } from "react";
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

const SPRINT_STEPS = [
  {
    num: "01", title: "Discovery Call (VC)",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 20a8.38 8.38 0 0 1 13 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    desc: "We start with a video call — no forms, no guesswork. You walk us through your business, pain points, and what you need the system to do.",
    bullets: ["Understand your business workflow", "Identify pain points & bottlenecks", "Record all feature requirements", "Define scope and priorities"],
  },
  {
    num: "02", title: "Feature Recording & Backlog",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    desc: "Every feature discussed is documented into a structured backlog — broken down into user stories, modules, and sprint tasks. Nothing gets lost.",
    bullets: ["All features logged as user stories", "Modules broken into sprint tasks", "Priority ranking per feature", "Effort estimation per task"],
  },
  {
    num: "03", title: "Full Project Roadmap",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    desc: "We build a complete project roadmap — sprint by sprint, milestone by milestone. You see exactly what gets built and when before a single line of code is written.",
    bullets: ["Sprint-by-sprint delivery plan", "Milestone & deadline mapping", "Database & system architecture", "UI/UX wireframe overview"],
  },
  {
    num: "04", title: "Client Approval",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    desc: "The full roadmap is sent to you for review. You approve every feature, every sprint, every milestone. We don't start building until you sign off.",
    bullets: ["Roadmap sent via email & VC", "Client reviews all features", "Revisions handled before coding", "Formal sign-off required"],
  },
  {
    num: "05", title: "Sprint Execution & Delivery",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    desc: "Once approved, we execute — sprint by sprint, with regular progress updates. Each sprint delivers a working slice. You see real progress every week.",
    bullets: ["Agile sprint cycles (1–2 weeks)", "Weekly progress updates", "Testing per sprint before next", "Final UAT & deployment"],
    active: true,
  },
];

function HowWeBuildSection() {
  return (
    <section className="sysInfoSection sysInfoSectionBuild">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">Process</p>
        <h2 className="sysInfoTitle">How We Build</h2>
        <p className="sysInfoSub">
          Every system follows a structured agile process — from your first call to final approval before a single line of code is written.
        </p>

        <div className="sysInfoSprintTrack">
          <div className="sysInfoSprintLine" />
          {SPRINT_STEPS.map((step) => (
            <div key={step.num} className={`sysInfoSprintStep${step.active ? " sysInfoSprintStepActive" : ""}`}>
              <div className="sysInfoSprintNum">{step.num}</div>
              <div className={`sysInfoSprintIcon${step.active ? " sysInfoSprintIconActive" : ""}`}>{step.icon}</div>
              <div className="sysInfoSprintBody">
                <h3 className="sysInfoSprintTitle">{step.title}</h3>
                <p className="sysInfoSprintDesc">{step.desc}</p>
                <ul className="sysInfoSprintList">
                  {step.bullets.map(b => <li key={b}>{b}</li>)}
                </ul>
              </div>
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
const BADGE_ITEMS = [
  {
    accent: "#7dc9a0",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "1 Month Free Support",
    desc: "After delivery, we stay. Bug fixes, questions, and minor tweaks — all covered free for 30 days. No ticket system. Direct access.",
    tag: "Post-delivery",
  },
  {
    accent: "#7eb8d4",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Source Code Included",
    desc: "You own 100% of the codebase. Full repository access, no lock-in, no licensing fees. Take it anywhere, modify anything.",
    tag: "Full ownership",
  },
  {
    accent: "#c4b5fd",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Lifetime Access",
    desc: "Your dashboard, your assets, your system — forever. No subscriptions, no renewals, no expiry. One payment, infinite access.",
    tag: "No subscriptions",
  },
  {
    accent: "#fcd34d",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    title: "Fixed Price. No Surprises.",
    desc: "We quote before we build. Scope, timeline, and price are locked in writing before a single line of code is written.",
    tag: "Transparent billing",
  },
  {
    accent: "#86efac",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Direct Communication",
    desc: "You talk directly to the person building your system. No account managers, no middlemen. Weekly updates, direct messaging.",
    tag: "Dedicated contact",
  },
  {
    accent: "#f9a8d4",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "30 / 70 Payment Structure",
    desc: "Only 30% upfront. The remaining 70% is due on final delivery — after you've seen and approved the complete working system.",
    tag: "Low risk entry",
  },
];

function ConfidenceSection() {
  return (
    <section className="sysInfoSection sysInfoSectionConfidence">
      <div className="sysInfoInner">
        <p className="sysInfoLabel">Our Commitment</p>
        <h2 className="sysInfoTitle">Built with confidence.<br />Backed by commitment.</h2>
        <p className="sysInfoSub">
          Every system we deliver comes with these guarantees built into the process — not just in the contract.
        </p>
        <div className="sysInfoBadgeGrid">
          {BADGE_ITEMS.map(item => (
            <div
              key={item.title}
              className="sysInfoBadgeCard"
              style={{ "--acc": item.accent } as React.CSSProperties}
            >
              <div className="sysInfoBadgeGlow" />
              <div className="sysInfoBadgeTop">
                <div
                  className="sysInfoBadgeIcon"
                  style={{ color: item.accent, borderColor: item.accent + "33", background: item.accent + "12" }}
                >
                  {item.icon}
                </div>
                <span
                  className="sysInfoBadgeTag"
                  style={{ color: item.accent, borderColor: item.accent + "33", background: item.accent + "10" }}
                >
                  {item.tag}
                </span>
              </div>
              <h3 className="sysInfoBadgeTitle">{item.title}</h3>
              <p className="sysInfoBadgeDesc">{item.desc}</p>
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
    name: "Basic",
    duration: "₱4,500 / month",
    accent: "#7dc9a0",
    perks: [
      "Bug fixing & minor revisions",
      "Email support (48hr response)",
      "Monthly system health check",
      "Uptime monitoring",
    ],
  },
  {
    name: "Priority Support",
    duration: "₱8,500 / month",
    accent: "#7eb8d4",
    perks: [
      "Everything in Basic",
      "Priority response (24hrs)",
      "Security patches & updates",
      "Performance monitoring",
      "Database backups",
    ],
  },
  {
    name: "Full Maintenance",
    duration: "₱15,000 / month",
    accent: "#c4b5fd",
    perks: [
      "Everything in Priority",
      "Server monitoring & auto-backups",
      "Minor feature updates (up to 8hrs/month)",
      "Monthly performance report",
      "Dedicated support channel",
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
          Delivery is not the end. Keep your system running at peak performance after launch.
        </p>

        <div className="sysInfoTierGrid">
          {SUPPORT_TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`sysInfoTierCard${i === 2 ? " sysInfoTierCardHighlight" : ""}`}
              style={{ "--mt-color": tier.accent } as React.CSSProperties}
            >
              <div className="sysInfoTierHeader">
                <span className="sysInfoTierLabel" style={{ color: tier.accent }}>{tier.name}</span>
                <div className="sysInfoTierPrice">
                  <span className="sysInfoTierAmount">{tier.duration.split(" /")[0]}</span>
                  <span className="sysInfoTierPeriod">/month</span>
                </div>
              </div>
              <ul className="sysInfoTierPerks">
                {tier.perks.map(perk => (
                  <li key={perk} className="sysInfoTierPerk">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M1 7l3.5 3.5L12 2" stroke={tier.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                className="sysInfoTierBtn"
                style={{
                  background:  i === 2 ? tier.accent : "transparent",
                  borderColor: tier.accent,
                  color:       i === 2 ? "#000" : tier.accent,
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <div className="sysInfoTierNote">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span>
            Maintenance does <strong>not</strong> include major new features.{" "}
            <strong>New features are scoped and quoted separately as a new project.</strong>
          </span>
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
// Renders all six informational sections below the systems carousel.
// Parallax: each sysInfoInner translates on scroll at 0.12x speed.
// Entrance: opacity 0→1 + translateY 28px→0 triggered by IntersectionObserver.
export default function SystemsInfoSections() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const inners = Array.from(
      wrap.querySelectorAll<HTMLElement>(".sysInfoInner")
    );
    const sections = Array.from(
      wrap.querySelectorAll<HTMLElement>(".sysInfoSection")
    );

    // ── Entrance animation via IntersectionObserver ──────────────────────
    inners.forEach(el => {
      el.style.opacity    = "0";
      el.style.transform  = "translateY(28px)";
      el.style.transition = "opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)";
      el.style.willChange = "transform, opacity";
    });

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity   = "1";
            el.style.transform = "translateY(0)";
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );

    inners.forEach(el => observer.observe(el));

    // ── Parallax on scroll — background layers move at 0.12x ────────────
    function onScroll() {
      const scrollY = window.scrollY;
      sections.forEach(section => {
        const rect      = section.getBoundingClientRect();
        const inView    = rect.bottom > 0 && rect.top < window.innerHeight;
        if (!inView) return;
        const inner     = section.querySelector<HTMLElement>(".sysInfoInner");
        if (!inner) return;
        // Only apply parallax offset after entrance animation resolves
        const sectionTop   = scrollY + rect.top;
        const relativeScroll = scrollY - sectionTop + window.innerHeight * 0.5;
        const offset         = relativeScroll * 0.12;
        // Clamp so content never flies too far
        const clamped = Math.max(-40, Math.min(40, offset));
        inner.style.transform = `translateY(${clamped}px)`;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={wrapRef}>
      <HowWeBuildSection />
      <CompareSection />
      <CostSection />
      <ConfidenceSection />
      <SupportSection />
      <FaqSection />
    </div>
  );
}