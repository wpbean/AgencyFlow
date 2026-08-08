import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  campaignRecipients,
  contacts,
  conversations,
  eddCustomers,
  messages,
  type CorrelationMethod,
} from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { extractThreadTokens, getEmailHeader } from "./reply-threading";
import { getResendReceivingClient } from "./resend";

const PREVIEW_LENGTH = 140;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function preview(text: string | null, html: string | null): string {
  const source = text ?? (html ? stripHtml(html) : "");
  return source.slice(0, PREVIEW_LENGTH);
}

function stripReplyPrefix(subject: string): string {
  return subject.replace(/^(re:\s*)+/i, "").trim() || subject;
}

function parseFromAddress(raw: string): { name: string | null; email: string } {
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, "");
    return { name: name || null, email: match[2].trim().toLowerCase() };
  }
  return { name: null, email: raw.trim().toLowerCase() };
}

type Correlation = {
  campaignId: string | null;
  campaignRecipientId: string | null;
  contactId: string | null;
  eddCustomerId: string | null;
  method: CorrelationMethod;
};

async function correlate(fromEmail: string, headers: Record<string, string> | null): Promise<Correlation> {
  const tokens = extractThreadTokens(headers);

  if (tokens.crmMessageId) {
    const [priorMessage] = await db.select().from(messages).where(eq(messages.id, tokens.crmMessageId)).limit(1);
    if (priorMessage) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, priorMessage.conversationId))
        .limit(1);
      if (conversation) {
        return {
          campaignId: conversation.campaignId,
          campaignRecipientId: conversation.campaignRecipientId,
          contactId: conversation.contactId,
          eddCustomerId: conversation.eddCustomerId,
          method: "MESSAGE_ID",
        };
      }
    }
  }

  if (tokens.campaignRecipientId) {
    const [recipient] = await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.id, tokens.campaignRecipientId))
      .limit(1);
    if (recipient) {
      return {
        campaignId: recipient.campaignId,
        campaignRecipientId: recipient.id,
        contactId: recipient.contactId,
        eddCustomerId: recipient.eddCustomerId,
        method: "MESSAGE_ID",
      };
    }
  }

  const [recentRecipient] = await db
    .select()
    .from(campaignRecipients)
    .where(and(sql`lower(${campaignRecipients.email}) = ${fromEmail}`, eq(campaignRecipients.status, "SENT")))
    .orderBy(desc(campaignRecipients.sentAt))
    .limit(1);
  if (recentRecipient) {
    return {
      campaignId: recentRecipient.campaignId,
      campaignRecipientId: recentRecipient.id,
      contactId: recentRecipient.contactId,
      eddCustomerId: recentRecipient.eddCustomerId,
      method: "RECIPIENT_EMAIL",
    };
  }

  const [contact] = await db
    .select()
    .from(contacts)
    .where(sql`lower(${contacts.email}) = ${fromEmail}`)
    .limit(1);
  if (contact) {
    return { campaignId: null, campaignRecipientId: null, contactId: contact.id, eddCustomerId: null, method: "CONTACT_EMAIL" };
  }

  const [eddCustomer] = await db
    .select()
    .from(eddCustomers)
    .where(sql`lower(${eddCustomers.email}) = ${fromEmail}`)
    .limit(1);
  if (eddCustomer) {
    return {
      campaignId: null,
      campaignRecipientId: null,
      contactId: eddCustomer.contactId,
      eddCustomerId: eddCustomer.id,
      method: "CONTACT_EMAIL",
    };
  }

  return { campaignId: null, campaignRecipientId: null, contactId: null, eddCustomerId: null, method: "NONE" };
}

async function findOrCreateConversation(params: {
  correlation: Correlation;
  participantEmail: string;
  participantName: string | null;
  subject: string;
}) {
  const { correlation, participantEmail, participantName, subject } = params;

  const existingQuery = correlation.campaignRecipientId
    ? db.select().from(conversations).where(eq(conversations.campaignRecipientId, correlation.campaignRecipientId)).limit(1)
    : db
        .select()
        .from(conversations)
        .where(
          correlation.campaignId
            ? and(eq(conversations.campaignId, correlation.campaignId), sql`lower(${conversations.participantEmail}) = ${participantEmail}`)
            : and(sql`${conversations.campaignId} is null`, sql`lower(${conversations.participantEmail}) = ${participantEmail}`)
        )
        .limit(1);

  const [existing] = await existingQuery;
  if (existing) return existing;

  const [created] = await db
    .insert(conversations)
    .values({
      campaignId: correlation.campaignId,
      campaignRecipientId: correlation.campaignRecipientId,
      contactId: correlation.contactId,
      eddCustomerId: correlation.eddCustomerId,
      participantEmail,
      participantName,
      subject: stripReplyPrefix(subject),
      linkStatus: correlation.method === "NONE" ? "UNLINKED" : "LINKED",
      correlationMethod: correlation.method,
      lastMessageAt: new Date(),
    })
    .returning();
  return created;
}

export async function handleInboundEmail(emailId: string): Promise<void> {
  const resend = getResendReceivingClient();
  const { data: email, error } = await resend.emails.receiving.get(emailId);
  if (error || !email) {
    throw new Error(error?.message ?? `Could not fetch inbound email ${emailId}`);
  }

  const { name: participantName, email: participantEmail } = parseFromAddress(email.from);
  const correlation = await correlate(participantEmail, email.headers);
  const toEmail = email.received_for[0] ?? email.to[0] ?? participantEmail;
  const subject = email.subject || "(no subject)";

  const conversation = await findOrCreateConversation({ correlation, participantEmail, participantName, subject });

  const [inserted] = await db
    .insert(messages)
    .values({
      conversationId: conversation.id,
      direction: "INBOUND",
      status: "RECEIVED",
      fromEmail: participantEmail,
      fromName: participantName,
      toEmail,
      subject,
      bodyHtml: email.html,
      bodyText: email.text,
      resendEmailId: email.id,
      messageIdHeader: email.message_id,
      inReplyToHeader: getEmailHeader(email.headers, "in-reply-to") ?? null,
    })
    .onConflictDoNothing({ target: messages.resendEmailId })
    .returning();

  // A null `inserted` means the unique index on resendEmailId rejected a
  // duplicate insert — this is a retried webhook delivery already processed.
  if (!inserted) return;

  await db
    .update(conversations)
    .set({
      isUnread: true,
      lastMessageAt: new Date(),
      lastMessagePreview: preview(email.text, email.html),
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversation.id));

  if (correlation.contactId) {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, correlation.contactId)).limit(1);
    if (contact?.agencyId) {
      await logActivity({
        agencyId: contact.agencyId,
        type: "REPLY_RECEIVED",
        title: `Reply: ${subject}`,
        metadata: { conversationId: conversation.id },
      });
    }
  }
}
