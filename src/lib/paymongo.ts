// src/lib/paymongo.ts — PayMongo REST API wrapper.
// Covers: create payment link, retrieve payment link, webhook sig verification.
// All amounts are in centavos (multiply PHP by 100).

const BASE = "https://api.paymongo.com/v1";

function authHeader() {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set");
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

// ── Types ────────────────────────────────────────────────────────────────────

export type PaymongoMethod = "gcash" | "card" | "paymaya" | "billease" | "dob" | "dob_ubp";

export interface CreateLinkOptions {
  amount:      number;          // PHP — will be converted to centavos
  description: string;
  remarks?:    string;
  referenceId: string;          // our internal order/meta id
  successUrl:  string;
  failedUrl:   string;
}

export interface PaymongoLink {
  id:          string;
  checkoutUrl: string;
  referenceNumber: string;
  status:      string;
}

// ── Create a Payment Link (supports GCash, Card, Bank) ───────────────────────
// PayMongo Payment Links automatically show GCash, card, and bank options.
export async function createPaymentLink(opts: CreateLinkOptions): Promise<PaymongoLink> {
  const res = await fetch(`${BASE}/links`, {
    method: "POST",
    headers: {
      Authorization:  authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount:       Math.round(opts.amount * 100),  // centavos
          currency:     "PHP",
          description:  opts.description,
          remarks:      opts.remarks ?? opts.description,
          reference_number: opts.referenceId,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err?.errors?.[0]?.detail ?? `PayMongo error ${res.status}`
    );
  }

  const json = await res.json();
  const attr = json.data.attributes;

  return {
    id:              json.data.id,
    checkoutUrl:     attr.checkout_url,
    referenceNumber: attr.reference_number,
    status:          attr.status,
  };
}

// ── Retrieve a Payment Link by ID ─────────────────────────────────────────────
export async function getPaymentLink(linkId: string) {
  const res = await fetch(`${BASE}/links/${linkId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayMongo getLink error ${res.status}`);
  return (await res.json()).data;
}

// ── Verify webhook signature ──────────────────────────────────────────────────
// PayMongo signs webhooks with HMAC-SHA256 using the webhook secret.
export async function verifyWebhookSignature(
  rawBody: string,
  sigHeader: string
): Promise<boolean> {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) return false;

  // sig header format: "t=<timestamp>,te=<test_sig>,li=<live_sig>"
  const parts = Object.fromEntries(
    sigHeader.split(",").map(p => p.split("=") as [string, string])
  );
  const timestamp = parts["t"];
  const signature = parts["te"] ?? parts["li"];
  if (!timestamp || !signature) return false;

  const message = `${timestamp}.${rawBody}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const computed = Buffer.from(mac).toString("hex");

  return computed === signature;
}
