"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/actions/projects";
import { PROJECT_STATUS_META } from "@/lib/labels";
import { ToneBadge } from "@/components/common/tone-badge";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { ProjectFormDialog } from "./project-form-dialog";
import type { projects } from "@/db/schema";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProjectCardData = typeof projects.$inferSelect & { agencyName?: string };

export function ProjectCard({ project, showAgency = false }: { project: ProjectCardData; showAgency?: boolean }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const statusMeta = PROJECT_STATUS_META[project.status];

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{project.name}</p>
          {showAgency && <p className="truncate text-xs text-muted-foreground">{project.agencyName}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ProjectFormDialog
              agencyId={project.agencyId}
              project={project}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ToneBadge tone={statusMeta.tone}>{statusMeta.label}</ToneBadge>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {project.hourlyRate != null && (
          <span>
            {project.currency} {project.hourlyRate}/hr
          </span>
        )}
        {project.startDate && <span>Started {format(project.startDate, "MMM d, yyyy")}</span>}
        {project.estimatedHours != null && <span>{project.estimatedHours}h estimated</span>}
        {project.actualHours != null && <span>{project.actualHours}h logged</span>}
      </div>
      {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${project.name}"?`}
        description="This permanently removes this project."
        onConfirm={async () => {
          await deleteProjectAction(project.id);
          toast.success("Project deleted.");
        }}
      />
    </Card>
  );
}
