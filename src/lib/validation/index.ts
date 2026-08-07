import { z } from "zod";
import {
  AGENCY_STATUSES,
  PRIORITIES,
  OUTREACH_TYPES,
  OUTREACH_STATUSES,
  FOLLOW_UP_STATUSES,
  TEMPLATE_CATEGORIES,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_STAGES,
  PROJECT_STATUSES,
} from "@/db/schema";
import { FONT_STACKS } from "@/lib/email/design-types";

const blockAlign = z.enum(["left", "center", "right"]);

const emailBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("heading"),
    text: z.string().max(2000),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    align: blockAlign,
    color: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("paragraph"),
    text: z.string().max(5000),
    align: blockAlign,
    color: z.string().optional(),
    fontSize: z.number().min(8).max(72).optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("list"),
    style: z.enum(["bullet", "number"]),
    items: z.array(z.string().max(1000)).max(50),
    align: blockAlign,
    color: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("image"),
    src: z.string().max(2000),
    alt: z.string().max(300),
    href: z.string().max(2000).optional(),
    width: z.number().min(1).max(2000).optional(),
    align: blockAlign,
  }),
  z.object({
    id: z.string(),
    type: z.literal("button"),
    text: z.string().max(200),
    href: z.string().max(2000),
    align: blockAlign,
    bgColor: z.string(),
    textColor: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("divider"),
    color: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("spacer"),
    height: z.number().min(0).max(400),
  }),
]);

export const emailDesignSchema = z.object({
  version: z.literal(1),
  styles: z.object({
    backgroundColor: z.string(),
    contentBackgroundColor: z.string(),
    contentWidth: z.number().min(300).max(900),
    fontFamily: z.enum(Object.keys(FONT_STACKS) as [keyof typeof FONT_STACKS, ...(keyof typeof FONT_STACKS)[]]),
    textColor: z.string(),
    linkColor: z.string(),
    borderRadius: z.number().min(0).max(60),
  }),
  blocks: z.array(emailBlockSchema).max(100),
});

const optionalUrl = z.union([z.literal(""), z.string().trim().url("Enter a valid URL")]).optional();
const optionalEmail = z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional();
const optionalString = z.string().max(5000).optional();

export const agencySchema = z.object({
  name: z.string().trim().min(1, "Agency name is required").max(200),
  website: optionalUrl,
  country: optionalString,
  city: optionalString,
  timezone: optionalString,
  companySize: optionalString,
  description: optionalString,
  services: z.array(z.string()),
  technologies: z.array(z.string()),
  source: optionalString,
  status: z.enum(AGENCY_STATUSES),
  priority: z.enum(PRIORITIES),
  notes: optionalString,
  leadScoreOverride: z.number().int().min(0).max(100).optional().nullable(),
});
export type AgencyInput = z.infer<typeof agencySchema>;

export const quickAgencySchema = agencySchema.extend({
  contactFirstName: optionalString,
  contactLastName: optionalString,
  contactEmail: optionalEmail,
  contactJobTitle: optionalString,
  tags: z.array(z.string()),
});
export type QuickAgencyInput = z.infer<typeof quickAgencySchema>;

export const contactSchema = z.object({
  agencyId: z.string().optional().nullable(),
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: optionalString,
  email: optionalEmail,
  phone: optionalString,
  jobTitle: optionalString,
  linkedinUrl: optionalUrl,
  isPrimary: z.boolean(),
  source: optionalString,
  notes: optionalString,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const emailTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(200),
  category: z.enum(TEMPLATE_CATEGORIES),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  body: z.string().trim().min(1, "Body is required").max(20000),
  design: emailDesignSchema.nullable().optional(),
});
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;

export const outreachSchema = z.object({
  agencyId: z.string().min(1),
  contactId: z.string().min(1).optional().nullable(),
  templateId: z.string().min(1).optional().nullable(),
  type: z.enum(OUTREACH_TYPES),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(20000),
  status: z.enum(OUTREACH_STATUSES),
});
export type OutreachInput = z.infer<typeof outreachSchema>;

export const followUpSchema = z.object({
  agencyId: z.string().min(1),
  contactId: z.string().min(1).optional().nullable(),
  outreachId: z.string().min(1).optional().nullable(),
  templateId: z.string().min(1).optional().nullable(),
  type: z.enum(OUTREACH_TYPES),
  dueDate: z.coerce.date(),
  notes: optionalString,
});
export type FollowUpInput = z.infer<typeof followUpSchema>;

export const followUpStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(FOLLOW_UP_STATUSES),
});

export const opportunitySchema = z.object({
  agencyId: z.string().min(1),
  contactId: z.string().min(1).optional().nullable(),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalString,
  type: z.enum(OPPORTUNITY_TYPES),
  stage: z.enum(OPPORTUNITY_STAGES),
  expectedRate: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().trim().max(10),
  expectedHours: z.coerce.number().min(0).optional().nullable(),
  probability: z.coerce.number().int().min(0).max(100),
  nextAction: optionalString,
  nextActionDate: z.coerce.date().optional().nullable(),
  notes: optionalString,
});
export type OpportunityInput = z.infer<typeof opportunitySchema>;

export const projectSchema = z.object({
  agencyId: z.string().min(1),
  opportunityId: z.string().min(1).optional().nullable(),
  name: z.string().trim().min(1, "Project name is required").max(200),
  description: optionalString,
  status: z.enum(PROJECT_STATUSES),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  hourlyRate: z.coerce.number().min(0).optional().nullable(),
  currency: z.string().trim().max(10),
  estimatedHours: z.coerce.number().min(0).optional().nullable(),
  actualHours: z.coerce.number().min(0).optional().nullable(),
  notes: optionalString,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required").max(200),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  body: z.string().trim().min(1, "Body is required").max(20000),
  design: emailDesignSchema.nullable().optional(),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

export const campaignSenderSchema = z.object({
  campaignFromName: z.string().trim().min(1, "From name is required").max(200),
  campaignFromEmail: z.string().trim().email("Enter a valid email"),
  campaignReplyTo: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
});
export type CampaignSenderInput = z.infer<typeof campaignSenderSchema>;
