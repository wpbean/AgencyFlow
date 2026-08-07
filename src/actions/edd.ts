"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { contacts, eddCustomers, type EddSyncStatus } from "@/db/schema";
import { getEddIntegration, upsertEddIntegration } from "@/lib/edd/settings";
import { testEddConnection, normalizeSiteUrl, type EddConfig } from "@/lib/edd/client";
import { startEddSync } from "@/lib/edd/sync";

export type EddIntegrationView = {
  siteUrl: string | null;
  connected: boolean;
  syncStatus: EddSyncStatus;
  syncError: string | null;
  lastSyncedAt: Date | null;
  lastSyncStats: { products: number; customers: number; orders: number } | null;
  lastSyncDebug: { customersSample?: string; salesSample?: string } | null;
  hasCredentials: boolean;
};

async function toView(): Promise<EddIntegrationView> {
  const row = await getEddIntegration();
  return {
    siteUrl: row?.siteUrl ?? null,
    connected: row?.connected ?? false,
    syncStatus: row?.syncStatus ?? "idle",
    syncError: row?.syncError ?? null,
    lastSyncedAt: row?.lastSyncedAt ?? null,
    lastSyncStats: row?.lastSyncStats ?? null,
    lastSyncDebug: row?.lastSyncDebug ?? null,
    hasCredentials: Boolean(row?.apiKey && row?.apiToken),
  };
}

export async function getEddIntegrationAction(): Promise<EddIntegrationView> {
  return toView();
}

export async function saveEddSettingsAction(formData: FormData): Promise<EddIntegrationView> {
  const siteUrl = normalizeSiteUrl(String(formData.get("siteUrl") || ""));
  const apiKey = String(formData.get("apiKey") || "").trim();
  const apiToken = String(formData.get("apiToken") || "").trim();

  if (!siteUrl || !apiKey || !apiToken) {
    throw new Error("Site URL, API key, and token are all required.");
  }

  await upsertEddIntegration({ siteUrl, apiKey, apiToken, connected: false, syncError: null });
  revalidatePath("/settings");
  return toView();
}

export async function testEddConnectionAction(): Promise<EddIntegrationView> {
  const row = await getEddIntegration();
  if (!row?.siteUrl || !row.apiKey || !row.apiToken) {
    throw new Error("Save the site URL, API key, and token first.");
  }

  const config: EddConfig = { siteUrl: row.siteUrl, apiKey: row.apiKey, apiToken: row.apiToken };
  try {
    await testEddConnection(config);
    await upsertEddIntegration({ connected: true, syncError: null });
  } catch (err) {
    await upsertEddIntegration({ connected: false, syncError: err instanceof Error ? err.message : String(err) });
    throw err;
  }
  revalidatePath("/settings");
  return toView();
}

export async function startEddSyncAction(): Promise<EddIntegrationView> {
  await startEddSync();
  revalidatePath("/settings");
  return toView();
}

export async function getEddSyncStatusAction(): Promise<EddIntegrationView> {
  return toView();
}

export async function disconnectEddAction(): Promise<void> {
  await upsertEddIntegration({
    siteUrl: null,
    apiKey: null,
    apiToken: null,
    connected: false,
    syncStatus: "idle",
    syncError: null,
  });
  revalidatePath("/settings");
}

export async function addEddCustomersToContactsAction(eddCustomerIds: string[]): Promise<{ added: number; linked: number }> {
  if (eddCustomerIds.length === 0) return { added: 0, linked: 0 };

  const rows = await db.select().from(eddCustomers).where(inArray(eddCustomers.id, eddCustomerIds));
  const existingContacts = await db.select({ id: contacts.id, email: contacts.email }).from(contacts);
  const contactIdByEmail = new Map(existingContacts.filter((c) => c.email).map((c) => [c.email!.trim().toLowerCase(), c.id]));

  let added = 0;
  let linked = 0;

  for (const row of rows) {
    if (row.contactId) continue;

    const emailKey = row.email.trim().toLowerCase();
    let contactId = contactIdByEmail.get(emailKey);

    if (contactId) {
      linked++;
    } else {
      const [contact] = await db
        .insert(contacts)
        .values({
          firstName: row.firstName || row.email,
          lastName: row.lastName,
          email: row.email,
          source: "EDD",
        })
        .returning();
      contactId = contact.id;
      contactIdByEmail.set(emailKey, contactId);
      added++;
    }

    await db.update(eddCustomers).set({ contactId }).where(eq(eddCustomers.id, row.id));
  }

  revalidatePath("/edd-customers");
  revalidatePath("/contacts");
  return { added, linked };
}
