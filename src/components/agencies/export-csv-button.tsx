"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton() {
  return (
    <Button variant="outline" size="lg" className="gap-1.5" asChild>
      <a href="/api/agencies/export" download>
        <Download className="size-4" /> Export CSV
      </a>
    </Button>
  );
}
