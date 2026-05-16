// InquirySection — client component.
// Contact/inquiry form for buyers to reach out about custom work or questions.
// Submits via POST /api/inquiry. Form state managed locally.

"use client";

import { useState } from "react";
import "./inquiry-section.css";

type Status = "idle" | "sending" | "sent" | "error";

export default function InquirySection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.MouseEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="inquirySection">

      {/* Left — copy */}
      <div className="inquiryLeft">
        <p className="inquiryLabel">Get in Touch</p>
        <h2 className="inquiryTitle">Have questions?<br />Let's talk.</h2>
        <p className="inquiryDesc">
          Need a custom feature, a different pricing plan, or just want to know more
          before buying? Send a message and I'll get back to you within 24 hours.
        </p>

        <div className="inquiryContacts">
          <div className="inquiryContactItem">
            <span className="inquiryContactIcon">📧</span>
            <span className="inquiryContactText">ceroncalsena@gmail.com</span>
          </div>
          <div className="inquiryContactItem">
            <span className="inquiryContactIcon">⏱</span>
            <span className="inquiryContactText">Response within 24 hours</span>
          </div>
          <div className="inquiryContactItem">
            <span className="inquiryContactIcon">🌏</span>
            <span className="inquiryContactText">Philippines — GMT+8</span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="inquiryRight">
        {status === "sent" ? (
          <div className="inquirySent">
            <span className="inquirySentIcon">✓</span>
            <p className="inquirySentTitle">Message sent!</p>
            <p className="inquirySentSub">I'll get back to you within 24 hours.</p>
            <button className="inquiryResetBtn" onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setStatus("idle"); }}>
              Send another
            </button>
          </div>
        ) : (
          <div className="inquiryForm">
            <div className="inquiryRow">
              <div className="inquiryField">
                <label className="inquiryFieldLabel">Name</label>
                <input
                  className="inquiryInput"
                  name="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="inquiryField">
                <label className="inquiryFieldLabel">Email</label>
                <input
                  className="inquiryInput"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="inquiryField">
              <label className="inquiryFieldLabel">Subject</label>
              <select className="inquiryInput inquirySelect" name="subject" value={form.subject} onChange={handleChange}>
                <option value="">Select a topic</option>
                <option value="custom">Custom development</option>
                <option value="pricing">Pricing question</option>
                <option value="support">Support</option>
                <option value="demo">Request a live demo</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="inquiryField">
              <label className="inquiryFieldLabel">Message</label>
              <textarea
                className="inquiryInput inquiryTextarea"
                name="message"
                placeholder="Tell me what you need..."
                value={form.message}
                onChange={handleChange}
                rows={5}
              />
            </div>

            {status === "error" && (
              <p className="inquiryError">Something went wrong. Please try again.</p>
            )}

            <button
              className="inquirySubmitBtn"
              onClick={handleSubmit}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
          </div>
        )}
      </div>

    </section>
  );
}