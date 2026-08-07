"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Mail, Phone, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { deleteContactAction } from "@/actions/contacts";
import type { ContactRow } from "@/db/queries/contacts";
import { ContactFormDialog } from "./contact-form-dialog";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ContactsTable({
  contacts,
  selected,
  onToggle,
  onToggleAll,
  agencyOptions,
}: {
  contacts: ContactRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  agencyOptions: { id: string; name: string }[];
}) {
  if (contacts.length === 0) {
    return <EmptyState icon={Users} title="No contacts found" description="Add a contact or adjust your search." />;
  }

  const allSelected = contacts.length > 0 && contacts.every((c) => selected.has(c.id));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8">
              <Checkbox checked={allSelected} onCheckedChange={onToggleAll} aria-label="Select all" />
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Agency</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <ContactTableRow
              key={c.id}
              contact={c}
              isSelected={selected.has(c.id)}
              onToggle={() => onToggle(c.id)}
              agencyOptions={agencyOptions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ContactTableRow({
  contact,
  isSelected,
  onToggle,
  agencyOptions,
}: {
  contact: ContactRow;
  isSelected: boolean;
  onToggle: () => void;
  agencyOptions: { id: string; name: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={onToggle} aria-label={`Select ${contact.firstName}`} />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-1.5">
          {contact.firstName} {contact.lastName}
          {contact.isPrimary && <Star className="size-3 fill-current text-muted-foreground" />}
        </div>
      </TableCell>
      <TableCell>
        {contact.agencyId ? (
          <Link href={`/agencies/${contact.agencyId}`} className="text-muted-foreground hover:text-primary hover:underline">
            {contact.agencyName}
          </Link>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{contact.jobTitle || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{contact.source || "—"}</TableCell>
      <TableCell>
        {contact.email ? (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
            <Mail className="size-3.5" /> {contact.email}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {contact.phone ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Phone className="size-3.5" /> {contact.phone}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
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
        <ContactFormDialog
          agencyId={contact.agencyId}
          agencyOptions={agencyOptions}
          contact={{
            id: contact.id,
            agencyId: contact.agencyId,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            jobTitle: contact.jobTitle,
            linkedinUrl: contact.linkedinUrl,
            isPrimary: contact.isPrimary,
            source: contact.source,
            notes: contact.notes,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Delete ${contact.firstName}?`}
          description="This removes the contact permanently."
          onConfirm={async () => {
            await deleteContactAction(contact.id);
            toast.success("Contact deleted.");
          }}
        />
      </TableCell>
    </TableRow>
  );
}
