"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import type { EmailBlock, EmailBlockType, EmailDesign, EmailDesignStyles } from "@/lib/email/design-types";
import { createDefaultBlock, renderDesignToHtml, wrapEmailPreviewDocument } from "@/lib/email/render-design";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BlockPalette } from "./block-palette";
import { DesignCanvas } from "./design-canvas";
import { BlockInspector } from "./block-inspector";
import { StyleInspector } from "./style-inspector";

const SAMPLE_VARS = {
  first_name: "John",
  last_name: "Smith",
  agency_name: "Acme Web Agency",
  website: "acmeagency.com",
  country: "Germany",
};

export function EmailDesignEditor({ value, onChange }: { value: EmailDesign; onChange: (design: EmailDesign) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedBlock = value.blocks.find((b) => b.id === selectedId) || null;

  function addBlock(type: EmailBlockType) {
    const block = createDefaultBlock(type);
    onChange({ ...value, blocks: [...value.blocks, block] });
    setSelectedId(block.id);
  }

  function updateBlock(id: string, patch: Record<string, unknown>) {
    onChange({
      ...value,
      blocks: value.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EmailBlock) : b)),
    });
  }

  function duplicateBlock(id: string) {
    const index = value.blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const copy: EmailBlock = { ...value.blocks[index], id: `${id}-${Date.now().toString(36)}` };
    const blocks = [...value.blocks];
    blocks.splice(index + 1, 0, copy);
    onChange({ ...value, blocks });
    setSelectedId(copy.id);
  }

  function deleteBlock(id: string) {
    onChange({ ...value, blocks: value.blocks.filter((b) => b.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const index = value.blocks.findIndex((b) => b.id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= value.blocks.length) return;
    const blocks = [...value.blocks];
    [blocks[index], blocks[targetIndex]] = [blocks[targetIndex], blocks[index]];
    onChange({ ...value, blocks });
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    const blocks = [...value.blocks];
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    onChange({ ...value, blocks });
  }

  function updateStyles(patch: Partial<EmailDesignStyles>) {
    onChange({ ...value, styles: { ...value.styles, ...patch } });
  }

  const previewHtml = useMemo(
    () => wrapEmailPreviewDocument(renderDesignToHtml(value, SAMPLE_VARS)),
    [value]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setPreviewOpen(true)}>
          <Eye className="size-3.5" /> Preview
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[180px_1fr_300px]">
        <BlockPalette onAdd={addBlock} />
        <DesignCanvas
          design={value}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={reorderBlocks}
          onDuplicate={duplicateBlock}
          onDelete={deleteBlock}
          onMove={moveBlock}
        />
        {selectedBlock ? (
          <BlockInspector
            block={selectedBlock}
            onChange={(patch) => updateBlock(selectedBlock.id, patch)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <StyleInspector styles={value.styles} onChange={updateStyles} />
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Preview uses sample data.</p>
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="h-[60vh] w-full rounded-md border bg-white"
            sandbox=""
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
