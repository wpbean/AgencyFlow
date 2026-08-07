import "server-only";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { APP_NAME } from "@/lib/config";
import { DEFAULT_SCORING_WEIGHTS, type ScoringWeights } from "@/lib/scoring";

export type AppSettings = {
  appName: string;
  defaultCurrency: string;
  defaultCountry: string;
  followUp1Days: number;
  followUp2Days: number;
  finalFollowUpDays: number;
  scoringWeights: ScoringWeights;
  defaultTemplateIds: Partial<Record<"INITIAL" | "FOLLOW_UP_1" | "FOLLOW_UP_2" | "FINAL_FOLLOW_UP", string>>;
  campaignFromName: string;
  campaignFromEmail: string;
  campaignReplyTo: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: APP_NAME,
  defaultCurrency: "USD",
  defaultCountry: "",
  followUp1Days: 4,
  followUp2Days: 6,
  finalFollowUpDays: 10,
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
  defaultTemplateIds: {},
  campaignFromName: "WPBean",
  campaignFromEmail: "hello@wpbean.com",
  campaignReplyTo: "hello@wpbean.com",
};

const SETTINGS_KEY = "app";

export async function getSettings(): Promise<AppSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEY)).limit(1);
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(row.value as Partial<AppSettings>) };
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await db
    .insert(settings)
    .values({ key: SETTINGS_KEY, value: next })
    .onConflictDoUpdate({ target: settings.key, set: { value: next } });
  return next;
}
