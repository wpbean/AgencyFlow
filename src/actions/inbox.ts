"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, conversations, messages } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { getResendClient } from "@/lib/email/resend";
import { isSuppressed } from "@/lib/email/suppression";
import { buildReplyMessageId } from "@/lib/email/reply-threading";
import { escapeHtml } from "@/lib/email/render-design";

export async function sendReplyAction(conversationId: string, body: string): Promise<{ error?: string }> {
  const text = body.trim();
  if (!text) return { error: "Reply can't be empty." };

  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (!conversation) return { error: "Conversation not found." };

  if (await isSuppressed(conversation.participantEmail)) {
    return { error: `${conversation.participantEmail} has unsubscribed and can't be emailed.` };
  }

  const settings = await getSettings();
  let fromName: string | null = settings.campaignFromName;
  let fromEmail = settings.campaignFromEmail;
  if (conversation.campaignId) {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, conversation.campaignId)).limit(1);
    if (campaign?.fromEmail) {
      fromName = campaign.fromName ?? fromName;
      fromEmail = campaign.fromEmail;
    }
  }

  const subject = conversation.subject.match(/^re:/i) ? conversation.subject : `Re: ${conversation.subject}`;
  const bodyHtml = `<div style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;line-height:1.6;color:#111">${escapeHtml(text)}</div>`;

  const [messageRow] = await db
    .insert(messages)
    .values({
      conversationId,
      direction: "OUTBOUND",
      status: "SENT",
      fromEmail,
      fromName,
      toEmail: conversation.participantEmail,
      subject,
      bodyText: text,
      bodyHtml,
    })
    .returning();

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    to: conversation.participantEmail,
    replyTo: settings.campaignReplyTo || undefined,
    subject,
    text,
    html: bodyHtml,
    headers: { "Message-ID": buildReplyMessageId(messageRow.id) },
  });

  if (error || !data) {
    await db
      .update(messages)
      .set({ status: "FAILED", error: error?.message ?? "Send failed" })
      .where(eq(messages.id, messageRow.id));
    return { error: error?.message ?? "Failed to send reply." };
  }

  await db
    .update(messages)
    .set({ resendEmailId: data.id, messageIdHeader: buildReplyMessageId(messageRow.id) })
    .where(eq(messages.id, messageRow.id));

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date(), lastMessagePreview: text.slice(0, 140), updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  revalidatePath("/inbox");
  revalidatePath(`/inbox/${conversationId}`);
  if (conversation.campaignId) revalidatePath(`/campaigns/${conversation.campaignId}`);
  return {};
}

export async function markConversationReadAction(conversationId: string) {
  await db.update(conversations).set({ isUnread: false }).where(eq(conversations.id, conversationId));
  revalidatePath("/inbox");
}
