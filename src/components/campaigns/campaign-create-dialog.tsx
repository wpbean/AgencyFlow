"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, LayoutTemplate, X } from "lucide-react";
import { createCampaignAction } from "@/actions/campaigns";
import { renderDesignToText } from "@/lib/email/render-design";
import type { EmailDesign } from "@/lib/email/design-types";
import { TemplatePickerDialog, type SavedTemplateOption } from "@/components/email-designer/template-picker-dialog";

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

const VARIABLES = ["first_name", "last_name"];

export function CampaignCreateDialog({ trigger, savedTemplates = [] }: { trigger: ReactNode; savedTemplates?: SavedTemplateOption[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [design, setDesign] = useState<EmailDesign | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setSubject("");
      setBody("");
      setDesign(null);
      setTemplateName(null);
    }
  }

  function handleSubmit() {
    const effectiveBody = design ? renderDesignToText(design, {}) : body;
    if (!name.trim() || !subject.trim() || !effectiveBody.trim()) {
      toast.error("Name, subject, and body are required.");
      return;
    }
    const fd = new FormData();
    fd.set("name", name);
    fd.set("subject", subject);
    fd.set("body", effectiveBody);
    if (design) fd.set("design", JSON.stringify(design));

    startTransition(async () => {
      const result = await createCampaignAction(undefined, fd);
      if (result?.error) {
        toast.error(result.error);
      }
      // On success, createCampaignAction redirects — no further handling needed here.
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
          <DialogDescription>
            Write the email once, then choose who receives it. Use {"{{first_name}}"} and {"{{last_name}}"} to personalize.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Campaign Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="August upgrade offer" />
            <p className="text-xs text-muted-foreground">Internal name only — recipients never see this.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Upgrade to Pro and save 20%" />
          </div>
          {design ? (
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm">
                <LayoutTemplate className="size-4 text-muted-foreground" />
                <span>
                  Using <span className="font-medium">{templateName}</span> — customize it after creating the campaign.
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => {
                  setDesign(null);
                  setTemplateName(null);
                }}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Body</Label>
                <Textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Hi {{first_name}},\n\nFor a limited time, upgrade to the Pro plan and save 20%...`}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBody((b) => `${b}{{${v}}}`)}
                    className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-accent"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </>
          )}
          <TemplatePickerDialog
            savedTemplates={savedTemplates}
            onSelect={(pickedDesign, pickedSubject, pickedName) => {
              setDesign(pickedDesign);
              setTemplateName(pickedName);
              if (pickedSubject && !subject.trim()) setSubject(pickedSubject);
            }}
            trigger={
              <Button type="button" variant="outline" size="sm" className="w-fit gap-1.5">
                <LayoutTemplate className="size-3.5" /> {design ? "Choose a different template" : "Start from a template"}
              </Button>
            }
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Create Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
