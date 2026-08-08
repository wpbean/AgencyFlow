import "server-only";
import { db } from "@/db";
import { conversations, messageAttachments, messages } from "@/db/schema";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";

// A personal-CRM-scale inbox — like the recipients list on a campaign, this
// loads in one shot rather than paginating.
const LIST_LIMIT = 200;

export async function listConversations() {
  return db.select().from(conversations).orderBy(desc(conversations.lastMessageAt)).limit(LIST_LIMIT);
}

export type ConversationRow = Awaited<ReturnType<typeof listConversations>>[number];

async function attachmentsByMessageId(messageIds: string[]) {
  if (messageIds.length === 0) return new Map<string, (typeof messageAttachments.$inferSelect)[]>();

  const rows = await db.select().from(messageAttachments).where(inArray(messageAttachments.messageId, messageIds));
  const byMessageId = new Map<string, (typeof messageAttachments.$inferSelect)[]>();
  for (const row of rows) {
    const list = byMessageId.get(row.messageId);
    if (list) list.push(row);
    else byMessageId.set(row.messageId, [row]);
  }
  return byMessageId;
}

export async function getConversationWithMessages(id: string) {
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conversation) return null;

  const thread = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
  const attachmentsByMessage = await attachmentsByMessageId(thread.map((m) => m.id));

  return {
    conversation,
    messages: thread.map((m) => ({ ...m, attachments: attachmentsByMessage.get(m.id) ?? [] })),
  };
}

export type ConversationWithMessages = NonNullable<Awaited<ReturnType<typeof getConversationWithMessages>>>;

export async function getConversationsWithMessagesByCampaign(campaignId: string): Promise<ConversationWithMessages[]> {
  const campaignConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.campaignId, campaignId))
    .orderBy(desc(conversations.lastMessageAt));

  if (campaignConversations.length === 0) return [];

  const conversationIds = campaignConversations.map((c) => c.id);
  const allMessages = await db
    .select()
    .from(messages)
    .where(inArray(messages.conversationId, conversationIds))
    .orderBy(asc(messages.createdAt));
  const attachmentsByMessage = await attachmentsByMessageId(allMessages.map((m) => m.id));

  return campaignConversations.map((conversation) => ({
    conversation,
    messages: allMessages
      .filter((m) => m.conversationId === conversation.id)
      .map((m) => ({ ...m, attachments: attachmentsByMessage.get(m.id) ?? [] })),
  }));
}

export async function getUnreadConversationCount() {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(conversations).where(eq(conversations.isUnread, true));
  return row.count;
}
