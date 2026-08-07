import "server-only";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";

// A personal-CRM-scale inbox — like the recipients list on a campaign, this
// loads in one shot rather than paginating.
const LIST_LIMIT = 200;

export async function listConversations() {
  return db.select().from(conversations).orderBy(desc(conversations.lastMessageAt)).limit(LIST_LIMIT);
}

export type ConversationRow = Awaited<ReturnType<typeof listConversations>>[number];

export async function getConversationWithMessages(id: string) {
  const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conversation) return null;

  const thread = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));

  return { conversation, messages: thread };
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

  return campaignConversations.map((conversation) => ({
    conversation,
    messages: allMessages.filter((m) => m.conversationId === conversation.id),
  }));
}

export async function getUnreadConversationCount() {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(conversations).where(eq(conversations.isUnread, true));
  return row.count;
}
