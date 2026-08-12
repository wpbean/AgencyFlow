import { BarChart3, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { LazyCampaignEventsChart } from "@/components/analytics/lazy-charts";
import type { CampaignAnalytics } from "@/db/queries/campaign-analytics";
import type { CampaignEventPoint } from "@/components/analytics/campaign-events-chart";

function StatCard({ label, value, rate }: { label: string; value: number; rate?: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      {rate !== undefined && <p className="mt-0.5 text-xs text-muted-foreground">{rate}%</p>}
    </Card>
  );
}

export function CampaignAnalyticsTab({
  campaignStatus,
  analytics,
  eventsOverTime,
  topLinks,
}: {
  campaignStatus: string;
  analytics: CampaignAnalytics;
  eventsOverTime: CampaignEventPoint[];
  topLinks: { link: string; clicks: number }[];
}) {
  if (campaignStatus === "DRAFT" && analytics.sent === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics yet"
        description="Analytics appear here once this campaign has been sent."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Sent" value={analytics.sent} />
        <StatCard label="Delivered" value={analytics.delivered} />
        <StatCard label="Opened" value={analytics.opened} rate={analytics.openRate} />
        <StatCard label="Clicked" value={analytics.clicked} rate={analytics.clickRate} />
        <StatCard label="Bounced" value={analytics.bounced} rate={analytics.bounceRate} />
        <StatCard label="Unsubscribed" value={analytics.unsubscribed} rate={analytics.unsubscribeRate} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Skipped (already unsubscribed)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{analytics.skipped.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Failed to send</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{analytics.failed.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Click-to-open rate</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{analytics.clickToOpenRate}%</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opens &amp; Clicks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsOverTime.length > 0 ? (
            <LazyCampaignEventsChart data={eventsOverTime} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No opens or clicks recorded yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Clicked Links</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topLinks.length === 0 ? (
            <EmptyState icon={Link2} title="No clicks yet" description="Links clicked in this campaign will show up here." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Link</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLinks.map((l) => (
                    <TableRow key={l.link}>
                      <TableCell className="max-w-md truncate">
                        <a href={l.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {l.link}
                        </a>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{l.clicks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
