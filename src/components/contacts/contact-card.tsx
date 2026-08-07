"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Link2, Star, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { contacts } from "@/db/schema";
import { deleteContactAction } from "@/actions/contacts";
import { ContactFormDialog } from "./contact-form-dialog";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Contact = typeof contacts.$inferSelect;

export function ContactCard({ contact }: { contact: Contact }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card className="flex flex-row items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium">
            {contact.firstName} {contact.lastName}
          </p>
          {contact.isPrimary && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Star className="size-3 fill-current" /> Primary
            </Badge>
          )}
        </div>
        {contact.jobTitle && <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>}
        {contact.source && <p className="text-xs text-muted-foreground">Source: {contact.source}</p>}
        <div className="mt-2 flex flex-col gap-1 text-sm">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
              <Mail className="size-3.5" /> {contact.email}
            </a>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="size-3.5" /> {contact.phone}
            </span>
          )}
          {contact.linkedinUrl && (
            <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
              <Link2 className="size-3.5" /> LinkedIn
            </a>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ContactFormDialog agencyId={contact.agencyId} contact={contact} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${contact.firstName}?`}
        description="This removes the contact permanently. Related outreach history will keep a reference but lose the contact link."
        onConfirm={async () => {
          await deleteContactAction(contact.id);
          toast.success("Contact deleted.");
        }}
      />
    </Card>
  );
}
