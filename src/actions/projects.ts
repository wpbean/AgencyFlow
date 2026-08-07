"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { projectSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import type { ActionState } from "./agencies";

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await db.insert(projects).values({
    agencyId: data.agencyId,
    opportunityId: data.opportunityId || null,
    name: data.name,
    description: data.description,
    status: data.status,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    hourlyRate: data.hourlyRate ?? null,
    currency: data.currency,
    estimatedHours: data.estimatedHours ?? null,
    actualHours: data.actualHours ?? null,
    notes: data.notes,
  });

  await logActivity({ agencyId: data.agencyId, type: "PROJECT_CREATED", title: `Project created: ${data.name}` });

  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath(`/agencies/${data.agencyId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function updateProjectAction(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) return { error: "Project not found." };

  await db
    .update(projects)
    .set({
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      hourlyRate: data.hourlyRate ?? null,
      currency: data.currency,
      estimatedHours: data.estimatedHours ?? null,
      actualHours: data.actualHours ?? null,
      notes: data.notes,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id));

  if (existing.status !== "COMPLETED" && data.status === "COMPLETED") {
    await logActivity({ agencyId: data.agencyId, type: "PROJECT_COMPLETED", title: `Project completed: ${data.name}` });
  }

  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath(`/agencies/${data.agencyId}`);
  return {};
}

export async function deleteProjectAction(id: string) {
  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) return;
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath(`/agencies/${existing.agencyId}`);
}
