import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type UnsubscribePayload = {
  email: string;
  campaignId?: string;
  recipientId?: string;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short. Set a random 32+ character value in your environment.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function signUnsubscribeToken(email: string, opts?: { campaignId?: string; recipientId?: string }): string {
  const normalized = email.trim().toLowerCase();
  const body: UnsubscribePayload = { email: normalized };
  if (opts?.campaignId) body.campaignId = opts.campaignId;
  if (opts?.recipientId) body.recipientId = opts.recipientId;

  const raw = JSON.stringify(body);
  const payload = Buffer.from(raw, "utf8").toString("base64url");
  return `${payload}.${sign(raw)}`;
}

// Older links (sent before campaign attribution was added) encode a bare
// email string rather than JSON — both shapes are accepted here.
export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let raw: string;
  try {
    raw = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(raw);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === "string") return parsed as UnsubscribePayload;
  } catch {
    // not JSON — fall through to legacy bare-email format
  }
  return { email: raw };
}

export function buildUnsubscribeUrl(email: string, opts?: { campaignId?: string; recipientId?: string }): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = signUnsubscribeToken(email, opts);
  return `${base.replace(/\/$/, "")}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
