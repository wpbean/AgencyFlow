import type {
  AgencyStatus,
  Priority,
  OpportunityStage,
  OpportunityType,
  ProjectStatus,
  OutreachStatus,
  OutreachType,
  FollowUpStatus,
  TemplateCategory,
  CampaignStatus,
  CampaignRecipientStatus,
} from "@/db/schema";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

function title(s: string) {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const AGENCY_STATUS_META: Record<AgencyStatus, { label: string; tone: Tone }> = {
  NEW: { label: "New", tone: "info" },
  QUALIFIED: { label: "Qualified", tone: "info" },
  CONTACTED: { label: "Contacted", tone: "primary" },
  FOLLOW_UP: { label: "Follow-up", tone: "warning" },
  REPLIED: { label: "Replied", tone: "primary" },
  INTERESTED: { label: "Interested", tone: "success" },
  INTERVIEW: { label: "Interview", tone: "success" },
  TRIAL: { label: "Trial", tone: "success" },
  PROJECT: { label: "Project", tone: "success" },
  CLIENT: { label: "Client", tone: "success" },
  NOT_INTERESTED: { label: "Not Interested", tone: "neutral" },
  REJECTED: { label: "Rejected", tone: "danger" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export const PRIORITY_META: Record<Priority, { label: string; tone: Tone }> = {
  LOW: { label: "Low", tone: "neutral" },
  MEDIUM: { label: "Medium", tone: "warning" },
  HIGH: { label: "High", tone: "danger" },
};

export const OPPORTUNITY_STAGE_META: Record<OpportunityStage, { label: string; tone: Tone }> = {
  INTERESTED: { label: "Interested", tone: "info" },
  DISCOVERY: { label: "Discovery", tone: "info" },
  INTERVIEW: { label: "Interview", tone: "primary" },
  TECHNICAL_TEST: { label: "Technical Test", tone: "primary" },
  TRIAL: { label: "Trial", tone: "warning" },
  NEGOTIATION: { label: "Negotiation", tone: "warning" },
  WON: { label: "Won", tone: "success" },
  LOST: { label: "Lost", tone: "danger" },
};

export const OPPORTUNITY_TYPE_META: Record<OpportunityType, { label: string }> = {
  LONG_TERM_CONTRACT: { label: "Long-term Contract" },
  PART_TIME: { label: "Part-time" },
  FULL_TIME: { label: "Full-time" },
  PROJECT: { label: "Project" },
  MAINTENANCE: { label: "Maintenance" },
  FREELANCE: { label: "Freelance" },
  TRIAL: { label: "Trial" },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; tone: Tone }> = {
  PLANNED: { label: "Planned", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  ON_HOLD: { label: "On Hold", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "primary" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const OUTREACH_STATUS_META: Record<OutreachStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SCHEDULED: { label: "Scheduled", tone: "info" },
  SENT: { label: "Sent", tone: "primary" },
  REPLIED: { label: "Replied", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const OUTREACH_TYPE_META: Record<OutreachType, { label: string }> = {
  INITIAL: { label: "Initial" },
  FOLLOW_UP_1: { label: "Follow-up #1" },
  FOLLOW_UP_2: { label: "Follow-up #2" },
  FOLLOW_UP_3: { label: "Follow-up #3" },
  FINAL_FOLLOW_UP: { label: "Final Follow-up" },
  OTHER: { label: "Other" },
};

export const FOLLOW_UP_STATUS_META: Record<FollowUpStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "success" },
  SKIPPED: { label: "Skipped", tone: "neutral" },
};

export const TEMPLATE_CATEGORY_META: Record<TemplateCategory, { label: string }> = {
  INITIAL_OUTREACH: { label: "Initial Outreach" },
  FOLLOW_UP_1: { label: "Follow-up #1" },
  FOLLOW_UP_2: { label: "Follow-up #2" },
  FINAL_FOLLOW_UP: { label: "Final Follow-up" },
  GENERAL: { label: "General" },
  INTERESTED: { label: "Interested" },
  PROJECT_DISCUSSION: { label: "Project Discussion" },
};

export const CAMPAIGN_STATUS_META: Record<CampaignStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SENDING: { label: "Sending", tone: "info" },
  SENT: { label: "Sent", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export const CAMPAIGN_RECIPIENT_STATUS_META: Record<CampaignRecipientStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "neutral" },
  SENT: { label: "Sent", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  SKIPPED: { label: "Skipped", tone: "warning" },
};

export { title as toTitleCase };
