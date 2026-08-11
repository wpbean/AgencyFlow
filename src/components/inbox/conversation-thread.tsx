"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Clock, Loader2, Paperclip, Send } from "lucide-react";
import { sendReplyAction, markConversationReadAction } from "@/actions/inbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConversationLinkBadge } from "./conversation-link-badge";
import { AttachmentLightbox, useAttachmentLightbox } from "./attachment-lightbox";
import type { ConversationWithMessages } from "@/db/queries/conversations";

type MessageAttachment = ConversationWithMessages["messages"][number]["attachments"][number];

// Resend's plaintext body leaves a U+FFFC object-replacement character where
// an inline image sat in the HTML — redundant now that we render the actual
// image as an attachment thumbnail below the text.
function cleanBodyText(text: string | null): string {
  return (text ?? "").replace(/￼/g, "").trim();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  const lightbox = useAttachmentLightbox();
  if (attachments.length === 0) return null;
  // Attachments older than 2 months have their bytes removed by the cleanup job
  // (purgedAt gets set) but the row — filename/size/type — is kept as a record.
  const active = attachments.filter((a) => !a.purgedAt);
  const purged = attachments.filter((a) => a.purgedAt);
  const images = active.filter((a) => a.contentType.startsWith("image/"));
  const files = active.filter((a) => !a.contentType.startsWith("image/"));
  const lightboxImages = images.map((a) => ({
    id: a.id,
    url: `/api/attachments/${a.id}`,
    alt: a.filename || "Attached image",
  }));

  return (
    <div className="mt-2 flex flex-col gap-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => lightbox.open(i)}
              className="cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external attachment bytes served from our own API, not a Next-optimizable asset */}
              <img
                src={`/api/attachments/${a.id}?variant=thumb`}
                alt={a.filename || "Attached image"}
                loading="lazy"
                decoding="async"
                className="max-h-48 rounded-md border object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {lightbox.openIndex !== null && (
        <AttachmentLightbox
          images={lightboxImages}
          index={lightbox.openIndex}
          onIndexChange={lightbox.setIndex}
          onClose={lightbox.close}
        />
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((a) => (
            <a
              key={a.id}
              href={`/api/attachments/${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border bg-background/60 px-2 py-1 text-xs hover:underline"
            >
              <Paperclip className="size-3.5 shrink-0" />
              <span className="max-w-40 truncate">{a.filename || "Attachment"}</span>
              <span className="text-muted-foreground">{formatFileSize(a.size)}</span>
            </a>
          ))}
        </div>
      )}
      {purged.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {purged.map((a) => (
            <span
              key={a.id}
              title="Removed after 2 months to save disk space"
              className="flex items-center gap-1.5 rounded-md border border-dashed bg-background/40 px-2 py-1 text-xs text-muted-foreground"
            >
              <Clock className="size-3.5 shrink-0" />
              <span className="max-w-40 truncate">{a.filename || "Attachment"}</span>
              <span>expired</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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
                <p className="whitespace-pre-wrap">{cleanBodyText(m.bodyText) || "(no content)"}</p>
                <MessageAttachments attachments={m.attachments} />
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
