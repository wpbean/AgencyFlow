"use client";

import { useState, type ReactNode } from "react";
import type { EmailDesign } from "@/lib/email/design-types";
import { STARTER_TEMPLATES } from "@/lib/email/starter-templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export type SavedTemplateOption = { id: string; name: string; subject: string; design: EmailDesign };

function TemplateSwatch({ design }: { design: EmailDesign }) {
  return (
    <div
      className="flex h-20 items-center justify-center rounded-md border"
      style={{ backgroundColor: design.styles.backgroundColor }}
    >
      <div
        className="h-14 w-24 rounded-sm border shadow-sm"
        style={{ backgroundColor: design.styles.contentBackgroundColor, borderRadius: design.styles.borderRadius / 2 }}
      />
    </div>
  );
}

export function TemplatePickerDialog({
  trigger,
  savedTemplates = [],
  onSelect,
}: {
  trigger: ReactNode;
  savedTemplates?: SavedTemplateOption[];
  onSelect: (design: EmailDesign, subject: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  function pick(design: EmailDesign, subject: string, name: string) {
    onSelect(design, subject, name);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
          <DialogDescription>Start from a pre-made design or one of your own saved templates.</DialogDescription>
        </DialogHeader>

        {savedTemplates.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Your templates</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {savedTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pick(t.design, t.subject, t.name)}
                  className="flex flex-col gap-2 rounded-lg border p-2 text-left hover:border-primary"
                >
                  <TemplateSwatch design={t.design} />
                  <p className="truncate text-sm font-medium">{t.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Starter templates</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {STARTER_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.design, "", t.name)}
                className="flex flex-col gap-2 rounded-lg border p-2 text-left hover:border-primary"
              >
                <TemplateSwatch design={t.design} />
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
