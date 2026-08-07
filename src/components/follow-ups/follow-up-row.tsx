"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { toast } from "sonner";
import { Check, Mail, SkipForward, Loader2, ExternalLink, CalendarClock } from "lucide-react";
import { completeFollowUpAction, skipFollowUpAction, rescheduleFollowUpAction } from "@/actions/follow-ups";
import { OUTREACH_TYPE_META } from "@/lib/labels";
import { SendEmailDialog } from "@/components/outreach/send-email-dialog";
import { DatePicker } from "@/components/common/date-picker";
import type { FollowUpRow as FollowUpRowType } from "@/db/queries/follow-ups";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Template = { id: string; name: string; category: string; subject: string; body: string };

export function FollowUpRow({ followUp, templates }: { followUp: FollowUpRowType; templates: Template[] }) {
  const [pending, startTransition] = useTransition();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const overdue = followUp.status === "PENDING" && isPast(followUp.dueDate);

  function handleComplete() {
    startTransition(async () => {
      await completeFollowUpAction(followUp.id);
      toast.success("Follow-up completed.");
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await skipFollowUpAction(followUp.id);
      toast.success("Follow-up skipped.");
    });
  }

  function handleReschedule(date: Date | undefined) {
    if (!date) return;
    startTransition(async () => {
      await rescheduleFollowUpAction(followUp.id, date);
      toast.success("Follow-up rescheduled.");
      setRescheduleOpen(false);
    });
  }

  const contactOptions = followUp.contactId
    ? [{ id: followUp.contactId, firstName: followUp.contactName ?? "", lastName: followUp.contactLastName, email: followUp.contactEmail }]
    : [];

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/agencies/${followUp.agencyId}`} className="font-medium hover:underline">
            {followUp.agencyName}
          </Link>
          <span className="text-xs text-muted-foreground">{OUTREACH_TYPE_META[followUp.type].label}</span>
        </div>
        <p className={`text-xs ${overdue ? "text-danger" : "text-muted-foreground"}`}>
          {followUp.status === "COMPLETED"
            ? `Completed ${followUp.completedAt ? format(followUp.completedAt, "MMM d") : ""}`
            : `Due ${format(followUp.dueDate, "MMM d, yyyy")} (${formatDistanceToNow(followUp.dueDate, { addSuffix: true })})`}
          {followUp.contactName && ` · ${followUp.contactName} ${followUp.contactLastName ?? ""}`}
        </p>
        {followUp.notes && <p className="mt-1 text-sm text-muted-foreground">{followUp.notes}</p>}
      </div>

      {followUp.status === "PENDING" && (
        <div className="flex flex-wrap items-center gap-2">
          <SendEmailDialog
            agencyId={followUp.agencyId}
            agencyName={followUp.agencyName}
            website={followUp.agencyWebsite}
            country={followUp.agencyCountry}
            contacts={contactOptions}
            templates={templates}
            defaultType={followUp.type}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <Mail className="size-3.5" /> Send
              </Button>
            }
          />
          <Popover open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <CalendarClock className="size-3.5" /> Reschedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <DatePicker value={followUp.dueDate} onChange={handleReschedule} />
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSkip} disabled={pending}>
            <SkipForward className="size-3.5" /> Skip
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleComplete} disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Complete
          </Button>
        </div>
      )}
      {followUp.status !== "PENDING" && (
        <Link href={`/agencies/${followUp.agencyId}`}>
          <Button size="sm" variant="ghost" className="gap-1.5">
            <ExternalLink className="size-3.5" /> Open Agency
          </Button>
        </Link>
      )}
    </Card>
  );
}
