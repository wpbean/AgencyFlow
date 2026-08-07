"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Building2,
  UserPlus,
  Mail,
  CalendarClock,
  CheckCheck,
  MessageSquareReply,
  ArrowRightLeft,
  Target,
  Briefcase,
  StickyNote,
  History,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { addAgencyNoteAction } from "@/actions/agencies";
import type { activities } from "@/db/schema";
import type { ActivityType } from "@/db/schema";
import { EmptyState } from "@/components/common/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Activity = typeof activities.$inferSelect;

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  AGENCY_CREATED: Building2,
  CONTACT_ADDED: UserPlus,
  EMAIL_SENT: Mail,
  FOLLOW_UP_SCHEDULED: CalendarClock,
  FOLLOW_UP_COMPLETED: CheckCheck,
  REPLY_RECEIVED: MessageSquareReply,
  STATUS_CHANGED: ArrowRightLeft,
  OPPORTUNITY_CREATED: Target,
  OPPORTUNITY_STAGE_CHANGED: ArrowRightLeft,
  INTERVIEW: Target,
  TRIAL_STARTED: Briefcase,
  PROJECT_CREATED: Briefcase,
  PROJECT_COMPLETED: CheckCheck,
  NOTE_ADDED: StickyNote,
};

export function ActivityTab({ agencyId, activities }: { agencyId: string; activities: Activity[] }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAddNote() {
    if (!note.trim()) return;
    startTransition(async () => {
      await addAgencyNoteAction(agencyId, note);
      setNote("");
      toast.success("Note added.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2 p-4">
        <Textarea
          rows={2}
          placeholder="Add a note about this agency..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAddNote} disabled={pending || !note.trim()}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Add Note
          </Button>
        </div>
      </Card>

      {activities.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" description="Actions on this agency will show up here." />
      ) : (
        <ol className="flex flex-col">
          {activities.map((item, i) => {
            const Icon = ACTIVITY_ICONS[item.type] ?? StickyNote;
            return (
              <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                {i !== activities.length - 1 && (
                  <span className="absolute top-7 left-[13px] h-[calc(100%-14px)] w-px bg-border" aria-hidden />
                )}
                <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card">
                  <Icon className="size-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{item.description}</p>}
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(item.createdAt, { addSuffix: true })}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
