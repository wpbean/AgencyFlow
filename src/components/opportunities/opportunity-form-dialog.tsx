"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createOpportunityAction, updateOpportunityAction } from "@/actions/opportunities";
import { OPPORTUNITY_TYPES, OPPORTUNITY_STAGES } from "@/db/schema";
import { OPPORTUNITY_TYPE_META, OPPORTUNITY_STAGE_META } from "@/lib/labels";
import { DatePicker } from "@/components/common/date-picker";
import type { opportunities } from "@/db/schema";

type OpportunityFormData = typeof opportunities.$inferSelect & { agencyName?: string };

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

type ContactOption = { id: string; firstName: string; lastName: string | null };

export function OpportunityFormDialog({
  agencyId,
  contacts,
  opportunity,
  trigger,
  defaultCurrency = "USD",
  agencyOptions,
  contactsByAgency,
}: {
  agencyId: string;
  contacts: ContactOption[];
  opportunity?: OpportunityFormData;
  trigger: ReactNode;
  defaultCurrency?: string;
  agencyOptions?: { id: string; name: string }[];
  contactsByAgency?: Record<string, ContactOption[]>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = !!opportunity;

  const [selectedAgencyId, setSelectedAgencyId] = useState(agencyId);
  const activeContacts = agencyOptions && contactsByAgency ? (contactsByAgency[selectedAgencyId] ?? []) : contacts;

  const [contactId, setContactId] = useState(opportunity?.contactId ?? "none");
  const [title, setTitle] = useState(opportunity?.title ?? "");
  const [description, setDescription] = useState(opportunity?.description ?? "");
  const [type, setType] = useState(opportunity?.type ?? "PROJECT");
  const [stage, setStage] = useState(opportunity?.stage ?? "INTERESTED");
  const [expectedRate, setExpectedRate] = useState(opportunity?.expectedRate?.toString() ?? "");
  const [currency, setCurrency] = useState(opportunity?.currency ?? defaultCurrency);
  const [expectedHours, setExpectedHours] = useState(opportunity?.expectedHours?.toString() ?? "");
  const [probability, setProbability] = useState(opportunity?.probability?.toString() ?? "50");
  const [nextAction, setNextAction] = useState(opportunity?.nextAction ?? "");
  const [nextActionDate, setNextActionDate] = useState<Date | undefined>(opportunity?.nextActionDate ?? undefined);
  const [notes, setNotes] = useState(opportunity?.notes ?? "");

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const fd = new FormData();
    fd.set("agencyId", selectedAgencyId);
    if (contactId !== "none") fd.set("contactId", contactId);
    fd.set("title", title);
    if (description) fd.set("description", description);
    fd.set("type", type);
    fd.set("stage", stage);
    if (expectedRate) fd.set("expectedRate", expectedRate);
    fd.set("currency", currency);
    if (expectedHours) fd.set("expectedHours", expectedHours);
    fd.set("probability", probability);
    if (nextAction) fd.set("nextAction", nextAction);
    if (nextActionDate) fd.set("nextActionDate", nextActionDate.toISOString());
    if (notes) fd.set("notes", notes);

    startTransition(async () => {
      const action = isEdit ? updateOpportunityAction.bind(null, opportunity.id) : createOpportunityAction;
      const result = await action(undefined, fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Opportunity updated." : "Opportunity created.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Opportunity" : "New Opportunity"}</DialogTitle>
          <DialogDescription>Track a potential engagement with this agency.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {agencyOptions && !isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>Agency</Label>
              <Select
                value={selectedAgencyId}
                onValueChange={(v) => {
                  setSelectedAgencyId(v);
                  setContactId("none");
                }}
              >
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
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="WooCommerce dev retainer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {OPPORTUNITY_TYPE_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as typeof stage)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {OPPORTUNITY_STAGE_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contact</SelectItem>
                {activeContacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Rate</Label>
              <Input type="number" min={0} value={expectedRate} onChange={(e) => setExpectedRate(e.target.value)} placeholder="45" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hours/mo</Label>
              <Input type="number" min={0} value={expectedHours} onChange={(e) => setExpectedHours(e.target.value)} placeholder="40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Probability (%)</Label>
              <Input type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Next Action Date</Label>
              <DatePicker value={nextActionDate} onChange={setNextActionDate} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Next Action</Label>
            <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Follow up after technical test" />
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
            {isEdit ? "Save Changes" : "Create Opportunity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
