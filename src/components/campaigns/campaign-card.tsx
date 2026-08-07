"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Users } from "lucide-react";
import { deleteCampaignAction } from "@/actions/campaigns";
import { CAMPAIGN_STATUS_META } from "@/lib/labels";
import { ToneBadge } from "@/components/common/tone-badge";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import type { CampaignRow } from "@/db/queries/campaigns";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CampaignCard({ campaign }: { campaign: CampaignRow }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card className="relative gap-3 py-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 size-7 shrink-0">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
      <CardFooter className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {campaign.totalRecipients} recipient{campaign.totalRecipients === 1 ? "" : "s"}
          {campaign.status === "SENT" && ` · ${campaign.sentCount} sent`}
          {campaign.failedCount > 0 && ` · ${campaign.failedCount} failed`}
        </div>
        <ToneBadge tone={CAMPAIGN_STATUS_META[campaign.status].tone} className="shrink-0">
          {CAMPAIGN_STATUS_META[campaign.status].label}
        </ToneBadge>
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
