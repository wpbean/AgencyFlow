import { format } from "date-fns";
import { Inbox } from "lucide-react";
import type { outreach } from "@/db/schema";
import { OUTREACH_TYPE_META, OUTREACH_STATUS_META } from "@/lib/labels";
import { ToneBadge } from "@/components/common/tone-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Card } from "@/components/ui/card";
import { OutreachRowActions } from "@/components/outreach/outreach-row-actions";

type Outreach = typeof outreach.$inferSelect;

export function OutreachTab({ records }: { records: Outreach[] }) {
  if (records.length === 0) {
    return <EmptyState icon={Inbox} title="No outreach yet" description="Emails you send from this agency's page will appear here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {records.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{r.subject}</p>
                <ToneBadge tone={OUTREACH_STATUS_META[r.status].tone}>{OUTREACH_STATUS_META[r.status].label}</ToneBadge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {OUTREACH_TYPE_META[r.type].label} · {r.sentAt ? `Sent ${format(r.sentAt, "MMM d, yyyy")}` : `Created ${format(r.createdAt, "MMM d, yyyy")}`}
              </p>
              <p className="mt-2 line-clamp-3 text-sm whitespace-pre-wrap text-muted-foreground">{r.body}</p>
            </div>
            {r.status === "SENT" && <OutreachRowActions outreachId={r.id} />}
          </div>
        </Card>
      ))}
    </div>
  );
}
