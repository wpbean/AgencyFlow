"use client";

import { Mail, ShoppingBag, UserPlus, CheckCircle2, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { ToneBadge } from "@/components/common/tone-badge";
import type { EddCustomerRow } from "@/db/queries/edd-customers";

export function EddCustomersTable({
  customers,
  selected,
  onToggle,
  onToggleAll,
  onAddOne,
  addingId,
}: {
  customers: EddCustomerRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onAddOne: (id: string) => void;
  addingId: string | null;
}) {
  if (customers.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No EDD customers found"
        description="Connect and sync Easy Digital Downloads in Settings, or adjust your filters."
      />
    );
  }

  const allSelected = customers.length > 0 && customers.every((c) => selected.has(c.id));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8">
              <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label="Select all" />
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Spent</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => {
            const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
            return (
              <TableRow key={c.id} data-state={selected.has(c.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox checked={selected.has(c.id)} onCheckedChange={() => onToggle(c.id)} aria-label={`Select ${c.email}`} />
                </TableCell>
                <TableCell className="font-medium">{name || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <Mail className="size-3.5" /> {c.email}
                    </a>
                    {c.isUnsubscribed && <ToneBadge tone="warning">Unsubscribed</ToneBadge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.products.length === 0 && <span className="text-muted-foreground">—</span>}
                    {c.products.slice(0, 3).map((p) => (
                      <Badge key={p.id} variant="outline" className="text-[10px]">
                        {p.name}
                      </Badge>
                    ))}
                    {c.products.length > 3 && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        +{c.products.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.purchaseCount}</TableCell>
                <TableCell className="text-muted-foreground">${c.purchaseValue.toFixed(2)}</TableCell>
                <TableCell>
                  {c.contactId ? (
                    <Badge variant="outline" className="gap-1 border-success/20 bg-success/15 text-success">
                      <CheckCircle2 className="size-3" /> In Contacts
                    </Badge>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => onAddOne(c.id)} disabled={addingId === c.id}>
                      {addingId === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
                      Add
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
