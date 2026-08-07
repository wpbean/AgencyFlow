"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, X } from "lucide-react";
import { ContactsFilters } from "./contacts-filters";
import { ContactsTable } from "./contacts-table";
import { PaginationBar } from "@/components/common/pagination-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ContactRow } from "@/db/queries/contacts";

export function ContactsExplorer({
  contacts,
  total,
  page,
  pageSize,
  agencyOptions,
  jobTitles,
  sources,
}: {
  contacts: ContactRow[];
  total: number;
  page: number;
  pageSize: number;
  agencyOptions: { id: string; name: string }[];
  jobTitles: string[];
  sources: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

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
      const allSelected = contacts.length > 0 && contacts.every((c) => prev.has(c.id));
      const next = new Set(prev);
      if (allSelected) {
        for (const c of contacts) next.delete(c.id);
      } else {
        for (const c of contacts) next.add(c.id);
      }
      return next;
    });
  }

  async function exportSelected() {
    setExporting(true);
    try {
      const res = await fetch("/api/contacts/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedIds.size} contact${selectedIds.size === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ContactsFilters agencyOptions={agencyOptions} jobTitles={jobTitles} sources={sources} />
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={exportSelected} disabled={exporting}>
              {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              Export Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="size-3.5" /> Clear
            </Button>
          </div>
        )}
      </div>
      <Card className="p-0">
        <ContactsTable
          contacts={contacts}
          selected={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          agencyOptions={agencyOptions}
        />
        <PaginationBar page={page} pageSize={pageSize} total={total} />
      </Card>
    </div>
  );
}
