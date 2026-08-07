"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteOpportunityAction } from "@/actions/opportunities";
import { OPPORTUNITY_TYPE_META, OPPORTUNITY_STAGE_META } from "@/lib/labels";
import { ToneBadge } from "@/components/common/tone-badge";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { OpportunityFormDialog } from "./opportunity-form-dialog";
import type { opportunities } from "@/db/schema";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ContactOption = { id: string; firstName: string; lastName: string | null };
type OpportunityCardData = typeof opportunities.$inferSelect & { agencyName?: string };

export function OpportunityCard({
  opportunity,
  contacts,
  showAgency = false,
}: {
  opportunity: OpportunityCardData;
  contacts: ContactOption[];
  showAgency?: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const stageMeta = OPPORTUNITY_STAGE_META[opportunity.stage];

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{opportunity.title}</p>
          {showAgency && <p className="truncate text-xs text-muted-foreground">{opportunity.agencyName}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <OpportunityFormDialog
              agencyId={opportunity.agencyId}
              contacts={contacts}
              opportunity={opportunity}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
              }
            />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <ToneBadge tone={stageMeta.tone}>{stageMeta.label}</ToneBadge>
        <span className="text-xs text-muted-foreground">{OPPORTUNITY_TYPE_META[opportunity.type].label}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {opportunity.expectedRate != null && (
          <span>
            {opportunity.currency} {opportunity.expectedRate}/hr
          </span>
        )}
        {opportunity.expectedHours != null && <span>{opportunity.expectedHours} hrs/mo</span>}
        <span>{opportunity.probability}% probability</span>
        {opportunity.nextActionDate && <span>Next: {format(opportunity.nextActionDate, "MMM d")}</span>}
      </div>
      {opportunity.nextAction && <p className="text-sm text-muted-foreground">{opportunity.nextAction}</p>}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${opportunity.title}"?`}
        description="This permanently removes this opportunity."
        onConfirm={async () => {
          await deleteOpportunityAction(opportunity.id);
          toast.success("Opportunity deleted.");
        }}
      />
    </Card>
  );
}
