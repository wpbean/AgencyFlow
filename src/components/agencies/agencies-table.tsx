"use client";

import { format } from "date-fns";
import { Globe, Building2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AgencyStatusBadge } from "./agency-status-badge";
import { PriorityBadge } from "./priority-badge";
import { LeadScoreBadge } from "./lead-score-badge";
import { AgencyRowActions } from "./agency-row-actions";
import { AgencyTableRow } from "./agency-table-row";
import { EmptyState } from "@/components/common/empty-state";
import type { agencies } from "@/db/schema";

type Agency = typeof agencies.$inferSelect;

export function AgenciesTable({ agencies }: { agencies: Agency[] }) {
  if (agencies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No agencies yet"
        description="Add your first agency to start tracking outreach, or import a list from CSV."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Agency</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Lead Score</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {agencies.map((agency) => (
            <AgencyTableRow key={agency.id} id={agency.id}>
              <TableCell className="max-w-56">
                <div className="font-medium">{agency.name}</div>
                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    <Globe className="size-3 shrink-0" />
                    <span className="truncate">{agency.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{agency.city ? `${agency.city}, ${agency.country ?? ""}` : agency.country ?? "—"}</TableCell>
              <TableCell className="max-w-40">
                <div className="flex flex-wrap gap-1">
                  {(agency.services ?? []).slice(0, 2).map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal">
                      {s}
                    </Badge>
                  ))}
                  {(agency.services ?? []).length > 2 && (
                    <Badge variant="secondary" className="font-normal">
                      +{(agency.services ?? []).length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <AgencyStatusBadge status={agency.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={agency.priority} />
              </TableCell>
              <TableCell>
                <LeadScoreBadge score={agency.leadScoreOverride ?? agency.leadScore} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {agency.nextFollowUpAt ? format(agency.nextFollowUpAt, "MMM d") : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{format(agency.updatedAt, "MMM d")}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <AgencyRowActions agency={agency} />
              </TableCell>
            </AgencyTableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
