// Structured representation for the drag-and-drop email designer.
// Stored as JSON on emailTemplates.design / campaigns.design (nullable —
// rows created before the designer existed simply have design: null and
// keep using the legacy plain-text subject/body path).

export type EmailBlockAlign = "left" | "center" | "right";

export type HeadingBlock = {
  id: string;
  type: "heading";
  text: string;
  level: 1 | 2 | 3;
  align: EmailBlockAlign;
  color?: string;
};

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: string;
  align: EmailBlockAlign;
  color?: string;
  fontSize?: number;
};

export type ListBlock = {
  id: string;
  type: "list";
  style: "bullet" | "number";
  items: string[];
  align: EmailBlockAlign;
  color?: string;
};

export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  href?: string;
  width?: number;
  align: EmailBlockAlign;
};

export type ButtonBlock = {
  id: string;
  type: "button";
  text: string;
  href: string;
  align: EmailBlockAlign;
  bgColor: string;
  textColor: string;
};

export type DividerBlock = {
  id: string;
  type: "divider";
  color: string;
};

export type SpacerBlock = {
  id: string;
  type: "spacer";
  height: number;
};

export type EmailBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock;

export type EmailBlockType = EmailBlock["type"];

export const FONT_STACKS = {
  sans: { label: "Sans-serif", css: "Helvetica, Arial, sans-serif" },
  serif: { label: "Serif", css: "Georgia, 'Times New Roman', serif" },
  mono: { label: "Monospace", css: "'Courier New', Courier, monospace" },
  trebuchet: { label: "Trebuchet", css: "'Trebuchet MS', Helvetica, sans-serif" },
  verdana: { label: "Verdana", css: "Verdana, Geneva, sans-serif" },
} as const;

export type FontStackKey = keyof typeof FONT_STACKS;

export type EmailDesignStyles = {
  backgroundColor: string;
  contentBackgroundColor: string;
  contentWidth: number;
  fontFamily: FontStackKey;
  textColor: string;
  linkColor: string;
  borderRadius: number;
};

export type EmailDesign = {
  version: 1;
  styles: EmailDesignStyles;
  blocks: EmailBlock[];
};
