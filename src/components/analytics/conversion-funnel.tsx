import type { ConversionFunnel } from "@/db/queries/analytics";

export function ConversionFunnelChart({ funnel }: { funnel: ConversionFunnel }) {
  const steps = [
    { label: "Total Agencies", value: funnel.total },
    { label: "Contacted", value: funnel.contacted },
    { label: "Replied", value: funnel.replied },
    { label: "Interested", value: funnel.interested },
    { label: "Interview", value: funnel.interview },
    { label: "Project", value: funnel.project },
    { label: "Client", value: funnel.client },
  ];
  const max = Math.max(1, funnel.total);

  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">{step.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
            <div
              className="flex h-full items-center justify-end rounded bg-primary/70 pr-2 text-xs font-medium text-primary-foreground"
              style={{ width: `${Math.max(4, (step.value / max) * 100)}%` }}
            >
              {step.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
