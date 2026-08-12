"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Users } from "lucide-react";
import { removeRecipientAction, clearRecipientsAction } from "@/actions/campaigns";
import { CAMPAIGN_RECIPIENT_STATUS_META } from "@/lib/labels";
import { ToneBadge } from "@/components/common/tone-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { SearchInput } from "@/components/common/search-input";
import type { CampaignRecipientRow } from "@/db/queries/campaigns";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export function CampaignRecipientsTable({
  campaignId,
  recipients,
  canEdit,
}: {
  campaignId: string;
  recipients: CampaignRecipientRow[];
  canEdit: boolean;
}) {
  const [q, setQ] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const router = useRouter();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return recipients;
    return recipients.filter((r) => {
      const name = `${r.firstName ?? ""} ${r.lastName ?? ""}`.toLowerCase();
      return name.includes(term) || r.email.toLowerCase().includes(term);
    });
  }, [recipients, q]);

  if (recipients.length === 0) {
    return <EmptyState icon={Users} title="No recipients yet" description="Add Contacts or EDD Customers from the audience picker above." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search recipients..." />
        {canEdit && (
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setClearOpen(true)}>
            <Trash2 className="size-3.5" /> Clear All
          </Button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <RecipientRow key={r.id} campaignId={campaignId} recipient={r} canEdit={canEdit} />
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 5 : 4} className="py-6 text-center text-muted-foreground">
                  No recipients match &quot;{q}&quot;.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear all recipients?"
        description={`This removes all ${recipients.length} recipient${recipients.length === 1 ? "" : "s"} from this campaign. Emails already sent are not affected.`}
        onConfirm={async () => {
          await clearRecipientsAction(campaignId);
          toast.success("Recipients cleared.");
          router.refresh();
        }}
      />
    </div>
  );
}

function RecipientRow({
  campaignId,
  recipient,
  canEdit,
}: {
  campaignId: string;
  recipient: CampaignRecipientRow;
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRemove() {
    startTransition(async () => {
      await removeRecipientAction(recipient.id, campaignId);
      toast.success("Recipient removed.");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {recipient.firstName} {recipient.lastName ?? ""}
      </TableCell>
      <TableCell className="text-muted-foreground">{recipient.email}</TableCell>
      <TableCell className="text-muted-foreground">{recipient.source === "CONTACT" ? "Contact" : "EDD Customer"}</TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <ToneBadge tone={CAMPAIGN_RECIPIENT_STATUS_META[recipient.status].tone}>
            {CAMPAIGN_RECIPIENT_STATUS_META[recipient.status].label}
          </ToneBadge>
          {recipient.isUnsubscribed && <ToneBadge tone="warning">Unsubscribed</ToneBadge>}
        </div>
        {recipient.error && <p className="mt-0.5 text-xs text-danger">{recipient.error}</p>}
      </TableCell>
      {canEdit && (
        <TableCell>
          <Button variant="ghost" size="icon" className="size-8" onClick={handleRemove} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}
