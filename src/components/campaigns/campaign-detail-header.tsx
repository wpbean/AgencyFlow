"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { deleteCampaignAction, duplicateCampaignAction } from "@/actions/campaigns";
import { CAMPAIGN_STATUS_META } from "@/lib/labels";
import { ToneBadge } from "@/components/common/tone-badge";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { CampaignSendDialog } from "./campaign-send-dialog";
import type { CampaignRow } from "@/db/queries/campaigns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CampaignDetailHeader({
  campaign,
  pendingCount,
  failedCount,
}: {
  campaign: CampaignRow;
  pendingCount: number;
  failedCount: number;
}) {
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
    <div className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">{campaign.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{campaign.subject}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ToneBadge tone={CAMPAIGN_STATUS_META[campaign.status].tone}>{CAMPAIGN_STATUS_META[campaign.status].label}</ToneBadge>
        <CampaignSendDialog
          campaignId={campaign.id}
          campaignName={campaign.name}
          pendingCount={pendingCount}
          failedCount={failedCount}
          fromEmail={campaign.fromEmail}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled={duplicating} onSelect={handleDuplicate}>
              <Copy className="size-4" /> Duplicate Campaign
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete Campaign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${campaign.name}"?`}
        description="This permanently removes the campaign and its recipient list. Emails already sent are not recalled."
        onConfirm={async () => {
          await deleteCampaignAction(campaign.id);
          toast.success("Campaign deleted.");
          router.push("/campaigns");
        }}
      />
    </div>
  );
}
