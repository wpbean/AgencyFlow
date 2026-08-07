"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2, X } from "lucide-react";
import { EddCustomersFilters } from "./edd-customers-filters";
import { EddCustomersTable } from "./edd-customers-table";
import { PaginationBar } from "@/components/common/pagination-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addEddCustomersToContactsAction } from "@/actions/edd";
import type { EddCustomerRow } from "@/db/queries/edd-customers";

export function EddCustomersExplorer({
  customers,
  total,
  page,
  pageSize,
  productOptions,
}: {
  customers: EddCustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  productOptions: { id: string; name: string }[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [addingId, setAddingId] = useState<string | null>(null);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      const allSelected = customers.length > 0 && customers.every((c) => prev.has(c.id));
      const next = new Set(prev);
      if (allSelected) {
        for (const c of customers) next.delete(c.id);
      } else {
        for (const c of customers) next.add(c.id);
      }
      return next;
    });
  }

  function addSelectedToContacts() {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const result = await addEddCustomersToContactsAction(ids);
      const count = result.added + result.linked;
      toast.success(`Added ${count} customer${count === 1 ? "" : "s"} to Contacts.`);
      setSelectedIds(new Set());
    });
  }

  function addOne(id: string) {
    setAddingId(id);
    startTransition(async () => {
      await addEddCustomersToContactsAction([id]);
      toast.success("Added to Contacts.");
      setAddingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EddCustomersFilters productOptions={productOptions} />
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={addSelectedToContacts} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
              Add to Contacts
            </Button>
            <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
              <X className="size-3.5" /> Clear
            </Button>
          </div>
        )}
      </div>
      <Card className="p-0">
        <EddCustomersTable
          customers={customers}
          selected={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onAddOne={addOne}
          addingId={addingId}
        />
        <PaginationBar page={page} pageSize={pageSize} total={total} />
      </Card>
    </div>
  );
}
