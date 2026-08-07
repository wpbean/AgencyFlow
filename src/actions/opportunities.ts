"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { opportunitySchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { OPPORTUNITY_STAGES, type OpportunityStage } from "@/db/schema";
import type { ActionState } from "./agencies";

export async function createOpportunityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await db
    .insert(opportunities)
    .values({
      agencyId: data.agencyId,
      contactId: data.contactId || null,
      title: data.title,
      description: data.description,
      type: data.type,
      stage: data.stage,
      expectedRate: data.expectedRate ?? null,
      currency: data.currency,
      expectedHours: data.expectedHours ?? null,
      probability: data.probability,
      nextAction: data.nextAction,
      nextActionDate: data.nextActionDate ?? null,
      notes: data.notes,
    });

  await logActivity({ agencyId: data.agencyId, type: "OPPORTUNITY_CREATED", title: `Opportunity created: ${data.title}` });

  revalidatePath("/opportunities");
  revalidatePath(`/agencies/${data.agencyId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function updateOpportunityAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const [existing] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  if (!existing) return { error: "Opportunity not found." };

  await db
    .update(opportunities)
    .set({
      title: data.title,
      description: data.description,
      type: data.type,
      stage: data.stage,
      expectedRate: data.expectedRate ?? null,
      currency: data.currency,
      expectedHours: data.expectedHours ?? null,
      probability: data.probability,
      nextAction: data.nextAction,
      nextActionDate: data.nextActionDate ?? null,
      notes: data.notes,
      updatedAt: new Date(),
    })
    .where(eq(opportunities.id, id));

  if (existing.stage !== data.stage) {
    await logActivity({
      agencyId: data.agencyId,
      type: "OPPORTUNITY_STAGE_CHANGED",
      title: `Opportunity moved to ${data.stage}`,
      description: existing.title,
    });
  }

  revalidatePath("/opportunities");
  revalidatePath(`/agencies/${data.agencyId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function updateOpportunityStageAction(id: string, stage: OpportunityStage) {
  if (!OPPORTUNITY_STAGES.includes(stage)) return;
  const [existing] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  if (!existing || existing.stage === stage) return;

  await db.update(opportunities).set({ stage, updatedAt: new Date() }).where(eq(opportunities.id, id));

  await logActivity({
    agencyId: existing.agencyId,
    type: "OPPORTUNITY_STAGE_CHANGED",
    title: `Opportunity moved to ${stage}`,
    description: existing.title,
  });

  revalidatePath("/opportunities");
  revalidatePath(`/agencies/${existing.agencyId}`);
  revalidatePath("/dashboard");
}

export async function deleteOpportunityAction(id: string) {
  const [existing] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  if (!existing) return;
  await db.delete(opportunities).where(eq(opportunities.id, id));
  revalidatePath("/opportunities");
  revalidatePath(`/agencies/${existing.agencyId}`);
}
