"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ConversationThread } from "@/components/inbox/conversation-thread";
import { EmptyState } from "@/components/common/empty-state";
import type { ConversationWithMessages } from "@/db/queries/conversations";

export function CampaignRepliesTab({ conversations }: { conversations: ConversationWithMessages[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.conversation.id ?? null);

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No replies yet"
        description="Replies recipients send back to this campaign will show up here."
      />
    );
  }

  const selected = conversations.find((c) => c.conversation.id === selectedId) ?? null;

  return (
    <div className="flex h-[600px] overflow-hidden rounded-lg border">
      <div className="w-80 shrink-0 overflow-y-auto border-r">
        <ConversationList
          conversations={conversations.map((c) => c.conversation)}
          activeId={selectedId ?? undefined}
          onSelect={setSelectedId}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ConversationThread data={selected} />
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState icon={MessageSquare} title="Select a conversation" />
          </div>
        )}
      </div>
    </div>
  );
}
