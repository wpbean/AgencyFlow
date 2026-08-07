import { createBlockId } from "./render-design";
import type { EmailBlock, EmailDesign, EmailDesignStyles } from "./design-types";

export type StarterTemplate = {
  id: string;
  name: string;
  description: string;
  design: EmailDesign;
};

function styles(overrides: Partial<EmailDesignStyles>): EmailDesignStyles {
  return {
    backgroundColor: "#f4f4f5",
    contentBackgroundColor: "#ffffff",
    contentWidth: 600,
    fontFamily: "sans",
    textColor: "#18181b",
    linkColor: "#2563eb",
    borderRadius: 8,
    ...overrides,
  };
}

function heading(text: string, opts: Partial<Extract<EmailBlock, { type: "heading" }>> = {}): EmailBlock {
  return { id: createBlockId(), type: "heading", text, level: 1, align: "left", ...opts };
}

function paragraph(text: string, opts: Partial<Extract<EmailBlock, { type: "paragraph" }>> = {}): EmailBlock {
  return { id: createBlockId(), type: "paragraph", text, align: "left", ...opts };
}

function list(items: string[], opts: Partial<Extract<EmailBlock, { type: "list" }>> = {}): EmailBlock {
  return { id: createBlockId(), type: "list", style: "bullet", items, align: "left", ...opts };
}

function button(text: string, href: string, opts: Partial<Extract<EmailBlock, { type: "button" }>> = {}): EmailBlock {
  return { id: createBlockId(), type: "button", text, href, align: "left", bgColor: "#18181b", textColor: "#ffffff", ...opts };
}

function image(src: string, alt: string, opts: Partial<Extract<EmailBlock, { type: "image" }>> = {}): EmailBlock {
  return { id: createBlockId(), type: "image", src, alt, align: "center", ...opts };
}

function divider(opts: Partial<Extract<EmailBlock, { type: "divider" }>> = {}): EmailBlock {
  return { id: createBlockId(), type: "divider", color: "#e4e4e7", ...opts };
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "simple-announcement",
    name: "Simple Announcement",
    description: "A clean, centered layout for a short update or news item.",
    design: {
      version: 1,
      styles: styles({ backgroundColor: "#f4f4f5", contentBackgroundColor: "#ffffff" }),
      blocks: [
        heading("We've got some news", { align: "center" }),
        paragraph(
          "Hi {{first_name}}, we wanted to give you a quick heads up about something new we've been working on.",
          { align: "center" }
        ),
        button("Read More", "https://example.com", { align: "center", bgColor: "#2563eb", textColor: "#ffffff" }),
      ],
    },
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "A multi-section layout for a regular digest or roundup.",
    design: {
      version: 1,
      styles: styles({ backgroundColor: "#eff6ff", contentBackgroundColor: "#ffffff", linkColor: "#1d4ed8" }),
      blocks: [
        heading("This Week's Newsletter"),
        paragraph("Hi {{first_name}}, here's what's new this week."),
        divider(),
        heading("Top Story", { level: 3 }),
        paragraph("A short summary of your top story goes here. Keep it brief and link out for the full read."),
        list(["Highlight one", "Highlight two", "Highlight three"]),
        button("Read the Full Newsletter", "https://example.com", { bgColor: "#1d4ed8", textColor: "#ffffff" }),
      ],
    },
  },
  {
    id: "product-promo",
    name: "Product Promo",
    description: "Bold, dark theme built to spotlight a product with an image and CTA.",
    design: {
      version: 1,
      styles: styles({
        backgroundColor: "#111827",
        contentBackgroundColor: "#1f2937",
        textColor: "#f9fafb",
        linkColor: "#fbbf24",
      }),
      blocks: [
        image("https://placehold.co/600x300/1f2937/ffffff?text=Your+Product", "Product preview", { width: 536 }),
        heading("Introducing Something New", { align: "center", color: "#f9fafb" }),
        paragraph("Hi {{first_name}}, check out our latest release — built for people like you.", {
          align: "center",
          color: "#d1d5db",
        }),
        button("Shop Now", "https://example.com", { align: "center", bgColor: "#fbbf24", textColor: "#111827" }),
      ],
    },
  },
  {
    id: "event-invite",
    name: "Event Invite",
    description: "A soft, friendly layout for an event invitation with details and RSVP.",
    design: {
      version: 1,
      styles: styles({ backgroundColor: "#fdf4ff", contentBackgroundColor: "#ffffff", linkColor: "#a21caf" }),
      blocks: [
        heading("You're Invited", { align: "center" }),
        paragraph("Hi {{first_name}}, join us — we'd love to see you there.", { align: "center" }),
        list(["Date: TBD", "Time: TBD", "Location: TBD"], { align: "center" }),
        button("RSVP Now", "https://example.com", { align: "center", bgColor: "#a21caf", textColor: "#ffffff" }),
      ],
    },
  },
  {
    id: "welcome-email",
    name: "Welcome Email",
    description: "A friendly onboarding layout with a numbered getting-started list.",
    design: {
      version: 1,
      styles: styles({ backgroundColor: "#ecfdf5", contentBackgroundColor: "#ffffff", linkColor: "#059669" }),
      blocks: [
        heading("Welcome aboard, {{first_name}}!"),
        paragraph("We're excited to have you. Here's how to get started:"),
        list(["Set up your profile", "Explore the dashboard", "Invite your team"], { style: "number" }),
        button("Get Started", "https://example.com", { bgColor: "#059669", textColor: "#ffffff" }),
      ],
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Plain and text-first — closest to a simple text email, just formatted.",
    design: {
      version: 1,
      styles: styles({ backgroundColor: "#ffffff", contentBackgroundColor: "#ffffff", borderRadius: 0 }),
      blocks: [
        heading("Subject line goes here", { level: 2 }),
        paragraph("Hi {{first_name}},\n\nWrite your message here."),
        button("Call to Action", "https://example.com", { bgColor: "#18181b", textColor: "#ffffff" }),
      ],
    },
  },
];
