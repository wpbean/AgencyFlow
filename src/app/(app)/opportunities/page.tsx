import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { OpportunityBoard } from "@/components/opportunities/opportunity-board";
import { OpportunityFormDialog } from "@/components/opportunities/opportunity-form-dialog";
import { Button } from "@/components/ui/button";
import { listOpportunitiesByStage } from "@/db/queries/opportunities";
import { getContactsGroupedByAgency, getAgencyOptions } from "@/db/queries/contacts";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Opportunities" };

export default async function OpportunitiesPage() {
  const [columns, contactsByAgency, agencyOptions, settings] = await Promise.all([
    listOpportunitiesByStage(),
    getContactsGroupedByAgency(),
    getAgencyOptions(),
    getSettings(),
  ]);

  const totalCount = columns.reduce((sum, c) => sum + c.items.length, 0);
  const firstAgency = agencyOptions[0];

  return (
    <>
      <PageHeader
        title="Opportunities"
        subtitle={`${totalCount} opportunit${totalCount === 1 ? "y" : "ies"} across your pipeline`}
        actions={
          firstAgency ? (
            <OpportunityFormDialog
              agencyId={firstAgency.id}
              contacts={contactsByAgency[firstAgency.id] ?? []}
              agencyOptions={agencyOptions}
              contactsByAgency={contactsByAgency}
              defaultCurrency={settings.defaultCurrency}
              trigger={
                <Button size="lg" className="gap-1.5">
                  <Plus className="size-4" /> New Opportunity
                </Button>
              }
            />
          ) : undefined
        }
      />
      <div className="p-4 sm:p-6">
        <OpportunityBoard columns={columns} contactsByAgency={contactsByAgency} />
      </div>
    </>
  );
}
