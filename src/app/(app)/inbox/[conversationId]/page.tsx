import { notFound } from "next/navigation";
import { getConversationWithMessages } from "@/db/queries/conversations";
import { ConversationThread } from "@/components/inbox/conversation-thread";

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const data = await getConversationWithMessages(conversationId);

  if (!data) notFound();

  return <ConversationThread data={data} />;
}
