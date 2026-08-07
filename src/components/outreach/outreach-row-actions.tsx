"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquareReply } from "lucide-react";
import { markOutreachRepliedAction } from "@/actions/outreach";
import { Button } from "@/components/ui/button";

export function OutreachRowActions({ outreachId }: { outreachId: string }) {
  const [pending, startTransition] = useTransition();

  function handleMarkReplied() {
    startTransition(async () => {
      await markOutreachRepliedAction(outreachId);
      toast.success("Marked as replied.");
    });
  }

  return (
    <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={handleMarkReplied} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <MessageSquareReply className="size-3.5" />}
      Mark Replied
    </Button>
  );
}
