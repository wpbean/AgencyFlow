"use client";

import { useState } from "react";
import { Check, Copy, Upload } from "lucide-react";
import type { EmailDesign, EmailDesignStyles } from "@/lib/email/design-types";
import { AI_IMPORT_GUIDE, parseImportedDesign } from "@/lib/email/import-design";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export function ImportDesignDialog({
  open,
  onOpenChange,
  currentStyles,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStyles: EmailDesignStyles;
  onImport: (design: EmailDesign) => void;
}) {
  const [tab, setTab] = useState("guide");
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPasted("");
    setError(null);
    setTab("guide");
  }

  function handleCopy() {
    navigator.clipboard.writeText(AI_IMPORT_GUIDE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleImport() {
    if (!pasted.trim()) {
      setError("Paste the AI agent's JSON reply first.");
      return;
    }
    const result = parseImportedDesign(pasted, currentStyles);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onImport(result.design);
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import content</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value="guide">AI agent guidelines</TabsTrigger>
            <TabsTrigger value="paste">Paste content</TabsTrigger>
          </TabsList>
          <TabsContent value="guide" className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Copy this and send it to your AI chat agent (ChatGPT, Claude, etc.) along with what you want the email
              to say. Paste the agent&apos;s reply into the &quot;Paste content&quot; tab.
            </p>
            <Textarea readOnly value={AI_IMPORT_GUIDE} className="h-64 resize-none overflow-y-auto font-mono text-xs" />
            <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start" onClick={handleCopy}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy guidelines"}
            </Button>
          </TabsContent>
          <TabsContent value="paste" className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Paste the JSON your AI agent replied with. This replaces the current blocks in the editor.
            </p>
            <Textarea
              value={pasted}
              onChange={(e) => {
                setPasted(e.target.value);
                setError(null);
              }}
              placeholder='{"blocks": [...]}'
              className="h-48 resize-none overflow-y-auto font-mono text-xs"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {tab === "paste" && (
            <Button type="button" className="gap-1.5" onClick={handleImport}>
              <Upload className="size-3.5" /> Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
