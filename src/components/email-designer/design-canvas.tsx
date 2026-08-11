"use client";

import { useState } from "react";
import { GripVertical, Copy, Trash2, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import { FONT_STACKS, type EmailBlock, type EmailDesign } from "@/lib/email/design-types";
import { BLOCK_PADDING, sanitizeRichText } from "@/lib/email/render-design";
import { Button } from "@/components/ui/button";

function BlockContent({ block, styles }: { block: EmailBlock; styles: EmailDesign["styles"] }) {
  const align = block.type !== "divider" && block.type !== "spacer" ? block.align : "left";

  switch (block.type) {
    case "heading": {
      const size = block.level === 1 ? 28 : block.level === 2 ? 22 : 18;
      return (
        <div
          style={{
            fontSize: size,
            fontWeight: 700,
            lineHeight: 1.3,
            color: block.color || styles.textColor,
            textAlign: align,
            whiteSpace: "pre-wrap",
          }}
        >
          {block.text || "Heading text"}
        </div>
      );
    }
    case "paragraph":
      return (
        <div
          style={{
            fontSize: block.fontSize || 16,
            lineHeight: 1.6,
            color: block.color || styles.textColor,
            textAlign: align,
          }}
          dangerouslySetInnerHTML={{
            __html: block.text ? sanitizeRichText(block.text) : "Paragraph text",
          }}
        />
      );
    case "list": {
      const Tag = block.style === "number" ? "ol" : "ul";
      return (
        <Tag
          style={{
            margin: 0,
            paddingLeft: 22,
            color: block.color || styles.textColor,
            fontSize: 16,
            lineHeight: 1.6,
            textAlign: align,
            listStyleType: block.style === "number" ? "decimal" : "disc",
            listStylePosition: "outside",
          }}
        >
          {(block.items.length > 0 ? block.items : ["List item"]).map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {item}
            </li>
          ))}
        </Tag>
      );
    }
    case "image":
      return (
        <div style={{ textAlign: align }}>
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.src}
              alt={block.alt}
              width={block.width || undefined}
              style={{ maxWidth: "100%", height: "auto", borderRadius: styles.borderRadius, display: "inline-block" }}
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center gap-2 rounded-md border border-dashed bg-muted text-sm text-muted-foreground">
              <ImageIcon className="size-4" /> No image URL set
            </div>
          )}
        </div>
      );
    case "button":
      return (
        <div style={{ textAlign: align }}>
          <span
            style={{
              display: "inline-block",
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 600,
              color: block.textColor,
              backgroundColor: block.bgColor,
              borderRadius: styles.borderRadius,
            }}
          >
            {block.text || "Button"}
          </span>
        </div>
      );
    case "divider":
      return <hr style={{ border: "none", borderTop: `1px solid ${block.color}`, margin: 0 }} />;
    case "spacer":
      return (
        <div
          className="rounded border border-dashed border-border/60"
          style={{ height: Math.max(block.height, 8) }}
        />
      );
  }
}

export function DesignCanvas({
  design,
  selectedId,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onMove,
}: {
  design: EmailDesign;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const { styles, blocks } = design;

  return (
    <div
      className="overflow-auto rounded-lg border p-4 sm:p-8"
      style={{ backgroundColor: styles.backgroundColor, fontFamily: FONT_STACKS[styles.fontFamily].css }}
    >
      <div
        className="mx-auto"
        style={{
          width: styles.contentWidth,
          maxWidth: "100%",
          backgroundColor: styles.contentBackgroundColor,
          borderRadius: styles.borderRadius,
        }}
      >
        {blocks.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Add a block from the left to start building your email.
          </p>
        )}
        {blocks.map((block, index) => {
          const selected = block.id === selectedId;
          return (
            <div
              key={block.id}
              draggable
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(index);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== index) onReorder(draggedIndex, index);
                setDraggedIndex(null);
                setOverIndex(null);
              }}
              onClick={() => onSelect(block.id)}
              className={`group relative cursor-pointer outline outline-2 outline-offset-[-2px] transition-colors ${
                selected ? "outline-primary" : "outline-transparent hover:outline-primary/30"
              } ${draggedIndex === index ? "opacity-40" : ""} ${
                overIndex === index && draggedIndex !== null && draggedIndex !== index ? "border-t-2 border-t-primary" : ""
              }`}
              style={{ padding: BLOCK_PADDING[block.type] }}
            >
              <BlockContent block={block} styles={styles} />
              <div
                className={`absolute -top-3 right-2 flex items-center gap-0.5 rounded-md border bg-popover p-0.5 shadow-sm transition-opacity ${
                  selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span className="cursor-grab px-1 text-muted-foreground">
                  <GripVertical className="size-3.5" />
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(block.id, "up");
                  }}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === blocks.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(block.id, "down");
                  }}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(block.id);
                  }}
                >
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(block.id);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
