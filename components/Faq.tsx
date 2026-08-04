/**
 * FILE: visitor/components/Faq.tsx
 * ROLE: Visitor — public, no auth required
 *
 * PURPOSE:
 * FAQ accordion section on the landing page. Static question/answer
 * data plus expand/collapse state. Extracted from page.tsx.
 */
"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

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
      <strong>Modern Web / SaaS Deployment</strong> — <strong>Next.js</strong> (React framework) for full-stack applications with SSR, API routes, and edge deployment. Ideal for public-facing systems, digital storefronts, and SaaS products. Hosted on Vercel or cloud infrastructure with full source code handover.<br /><br />
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

export function FaqSection() {
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
