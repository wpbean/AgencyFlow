"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { outreach, agencies } from "@/db/schema";
import { outreachSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { getSettings } from "@/lib/settings";
import { scheduleNextFollowUp } from "@/lib/follow-up-scheduler";
import type { ActionState } from "./agencies";

const CONTACTED_STATUSES = new Set(["NEW", "QUALIFIED"]);

export async function markOutreachSentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = outreachSchema.safeParse({ ...raw, status: "SENT" });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const now = new Date();

  const [record] = await db
    .insert(outreach)
    .values({
      agencyId: data.agencyId,
      contactId: data.contactId || null,
      templateId: data.templateId || null,
      type: data.type,
      subject: data.subject,
      body: data.body,
      status: "SENT",
      sentAt: now,
    })
    .returning();

  const [agency] = await db.select().from(agencies).where(eq(agencies.id, data.agencyId)).limit(1);
  if (agency) {
    const nextStatus = CONTACTED_STATUSES.has(agency.status)
      ? "CONTACTED"
      : data.type !== "INITIAL"
        ? "FOLLOW_UP"
        : agency.status;

    await db
      .update(agencies)
      .set({ lastContactAt: now, status: nextStatus, updatedAt: now })
      .where(eq(agencies.id, data.agencyId));
  }

  await logActivity({
    agencyId: data.agencyId,
    type: "EMAIL_SENT",
    title: `Email sent: ${data.subject}`,
    metadata: { outreachId: record.id, type: data.type },
  });

  const settings = await getSettings();
  await scheduleNextFollowUp({
    agencyId: data.agencyId,
    contactId: data.contactId,
    lastType: data.type,
    settings,
  });

  revalidatePath(`/agencies/${data.agencyId}`);
  revalidatePath("/agencies");
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return {};
}

export async function markOutreachRepliedAction(outreachId: string) {
  const [record] = await db.select().from(outreach).where(eq(outreach.id, outreachId)).limit(1);
  if (!record) return;

  await db.update(outreach).set({ status: "REPLIED" }).where(eq(outreach.id, outreachId));
  await db.update(agencies).set({ status: "REPLIED", updatedAt: new Date() }).where(eq(agencies.id, record.agencyId));

  await logActivity({ agencyId: record.agencyId, type: "REPLY_RECEIVED", title: "Reply received" });

  revalidatePath(`/agencies/${record.agencyId}`);
  revalidatePath("/agencies");
  revalidatePath("/dashboard");
}
