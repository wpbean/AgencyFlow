"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { scheduleCampaignAction, retryCampaignAction } from "@/actions/campaigns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  // 10:00 AM is the commonly-cited sweet spot for US business audiences — after the
  // morning inbox triage but well before lunch, when open rates peak.
  const [dailySendTime, setDailySendTime] = useState("10:00");
  const router = useRouter();

  const isRetry = pendingCount === 0 && failedCount > 0;
  const recipientCount = isRetry ? failedCount : pendingCount;
  const disabled = recipientCount === 0 || !fromEmail;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setWhen("now");
      setScheduledAt("");
      setDailyLimit("");
      setDailySendTime("10:00");
    }
  }

  function handleSend() {
    if (isRetry) {
      startTransition(async () => {
        const result = await retryCampaignAction(campaignId);
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
      return;
    }

    if (when === "later" && !scheduledAt) {
      toast.error("Pick a date and time to schedule this campaign.");
      return;
    }
    const limitNum = dailyLimit.trim() ? Number(dailyLimit) : undefined;
    if (limitNum !== undefined && (!Number.isFinite(limitNum) || limitNum <= 0)) {
      toast.error("Daily limit must be a positive number.");
      return;
    }
    if (limitNum !== undefined && !dailySendTime) {
      toast.error("Pick a daily send time.");
      return;
    }

    startTransition(async () => {
      const result = await scheduleCampaignAction(campaignId, {
        scheduledAt: when === "later" ? new Date(scheduledAt) : undefined,
        dailyLimit: limitNum,
        dailySendTime: limitNum ? dailySendTime : undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.scheduled) {
        toast.success(`Scheduled for ${new Date(scheduledAt).toLocaleString()}.`);
      } else {
        const parts = [`${result.sent ?? 0} sent`];
        if (result.failed) parts.push(`${result.failed} failed`);
        if (result.skipped) parts.push(`${result.skipped} skipped (unsubscribed)`);
        if (limitNum) parts.push(`daily limit ${limitNum}`);
        toast.success(parts.join(", "));
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-1.5" disabled={disabled}>
          <Send className="size-4" /> {isRetry ? "Retry Failed" : "Send Campaign"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRetry ? "Retry" : "Send"} &quot;{campaignName}&quot;?
          </DialogTitle>
          <DialogDescription>
            {isRetry
              ? `This resends the email to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"} that previously failed, from ${fromEmail}. This can't be undone.`
              : `This sends the email to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"} from ${fromEmail}. This can't be undone.`}
          </DialogDescription>
        </DialogHeader>

        {!isRetry && (
          <div className="flex flex-col gap-4">
            <Tabs value={when} onValueChange={(v) => setWhen(v as "now" | "later")}>
              <TabsList className="w-full">
                <TabsTrigger value="now">Send now</TabsTrigger>
                <TabsTrigger value="later">Schedule for later</TabsTrigger>
              </TabsList>
            </Tabs>

            {when === "later" && (
              <div className="flex flex-col gap-1.5">
                <Label>Start date &amp; time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  min={toLocalDatetimeInputValue(new Date())}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Limit to per day (optional)</Label>
              <Input
                type="number"
                min={1}
                placeholder="No limit — send everything at once"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Trickles the {recipientCount} recipients out in batches per day instead of all at once.
              </p>
            </div>

            {dailyLimit.trim() && (
              <div className="flex flex-col gap-1.5">
                <Label>Daily send time</Label>
                <Input
                  type="time"
                  value={dailySendTime}
                  onChange={(e) => setDailySendTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Each day&apos;s batch goes out at this time (server time). Defaults to 10:00 AM — a
                  strong average open-time window for US business audiences.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSend} disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isRetry ? "Retry Now" : when === "later" ? "Schedule" : "Send Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
