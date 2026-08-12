"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, UserCheck, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelectFilter } from "@/components/common/multi-select-filter";
import { SearchInput } from "@/components/common/search-input";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function EddCustomersFilters({ productOptions }: { productOptions: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebouncedValue(q, 300);

  const productId = searchParams.get("productId")?.split(",").filter(Boolean) ?? [];
  const synced = searchParams.get("synced");
  const excludeUnsubscribed = searchParams.get("excludeUnsubscribed") === "1";

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

  const hasFilters = productId.length || synced || excludeUnsubscribed || q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput value={q} onChange={setQ} placeholder="Search customers..." />
      <MultiSelectFilter
        label="Product"
        options={productOptions.map((p) => ({ value: p.id, label: p.name }))}
        selected={productId}
        onChange={(v) => updateParams({ productId: v.join(",") || null })}
      />
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", synced === "0" && "border-primary/50 text-foreground")}
        onClick={() => updateParams({ synced: synced === "0" ? null : "0" })}
      >
        <UserCheck className="size-3.5" /> Not in Contacts
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn("gap-1.5", excludeUnsubscribed && "border-primary/50 text-foreground")}
        onClick={() => updateParams({ excludeUnsubscribed: excludeUnsubscribed ? null : "1" })}
      >
        <MailX className="size-3.5" /> Hide unsubscribed
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
