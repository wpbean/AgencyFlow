"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { createFollowUpAction } from "@/actions/follow-ups";
import { OUTREACH_TYPES } from "@/db/schema";
import { OUTREACH_TYPE_META } from "@/lib/labels";
import { DatePicker } from "@/components/common/date-picker";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d;
}

export function FollowUpCreateTrigger({ agencyOptions }: { agencyOptions: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [agencyId, setAgencyId] = useState(agencyOptions[0]?.id ?? "");
  const [type, setType] = useState<(typeof OUTREACH_TYPES)[number]>("FOLLOW_UP_1");
  const [dueDate, setDueDate] = useState<Date>(defaultDueDate());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs dialog open state to the ?new=1 URL param
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && searchParams.get("new") === "1") router.replace("/follow-ups");
  }

  function handleSubmit() {
    if (!agencyId) {
      toast.error("Choose an agency.");
      return;
    }
    const fd = new FormData();
    fd.set("agencyId", agencyId);
    fd.set("type", type);
    fd.set("dueDate", dueDate.toISOString());
    if (notes) fd.set("notes", notes);

    startTransition(async () => {
      const result = await createFollowUpAction(undefined, fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Follow-up scheduled.");
      handleOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="lg" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> New Follow-up
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
          <DialogDescription>Add a follow-up reminder for an agency.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Agency</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTREACH_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {OUTREACH_TYPE_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Due Date</Label>
              <DatePicker value={dueDate} onChange={(d) => d && setDueDate(d)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
