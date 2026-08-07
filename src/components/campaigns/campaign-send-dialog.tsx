"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { sendCampaignAction, retryCampaignAction } from "@/actions/campaigns";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CampaignSendDialog({
  campaignId,
  campaignName,
  pendingCount,
  failedCount,
  fromEmail,
}: {
  campaignId: string;
  campaignName: string;
  pendingCount: number;
  failedCount: number;
  fromEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isRetry = pendingCount === 0 && failedCount > 0;
  const recipientCount = isRetry ? failedCount : pendingCount;
  const disabled = recipientCount === 0 || !fromEmail;

  function handleSend() {
    startTransition(async () => {
      const result = await (isRetry ? retryCampaignAction(campaignId) : sendCampaignAction(campaignId));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const parts = [`${result.sent ?? 0} sent`];
      if (result.failed) parts.push(`${result.failed} failed`);
      if (result.skipped) parts.push(`${result.skipped} skipped (unsubscribed)`);
      toast.success(parts.join(", "));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="gap-1.5" disabled={disabled}>
          <Send className="size-4" /> {isRetry ? "Retry Failed" : "Send Campaign"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRetry ? "Retry" : "Send"} &quot;{campaignName}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRetry
              ? `This resends the email to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"} that previously failed, from ${fromEmail}. This can't be undone.`
              : `This sends the email to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"} from ${fromEmail}. This can't be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSend} disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isRetry ? "Retry Now" : "Send Now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
