"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, MailX } from "lucide-react";
import { searchAudienceAction, addRecipientsAction } from "@/actions/campaigns";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectFilter } from "@/components/common/multi-select-filter";
import { SearchInput } from "@/components/common/search-input";
import { ToneBadge } from "@/components/common/tone-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AudienceRow = { id: string; firstName: string | null; lastName: string | null; email: string | null; isUnsubscribed: boolean };

type Props =
  | {
      campaignId: string;
      source: "CONTACT";
      agencyOptions: { id: string; name: string }[];
      jobTitles: string[];
      sources: string[];
      existingEmails: Set<string>;
      onAdded: () => void;
    }
  | {
      campaignId: string;
      source: "EDD_CUSTOMER";
      productOptions: { id: string; name: string }[];
      existingEmails: Set<string>;
      onAdded: () => void;
    };

export function CampaignAudiencePicker(props: Props) {
  const { campaignId, source, existingEmails, onAdded } = props;
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 300);
  const [agencyId, setAgencyId] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [productId, setProductId] = useState<string[]>([]);
  const [includeUnsubscribed, setIncludeUnsubscribed] = useState(false);

  const [rows, setRows] = useState<AudienceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-change loading flag
    setLoading(true);
    const excludeUnsubscribed = !includeUnsubscribed;
    const filters =
      source === "CONTACT"
        ? { q: debouncedQ || undefined, agencyId, jobTitle, source: sourceFilter, excludeUnsubscribed }
        : { q: debouncedQ || undefined, productId, excludeUnsubscribed };

    searchAudienceAction(source, filters).then((result) => {
      if (cancelled) return;
      setRows(result);
      setLoading(false);
      setSelected(new Set());
    });
    return () => {
      cancelled = true;
    };
  }, [source, debouncedQ, agencyId, jobTitle, sourceFilter, productId, includeUnsubscribed]);

  const selectable = rows.filter((r) => r.email && !existingEmails.has(r.email.toLowerCase()));
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)));
  }

  function addIds(ids: string[]) {
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await addRecipientsAction(campaignId, source, ids);
      toast.success(`Added ${result.added} recipient${result.added === 1 ? "" : "s"}.`);
      setSelected(new Set());
      onAdded();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search..." />
        {source === "CONTACT" && (
          <>
            <MultiSelectFilter
              label="Agency"
              options={props.agencyOptions.map((a) => ({ value: a.id, label: a.name }))}
              selected={agencyId}
              onChange={setAgencyId}
            />
            <MultiSelectFilter
              label="Job Title"
              options={props.jobTitles.map((j) => ({ value: j, label: j }))}
              selected={jobTitle}
              onChange={setJobTitle}
            />
            <MultiSelectFilter
              label="Source"
              options={props.sources.map((s) => ({ value: s, label: s }))}
              selected={sourceFilter}
              onChange={setSourceFilter}
            />
          </>
        )}
        {source === "EDD_CUSTOMER" && (
          <MultiSelectFilter
            label="Product"
            options={props.productOptions.map((p) => ({ value: p.id, label: p.name }))}
            selected={productId}
            onChange={setProductId}
          />
        )}
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1.5", includeUnsubscribed && "border-primary/50 text-foreground")}
          onClick={() => setIncludeUnsubscribed((v) => !v)}
        >
          <MailX className="size-3.5" />
          {includeUnsubscribed ? "Showing unsubscribed" : "Unsubscribed hidden"}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {loading ? "Searching…" : `${rows.length} match${rows.length === 1 ? "" : "es"}${rows.length >= 500 ? " (showing first 500)" : ""}`}
        </p>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5" disabled={pending} onClick={() => addIds(Array.from(selected))}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
              Add {selected.size} Selected
            </Button>
          )}
          {selectable.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={pending}
              onClick={() => addIds(selectable.map((r) => r.id))}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
              Add All Matching ({selectable.length})
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" disabled={selectable.length === 0} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const alreadyAdded = !!r.email && existingEmails.has(r.email.toLowerCase());
              return (
                <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggle(r.id)}
                      disabled={alreadyAdded || !r.email}
                      aria-label={`Select ${r.firstName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {r.firstName} {r.lastName ?? ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {r.email || "No email"}
                      {alreadyAdded && <span className="text-xs text-muted-foreground">(added)</span>}
                      {r.isUnsubscribed && <ToneBadge tone="warning">Unsubscribed</ToneBadge>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                  No matches.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
