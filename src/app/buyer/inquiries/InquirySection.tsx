// InquirySection.tsx — Get in Touch section for buyer dashboard.
// Full-width editorial layout — left meta column + right form card.
// SVG contact icons, no emoji. Syne + DM Mono typography.
// Email delivery via EmailJS — sends directly from the browser, no backend needed.

"use client";

import { useState }  from "react";
import emailjs       from "@emailjs/browser";
import "./inquiry-section.css";
import { sanitize } from "@/lib/utils";
import { useToast }  from "@/app/buyer/shared/useToast";
import ToastStack    from "@/app/buyer/shared/ToastStack";

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
    href:  "mailto:developerceron@gmail.com",
  },
  {
    icon: (
      // Viber
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.993 2C7.392 2 3.5 5.765 3.5 10.214c0 2.548 1.26 4.818 3.218 6.27v3.016l2.93-1.612c.73.197 1.505.305 2.305.305.048 0 .096 0 .144-.001 4.558-.081 8.232-3.697 8.232-8.02C20.329 5.677 16.544 2 11.993 2zm.34 13.477a7.24 7.24 0 0 1-1.933-.26l-.44-.118-2.133 1.175v-2.2l-.344-.24C5.754 12.74 4.75 11.527 4.75 10.214c0-3.693 3.25-6.714 7.243-6.714s7.086 2.937 7.086 6.564c0 3.578-3.092 6.432-6.746 6.413zm3.458-4.705c-.185-.093-1.088-.537-1.258-.599-.17-.062-.293-.093-.416.093-.123.185-.478.599-.586.722-.108.124-.216.139-.4.046-.185-.093-.781-.288-1.487-.917-.55-.49-.922-1.096-1.03-1.281-.108-.185-.011-.285.08-.377.083-.083.185-.216.278-.324.093-.108.123-.185.185-.308.062-.124.031-.232-.015-.325-.047-.093-.416-1.003-.57-1.373-.15-.36-.303-.311-.416-.317-.108-.005-.231-.006-.354-.006-.123 0-.324.046-.493.232-.17.185-.648.634-.648 1.545 0 .912.663 1.793.755 1.916.093.124 1.305 1.993 3.162 2.795.442.19.786.304 1.054.39.443.14.846.12 1.165.073.355-.053 1.088-.445 1.242-.874.154-.43.154-.797.108-.874-.046-.077-.17-.124-.355-.217z"/>
      </svg>
    ),
    label: "Viber",
    value: "(+63) 966-882-9302",
    href:  "viber://chat?number=%2B639668829302",
  },
  {
    icon: (
      // WhatsApp
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
    label: "WhatsApp",
    value: "(+63) 966-882-9302",
    href:  "https://wa.me/639668829302",
  },
  {
    icon: (
      // Telegram
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    label: "Telegram",
    value: "(+63) 966-882-9302",
    href:  "https://t.me/+639668829302",
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
    href:  undefined,
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
    href:  undefined,
  },
];

export default function InquirySection() {
  const { toasts, showToast, dismissToast } = useToast();
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
      showToast("✓ Message sent. I'll get back to you within 24 hours.", "success");
    } catch {
      setStatus("error");
      showToast("✕ Failed to send message. Please try again.", "error");
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
    <section id="get-in-touch" className="iqSection">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
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
                    {item.href ? (
                      <a className="iqContactValueLink" href={item.href} target="_blank" rel="noopener noreferrer">
                        {item.value}
                      </a>
                    ) : (
                      <span className="iqContactValue">{item.value}</span>
                    )}
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