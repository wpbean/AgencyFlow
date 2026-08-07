"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createProjectAction, updateProjectAction } from "@/actions/projects";
import { PROJECT_STATUSES } from "@/db/schema";
import { PROJECT_STATUS_META } from "@/lib/labels";
import { DatePicker } from "@/components/common/date-picker";
import type { projects } from "@/db/schema";

type ProjectFormData = typeof projects.$inferSelect & { agencyName?: string };

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProjectFormDialog({
  agencyId,
  opportunityId,
  project,
  trigger,
  defaultCurrency = "USD",
  agencyOptions,
}: {
  agencyId: string;
  opportunityId?: string;
  project?: ProjectFormData;
  trigger: ReactNode;
  defaultCurrency?: string;
  agencyOptions?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = !!project;

  const [selectedAgencyId, setSelectedAgencyId] = useState(agencyId);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState(project?.status ?? "PLANNED");
  const [startDate, setStartDate] = useState<Date | undefined>(project?.startDate ?? undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(project?.endDate ?? undefined);
  const [hourlyRate, setHourlyRate] = useState(project?.hourlyRate?.toString() ?? "");
  const [currency, setCurrency] = useState(project?.currency ?? defaultCurrency);
  const [estimatedHours, setEstimatedHours] = useState(project?.estimatedHours?.toString() ?? "");
  const [actualHours, setActualHours] = useState(project?.actualHours?.toString() ?? "");
  const [notes, setNotes] = useState(project?.notes ?? "");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    const fd = new FormData();
    fd.set("agencyId", selectedAgencyId);
    if (opportunityId) fd.set("opportunityId", opportunityId);
    fd.set("name", name);
    if (description) fd.set("description", description);
    fd.set("status", status);
    if (startDate) fd.set("startDate", startDate.toISOString());
    if (endDate) fd.set("endDate", endDate.toISOString());
    if (hourlyRate) fd.set("hourlyRate", hourlyRate);
    fd.set("currency", currency);
    if (estimatedHours) fd.set("estimatedHours", estimatedHours);
    if (actualHours) fd.set("actualHours", actualHours);
    if (notes) fd.set("notes", notes);

    startTransition(async () => {
      const action = isEdit ? updateProjectAction.bind(null, project.id) : createProjectAction;
      const result = await action(undefined, fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Project updated." : "Project created.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
          <DialogDescription>Track delivery details for this engagement.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {agencyOptions && !isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>Agency</Label>
              <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an agency" />
                </SelectTrigger>
                <SelectContent>
                  {agencyOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Project Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Storefront rebuild" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROJECT_STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Start Date</Label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End Date</Label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Hourly Rate</Label>
              <Input type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Est. Hours</Label>
              <Input type="number" min={0} value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Actual Hours</Label>
            <Input type="number" min={0} value={actualHours} onChange={(e) => setActualHours(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
