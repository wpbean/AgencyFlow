"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TableRow } from "@/components/ui/table";

export function AgencyTableRow({ id, children }: { id: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(`/agencies/${id}`)}>
      {children}
    </TableRow>
  );
}
