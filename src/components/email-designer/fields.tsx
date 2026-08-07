"use client";

import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { EmailBlockAlign } from "@/lib/email/design-types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const MERGE_VARIABLES = ["first_name", "last_name", "agency_name", "website", "country"];

export function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldGroup label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full rounded-md border bg-background px-2 font-mono text-xs"
        />
      </div>
    </FieldGroup>
  );
}

const ALIGN_OPTIONS: { value: EmailBlockAlign; icon: typeof AlignLeft }[] = [
  { value: "left", icon: AlignLeft },
  { value: "center", icon: AlignCenter },
  { value: "right", icon: AlignRight },
];

export function AlignField({ value, onChange }: { value: EmailBlockAlign; onChange: (v: EmailBlockAlign) => void }) {
  return (
    <FieldGroup label="Alignment">
      <div className="flex gap-1">
        {ALIGN_OPTIONS.map(({ value: v, icon: Icon }) => (
          <Button
            key={v}
            type="button"
            size="icon"
            variant={value === v ? "default" : "outline"}
            className="size-8"
            onClick={() => onChange(v)}
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
    </FieldGroup>
  );
}

export function MergeTagButtons({ onInsert }: { onInsert: (variable: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MERGE_VARIABLES.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onInsert(v)}
          className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-accent"
        >
          {`{{${v}}}`}
        </button>
      ))}
    </div>
  );
}
