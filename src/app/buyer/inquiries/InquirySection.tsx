// InquirySection.tsx — Get in Touch section for buyer dashboard.
// Full-width editorial layout — left meta column + right form card.
// SVG contact icons, no emoji. Syne + DM Mono typography.
// Email delivery via EmailJS — sends directly from the browser, no backend needed.

"use client";

import { useState }  from "react";
import emailjs       from "@emailjs/browser";
import "./inquiry-section.css";
import { sanitize } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

// ── EmailJS config — keys set in .env.local ──────────────────────────────────
const EMAILJS_SERVICE_ID  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID ?? "";
const EMAILJS_PUBLIC_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "";

const CONTACT_ITEMS = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    label: "Email",
    value: "developerceron@gmail.com",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "Response time",
    value: "Within 24 hours",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    label: "Location",
    value: "Philippines — GMT+8",
  },
];

export default function InquirySection() {
  const [form,   setForm]   = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: sanitize(e.target.value) }));
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name:    form.name,
          from_email:   form.email,
          subject:      form.subject || "General Inquiry",
          message:      form.message,
        },
        EMAILJS_PUBLIC_KEY
      );
      setStatus("sent");
    } catch {
      setStatus("error");
    }
    // ── Also write to DB for admin paper trail (fire-and-forget) ────────────
    fetch("/api/contact", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        contactName: form.name,
        email:       form.email,
        subject:     form.subject || "General Inquiry",
        message:     form.message,
      }),
    }).catch(() => {});
  }

  return (
    <section className="iqSection">
      <div className="iqInner">

        {/* Header */}
        <div className="iqHeader">
          <div className="iqHeaderLeft">
            <p className="iqEyebrow">Get in Touch</p>
            <h2 className="iqTitle">Have questions?<br />Let's talk.</h2>
          </div>
          <p className="iqHeaderSub">
            Need a custom feature, a different plan, or just want to know more
            before buying? I'll get back to you within 24 hours.
          </p>
        </div>

        {/* Content row */}
        <div className="iqLayout">

          {/* Left — meta */}
          <div className="iqMeta">
            <div className="iqContactList">
              {CONTACT_ITEMS.map(item => (
                <div key={item.label} className="iqContactItem">
                  <div className="iqContactIcon">{item.icon}</div>
                  <div className="iqContactBody">
                    <span className="iqContactLabel">{item.label}</span>
                    <span className="iqContactValue">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider note */}
            <div className="iqMetaNote">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "rgba(255,255,255,0.2)" }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <p>For complex custom builds, use the <strong>Build a Custom Request</strong> form above — it generates an instant estimate.</p>
            </div>
          </div>

          {/* Right — form */}
          <div className="iqFormCard">
            {status === "sent" ? (
              <div className="iqSuccess">
                <div className="iqSuccessIcon">✓</div>
                <h3 className="iqSuccessTitle">Message sent</h3>
                <p className="iqSuccessDesc">I'll get back to you within 24 hours.</p>
                <button
                  className="iqSuccessReset"
                  onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <div className="iqForm">

                <div className="iqFormRow">
                  <div className="iqField">
                    <label className="iqLabel">Name</label>
                    <input className="iqInput" name="name" placeholder="Your name" value={form.name} onChange={handleChange} />
                  </div>
                  <div className="iqField">
                    <label className="iqLabel">Email</label>
                    <input className="iqInput" name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} />
                  </div>
                </div>

                <div className="iqField">
                  <label className="iqLabel">Topic</label>
                  <div className="iqSelectWrap">
                    <select className="iqInput iqSelect" name="subject" value={form.subject} onChange={handleChange}>
                      <option value="">Select a topic</option>
                      <option value="Custom">Custom development</option>
                      <option value="Pricing">Pricing question</option>
                      <option value="Support">Support</option>
                      <option value="Demo">Request a live demo</option>
                      <option value="Other">Other</option>
                    </select>
                    <svg className="iqSelectChevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                <div className="iqField">
                  <label className="iqLabel">Message</label>
                  <textarea
                    className="iqInput iqTextarea"
                    name="message"
                    placeholder="Tell me what you need…"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                  />
                  <span className="iqCharCount">{form.message.length} / 800</span>
                </div>

                {status === "error" && (
                  <p className="iqError">Something went wrong. Please try again.</p>
                )}

                <div className="iqFormFooter">
                  <p className="iqFormDisclaimer">No spam. Direct reply from the builder.</p>
                  <button
                    className={`iqSubmitBtn${status === "sending" ? " iqSubmitBtnLoading" : ""}`}
                    onClick={handleSubmit}
                    disabled={status === "sending" || !form.name || !form.email || !form.message}
                  >
                    {status === "sending" ? "Sending…" : "Send Message →"}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}