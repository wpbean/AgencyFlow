"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { ContactFormDialog } from "./contact-form-dialog";
import { Button } from "@/components/ui/button";

export function ContactCreateTrigger({ agencyOptions }: { agencyOptions: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs dialog open state to the ?new=1 URL param
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && searchParams.get("new") === "1") {
      const params = new URLSearchParams(searchParams);
      params.delete("new");
      router.replace(params.size ? `/contacts?${params}` : "/contacts");
    }
  }

  return (
    <>
      <Button size="lg" className="gap-1.5" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        New Contact
      </Button>
      <ContactFormDialog agencyId={null} agencyOptions={agencyOptions} open={open} onOpenChange={handleOpenChange} />
    </>
  );
}
