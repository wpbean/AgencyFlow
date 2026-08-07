import { Plus, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/db/queries/projects";
import { getAgencyOptions } from "@/db/queries/contacts";
import { getSettings } from "@/lib/settings";
import { PROJECT_STATUSES } from "@/db/schema";
import { PROJECT_STATUS_META } from "@/lib/labels";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const activeStatus = sp.status;

  const [projects, agencyOptions, settings] = await Promise.all([
    listProjects(activeStatus ? [activeStatus as (typeof PROJECT_STATUSES)[number]] : undefined),
    getAgencyOptions(),
    getSettings(),
  ]);
  const firstAgency = agencyOptions[0];

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length === 1 ? "" : "s"}`}
        actions={
          firstAgency ? (
            <ProjectFormDialog
              agencyId={firstAgency.id}
              agencyOptions={agencyOptions}
              defaultCurrency={settings.defaultCurrency}
              trigger={
                <Button size="lg" className="gap-1.5">
                  <Plus className="size-4" /> New Project
                </Button>
              }
            />
          ) : undefined
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/projects"
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              !activeStatus ? "border-primary/50 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
            )}
          >
            All
          </Link>
          {PROJECT_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/projects?status=${s}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                activeStatus === s ? "border-primary/50 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {PROJECT_STATUS_META[s].label}
            </Link>
          ))}
        </div>
        {projects.length === 0 ? (
          <EmptyState icon={Briefcase} title="No projects" description="Projects appear here once you start delivering work for a client." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} showAgency />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
