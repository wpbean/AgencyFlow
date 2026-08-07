import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, Clock, Sparkles, Users2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OUTREACH_TYPE_META } from "@/lib/labels";
import type { TodaysActions as TodaysActionsData } from "@/db/queries/dashboard";
import { EmptyState } from "@/components/common/empty-state";

function ActionRow({ href, title, meta, badge }: { href: string; title: string; meta: string; badge?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent/60"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      {badge}
    </Link>
  );
}

export function TodaysActions({ actions }: { actions: TodaysActionsData }) {
  const { overdue, dueToday, newAgencyLeads, upcomingInterviews } = actions;
  const isEmpty = !overdue.length && !dueToday.length && !newAgencyLeads.length && !upcomingInterviews.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <EmptyState icon={CheckCircle2} title="Nothing needs attention" description="You're all caught up. New leads and follow-ups will show up here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {overdue.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-danger">
                  <AlertTriangle className="size-3.5" /> Overdue ({overdue.length})
                </div>
                <div className="flex flex-col">
                  {overdue.map((f) => (
                    <ActionRow
                      key={f.id}
                      href={`/agencies/${f.agencyId}`}
                      title={f.agencyName}
                      meta={`${OUTREACH_TYPE_META[f.type].label} · due ${format(f.dueDate, "MMM d")}`}
                      badge={<span className="text-xs text-danger">{formatDistanceToNow(f.dueDate)} ago</span>}
                    />
                  ))}
                </div>
              </div>
            )}
            {dueToday.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
                  <Clock className="size-3.5" /> Due Today ({dueToday.length})
                </div>
                <div className="flex flex-col">
                  {dueToday.map((f) => (
                    <ActionRow
                      key={f.id}
                      href={`/agencies/${f.agencyId}`}
                      title={f.agencyName}
                      meta={OUTREACH_TYPE_META[f.type].label}
                    />
                  ))}
                </div>
              </div>
            )}
            {newAgencyLeads.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-info">
                  <Sparkles className="size-3.5" /> New Leads to Contact ({newAgencyLeads.length})
                </div>
                <div className="flex flex-col">
                  {newAgencyLeads.map((a) => (
                    <ActionRow
                      key={a.id}
                      href={`/agencies/${a.id}`}
                      title={a.name}
                      meta={`Added ${formatDistanceToNow(a.createdAt, { addSuffix: true })}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {upcomingInterviews.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success">
                  <Users2 className="size-3.5" /> Upcoming Interviews ({upcomingInterviews.length})
                </div>
                <div className="flex flex-col">
                  {upcomingInterviews.map((o) => (
                    <ActionRow
                      key={o.id}
                      href={`/agencies/${o.agencyId}`}
                      title={o.agencyName}
                      meta={o.title}
                      badge={
                        o.nextActionDate ? (
                          <span className="text-xs text-muted-foreground">{format(o.nextActionDate, "MMM d")}</span>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
