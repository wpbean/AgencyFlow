import { Suspense } from "react";
import { CalendarCheck2, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FollowUpRow } from "@/components/follow-ups/follow-up-row";
import { FollowUpCreateTrigger } from "@/components/follow-ups/follow-up-create-trigger";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { getFollowUpsGrouped, type FollowUpRow as FollowUpRowType } from "@/db/queries/follow-ups";
import { listTemplates } from "@/db/queries/templates";
import { getAgencyOptions } from "@/db/queries/contacts";

export const metadata = { title: "Follow-ups" };

function Section({ title, count, tone, items, templates }: { title: string; count: number; tone: string; items: FollowUpRowType[]; templates: Awaited<ReturnType<typeof listTemplates>> }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h2 className={`text-sm font-semibold uppercase tracking-wide ${tone}`}>
        {title} ({count})
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((f) => (
          <FollowUpRow key={f.id} followUp={f} templates={templates} />
        ))}
      </div>
    </div>
  );
}

export default async function FollowUpsPage() {
  const [{ overdue, dueToday, upcoming, completed }, templates, agencyOptions] = await Promise.all([
    getFollowUpsGrouped(),
    listTemplates(),
    getAgencyOptions(),
  ]);
  const total = overdue.length + dueToday.length + upcoming.length;

  return (
    <>
      <PageHeader
        title="Follow-ups"
        subtitle={`${total} pending follow-up${total === 1 ? "" : "s"}`}
        actions={
          <Suspense
            fallback={
              <Button size="lg" className="gap-1.5" disabled>
                <Plus className="size-4" /> New Follow-up
              </Button>
            }
          >
            <FollowUpCreateTrigger agencyOptions={agencyOptions} />
          </Suspense>
        }
      />
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {total === 0 && completed.length === 0 ? (
          <EmptyState icon={CalendarCheck2} title="No follow-ups today" description="Follow-ups are created automatically after you send outreach, or you can add one from an agency's page." />
        ) : (
          <>
            <Section title="Overdue" count={overdue.length} tone="text-danger" items={overdue} templates={templates} />
            <Section title="Due Today" count={dueToday.length} tone="text-warning" items={dueToday} templates={templates} />
            <Section title="Upcoming" count={upcoming.length} tone="text-info" items={upcoming} templates={templates} />
            <Section title="Completed" count={completed.length} tone="text-muted-foreground" items={completed} templates={templates} />
          </>
        )}
      </div>
    </>
  );
}
