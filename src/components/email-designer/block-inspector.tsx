"use client";

import { X } from "lucide-react";
import type { EmailBlock } from "@/lib/email/design-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldGroup, ColorField, AlignField, MergeTagButtons } from "./fields";

type Patch = Record<string, unknown>;

function insertIntoTextarea(current: string, variable: string): string {
  return `${current}{{${variable}}}`;
}

export function BlockInspector({
  block,
  onChange,
  onClose,
}: {
  block: EmailBlock;
  onChange: (patch: Patch) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium capitalize">{block.type} block</p>
        <Button type="button" variant="ghost" size="icon" className="size-6" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>

      {block.type === "heading" && (
        <>
          <FieldGroup label="Text">
            <Textarea rows={2} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
          </FieldGroup>
          <MergeTagButtons onInsert={(v) => onChange({ text: insertIntoTextarea(block.text, v) })} />
          <FieldGroup label="Size">
            <Select value={String(block.level)} onValueChange={(v) => onChange({ level: Number(v) })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Large</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Small</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
          <ColorField label="Color" value={block.color || "#18181b"} onChange={(color) => onChange({ color })} />
        </>
      )}

      {block.type === "paragraph" && (
        <>
          <FieldGroup label="Text">
            <Textarea rows={5} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
          </FieldGroup>
          <MergeTagButtons onInsert={(v) => onChange({ text: insertIntoTextarea(block.text, v) })} />
          <FieldGroup label="Font size (px)">
            <Input
              type="number"
              min={8}
              max={72}
              value={block.fontSize || 16}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) || 16 })}
            />
          </FieldGroup>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
          <ColorField label="Color" value={block.color || "#18181b"} onChange={(color) => onChange({ color })} />
        </>
      )}

      {block.type === "list" && (
        <>
          <FieldGroup label="Style">
            <Select value={block.style} onValueChange={(style) => onChange({ style })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullet">Bulleted</SelectItem>
                <SelectItem value="number">Numbered</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
          <FieldGroup label="Items (one per line)">
            <Textarea
              rows={5}
              value={block.items.join("\n")}
              onChange={(e) => onChange({ items: e.target.value.split("\n") })}
            />
          </FieldGroup>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
          <ColorField label="Color" value={block.color || "#18181b"} onChange={(color) => onChange({ color })} />
        </>
      )}

      {block.type === "image" && (
        <>
          <FieldGroup label="Image URL">
            <Input
              value={block.src}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </FieldGroup>
          <FieldGroup label="Alt text">
            <Input value={block.alt} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Describe the image" />
          </FieldGroup>
          <FieldGroup label="Link URL (optional)">
            <Input value={block.href || ""} onChange={(e) => onChange({ href: e.target.value || undefined })} placeholder="https://example.com" />
          </FieldGroup>
          <FieldGroup label="Width (px, optional)">
            <Input
              type="number"
              min={1}
              value={block.width || ""}
              onChange={(e) => onChange({ width: e.target.value ? Number(e.target.value) : undefined })}
            />
          </FieldGroup>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
        </>
      )}

      {block.type === "button" && (
        <>
          <FieldGroup label="Text">
            <Input value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Link URL">
            <Input value={block.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="https://example.com" />
          </FieldGroup>
          <AlignField value={block.align} onChange={(align) => onChange({ align })} />
          <ColorField label="Background color" value={block.bgColor} onChange={(bgColor) => onChange({ bgColor })} />
          <ColorField label="Text color" value={block.textColor} onChange={(textColor) => onChange({ textColor })} />
        </>
      )}

      {block.type === "divider" && (
        <ColorField label="Color" value={block.color} onChange={(color) => onChange({ color })} />
      )}

      {block.type === "spacer" && (
        <FieldGroup label="Height (px)">
          <Input
            type="number"
            min={0}
            max={400}
            value={block.height}
            onChange={(e) => onChange({ height: Number(e.target.value) || 0 })}
          />
        </FieldGroup>
      )}
    </div>
  );
}
