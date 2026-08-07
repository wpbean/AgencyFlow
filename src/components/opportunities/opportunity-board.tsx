"use client";

import { useOptimistic, useState, useTransition } from "react";
import { updateOpportunityStageAction } from "@/actions/opportunities";
import { OPPORTUNITY_STAGE_META } from "@/lib/labels";
import type { OpportunityStage } from "@/db/schema";
import type { OpportunityRow } from "@/db/queries/opportunities";
import { OpportunityCard } from "./opportunity-card";
import { cn } from "@/lib/utils";

type Column = { stage: OpportunityStage; items: OpportunityRow[] };
type ContactOption = { id: string; firstName: string; lastName: string | null };

function moveItem(columns: Column[], action: { id: string; newStage: OpportunityStage }): Column[] {
  const { id, newStage } = action;
  let moved: OpportunityRow | undefined;
  const stripped = columns.map((col) => {
    const found = col.items.find((i) => i.id === id);
    if (found) moved = { ...found, stage: newStage };
    return { ...col, items: col.items.filter((i) => i.id !== id) };
  });
  if (!moved) return columns;
  return stripped.map((col) => (col.stage === newStage ? { ...col, items: [moved!, ...col.items] } : col));
}

export function OpportunityBoard({
  columns,
  contactsByAgency,
}: {
  columns: Column[];
  contactsByAgency: Record<string, ContactOption[]>;
}) {
  const [optimisticColumns, applyMove] = useOptimistic(columns, moveItem);
  const [, startTransition] = useTransition();
  const [dragOverStage, setDragOverStage] = useState<OpportunityStage | null>(null);

  function handleDrop(stage: OpportunityStage, id: string) {
    setDragOverStage(null);
    startTransition(async () => {
      applyMove({ id, newStage: stage });
      await updateOpportunityStageAction(id, stage);
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {optimisticColumns.map((col) => {
        const meta = OPPORTUNITY_STAGE_META[col.stage];
        return (
          <div
            key={col.stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(col.stage);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === col.stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/opportunity-id");
              if (id) handleDrop(col.stage, id);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2.5 transition-colors",
              dragOverStage === col.stage && "border-primary/50 bg-primary/5"
            )}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold">{meta.label}</span>
              <span className="text-xs text-muted-foreground">{col.items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {col.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/opportunity-id", item.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <OpportunityCard opportunity={item} contacts={contactsByAgency[item.agencyId] ?? []} showAgency />
                </div>
              ))}
              {col.items.length === 0 && (
                <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">Drop here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
