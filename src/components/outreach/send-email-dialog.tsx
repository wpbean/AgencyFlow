"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Check, Loader2 } from "lucide-react";
import { markOutreachSentAction } from "@/actions/outreach";
import { renderTemplate, buildGmailComposeUrl } from "@/lib/email";
import { OUTREACH_TYPES } from "@/db/schema";
import { OUTREACH_TYPE_META, TEMPLATE_CATEGORY_META } from "@/lib/labels";

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

type ContactOption = { id: string; firstName: string; lastName: string | null; email: string | null };
type TemplateOption = { id: string; name: string; category: string; subject: string; body: string };

export function SendEmailDialog({
  agencyId,
  agencyName,
  website,
  country,
  contacts,
  templates,
  defaultType = "INITIAL",
  trigger,
}: {
  agencyId: string;
  agencyName: string;
  website?: string | null;
  country?: string | null;
  contacts: ContactOption[];
  templates: TemplateOption[];
  defaultType?: (typeof OUTREACH_TYPES)[number];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [contactId, setContactId] = useState<string>(contacts[0]?.id ?? "none");
  const [templateId, setTemplateId] = useState<string>("none");
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedContact = contacts.find((c) => c.id === contactId);

  const vars = useMemo(
    () => ({
      first_name: selectedContact?.firstName || "there",
      last_name: selectedContact?.lastName || "",
      agency_name: agencyName,
      website: website || "",
      country: country || "",
    }),
    [selectedContact, agencyName, website, country]
  );

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSubject(renderTemplate(template.subject, vars));
      setBody(renderTemplate(template.body, vars));
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setContactId(contacts[0]?.id ?? "none");
      setTemplateId("none");
      setType(defaultType);
      setSubject("");
      setBody("");
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    toast.success("Email copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  }

  function handleOpenGmail() {
    window.open(buildGmailComposeUrl({ to: selectedContact?.email ?? undefined, subject, body }), "_blank", "noopener,noreferrer");
  }

  function handleMarkSent() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    const fd = new FormData();
    fd.set("agencyId", agencyId);
    if (contactId !== "none") fd.set("contactId", contactId);
    if (templateId !== "none") fd.set("templateId", templateId);
    fd.set("type", type);
    fd.set("subject", subject);
    fd.set("body", body);

    startTransition(async () => {
      const result = await markOutreachSentAction(undefined, fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Email marked as sent. Next follow-up scheduled.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>Compose an email to {agencyName}. This app does not send email directly.</DialogDescription>
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
                      {c.firstName} {c.lastName ?? ""} {c.email ? `(${c.email})` : ""}
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
            <Label>Template</Label>
            <Select value={templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Blank email</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {TEMPLATE_CATEGORY_META[t.category as keyof typeof TEMPLATE_CATEGORY_META]?.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Body</Label>
            <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Email body" />
          </div>
        </div>

        <DialogFooter className="flex-row flex-wrap justify-end gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            Copy
          </Button>
          <Button type="button" variant="outline" onClick={handleOpenGmail} className="gap-1.5">
            <ExternalLink className="size-4" />
            Open Gmail
          </Button>
          <Button type="button" onClick={handleMarkSent} disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Mark as Sent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
