// Parses AI-generated JSON (see AI_IMPORT_GUIDE) into an EmailDesign for the "Import content" dialog.

import {
  FONT_STACKS,
  type EmailBlock,
  type EmailBlockAlign,
  type EmailBlockType,
  type EmailDesignStyles,
  type EmailDesign,
  type FontStackKey,
} from "./design-types";
import { createBlockId, sanitizeRichText } from "./render-design";

// Keep in sync with MERGE_VARIABLES in components/email-designer/fields.tsx.
const MERGE_VARIABLES = ["first_name", "last_name", "agency_name", "website", "country"];

const BLOCK_TYPES: EmailBlockType[] = ["heading", "paragraph", "list", "image", "button", "divider", "spacer"];
const ALIGNS: EmailBlockAlign[] = ["left", "center", "right"];

function isAlign(v: unknown): v is EmailBlockAlign {
  return typeof v === "string" && (ALIGNS as string[]).includes(v);
}

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v.trim());
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export type ImportResult = { design: EmailDesign } | { error: string };

function parseBlock(raw: unknown, index: number): EmailBlock | { error: string } {
  if (typeof raw !== "object" || raw === null) return { error: `Block ${index + 1} is not an object.` };
  const b = raw as Record<string, unknown>;
  if (!BLOCK_TYPES.includes(b.type as EmailBlockType)) {
    return { error: `Block ${index + 1} has an unknown "type": ${JSON.stringify(b.type)}. Expected one of ${BLOCK_TYPES.join(", ")}.` };
  }
  const id = createBlockId();
  const align: EmailBlockAlign = isAlign(b.align) ? b.align : "left";

  switch (b.type as EmailBlockType) {
    case "heading": {
      const level = ([1, 2, 3] as unknown[]).includes(b.level) ? (b.level as 1 | 2 | 3) : 2;
      return { id, type: "heading", text: str(b.text, "Heading"), level, align, color: isHexColor(b.color) ? b.color : undefined };
    }
    case "paragraph":
      return {
        id,
        type: "paragraph",
        text: sanitizeRichText(str(b.text, "")),
        align,
        color: isHexColor(b.color) ? b.color : undefined,
        fontSize: typeof b.fontSize === "number" ? b.fontSize : undefined,
      };
    case "list": {
      const items = Array.isArray(b.items) ? b.items.filter((i): i is string => typeof i === "string") : [];
      if (items.length === 0) return { error: `Block ${index + 1} (list) needs a non-empty "items" array of strings.` };
      return { id, type: "list", style: b.style === "number" ? "number" : "bullet", items, align, color: isHexColor(b.color) ? b.color : undefined };
    }
    case "image":
      if (!str(b.src)) return { error: `Block ${index + 1} (image) is missing "src".` };
      return {
        id,
        type: "image",
        src: str(b.src),
        alt: str(b.alt, ""),
        href: str(b.href) || undefined,
        width: typeof b.width === "number" ? b.width : undefined,
        align,
      };
    case "button":
      if (!str(b.href)) return { error: `Block ${index + 1} (button) is missing "href".` };
      return {
        id,
        type: "button",
        text: str(b.text, "Click here"),
        href: str(b.href),
        align,
        bgColor: isHexColor(b.bgColor) ? b.bgColor : "#18181b",
        textColor: isHexColor(b.textColor) ? b.textColor : "#ffffff",
      };
    case "divider":
      return { id, type: "divider", color: isHexColor(b.color) ? b.color : "#e4e4e7" };
    case "spacer":
      return { id, type: "spacer", height: num(b.height, 24) };
  }
}

