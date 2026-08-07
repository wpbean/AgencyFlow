import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
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
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivity as RecentActivityData } from "@/db/queries/dashboard";
import type { ActivityType } from "@/db/schema";
import { EmptyState } from "@/components/common/empty-state";

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

export function RecentActivity({ activity }: { activity: RecentActivityData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState icon={History} title="No activity yet" description="Actions across your agencies will appear here as you work." />
        ) : (
          <ol className="flex flex-col">
            {activity.map((item, i) => {
              const Icon = ACTIVITY_ICONS[item.type] ?? StickyNote;
              return (
                <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i !== activity.length - 1 && (
                    <span className="absolute top-7 left-[13px] h-[calc(100%-14px)] w-px bg-border" aria-hidden />
                  )}
                  <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm">
                      <Link href={`/agencies/${item.agencyId}`} className="font-medium hover:underline">
                        {item.agencyName}
                      </Link>{" "}
                      <span className="text-muted-foreground">{item.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(item.createdAt, { addSuffix: true })}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
