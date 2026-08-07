"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectFilter } from "@/components/common/multi-select-filter";
import { SearchInput } from "@/components/common/search-input";
import { AGENCY_STATUSES, PRIORITIES } from "@/db/schema";
import { AGENCY_STATUS_META, PRIORITY_META } from "@/lib/labels";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const SCORE_OPTIONS = [
  { value: "0", label: "Any score" },
  { value: "50", label: "50+" },
  { value: "70", label: "70+" },
  { value: "85", label: "85+" },
];

export function AgenciesFilters({ countries, sources }: { countries: string[]; sources: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebouncedValue(q, 300);

  const status = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const country = searchParams.get("country")?.split(",").filter(Boolean) ?? [];
  const priority = searchParams.get("priority")?.split(",").filter(Boolean) ?? [];
  const source = searchParams.get("source") ?? "";
  const minScore = searchParams.get("minScore") ?? "0";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params}`);
    });
  }

  useEffect(() => {
    if (debouncedQ !== (searchParams.get("q") ?? "")) {
      updateParams({ q: debouncedQ || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const hasFilters = status.length || country.length || priority.length || source || minScore !== "0" || q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput value={q} onChange={setQ} placeholder="Search agencies..." />
      <MultiSelectFilter
        label="Status"
        options={AGENCY_STATUSES.map((s) => ({ value: s, label: AGENCY_STATUS_META[s].label }))}
        selected={status}
        onChange={(v) => updateParams({ status: v.join(",") || null })}
      />
      <MultiSelectFilter
        label="Country"
        options={countries.map((c) => ({ value: c, label: c }))}
        selected={country}
        onChange={(v) => updateParams({ country: v.join(",") || null })}
      />
      <MultiSelectFilter
        label="Priority"
        options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
        selected={priority}
        onChange={(v) => updateParams({ priority: v.join(",") || null })}
      />
      <Select value={source || "any"} onValueChange={(v) => updateParams({ source: v === "any" ? null : v })}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any source</SelectItem>
          {sources.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={minScore} onValueChange={(v) => updateParams({ minScore: v === "0" ? null : v })}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCORE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!!hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
        >
          <X className="size-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
