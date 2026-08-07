import { PageHeader } from "@/components/layout/page-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { PipelineOverview } from "@/components/dashboard/pipeline-overview";
import { TodaysActions } from "@/components/dashboard/todays-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getDashboardStats, getPipelineCounts, getTodaysActions, getRecentActivity } from "@/db/queries/dashboard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, pipeline, actions, activity] = await Promise.all([
    getDashboardStats(),
    getPipelineCounts(),
    getTodaysActions(),
    getRecentActivity(),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your agency outreach activity." />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <StatCards stats={stats} />
        <TodaysActions actions={actions} />
        <PipelineOverview pipeline={pipeline} />
        <RecentActivity activity={activity} />
      </div>
    </>
  );
}
