"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { emptyToNull } from "@/lib/utils";
import type { ActionState } from "./agencies";

function normalizeContact(data: ContactInput) {
  return {
    agencyId: data.agencyId || null,
    firstName: data.firstName,
    lastName: emptyToNull(data.lastName),
    email: emptyToNull(data.email),
    phone: emptyToNull(data.phone),
    jobTitle: emptyToNull(data.jobTitle),
    linkedinUrl: emptyToNull(data.linkedinUrl),
    isPrimary: data.isPrimary,
    source: emptyToNull(data.source),
    notes: emptyToNull(data.notes),
  };
}

export async function createContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse({ ...raw, isPrimary: raw.isPrimary === "on" || raw.isPrimary === "true" });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const agencyId = data.agencyId || null;

  if (data.isPrimary && agencyId) {
    await db.update(contacts).set({ isPrimary: false }).where(eq(contacts.agencyId, agencyId));
  }

  await db.insert(contacts).values(normalizeContact(data));

  if (agencyId) {
    await logActivity({
      agencyId,
      type: "CONTACT_ADDED",
      title: `Contact added: ${data.firstName} ${data.lastName ?? ""}`.trim(),
    });
    revalidatePath(`/agencies/${agencyId}`);
  }

  revalidatePath("/contacts");
  return {};
}

export async function updateContactAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = contactSchema.safeParse({ ...raw, isPrimary: raw.isPrimary === "on" || raw.isPrimary === "true" });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const agencyId = data.agencyId || null;

  if (data.isPrimary && agencyId) {
    await db.update(contacts).set({ isPrimary: false }).where(eq(contacts.agencyId, agencyId));
  }

  await db.update(contacts).set({ ...normalizeContact(data), updatedAt: new Date() }).where(eq(contacts.id, id));

  revalidatePath("/contacts");
  if (agencyId) revalidatePath(`/agencies/${agencyId}`);
  return {};
}

export async function deleteContactAction(id: string) {
  const [existing] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  if (!existing) return;
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/contacts");
  if (existing.agencyId) revalidatePath(`/agencies/${existing.agencyId}`);
}
