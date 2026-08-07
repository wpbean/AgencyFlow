import "server-only";
import { db } from "@/db";
import { emailSuppressions } from "@/db/schema";

export async function getSuppressedEmailSet(): Promise<Set<string>> {
  const rows = await db.select({ email: emailSuppressions.email }).from(emailSuppressions);
  return new Set(rows.map((r) => r.email.toLowerCase()));
}

export async function isSuppressed(email: string): Promise<boolean> {
  const suppressed = await getSuppressedEmailSet();
  return suppressed.has(email.toLowerCase());
}
