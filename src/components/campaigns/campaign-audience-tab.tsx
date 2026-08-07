"use client";

import { useRouter } from "next/navigation";
import { CampaignAudiencePicker } from "./campaign-audience-picker";
import { CampaignRecipientsTable } from "./campaign-recipients-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CampaignRecipientRow } from "@/db/queries/campaigns";

export function CampaignAudienceTab({
  campaignId,
  recipients,
  canEdit,
  agencyOptions,
  jobTitles,
  sources,
  productOptions,
}: {
  campaignId: string;
  recipients: CampaignRecipientRow[];
  canEdit: boolean;
  agencyOptions: { id: string; name: string }[];
  jobTitles: string[];
  sources: string[];
  productOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const existingEmails = new Set(recipients.map((r) => r.email.toLowerCase()));

  function handleAdded() {
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Contacts</CardTitle>
              <CardDescription>Filter by agency, job title, or source, then add matching contacts.</CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignAudiencePicker
                campaignId={campaignId}
                source="CONTACT"
                agencyOptions={agencyOptions}
                jobTitles={jobTitles}
                sources={sources}
                existingEmails={existingEmails}
                onAdded={handleAdded}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add EDD Customers</CardTitle>
              <CardDescription>Filter by product purchased, then add matching customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignAudiencePicker
                campaignId={campaignId}
                source="EDD_CUSTOMER"
                productOptions={productOptions}
                existingEmails={existingEmails}
                onAdded={handleAdded}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recipients ({recipients.length})</CardTitle>
          <CardDescription>
            {canEdit ? "Everyone who will receive this campaign." : "Send status for each recipient."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignRecipientsTable campaignId={campaignId} recipients={recipients} canEdit={canEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
