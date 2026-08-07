"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportContactsButton() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  params.delete("page");
  const href = `/api/contacts/export${params.toString() ? `?${params}` : ""}`;

  return (
    <Button variant="outline" size="lg" className="gap-1.5" asChild>
      <a href={href} download>
        <Download className="size-4" /> Export CSV
      </a>
    </Button>
  );
}
