"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { emailTemplateSchema } from "@/lib/validation";
import type { ActionState } from "./agencies";

function parseTemplateFormData(formData: FormData) {
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
  return emailTemplateSchema.safeParse({ ...raw, design });
}

export async function createTemplateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseTemplateFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await db.insert(emailTemplates).values(parsed.data);
  revalidatePath("/templates");
  return {};
}

export async function updateTemplateAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseTemplateFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await db.update(emailTemplates).set({ ...parsed.data, updatedAt: new Date() }).where(eq(emailTemplates.id, id));
  revalidatePath("/templates");
  return {};
}

export async function duplicateTemplateAction(id: string) {
  const [existing] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  if (!existing) return;
  await db.insert(emailTemplates).values({
    name: `${existing.name} (Copy)`,
    category: existing.category,
    subject: existing.subject,
    body: existing.body,
    design: existing.design,
  });
  revalidatePath("/templates");
}

export async function deleteTemplateAction(id: string) {
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  revalidatePath("/templates");
}
