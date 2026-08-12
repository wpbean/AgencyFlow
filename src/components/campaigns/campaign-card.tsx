"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, MoreHorizontal, Trash2, Users } from "lucide-react";
import { deleteCampaignAction, duplicateCampaignAction } from "@/actions/campaigns";
import { CAMPAIGN_STATUS_META } from "@/lib/labels";
import { ToneBadge } from "@/components/common/tone-badge";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import type { CampaignRow } from "@/db/queries/campaigns";
import type { CampaignRateSummary } from "@/db/queries/campaign-analytics";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CampaignCard({ campaign, rates }: { campaign: CampaignRow; rates?: CampaignRateSummary }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const router = useRouter();

  async function handleDuplicate() {
    setDuplicating(true);
    const result = await duplicateCampaignAction(campaign.id);
    if ("error" in result) {
      toast.error(result.error);
      setDuplicating(false);
      return;
    }
    toast.success("Campaign duplicated.");
    router.push(`/campaigns/${result.id}`);
  }

  return (
    <Card className="relative gap-3 py-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 size-7 shrink-0">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={duplicating} onSelect={handleDuplicate}>
            <Copy className="size-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CardHeader className="space-y-0 pt-4 pr-8">
        <CardTitle>
          <Link href={`/campaigns/${campaign.id}`} className="block truncate hover:underline">
            {campaign.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="truncate text-sm font-medium text-foreground/80">{campaign.subject}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">{campaign.body}</p>
      </CardContent>
      <CardFooter className="mt-1 flex flex-col items-start gap-1.5 text-xs text-muted-foreground">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {campaign.totalRecipients} recipient{campaign.totalRecipients === 1 ? "" : "s"}
            {(campaign.status === "SENT" || (campaign.status === "SENDING" && campaign.dailyLimit)) && ` · ${campaign.sentCount} sent`}
            {campaign.status === "SCHEDULED" && campaign.scheduledAt && ` · starts ${new Date(campaign.scheduledAt).toLocaleDateString()}`}
            {campaign.failedCount > 0 && ` · ${campaign.failedCount} failed`}
          </div>
          <ToneBadge tone={CAMPAIGN_STATUS_META[campaign.status].tone} className="shrink-0">
            {CAMPAIGN_STATUS_META[campaign.status].label}
          </ToneBadge>
        </div>
        {rates && campaign.sentCount > 0 && (
          <div className="flex items-center gap-3">
            <span>Opens {rates.openRate}%</span>
            <span>Clicks {rates.clickRate}%</span>
          </div>
        )}
      </CardFooter>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${campaign.name}"?`}
        description="This permanently removes the campaign and its recipient list. Emails already sent are not recalled."
        onConfirm={async () => {
          await deleteCampaignAction(campaign.id);
          toast.success("Campaign deleted.");
        }}
      />
    </Card>
  );
}
