"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox as InboxIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/empty-state";
import { ConversationLinkBadge } from "./conversation-link-badge";
import type { ConversationRow } from "@/db/queries/conversations";

export function ConversationList({
  conversations,
  activeId,
  basePath,
  onSelect,
}: {
  conversations: ConversationRow[];
  activeId?: string;
  basePath?: string;
  onSelect?: (id: string) => void;
}) {
  const pathname = usePathname();
  const resolvedActiveId = activeId ?? (basePath ? pathname.slice(basePath.length + 1) : undefined);

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <EmptyState icon={InboxIcon} title="No replies yet" description="Replies to your campaigns will show up here." />
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {conversations.map((c) => {
        const active = c.id === resolvedActiveId;
        const body = (
          <div className={cn("flex flex-col gap-1 px-4 py-3 text-sm", active ? "bg-muted" : "hover:bg-muted/50")}>
            <div className="flex items-center justify-between gap-2">
              <span className={cn("truncate", c.isUnread && "font-semibold")}>{c.participantName || c.participantEmail}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(c.lastMessageAt, { addSuffix: true })}
              </span>
            </div>
            <p className={cn("truncate text-xs", c.isUnread ? "text-foreground" : "text-muted-foreground")}>{c.subject}</p>
            {c.lastMessagePreview && <p className="truncate text-xs text-muted-foreground">{c.lastMessagePreview}</p>}
            <div className="flex items-center gap-1.5 pt-0.5">
              {c.isUnread && <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
              <ConversationLinkBadge linkStatus={c.linkStatus} />
            </div>
          </div>
        );

        if (onSelect) {
          return (
            <li key={c.id}>
              <button type="button" className="block w-full text-left" onClick={() => onSelect(c.id)}>
                {body}
              </button>
            </li>
          );
        }

        return (
          <li key={c.id}>
            <Link href={`${basePath}/${c.id}`}>{body}</Link>
          </li>
        );
      })}
    </ul>
  );
}
