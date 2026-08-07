import { notFound } from "next/navigation";
import { getCampaignById } from "@/db/queries/campaigns";
import { getAgencyOptions, getContactFilterOptions } from "@/db/queries/contacts";
import { getEddProductOptions } from "@/db/queries/edd-customers";
import { listTemplatesWithDesign } from "@/db/queries/templates";
import { getConversationsWithMessagesByCampaign } from "@/db/queries/conversations";
import { CampaignDetailHeader } from "@/components/campaigns/campaign-detail-header";
import { CampaignComposeTab } from "@/components/campaigns/campaign-compose-tab";
import { CampaignAudienceTab } from "@/components/campaigns/campaign-audience-tab";
import { CampaignRepliesTab } from "@/components/campaigns/campaign-replies-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Campaign" };

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [record, agencyOptions, contactFilterOptions, productOptions, savedTemplates, conversations] = await Promise.all([
    getCampaignById(id),
    getAgencyOptions(),
    getContactFilterOptions(),
    getEddProductOptions(),
    listTemplatesWithDesign(),
    getConversationsWithMessagesByCampaign(id),
  ]);

  if (!record) notFound();

  const { campaign, recipients } = record;
  const canEdit = campaign.status === "DRAFT" || campaign.status === "FAILED";
  const pendingCount = recipients.filter((r) => r.status === "PENDING").length;
  const failedCount = recipients.filter((r) => r.status === "FAILED").length;
  const unreadReplies = conversations.filter((c) => c.conversation.isUnread).length;

  return (
    <>
      <CampaignDetailHeader campaign={campaign} pendingCount={pendingCount} failedCount={failedCount} />
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="compose">
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="audience">Audience ({recipients.length})</TabsTrigger>
            <TabsTrigger value="replies">Replies ({unreadReplies > 0 ? `${unreadReplies} new` : conversations.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="compose" className="mt-4">
            <CampaignComposeTab campaign={campaign} savedTemplates={savedTemplates} />
          </TabsContent>
          <TabsContent value="audience" className="mt-4">
            <CampaignAudienceTab
              campaignId={campaign.id}
              recipients={recipients}
              canEdit={canEdit}
              agencyOptions={agencyOptions}
              jobTitles={contactFilterOptions.jobTitles}
              sources={contactFilterOptions.sources}
              productOptions={productOptions}
            />
          </TabsContent>
          <TabsContent value="replies" className="mt-4">
            <CampaignRepliesTab conversations={conversations} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