function parseStyles(raw: unknown, base: EmailDesignStyles): EmailDesignStyles {
  if (typeof raw !== "object" || raw === null) return base;
  const s = raw as Record<string, unknown>;
  const fontFamily = typeof s.fontFamily === "string" && s.fontFamily in FONT_STACKS ? (s.fontFamily as FontStackKey) : base.fontFamily;
  return {
    backgroundColor: isHexColor(s.backgroundColor) ? s.backgroundColor : base.backgroundColor,
    contentBackgroundColor: isHexColor(s.contentBackgroundColor) ? s.contentBackgroundColor : base.contentBackgroundColor,
    contentWidth: num(s.contentWidth, base.contentWidth),
    fontFamily,
    textColor: isHexColor(s.textColor) ? s.textColor : base.textColor,
    linkColor: isHexColor(s.linkColor) ? s.linkColor : base.linkColor,
    borderRadius: num(s.borderRadius, base.borderRadius),
  };
}

/** Parses pasted JSON (an AI agent's reply, per AI_IMPORT_GUIDE) into an EmailDesign. `baseStyles` fills in anything the JSON omits. */
export function parseImportedDesign(input: string, baseStyles: EmailDesignStyles): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { error: "That isn't valid JSON. Paste only the AI agent's raw JSON output, with no extra commentary or code fences." };
  }

  const rawBlocks = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as Record<string, unknown>).blocks)
      ? ((parsed as Record<string, unknown>).blocks as unknown[])
      : null;
  if (!rawBlocks) return { error: 'Expected a "blocks" array in the JSON.' };
  if (rawBlocks.length === 0) return { error: 'The "blocks" array is empty.' };

  const blocks: EmailBlock[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const result = parseBlock(rawBlocks[i], i);
    if ("error" in result) return result;
    blocks.push(result);
  }

  const styles = Array.isArray(parsed) ? baseStyles : parseStyles((parsed as Record<string, unknown>).styles, baseStyles);
  return { design: { version: 1, styles, blocks } };
}

/** Instructions for an AI chat agent to produce content this dialog can import. Shown verbatim in the Import dialog. */
export const AI_IMPORT_GUIDE = `You are formatting content for a drag-and-drop email template editor. Reply with ONLY a single JSON object — no markdown code fences, no commentary before or after.

Shape:
{
  "blocks": [ ...block objects, in the order they should appear... ],
  "styles": { ...optional, see below... }
}

Each block is one of the following object shapes (only "type" and the fields listed are read; omit a field to use its default):

heading   { "type": "heading", "text": "...", "level": 1|2|3, "align": "left|center|right", "color": "#hex (optional)" }
paragraph { "type": "paragraph", "text": "...", "align": "left|center|right", "color": "#hex (optional)", "fontSize": number (optional) }
           - "text" may include simple inline HTML: <b>, <i>, <u>, <a href="...">, <br>. Anything else is stripped.
list      { "type": "list", "style": "bullet|number", "items": ["...", "..."], "align": "left|center|right", "color": "#hex (optional)" }
image     { "type": "image", "src": "https://...", "alt": "...", "href": "https://... (optional link)", "width": number (optional px), "align": "left|center|right" }
button    { "type": "button", "text": "...", "href": "https://...", "align": "left|center|right", "bgColor": "#hex", "textColor": "#hex" }
divider   { "type": "divider", "color": "#hex" }
spacer    { "type": "spacer", "height": number (px) }

Personalization: use double-curly merge tags in any "text"/"items" field — ${MERGE_VARIABLES.map((v) => `{{${v}}}`).join(", ")} — they're substituted per recipient when the email is sent.

Optional "styles" object (omit fields to keep the template's current styling):
{
  "backgroundColor": "#hex",
  "contentBackgroundColor": "#hex",
  "contentWidth": number (px, e.g. 600),
  "fontFamily": "sans|serif|mono|trebuchet|verdana",
  "textColor": "#hex",
  "linkColor": "#hex",
  "borderRadius": number (px)
}

Example:
{
  "blocks": [
    { "type": "heading", "text": "Hi {{first_name}}, welcome aboard!", "level": 1, "align": "left" },
    { "type": "paragraph", "text": "Thanks for joining <b>{{agency_name}}</b>. We're excited to have you.", "align": "left" },
    { "type": "button", "text": "Get started", "href": "https://example.com", "align": "left", "bgColor": "#18181b", "textColor": "#ffffff" }
  ]
}`;
