"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, TriangleAlert, LayoutTemplate } from "lucide-react";
import { updateCampaignAction } from "@/actions/campaigns";
import { renderTemplate } from "@/lib/email";
import { renderDesignToText } from "@/lib/email/render-design";
import type { EmailDesign } from "@/lib/email/design-types";
import type { CampaignRow } from "@/db/queries/campaigns";
import { EmailDesignEditor } from "@/components/email-designer/email-design-editor";
import { TemplatePickerDialog, type SavedTemplateOption } from "@/components/email-designer/template-picker-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VARIABLES = ["first_name", "last_name"];
const SAMPLE_VARS = { first_name: "John", last_name: "Smith" };

export function CampaignComposeTab({ campaign, savedTemplates }: { campaign: CampaignRow; savedTemplates: SavedTemplateOption[] }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(campaign.name);
  const [subject, setSubject] = useState(campaign.subject);
  const [body, setBody] = useState(campaign.body);
  const [design, setDesign] = useState<EmailDesign | null>(campaign.design);

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
      const result = await updateCampaignAction(campaign.id, undefined, fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Campaign saved.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {campaign.status !== "DRAFT" && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            This campaign has already {campaign.status === "SENDING" ? "started sending" : "been sent"}. Changes here won&apos;t be
            reflected in emails already sent.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Campaign Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          </div>

          <TemplatePickerDialog
            savedTemplates={savedTemplates}
            onSelect={(picked) => setDesign(picked)}
            trigger={
              <Button type="button" variant="outline" size="sm" className="w-fit gap-1.5">
                <LayoutTemplate className="size-3.5" /> {design ? "Choose a different template" : "Use a template"}
              </Button>
            }
          />

          {design ? (
            <EmailDesignEditor value={design} onChange={setDesign} />
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Body</Label>
                <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
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
              <div className="rounded-lg border p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Preview (uses sample data)</p>
                <p className="mb-2 font-medium">{renderTemplate(subject, SAMPLE_VARS)}</p>
                <p className="text-sm whitespace-pre-wrap">{renderTemplate(body, SAMPLE_VARS)}</p>
                <p className="mt-4 border-t pt-2 text-xs text-muted-foreground">Don&apos;t want these emails? Unsubscribe</p>
              </div>
            </>
          )}

          <div>
            <Button type="button" onClick={handleSubmit} disabled={pending} className="gap-1.5">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
