import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConversionFunnelChart } from "@/components/analytics/conversion-funnel";
import { LazyBarChart, LazyLineChart } from "@/components/analytics/lazy-charts";
import {
  getConversionFunnel,
  computeConversionRates,
  getOutreachOverTime,
  getActivityOverTime,
  getLeadsByCountry,
  getLeadsBySource,
  getCountryBreakdown,
} from "@/db/queries/analytics";
import { getPipelineCounts } from "@/db/queries/dashboard";
import { AGENCY_STATUS_META } from "@/lib/labels";

export const metadata = { title: "Analytics" };

function RateCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}%</p>
    </Card>
  );
}

export default async function AnalyticsPage() {
  const [funnel, pipeline, outreachOverTime, repliesOverTime, projectsOverTime, leadsByCountry, leadsBySource, countryBreakdown] =
    await Promise.all([
      getConversionFunnel(),
      getPipelineCounts(),
      getOutreachOverTime(),
      getActivityOverTime("REPLY_RECEIVED"),
      getActivityOverTime("PROJECT_CREATED"),
      getLeadsByCountry(),
      getLeadsBySource(),
      getCountryBreakdown(),
    ]);

  const rates = computeConversionRates(funnel);
  const pipelineData = pipeline.map((p) => ({ label: AGENCY_STATUS_META[p.stage].label, count: p.count }));
  const countryData = leadsByCountry.map((c) => ({ label: c.country, count: c.count }));
  const sourceData = leadsBySource.map((s) => ({ label: s.source, count: s.count }));

  return (
    <>
      <PageHeader title="Analytics" subtitle="Understand what's working in your outreach." />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <RateCard label="Contacted → Reply" value={rates.contactedToReply} />
          <RateCard label="Reply → Interested" value={rates.replyToInterested} />
          <RateCard label="Interested → Interview" value={rates.interestedToInterview} />
          <RateCard label="Interview → Project" value={rates.interviewToProject} />
          <RateCard label="Project → Client" value={rates.projectToClient} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ConversionFunnelChart funnel={funnel} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyBarChart data={pipelineData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outreach Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyLineChart data={outreachOverTime} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Replies Received</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyLineChart data={repliesOverTime} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Projects Won</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyLineChart data={projectsOverTime} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyBarChart data={countryData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leads by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyBarChart data={sourceData} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Country Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Country</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Contacted</TableHead>
                    <TableHead>Replied</TableHead>
                    <TableHead>Interested</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Reply Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countryBreakdown.map((c) => (
                    <TableRow key={c.country}>
                      <TableCell className="font-medium">{c.country}</TableCell>
                      <TableCell>{c.leads}</TableCell>
                      <TableCell>{c.contacted}</TableCell>
                      <TableCell>{c.replied}</TableCell>
                      <TableCell>{c.interested}</TableCell>
                      <TableCell>{c.projects}</TableCell>
                      <TableCell>{c.clients}</TableCell>
                      <TableCell>{c.replyRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
