import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENCY_STATUS_META } from "@/lib/labels";
import type { PipelineCounts } from "@/db/queries/dashboard";
import { cn } from "@/lib/utils";

const TONE_BAR: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  primary: "bg-primary",
  neutral: "bg-muted-foreground/40",
};

export function PipelineOverview({ pipeline }: { pipeline: PipelineCounts }) {
  const max = Math.max(1, ...pipeline.map((p) => p.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {pipeline.map(({ stage, count }) => {
            const meta = AGENCY_STATUS_META[stage];
            return (
              <Link
                key={stage}
                href={`/agencies?status=${stage}`}
                className="group flex flex-col gap-2 rounded-md border p-3 transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
                <span className="text-xl font-semibold tabular-nums">{count}</span>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", TONE_BAR[meta.tone])}
                    style={{ width: `${Math.max(4, (count / max) * 100)}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
