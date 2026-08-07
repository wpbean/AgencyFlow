"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, LayoutTemplate } from "lucide-react";
import { createTemplateAction, updateTemplateAction } from "@/actions/templates";
import { TEMPLATE_CATEGORIES } from "@/db/schema";
import { TEMPLATE_CATEGORY_META } from "@/lib/labels";
import { emptyEmailDesign, renderDesignToText, createBlockId } from "@/lib/email/render-design";
import type { EmailDesign } from "@/lib/email/design-types";
import type { emailTemplates } from "@/db/schema";
import { EmailDesignEditor } from "@/components/email-designer/email-design-editor";
import { TemplatePickerDialog, type SavedTemplateOption } from "@/components/email-designer/template-picker-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Template = typeof emailTemplates.$inferSelect;

function seedDesign(template?: Template): EmailDesign {
  if (template?.design) return template.design;
  if (template?.body) {
    const base = emptyEmailDesign();
    return { ...base, blocks: [{ id: createBlockId(), type: "paragraph", text: template.body, align: "left" }] };
  }
  return emptyEmailDesign();
}

export function TemplateBuilderForm({
  template,
  savedTemplates,
}: {
  template?: Template;
  savedTemplates: SavedTemplateOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = !!template;

  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState(template?.category ?? "GENERAL");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [design, setDesign] = useState<EmailDesign>(() => seedDesign(template));

  const otherSavedTemplates = useMemo(() => savedTemplates.filter((t) => t.id !== template?.id), [savedTemplates, template?.id]);

  function handleSubmit() {
    if (!name.trim() || !subject.trim()) {
      toast.error("Name and subject are required.");
      return;
    }
    const body = renderDesignToText(design, {});
    if (!body.trim()) {
      toast.error("Add at least one block with content.");
      return;
    }

    const fd = new FormData();
    fd.set("name", name);
    fd.set("category", category);
    fd.set("subject", subject);
    fd.set("body", body);
    fd.set("design", JSON.stringify(design));

    startTransition(async () => {
      const action = isEdit ? updateTemplateAction.bind(null, template.id) : createTemplateAction;
      const result = await action(undefined, fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Template updated." : "Template created.");
      router.push("/templates");
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_2fr]">
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="WordPress agency intro" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {TEMPLATE_CATEGORY_META[c].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="WordPress/WooCommerce development support" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Use variables like {"{{first_name}}"}, {"{{agency_name}}"}, {"{{website}}"}, {"{{country}}"} in text blocks.
        </p>
        <TemplatePickerDialog
          savedTemplates={otherSavedTemplates}
          onSelect={(picked, pickedSubject) => {
            setDesign(picked);
            if (pickedSubject && !subject.trim()) setSubject(pickedSubject);
          }}
          trigger={
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <LayoutTemplate className="size-3.5" /> Start from a template
            </Button>
          }
        />
      </div>

      <EmailDesignEditor value={design} onChange={setDesign} />

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => router.push("/templates")}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isEdit ? "Save Changes" : "Create Template"}
        </Button>
      </div>
    </div>
  );
}
