import "server-only";

// Synthetic Message-ID tokens we attach to outbound campaign/reply emails so
// that when a recipient replies, the In-Reply-To/References headers on the
// inbound email let us deterministically resolve which campaign recipient
// (or which prior CRM-sent message) the reply belongs to — without needing a
// distinct reply-to address per campaign or per recipient.

function messageIdHost(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    return new URL(appUrl).hostname || "msgid.internal";
  } catch {
    return "msgid.internal";
  }
}

export function buildCampaignRecipientMessageId(campaignRecipientId: string): string {
  return `<campaign-recipient-${campaignRecipientId}@${messageIdHost()}>`;
}

export function buildReplyMessageId(messageId: string): string {
  return `<crm-message-${messageId}@${messageIdHost()}>`;
}

export type ThreadTokens = {
  campaignRecipientId?: string;
  crmMessageId?: string;
};

function scanForTokens(value: string): ThreadTokens {
  const tokens: ThreadTokens = {};
  const recipientMatch = value.match(/campaign-recipient-([\w-]+)@/);
  if (recipientMatch) tokens.campaignRecipientId = recipientMatch[1];
  const crmMatch = value.match(/crm-message-([\w-]+)@/);
  if (crmMatch) tokens.crmMessageId = crmMatch[1];
  return tokens;
}

/**
 * Header lookup is case-insensitive because `resend.receiving.get()` returns
 * headers exactly as the sending mail client set them.
 */
export function getEmailHeader(headers: Record<string, string> | null | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

export function extractThreadTokens(headers: Record<string, string> | null | undefined): ThreadTokens {
  const inReplyTo = getEmailHeader(headers, "in-reply-to");
  if (inReplyTo) {
    const tokens = scanForTokens(inReplyTo);
    if (tokens.campaignRecipientId || tokens.crmMessageId) return tokens;
  }

  const references = getEmailHeader(headers, "references");
  if (references) {
    const tokens = scanForTokens(references);
    if (tokens.campaignRecipientId || tokens.crmMessageId) return tokens;
  }

  return {};
}
