import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { EddIntegrationCard } from "@/components/settings/edd-integration-card";
import { CampaignSenderCard } from "@/components/settings/campaign-sender-card";
import { getSettings } from "@/lib/settings";
import { getEddIntegrationAction } from "@/actions/edd";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, eddIntegration] = await Promise.all([getSettings(), getEddIntegrationAction()]);

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure application defaults and preferences." />
      <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl">
        <ThemeSettings />
        <EddIntegrationCard integration={eddIntegration} />
        <CampaignSenderCard settings={settings} />
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
