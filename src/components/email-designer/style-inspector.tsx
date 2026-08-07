"use client";

import { FONT_STACKS, type EmailDesignStyles, type FontStackKey } from "@/lib/email/design-types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldGroup, ColorField } from "./fields";

type Patch = Partial<EmailDesignStyles>;

export function StyleInspector({ styles, onChange }: { styles: EmailDesignStyles; onChange: (patch: Patch) => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-3">
      <p className="text-sm font-medium">Email design</p>
      <p className="text-xs text-muted-foreground">Click a block to edit its content, or adjust the overall look here.</p>

      <FieldGroup label="Font">
        <Select value={styles.fontFamily} onValueChange={(v) => onChange({ fontFamily: v as FontStackKey })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FONT_STACKS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <FieldGroup label="Content width (px)">
        <Input
          type="number"
          min={300}
          max={900}
          value={styles.contentWidth}
          onChange={(e) => onChange({ contentWidth: Number(e.target.value) || 600 })}
        />
      </FieldGroup>

      <FieldGroup label="Corner radius (px)">
        <Input
          type="number"
          min={0}
          max={60}
          value={styles.borderRadius}
          onChange={(e) => onChange({ borderRadius: Number(e.target.value) || 0 })}
        />
      </FieldGroup>

      <ColorField label="Page background" value={styles.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} />
      <ColorField
        label="Content background"
        value={styles.contentBackgroundColor}
        onChange={(contentBackgroundColor) => onChange({ contentBackgroundColor })}
      />
      <ColorField label="Text color" value={styles.textColor} onChange={(textColor) => onChange({ textColor })} />
      <ColorField label="Link color" value={styles.linkColor} onChange={(linkColor) => onChange({ linkColor })} />
    </div>
  );
}
