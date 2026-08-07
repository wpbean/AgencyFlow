"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, Star, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelectFilter } from "@/components/common/multi-select-filter";
import { SearchInput } from "@/components/common/search-input";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function ContactsFilters({
  agencyOptions,
  jobTitles,
  sources,
}: {
  agencyOptions: { id: string; name: string }[];
  jobTitles: string[];
  sources: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebouncedValue(q, 300);

  const agencyId = searchParams.get("agencyId")?.split(",").filter(Boolean) ?? [];
  const jobTitle = searchParams.get("jobTitle")?.split(",").filter(Boolean) ?? [];
  const source = searchParams.get("source")?.split(",").filter(Boolean) ?? [];
  const isPrimary = searchParams.get("isPrimary") === "1";
  const hasEmail = searchParams.get("hasEmail") === "1";
  const hasPhone = searchParams.get("hasPhone") === "1";

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

  const hasFilters = agencyId.length || jobTitle.length || source.length || isPrimary || hasEmail || hasPhone || q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput value={q} onChange={setQ} placeholder="Search contacts..." />
      <MultiSelectFilter
        label="Agency"
        options={agencyOptions.map((a) => ({ value: a.id, label: a.name }))}
        selected={agencyId}
        onChange={(v) => updateParams({ agencyId: v.join(",") || null })}
      />
      <MultiSelectFilter
        label="Job Title"
        options={jobTitles.map((j) => ({ value: j, label: j }))}
        selected={jobTitle}
        onChange={(v) => updateParams({ jobTitle: v.join(",") || null })}
      />
      <MultiSelectFilter
        label="Source"
        options={sources.map((s) => ({ value: s, label: s }))}
        selected={source}
        onChange={(v) => updateParams({ source: v.join(",") || null })}
      />
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", isPrimary && "border-primary/50 text-foreground")}
        onClick={() => updateParams({ isPrimary: isPrimary ? null : "1" })}
      >
        <Star className="size-3.5" /> Primary only
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", hasEmail && "border-primary/50 text-foreground")}
        onClick={() => updateParams({ hasEmail: hasEmail ? null : "1" })}
      >
        <Mail className="size-3.5" /> Has email
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", hasPhone && "border-primary/50 text-foreground")}
        onClick={() => updateParams({ hasPhone: hasPhone ? null : "1" })}
      >
        <Phone className="size-3.5" /> Has phone
      </Button>
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
