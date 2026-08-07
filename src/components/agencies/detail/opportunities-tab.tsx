import { Target } from "lucide-react";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { OpportunityFormDialog } from "@/components/opportunities/opportunity-form-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { opportunities as opportunitiesTable } from "@/db/schema";

type ContactOption = { id: string; firstName: string; lastName: string | null };

export function OpportunitiesTab({
  agencyId,
  opportunities,
  contacts,
  defaultCurrency,
}: {
  agencyId: string;
  opportunities: (typeof opportunitiesTable.$inferSelect)[];
  contacts: ContactOption[];
  defaultCurrency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <OpportunityFormDialog
          agencyId={agencyId}
          contacts={contacts}
          defaultCurrency={defaultCurrency}
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> New Opportunity
            </Button>
          }
        />
      </div>
      {opportunities.length === 0 ? (
        <EmptyState icon={Target} title="No opportunities" description="Create one once this agency shows interest." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} contacts={contacts} />
          ))}
        </div>
      )}
    </div>
  );
}
