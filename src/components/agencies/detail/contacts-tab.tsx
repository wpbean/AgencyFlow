"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import type { contacts } from "@/db/schema";
import { ContactCard } from "@/components/contacts/contact-card";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

type Contact = typeof contacts.$inferSelect;

export function ContactsTab({ agencyId, contacts }: { agencyId: string; contacts: Contact[] }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <UserPlus className="size-4" /> Add Contact
        </Button>
      </div>
      {contacts.length === 0 ? (
        <EmptyState icon={Users} title="No contacts yet" description="Add the people you'll be talking to at this agency." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <ContactCard key={c.id} contact={c} />
          ))}
        </div>
      )}
      <ContactFormDialog agencyId={agencyId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
