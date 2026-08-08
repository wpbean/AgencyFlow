import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import type { EmailDesign } from "../lib/email/design-types";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => nanoid());

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

// ---------------------------------------------------------------------------
// Enums (as string unions, enforced at the application layer via Zod)
// ---------------------------------------------------------------------------

export const AGENCY_STATUSES = [
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "FOLLOW_UP",
  "REPLIED",
  "INTERESTED",
  "INTERVIEW",
  "TRIAL",
  "PROJECT",
  "CLIENT",
  "NOT_INTERESTED",
  "REJECTED",
  "CLOSED",
] as const;
export type AgencyStatus = (typeof AGENCY_STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const OUTREACH_TYPES = [
  "INITIAL",
  "FOLLOW_UP_1",
  "FOLLOW_UP_2",
  "FOLLOW_UP_3",
  "FINAL_FOLLOW_UP",
  "OTHER",
] as const;
export type OutreachType = (typeof OUTREACH_TYPES)[number];

export const OUTREACH_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "SENT",
  "REPLIED",
  "CANCELLED",
] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const FOLLOW_UP_STATUSES = [
  "PENDING",
  "COMPLETED",
  "SKIPPED",
] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export const TEMPLATE_CATEGORIES = [
  "INITIAL_OUTREACH",
  "FOLLOW_UP_1",
  "FOLLOW_UP_2",
  "FINAL_FOLLOW_UP",
  "GENERAL",
  "INTERESTED",
  "PROJECT_DISCUSSION",
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const OPPORTUNITY_TYPES = [
  "LONG_TERM_CONTRACT",
  "PART_TIME",
  "FULL_TIME",
  "PROJECT",
  "MAINTENANCE",
  "FREELANCE",
  "TRIAL",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_STAGES = [
  "INTERESTED",
  "DISCOVERY",
  "INTERVIEW",
  "TECHNICAL_TEST",
  "TRIAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const PROJECT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ACTIVITY_TYPES = [
  "AGENCY_CREATED",
  "CONTACT_ADDED",
  "EMAIL_SENT",
  "FOLLOW_UP_SCHEDULED",
  "FOLLOW_UP_COMPLETED",
  "REPLY_RECEIVED",
  "STATUS_CHANGED",
  "OPPORTUNITY_CREATED",
  "OPPORTUNITY_STAGE_CHANGED",
  "INTERVIEW",
  "TRIAL_STARTED",
  "PROJECT_CREATED",
  "PROJECT_COMPLETED",
  "NOTE_ADDED",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// ---------------------------------------------------------------------------
// Agencies
// ---------------------------------------------------------------------------

export const agencies = sqliteTable(
  "agencies",
  {
    id: id(),
    name: text("name").notNull(),
    website: text("website"),
    country: text("country"),
    city: text("city"),
    timezone: text("timezone"),
    companySize: text("company_size"),
    description: text("description"),
    services: text("services", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    technologies: text("technologies", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    source: text("source"),
    status: text("status").$type<AgencyStatus>().notNull().default("NEW"),
    leadScore: integer("lead_score").notNull().default(0),
    leadScoreOverride: integer("lead_score_override"),
    priority: text("priority").$type<Priority>().notNull().default("MEDIUM"),
    notes: text("notes"),
    lastContactAt: integer("last_contact_at", { mode: "timestamp" }),
    nextFollowUpAt: integer("next_follow_up_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    index("agencies_status_idx").on(t.status),
    index("agencies_country_idx").on(t.country),
    index("agencies_website_idx").on(t.website),
    index("agencies_lead_score_idx").on(t.leadScore),
    index("agencies_created_at_idx").on(t.createdAt),
    index("agencies_priority_idx").on(t.priority),
    index("agencies_source_idx").on(t.source),
  ]
);

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const contacts = sqliteTable(
  "contacts",
  {
    id: id(),
    agencyId: text("agency_id").references(() => agencies.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    jobTitle: text("job_title"),
    linkedinUrl: text("linkedin_url"),
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    source: text("source"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("contacts_agency_id_idx").on(t.agencyId),
    index("contacts_email_idx").on(t.email),
    index("contacts_source_idx").on(t.source),
  ]
);

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

export const emailTemplates = sqliteTable("email_templates", {
  id: id(),
  name: text("name").notNull(),
  category: text("category").$type<TemplateCategory>().notNull().default("GENERAL"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  // Visual designer document. Null for templates created before the designer
  // existed (or never opened in it) — those keep using `body` as plain text.
  design: text("design", { mode: "json" }).$type<EmailDesign>(),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// Outreach
// ---------------------------------------------------------------------------

export const outreach = sqliteTable(
  "outreach",
  {
    id: id(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    templateId: text("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
    type: text("type").$type<OutreachType>().notNull().default("INITIAL"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: text("status").$type<OutreachStatus>().notNull().default("DRAFT"),
    sentAt: integer("sent_at", { mode: "timestamp" }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("outreach_agency_id_idx").on(t.agencyId),
    index("outreach_sent_at_idx").on(t.sentAt),
    index("outreach_status_idx").on(t.status),
  ]
);

// ---------------------------------------------------------------------------
// Follow-ups
// ---------------------------------------------------------------------------

export const followUps = sqliteTable(
  "follow_ups",
  {
    id: id(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    outreachId: text("outreach_id").references(() => outreach.id, { onDelete: "set null" }),
    templateId: text("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
    type: text("type").$type<OutreachType>().notNull().default("FOLLOW_UP_1"),
    dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
    status: text("status").$type<FollowUpStatus>().notNull().default("PENDING"),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("follow_ups_due_date_idx").on(t.dueDate),
    index("follow_ups_status_idx").on(t.status),
    index("follow_ups_agency_id_idx").on(t.agencyId),
  ]
);

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export const opportunities = sqliteTable(
  "opportunities",
  {
    id: id(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").$type<OpportunityType>().notNull().default("PROJECT"),
    stage: text("stage").$type<OpportunityStage>().notNull().default("INTERESTED"),
    expectedRate: real("expected_rate"),
    currency: text("currency").notNull().default("USD"),
    expectedHours: real("expected_hours"),
    probability: integer("probability").notNull().default(50),
    nextAction: text("next_action"),
    nextActionDate: integer("next_action_date", { mode: "timestamp" }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("opportunities_stage_idx").on(t.stage),
    index("opportunities_agency_id_idx").on(t.agencyId),
  ]
);

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projects = sqliteTable(
  "projects",
  {
    id: id(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    opportunityId: text("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").$type<ProjectStatus>().notNull().default("PLANNED"),
    startDate: integer("start_date", { mode: "timestamp" }),
    endDate: integer("end_date", { mode: "timestamp" }),
    hourlyRate: real("hourly_rate"),
    currency: text("currency").notNull().default("USD"),
    estimatedHours: real("estimated_hours"),
    actualHours: real("actual_hours"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("projects_agency_id_idx").on(t.agencyId),
    index("projects_status_idx").on(t.status),
  ]
);

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export const activities = sqliteTable(
  "activities",
  {
    id: id(),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    type: text("type").$type<ActivityType>().notNull(),
    title: text("title").notNull(),
    description: text("description"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("activities_agency_id_idx").on(t.agencyId),
    index("activities_created_at_idx").on(t.createdAt),
  ]
);

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export const tags = sqliteTable("tags", {
  id: id(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("gray"),
});

export const agencyTags = sqliteTable(
  "agency_tags",
  {
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.agencyId, t.tagId] }),
    index("agency_tags_tag_id_idx").on(t.tagId),
  ]
);

// ---------------------------------------------------------------------------
// Settings (simple key/value store)
// ---------------------------------------------------------------------------

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
});

// ---------------------------------------------------------------------------
// Easy Digital Downloads integration
// ---------------------------------------------------------------------------

export const EDD_SYNC_STATUSES = ["idle", "syncing", "success", "error"] as const;
export type EddSyncStatus = (typeof EDD_SYNC_STATUSES)[number];

// Singleton row, always keyed "default" — see EDD_INTEGRATION_ROW_ID in lib/edd.
export const eddIntegration = sqliteTable("edd_integration", {
  id: text("id").primaryKey(),
  siteUrl: text("site_url"),
  apiKey: text("api_key"),
  apiToken: text("api_token"),
  connected: integer("connected", { mode: "boolean" }).notNull().default(false),
  syncStatus: text("sync_status").$type<EddSyncStatus>().notNull().default("idle"),
  syncError: text("sync_error"),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  lastSyncStats: text("last_sync_stats", { mode: "json" }).$type<{
    products: number;
    customers: number;
    orders: number;
  }>(),
  // Truncated raw API responses captured on the last sync, for diagnosing shape mismatches
  // against a specific site's EDD version without needing server log access.
  lastSyncDebug: text("last_sync_debug", { mode: "json" }).$type<{
    customersSample?: string;
    salesSample?: string;
  }>(),
  ...timestamps,
});

export const eddProducts = sqliteTable("edd_products", {
  id: text("id").primaryKey(), // EDD download post ID
  name: text("name").notNull(),
  price: real("price"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const eddCustomers = sqliteTable(
  "edd_customers",
  {
    id: id(),
    eddCustomerId: integer("edd_customer_id").notNull().unique(),
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email").notNull(),
    purchaseCount: integer("purchase_count").notNull().default(0),
    purchaseValue: real("purchase_value").notNull().default(0),
    dateCreated: integer("date_created", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    index("edd_customers_email_idx").on(t.email),
    index("edd_customers_contact_id_idx").on(t.contactId),
  ]
);

export const eddCustomerProducts = sqliteTable(
  "edd_customer_products",
  {
    eddCustomerId: text("edd_customer_id")
      .notNull()
      .references(() => eddCustomers.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => eddProducts.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.eddCustomerId, t.productId] }),
    index("edd_customer_products_product_id_idx").on(t.productId),
  ]
);

// ---------------------------------------------------------------------------
// Campaigns (bulk email blasts to Contacts / EDD Customers, sent via Resend)
// ---------------------------------------------------------------------------

export const CAMPAIGN_STATUSES = ["DRAFT", "SENDING", "SENT", "FAILED"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_RECIPIENT_SOURCES = ["CONTACT", "EDD_CUSTOMER"] as const;
export type CampaignRecipientSource = (typeof CAMPAIGN_RECIPIENT_SOURCES)[number];

export const CAMPAIGN_RECIPIENT_STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const;
export type CampaignRecipientStatus = (typeof CAMPAIGN_RECIPIENT_STATUSES)[number];

export const campaigns = sqliteTable("campaigns", {
  id: id(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  design: text("design", { mode: "json" }).$type<EmailDesign>(),
  status: text("status").$type<CampaignStatus>().notNull().default("DRAFT"),
  fromName: text("from_name"),
  fromEmail: text("from_email"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  ...timestamps,
});

export const campaignRecipients = sqliteTable(
  "campaign_recipients",
  {
    id: id(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    source: text("source").$type<CampaignRecipientSource>().notNull(),
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    eddCustomerId: text("edd_customer_id").references(() => eddCustomers.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    status: text("status").$type<CampaignRecipientStatus>().notNull().default("PENDING"),
    error: text("error"),
    resendMessageId: text("resend_message_id"),
    sentAt: integer("sent_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("campaign_recipients_campaign_id_idx").on(t.campaignId),
    index("campaign_recipients_status_idx").on(t.status),
    uniqueIndex("campaign_recipients_campaign_email_idx").on(t.campaignId, t.email),
  ]
);

// Global unsubscribe list, keyed by email — checked before sending any campaign
// so someone who opts out of one campaign never receives another.
export const emailSuppressions = sqliteTable("email_suppressions", {
  email: text("email").primaryKey(),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------------------------------------------------------------------------
// Inbox (conversations + messages) — replies to sent campaigns, correlated
// back to the campaign recipient / contact that triggered them where possible.
// ---------------------------------------------------------------------------

export const CONVERSATION_LINK_STATUSES = ["LINKED", "UNLINKED"] as const;
export type ConversationLinkStatus = (typeof CONVERSATION_LINK_STATUSES)[number];

export const CORRELATION_METHODS = ["MESSAGE_ID", "RECIPIENT_EMAIL", "CONTACT_EMAIL", "NONE"] as const;
export type CorrelationMethod = (typeof CORRELATION_METHODS)[number];

export const MESSAGE_DIRECTIONS = ["INBOUND", "OUTBOUND"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_STATUSES = ["RECEIVED", "SENT", "FAILED"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const conversations = sqliteTable(
  "conversations",
  {
    id: id(),
    campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    campaignRecipientId: text("campaign_recipient_id").references(() => campaignRecipients.id, {
      onDelete: "set null",
    }),
    contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    eddCustomerId: text("edd_customer_id").references(() => eddCustomers.id, { onDelete: "set null" }),
    participantEmail: text("participant_email").notNull(),
    participantName: text("participant_name"),
    subject: text("subject").notNull(),
    linkStatus: text("link_status").$type<ConversationLinkStatus>().notNull().default("UNLINKED"),
    correlationMethod: text("correlation_method").$type<CorrelationMethod>().notNull().default("NONE"),
    isUnread: integer("is_unread", { mode: "boolean" }).notNull().default(true),
    lastMessageAt: integer("last_message_at", { mode: "timestamp" }).notNull(),
    lastMessagePreview: text("last_message_preview"),
    ...timestamps,
  },
  (t) => [
    index("conversations_campaign_id_idx").on(t.campaignId),
    index("conversations_contact_id_idx").on(t.contactId),
    index("conversations_participant_email_idx").on(t.participantEmail),
    index("conversations_last_message_at_idx").on(t.lastMessageAt),
    index("conversations_is_unread_idx").on(t.isUnread),
  ]
);

export const messages = sqliteTable(
  "messages",
  {
    id: id(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    direction: text("direction").$type<MessageDirection>().notNull(),
    status: text("status").$type<MessageStatus>().notNull(),
    fromEmail: text("from_email").notNull(),
    fromName: text("from_name"),
    toEmail: text("to_email").notNull(),
    subject: text("subject"),
    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    // Resend's inbound receiving id, or the id returned from an outbound send/batch call.
    resendEmailId: text("resend_email_id"),
    messageIdHeader: text("message_id_header"),
    inReplyToHeader: text("in_reply_to_header"),
    error: text("error"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("messages_conversation_id_idx").on(t.conversationId),
    // Dedupes at-least-once webhook redelivery of the same inbound email.
    uniqueIndex("messages_resend_email_id_idx").on(t.resendEmailId),
    index("messages_created_at_idx").on(t.createdAt),
  ]
);

export const messageAttachments = sqliteTable(
  "message_attachments",
  {
    id: id(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    filename: text("filename"),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    // Set when the attachment is referenced inline in the HTML body via `cid:`.
    contentId: text("content_id"),
    isInline: integer("is_inline", { mode: "boolean" }).notNull().default(false),
    // Path to the saved file, relative to the attachments storage root.
    storagePath: text("storage_path").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("message_attachments_message_id_idx").on(t.messageId)]
);
