import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ConversationList } from "@/components/inbox/conversation-list";
import { listConversations } from "@/db/queries/conversations";

export const metadata = { title: "Inbox" };

export default async function InboxLayout({ children }: { children: ReactNode }) {
  const conversations = await listConversations();

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Inbox" subtitle="Replies to your campaigns, in one place." />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 overflow-y-auto border-r">
          <ConversationList conversations={conversations} basePath="/inbox" />
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
