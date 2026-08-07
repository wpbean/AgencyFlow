import { Briefcase, Plus } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import type { projects as projectsTable } from "@/db/schema";

export function ProjectsTab({
  agencyId,
  projects,
  defaultCurrency,
}: {
  agencyId: string;
  projects: (typeof projectsTable.$inferSelect)[];
  defaultCurrency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ProjectFormDialog
          agencyId={agencyId}
          defaultCurrency={defaultCurrency}
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> New Project
            </Button>
          }
        />
      </div>
      {projects.length === 0 ? (
        <EmptyState icon={Briefcase} title="No projects" description="Once work begins, track it here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
