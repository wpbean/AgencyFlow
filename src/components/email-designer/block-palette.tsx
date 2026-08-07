"use client";

import { Heading1, Pilcrow, List, Image as ImageIcon, MousePointerClick, Minus, StretchVertical } from "lucide-react";
import type { EmailBlockType } from "@/lib/email/design-types";

const PALETTE: { type: EmailBlockType; label: string; icon: typeof Heading1 }[] = [
  { type: "heading", label: "Heading", icon: Heading1 },
  { type: "paragraph", label: "Paragraph", icon: Pilcrow },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "list", label: "List", icon: List },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: StretchVertical },
];

export function BlockPalette({ onAdd }: { onAdd: (type: EmailBlockType) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 text-xs font-medium text-muted-foreground">Add block</p>
      {PALETTE.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-left text-sm hover:bg-accent"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          {label}
        </button>
      ))}
    </div>
  );
}
