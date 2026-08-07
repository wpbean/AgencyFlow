"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, MapPin, Mail, CalendarPlus, Pencil, MoreHorizontal, Trash2, ChevronLeft } from "lucide-react";
import type { agencies, contacts as contactsTable, emailTemplates } from "@/db/schema";
import { AgencyStatusBadge } from "./agency-status-badge";
import { PriorityBadge } from "./priority-badge";
import { LeadScoreBadge } from "./lead-score-badge";
import { AgencyEditDialog } from "./agency-edit-dialog";
import { DeleteAgencyDialog } from "./delete-agency-dialog";
import { SendEmailDialog } from "@/components/outreach/send-email-dialog";
import { AddFollowUpDialog } from "@/components/outreach/add-follow-up-dialog";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Agency = typeof agencies.$inferSelect;
type Contact = typeof contactsTable.$inferSelect;
type Template = typeof emailTemplates.$inferSelect;

export function AgencyDetailHeader({
  agency,
  contacts,
  templates,
}: {
  agency: Agency;
  contacts: Contact[];
  templates: Template[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="border-b px-4 py-4 sm:px-6">
      <Link href="/agencies" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Agencies
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{agency.name}</h1>
            <AgencyStatusBadge status={agency.status} />
            <PriorityBadge priority={agency.priority} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {agency.website && (
              <a href={agency.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary hover:underline">
                <Globe className="size-3.5" />
                {agency.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {(agency.city || agency.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {[agency.city, agency.country].filter(Boolean).join(", ")}
              </span>
            )}
            <LeadScoreBadge score={agency.leadScoreOverride ?? agency.leadScore} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SendEmailDialog
            agencyId={agency.id}
            agencyName={agency.name}
            website={agency.website}
            country={agency.country}
            contacts={contacts}
            templates={templates}
            trigger={
              <Button size="sm" className="gap-1.5">
                <Mail className="size-4" /> Send Email
              </Button>
            }
          />
          <AddFollowUpDialog
            agencyId={agency.id}
            contacts={contacts}
            trigger={
              <Button size="sm" variant="outline" className="gap-1.5">
                <CalendarPlus className="size-4" /> Add Follow-up
              </Button>
            }
          />
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete Agency
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AgencyEditDialog agency={agency} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteAgencyDialog agencyId={agency.id} agencyName={agency.name} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}
