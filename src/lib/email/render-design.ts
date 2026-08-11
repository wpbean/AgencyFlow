import { nanoid } from "nanoid";
import sanitizeHtml from "sanitize-html";
import { renderTemplate } from "./index";
import { FONT_STACKS, type EmailBlock, type EmailBlockType, type EmailDesign, type EmailDesignStyles } from "./design-types";

export function createBlockId(): string {
  return nanoid(8);
}

export function createDefaultBlock(type: EmailBlockType): EmailBlock {
  const id = createBlockId();
  switch (type) {
    case "heading":
      return { id, type, text: "New heading", level: 2, align: "left" };
    case "paragraph":
      return { id, type, text: "Write your message here.", align: "left" };
    case "list":
      return { id, type, style: "bullet", items: ["First item", "Second item"], align: "left" };
    case "image":
      return { id, type, src: "", alt: "", align: "center" };
    case "button":
      return { id, type, text: "Click here", href: "https://example.com", align: "left", bgColor: "#18181b", textColor: "#ffffff" };
    case "divider":
      return { id, type, color: "#e4e4e7" };
    case "spacer":
      return { id, type, height: 24 };
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

export function emptyEmailDesign(): EmailDesign {
  return {
    version: 1,
    styles: {
      backgroundColor: "#f4f4f5",
      contentBackgroundColor: "#ffffff",
      contentWidth: 600,
      fontFamily: "sans",
      textColor: "#18181b",
      linkColor: "#2563eb",
      borderRadius: 8,
    },
    blocks: [
      { id: createBlockId(), type: "heading", text: "Your headline here", level: 2, align: "left" },
      {
        id: createBlockId(),
        type: "paragraph",
        text: "Write your message here. Use {{first_name}} to personalize it for each recipient.",
        align: "left",
      },
    ],
  };
}

type Vars = Record<string, string | null | undefined>;

function textWithBreaks(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

const RICH_TEXT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["b", "strong", "i", "em", "u", "a", "br"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }, true),
  },
};

/** Sanitizes paragraph-block rich text HTML, tolerating legacy plain-text values with raw newlines. */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html.replace(/\r\n|\n/g, "<br />"), RICH_TEXT_SANITIZE_OPTIONS);
}

/** Like renderTemplate, but HTML-escapes substituted values since the surrounding text is trusted HTML. */
function renderTemplateIntoHtml(html: string, vars: Vars): string {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = vars[key];
    return value ? escapeHtml(String(value)) : "";
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function renderBlockContent(block: EmailBlock, styles: EmailDesignStyles, vars: Vars): string {
  const align = block.type !== "divider" && block.type !== "spacer" ? block.align : "left";

  switch (block.type) {
    case "heading": {
      const size = block.level === 1 ? 28 : block.level === 2 ? 22 : 18;
      const color = block.color || styles.textColor;
      const text = renderTemplate(block.text, vars);
      return `<div style="font-size:${size}px;font-weight:700;line-height:1.3;color:${color};text-align:${align};margin:0;">${textWithBreaks(text)}</div>`;
    }
    case "paragraph": {
      const color = block.color || styles.textColor;
      const size = block.fontSize || 16;
      const html = renderTemplateIntoHtml(sanitizeRichText(block.text), vars);
      return `<div style="font-size:${size}px;line-height:1.6;color:${color};text-align:${align};margin:0;">${html}</div>`;
    }
    case "list": {
      const color = block.color || styles.textColor;
      const tag = block.style === "number" ? "ol" : "ul";
      const items = block.items
        .map((item) => `<li style="margin-bottom:4px;">${textWithBreaks(renderTemplate(item, vars))}</li>`)
        .join("");
      return `<${tag} style="margin:0;padding-left:22px;color:${color};font-size:16px;line-height:1.6;text-align:${align};">${items}</${tag}>`;
    }
    case "image": {
      const width = block.width || styles.contentWidth - 64;
      const img = `<img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt)}" width="${width}" style="max-width:100%;height:auto;display:inline-block;border:0;border-radius:${styles.borderRadius}px;" />`;
      const inner = block.href ? `<a href="${escapeAttr(block.href)}" target="_blank" rel="noopener">${img}</a>` : img;
      return `<div style="text-align:${align};">${inner}</div>`;
    }
    case "button": {
      const text = renderTemplate(block.text, vars);
      const margin = align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0";
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${margin};"><tr><td style="border-radius:${styles.borderRadius}px;background-color:${block.bgColor};"><a href="${escapeAttr(
        block.href
      )}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:${block.textColor};text-decoration:none;border-radius:${styles.borderRadius}px;">${escapeHtml(
        text
      )}</a></td></tr></table>`;
    }
    case "divider":
      return `<hr style="border:none;border-top:1px solid ${block.color};margin:0;" />`;
    case "spacer":
      return `<div style="height:${block.height}px;line-height:${block.height}px;font-size:1px;">&nbsp;</div>`;
  }
}

export const BLOCK_PADDING: Record<EmailBlock["type"], string> = {
  heading: "24px 32px 8px",
  paragraph: "8px 32px",
  list: "8px 32px",
  image: "16px 32px",
  button: "20px 32px",
  divider: "16px 32px",
  spacer: "0",
};

/** Table-based, email-client-safe HTML fragment for the given design. */
export function renderDesignToHtml(design: EmailDesign, vars: Vars): string {
  const { styles, blocks } = design;
  const font = FONT_STACKS[styles.fontFamily]?.css ?? FONT_STACKS.sans.css;

  const rows = blocks
    .map(
      (block) =>
        `<tr><td style="padding:${BLOCK_PADDING[block.type]};">${renderBlockContent(block, styles, vars)}</td></tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${styles.backgroundColor};font-family:${font};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="${styles.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${styles.contentWidth}px;max-width:100%;background-color:${styles.contentBackgroundColor};border-radius:${styles.borderRadius}px;">
${rows}
</table>
</td></tr>
</table>`;
}

/** Wraps a rendered fragment in a full HTML document — for iframe previews. */
export function wrapEmailPreviewDocument(fragment: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{margin:0;-webkit-text-size-adjust:100%;}</style></head><body>${fragment}</body></html>`;
}

function blockToText(block: EmailBlock, vars: Vars): string {
  switch (block.type) {
    case "heading":
      return renderTemplate(block.text, vars);
    case "paragraph":
      return renderTemplate(stripHtml(block.text), vars);
    case "list":
      return block.items.map((item) => `- ${renderTemplate(item, vars)}`).join("\n");
    case "button":
      return `${renderTemplate(block.text, vars)}: ${block.href}`;
    case "divider":
      return "----------";
    case "image":
    case "spacer":
      return "";
  }
}

/** Plain-text mirror of the design — used as the text/plain alternative and as the auto-synced `body` column. */
export function renderDesignToText(design: EmailDesign, vars: Vars): string {
  return design.blocks
    .map((b) => blockToText(b, vars))
    .filter((s) => s.length > 0)
    .join("\n\n")
    .trim();
}
