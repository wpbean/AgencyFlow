"use server";

import { revalidatePath } from "next/cache";
import { updateSettings, type AppSettings } from "@/lib/settings";
import { campaignSenderSchema } from "@/lib/validation";

export async function updateSettingsAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());

  await updateSettings({
    appName: String(raw.appName || "AgencyFlow").trim(),
    defaultCurrency: String(raw.defaultCurrency || "USD").trim(),
    defaultCountry: String(raw.defaultCountry || "").trim(),
    followUp1Days: Number(raw.followUp1Days) || 4,
    followUp2Days: Number(raw.followUp2Days) || 6,
    finalFollowUpDays: Number(raw.finalFollowUpDays) || 10,
    scoringWeights: {
      wordpress: Number(raw.wordpress) || 0,
      woocommerce: Number(raw.woocommerce) || 0,
      smallMediumAgency: Number(raw.smallMediumAgency) || 0,
      hiring: Number(raw.hiring) || 0,
      remoteFriendly: Number(raw.remoteFriendly) || 0,
      specialtyTech: Number(raw.specialtyTech) || 0,
    },
  });

  revalidatePath("/", "layout");
}

export type CampaignSenderActionState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

export async function updateCampaignSenderSettingsAction(
  _prev: CampaignSenderActionState,
  formData: FormData
): Promise<CampaignSenderActionState> {
  const parsed = campaignSenderSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const update: Partial<AppSettings> = {
    campaignFromName: parsed.data.campaignFromName,
    campaignFromEmail: parsed.data.campaignFromEmail,
    campaignReplyTo: parsed.data.campaignReplyTo || "",
  };
  await updateSettings(update);

  revalidatePath("/settings");
  revalidatePath("/campaigns");
  return {};
}
