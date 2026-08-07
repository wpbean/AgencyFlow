"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ContactOption = { id: string; firstName: string; lastName: string | null };

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d;
}

export function AddFollowUpDialog({
  agencyId,
  contacts,
  trigger,
}: {
  agencyId: string;
  contacts: ContactOption[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [contactId, setContactId] = useState("none");
  const [type, setType] = useState<(typeof OUTREACH_TYPES)[number]>("FOLLOW_UP_1");
  const [dueDate, setDueDate] = useState<Date>(defaultDueDate());
  const [notes, setNotes] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setContactId(contacts[0]?.id ?? "none");
      setType("FOLLOW_UP_1");
      setDueDate(defaultDueDate());
      setNotes("");
    }
  }

  function handleSubmit() {
    const fd = new FormData();
    fd.set("agencyId", agencyId);
    if (contactId !== "none") fd.set("contactId", contactId);
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
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
          <DialogDescription>Add a follow-up reminder for this agency.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No contact</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Due Date</Label>
            <DatePicker value={dueDate} onChange={(d) => d && setDueDate(d)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
