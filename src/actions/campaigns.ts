"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignRecipients, contacts, eddCustomers } from "@/db/schema";
import { campaignSchema } from "@/lib/validation";
import { getSettings } from "@/lib/settings";
import { sendCampaign } from "@/lib/email/send-campaign";
import { listContactsForExport, type ContactListFilters } from "@/db/queries/contacts";
import { listEddCustomersForExport, type EddCustomerListFilters } from "@/db/queries/edd-customers";
import type { ActionState } from "./agencies";

function parseCampaignFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const designRaw = formData.get("design");
  let design: unknown = null;
  if (typeof designRaw === "string" && designRaw) {
    try {
      design = JSON.parse(designRaw);
    } catch {
      design = null;
    }
  }
  return campaignSchema.safeParse({ ...raw, design });
}

export async function createCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseCampaignFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const settings = await getSettings();
  const [campaign] = await db
    .insert(campaigns)
    .values({
      ...parsed.data,
      fromName: settings.campaignFromName,
      fromEmail: settings.campaignFromEmail,
    })
    .returning();

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseCampaignFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.update(campaigns).set({ ...parsed.data, updatedAt: new Date() }).where(eq(campaigns.id, id));

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/campaigns");
  return {};
}

export async function updateCampaignSenderAction(id: string, fromName: string, fromEmail: string): Promise<ActionState> {
  if (!fromName.trim() || !fromEmail.trim()) {
    return { error: "From name and From email are required." };
  }

  await db.update(campaigns).set({ fromName: fromName.trim(), fromEmail: fromEmail.trim(), updatedAt: new Date() }).where(eq(campaigns.id, id));

  revalidatePath(`/campaigns/${id}`);
  return {};
}

export async function deleteCampaignAction(id: string) {
  await db.delete(campaigns).where(eq(campaigns.id, id));
  revalidatePath("/campaigns");
}

async function recountCampaign(campaignId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  await db.update(campaigns).set({ totalRecipients: count, updatedAt: new Date() }).where(eq(campaigns.id, campaignId));
}

type AudienceSource = "CONTACT" | "EDD_CUSTOMER";

export async function searchAudienceAction(
  source: AudienceSource,
  filters: ContactListFilters | EddCustomerListFilters
): Promise<{ id: string; firstName: string | null; lastName: string | null; email: string | null }[]> {
  if (source === "CONTACT") {
    const rows = await listContactsForExport({ ...(filters as ContactListFilters), hasEmail: true });
    return rows.slice(0, 500).map((r) => ({ id: r.id, firstName: r.firstName, lastName: r.lastName, email: r.email }));
  }

  const rows = await listEddCustomersForExport(filters as EddCustomerListFilters);
  return rows.slice(0, 500).map((r) => ({ id: r.id, firstName: r.firstName, lastName: r.lastName, email: r.email }));
}

type NewRecipient = {
  campaignId: string;
  source: AudienceSource;
  contactId: string | null;
  eddCustomerId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export async function addRecipientsAction(
  campaignId: string,
  source: AudienceSource,
  ids: string[]
): Promise<{ added: number }> {
  if (ids.length === 0) return { added: 0 };

  const values: NewRecipient[] = [];

  if (source === "CONTACT") {
    const rows = await db.select().from(contacts).where(inArray(contacts.id, ids));
    for (const r of rows) {
      if (!r.email?.trim()) continue;
      values.push({
        campaignId,
        source,
        contactId: r.id,
        eddCustomerId: null,
        email: r.email.trim().toLowerCase(),
        firstName: r.firstName,
        lastName: r.lastName,
      });
    }
  } else {
    const rows = await db.select().from(eddCustomers).where(inArray(eddCustomers.id, ids));
    for (const r of rows) {
      if (!r.email?.trim()) continue;
      values.push({
        campaignId,
        source,
        contactId: null,
        eddCustomerId: r.id,
        email: r.email.trim().toLowerCase(),
        firstName: r.firstName,
        lastName: r.lastName,
      });
    }
  }

  if (values.length === 0) return { added: 0 };

  await db.insert(campaignRecipients).values(values).onConflictDoNothing();
  await recountCampaign(campaignId);
  revalidatePath(`/campaigns/${campaignId}`);
  return { added: values.length };
}

export async function removeRecipientAction(recipientId: string, campaignId: string) {
  await db.delete(campaignRecipients).where(eq(campaignRecipients.id, recipientId));
  await recountCampaign(campaignId);
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function clearRecipientsAction(campaignId: string) {
  await db.delete(campaignRecipients).where(eq(campaignRecipients.campaignId, campaignId));
  await recountCampaign(campaignId);
  revalidatePath(`/campaigns/${campaignId}`);
}

export async function sendCampaignAction(campaignId: string): Promise<{ error?: string; sent?: number; failed?: number; skipped?: number }> {
  try {
    const result = await sendCampaign(campaignId);
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath("/campaigns");
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send campaign." };
  }
}

// Resets FAILED recipients back to PENDING so a failed campaign can be re-sent,
// then runs the normal send flow over them (and any still-PENDING recipients).
export async function retryCampaignAction(campaignId: string): Promise<{ error?: string; sent?: number; failed?: number; skipped?: number }> {
  try {
    await db
      .update(campaignRecipients)
      .set({ status: "PENDING", error: null })
      .where(and(eq(campaignRecipients.campaignId, campaignId), eq(campaignRecipients.status, "FAILED")));

    const result = await sendCampaign(campaignId);
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath("/campaigns");
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to retry campaign." };
  }
}

export async function duplicateCampaignAction(campaignId: string): Promise<{ id: string } | { error: string }> {
  const [original] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!original) return { error: "Campaign not found." };

  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  const [copy] = await db
    .insert(campaigns)
    .values({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      body: original.body,
      design: original.design,
      status: "DRAFT",
      fromName: original.fromName,
      fromEmail: original.fromEmail,
      totalRecipients: recipients.length,
    })
    .returning();

  if (recipients.length > 0) {
    await db.insert(campaignRecipients).values(
      recipients.map((r) => ({
        campaignId: copy.id,
        source: r.source,
        contactId: r.contactId,
        eddCustomerId: r.eddCustomerId,
        email: r.email,
        firstName: r.firstName,
        lastName: r.lastName,
      }))
    );
  }

  revalidatePath("/campaigns");
  return { id: copy.id };
}
