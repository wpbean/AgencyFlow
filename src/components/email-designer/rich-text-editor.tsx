"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Legacy plain-text values (pre rich-text) store real "\n" newlines; render them as <br /> for display. */
function toDisplayHtml(value: string): string {
  return value.replace(/\r\n|\n/g, "<br />");
}

function ToolbarButton({
  icon: Icon,
  label,
  onRun,
}: {
  icon: typeof Bold;
  label: string;
  onRun: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-7"
      title={label}
      aria-label={label}
      // Preserve the editor's text selection — a normal click would blur it first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onRun}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  rows = 5,
}: {
  value: string;
  onChange: (html: string) => void;
  rows?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isFocused = useRef(false);

  // Keep the DOM in sync with external value changes (e.g. merge-tag insertion)
  // without clobbering the user's cursor while they're actively typing.
  useEffect(() => {
    const el = ref.current;
    if (!el || isFocused.current) return;
    const html = toDisplayHtml(value);
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [value]);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function handleLink() {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      window.alert("Select some text first, then click Link.");
      return;
    }
    const existing = document.queryCommandValue("createLink");
    const url = window.prompt("Link URL", existing && existing !== "false" ? existing : "https://");
    if (!url) return;
    exec("createLink", url);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        <ToolbarButton icon={Bold} label="Bold" onRun={() => exec("bold")} />
        <ToolbarButton icon={Italic} label="Italic" onRun={() => exec("italic")} />
        <ToolbarButton icon={Link2} label="Link" onRun={handleLink} />
        <ToolbarButton icon={Link2Off} label="Remove link" onRun={() => exec("unlink")} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        style={{ minHeight: `${rows * 1.5}em` }}
        className={cn(
          "block w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
          "md:text-sm dark:bg-input/30 [&_a]:underline [&_a]:text-primary"
        )}
        data-placeholder="Write your message here."
        onFocus={() => {
          isFocused.current = true;
          document.execCommand("defaultParagraphSeparator", false, "br");
        }}
        onBlur={() => {
          isFocused.current = false;
        }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
      />
    </div>
  );
}
