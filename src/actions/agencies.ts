"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { agencies, contacts, tags, agencyTags } from "@/db/schema";
import { agencySchema, quickAgencySchema } from "@/lib/validation";
import { calculateLeadScore } from "@/lib/scoring";
import { logActivity } from "@/lib/activity";
import { getSettings } from "@/lib/settings";
import { emptyToNull } from "@/lib/utils";

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

async function resolveTagIds(tagNames: string[]): Promise<string[]> {
  if (!tagNames.length) return [];
  const clean = [...new Set(tagNames.map((t) => t.trim()).filter(Boolean))];
  if (!clean.length) return [];

  const existing = await db.select().from(tags).where(inArray(tags.name, clean));
  const existingNames = new Set(existing.map((t) => t.name));
  const toCreate = clean.filter((n) => !existingNames.has(n));

  const created = toCreate.length
    ? await db.insert(tags).values(toCreate.map((name) => ({ name }))).returning()
    : [];

  return [...existing, ...created].map((t) => t.id);
}

export async function createAgencyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = quickAgencySchema.safeParse({
    ...raw,
    services: formData.getAll("services"),
    technologies: formData.getAll("technologies"),
    tags: formData.getAll("tags"),
    leadScoreOverride: raw.leadScoreOverride ? Number(raw.leadScoreOverride) : undefined,
  });

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const settings = await getSettings();
  const leadScore = data.leadScoreOverride ?? calculateLeadScore(data, settings.scoringWeights);

  const [agency] = await db
    .insert(agencies)
    .values({
      name: data.name,
      website: emptyToNull(data.website),
      country: emptyToNull(data.country),
      city: emptyToNull(data.city),
      timezone: emptyToNull(data.timezone),
      companySize: emptyToNull(data.companySize),
      description: emptyToNull(data.description),
      services: data.services,
      technologies: data.technologies,
      source: emptyToNull(data.source),
      status: data.status,
      priority: data.priority,
      notes: emptyToNull(data.notes),
      leadScore,
      leadScoreOverride: data.leadScoreOverride ?? null,
    })
    .returning();

  if (data.contactFirstName) {
    await db.insert(contacts).values({
      agencyId: agency.id,
      firstName: data.contactFirstName,
      lastName: emptyToNull(data.contactLastName),
      email: emptyToNull(data.contactEmail),
      jobTitle: emptyToNull(data.contactJobTitle),
      isPrimary: true,
    });
  }

  const tagIds = await resolveTagIds(data.tags);
  if (tagIds.length) {
    await db.insert(agencyTags).values(tagIds.map((tagId) => ({ agencyId: agency.id, tagId })));
  }

  await logActivity({
    agencyId: agency.id,
    type: "AGENCY_CREATED",
    title: "Agency added",
    description: data.contactFirstName ? `Added with contact ${data.contactFirstName}` : undefined,
  });

  revalidatePath("/agencies");
  revalidatePath("/dashboard");
  redirect(`/agencies/${agency.id}`);
}

export async function updateAgencyAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = agencySchema.safeParse({
    ...raw,
    services: formData.getAll("services"),
    technologies: formData.getAll("technologies"),
    leadScoreOverride: raw.leadScoreOverride ? Number(raw.leadScoreOverride) : undefined,
  });

  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const [existing] = await db.select().from(agencies).where(eq(agencies.id, id)).limit(1);
  if (!existing) return { error: "Agency not found." };

  const settings = await getSettings();
  const leadScore = data.leadScoreOverride ?? calculateLeadScore(data, settings.scoringWeights);

  await db
    .update(agencies)
    .set({
      name: data.name,
      website: emptyToNull(data.website),
      country: emptyToNull(data.country),
      city: emptyToNull(data.city),
      timezone: emptyToNull(data.timezone),
      companySize: emptyToNull(data.companySize),
      description: emptyToNull(data.description),
      services: data.services,
      technologies: data.technologies,
      source: emptyToNull(data.source),
      status: data.status,
      priority: data.priority,
      notes: emptyToNull(data.notes),
      leadScore,
      leadScoreOverride: data.leadScoreOverride ?? null,
      updatedAt: new Date(),
    })
    .where(eq(agencies.id, id));

  if (existing.status !== data.status) {
    await logActivity({
      agencyId: id,
      type: "STATUS_CHANGED",
      title: `Status changed to ${data.status}`,
      description: `Previously ${existing.status}`,
    });
  }

  revalidatePath("/agencies");
  revalidatePath(`/agencies/${id}`);
  revalidatePath("/dashboard");
  return {};
}

export async function updateAgencyStatusAction(id: string, status: (typeof agencies.$inferSelect)["status"]) {
  const [existing] = await db.select().from(agencies).where(eq(agencies.id, id)).limit(1);
  if (!existing) return;

  await db.update(agencies).set({ status, updatedAt: new Date() }).where(eq(agencies.id, id));

  if (existing.status !== status) {
    await logActivity({
      agencyId: id,
      type: "STATUS_CHANGED",
      title: `Status changed to ${status}`,
      description: `Previously ${existing.status}`,
    });
  }

  revalidatePath("/agencies");
  revalidatePath(`/agencies/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteAgencyAction(id: string) {
  await db.delete(agencies).where(eq(agencies.id, id));
  revalidatePath("/agencies");
  revalidatePath("/dashboard");
  redirect("/agencies");
}

export async function addAgencyNoteAction(agencyId: string, note: string) {
  if (!note.trim()) return;
  await logActivity({ agencyId, type: "NOTE_ADDED", title: "Note added", description: note.trim() });
  revalidatePath(`/agencies/${agencyId}`);
}
