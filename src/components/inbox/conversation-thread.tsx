"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { sendReplyAction, markConversationReadAction } from "@/actions/inbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConversationLinkBadge } from "./conversation-link-badge";
import type { ConversationWithMessages } from "@/db/queries/conversations";

export function ConversationThread({ data }: { data: ConversationWithMessages }) {
  const { conversation, messages } = data;
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (conversation.isUnread) markConversationReadAction(conversation.id);
    // Only mark-as-read when the viewed conversation changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  function handleSend() {
    if (!reply.trim()) return;
    startTransition(async () => {
      const result = await sendReplyAction(conversation.id, reply);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setReply("");
      toast.success("Reply sent.");
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{conversation.participantName || conversation.participantEmail}</p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.participantEmail} · {conversation.subject}
          </p>
        </div>
        <ConversationLinkBadge linkStatus={conversation.linkStatus} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ol className="flex flex-col gap-4">
          {messages.map((m) => (
            <li key={m.id} className={cn("flex", m.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  m.direction === "OUTBOUND" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{m.bodyText || "(no content)"}</p>
                <p
                  className={cn(
                    "mt-1 text-[11px]",
                    m.direction === "OUTBOUND" ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {m.direction === "OUTBOUND" ? "You" : m.fromName || m.fromEmail} ·{" "}
                  {formatDistanceToNow(m.createdAt, { addSuffix: true })}
                  {m.status === "FAILED" && " · Failed to send"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Card className="m-4 mt-0 flex flex-col gap-2 p-3">
        <Textarea
          rows={3}
          placeholder={`Reply to ${conversation.participantEmail}...`}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSend} disabled={pending || !reply.trim()} className="gap-1.5">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send Reply
          </Button>
        </div>
      </Card>
    </div>
  );
}
