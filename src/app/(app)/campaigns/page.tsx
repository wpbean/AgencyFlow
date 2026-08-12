import { Plus, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignCreateDialog } from "@/components/campaigns/campaign-create-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { listCampaigns } from "@/db/queries/campaigns";
import { listTemplatesWithDesign } from "@/db/queries/templates";
import { getCampaignListRates } from "@/db/queries/campaign-analytics";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  const [campaigns, savedTemplates, rates] = await Promise.all([listCampaigns(), listTemplatesWithDesign(), getCampaignListRates()]);

  return (
    <>
      <PageHeader
        title="Campaigns"
        subtitle="Send a single email to a set of Contacts or EDD Customers — offers, plan upgrades, discounts."
        actions={
          <CampaignCreateDialog
            savedTemplates={savedTemplates}
            trigger={
              <Button size="lg" className="gap-1.5">
                <Plus className="size-4" /> New Campaign
              </Button>
            }
          />
        }
      />
      <div className="p-4 sm:p-6">
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No campaigns yet"
            description="Create a campaign to send a bulk email to selected Contacts or EDD Customers."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} rates={rates.get(c.id)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
