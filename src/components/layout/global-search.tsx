"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, Users, Target, Briefcase, Loader2 } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type SearchResults = {
  agencies: { id: string; name: string; website: string | null; status: string }[];
  contacts: { id: string; firstName: string; lastName: string | null; email: string | null; agencyId: string | null }[];
  opportunities: { id: string; title: string; stage: string; agencyId: string }[];
  projects: { id: string; name: string; status: string; agencyId: string }[];
};

const EMPTY_RESULTS: SearchResults = { agencies: [], contacts: [], opportunities: [], projects: [] };

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable || !!el.closest('[role="dialog"]');
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.key) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key.toLowerCase() === "n" && !isTypingTarget(e.target) && !open) {
        e.preventDefault();
        router.push("/agencies?new=1");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, router]);

  useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-change loading flag
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data: SearchResults) => {
        if (!cancelled) setResults(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const displayResults = debouncedQuery.trim().length < 2 ? EMPTY_RESULTS : results;
  const hasResults =
    displayResults.agencies.length +
      displayResults.contacts.length +
      displayResults.opportunities.length +
      displayResults.projects.length >
    0;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-64 shrink-0 justify-between text-muted-foreground font-normal sm:flex hidden"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          Search...
        </span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span>⌘</span>K
        </kbd>
      </Button>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)} className="sm:hidden">
        <Search className="size-4" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
        <CommandInput placeholder="Search agencies, contacts, opportunities, projects..." value={query} onValueChange={setQuery} />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching...
            </div>
          )}
          {!loading && query.trim().length >= 2 && !hasResults && <CommandEmpty>No results found.</CommandEmpty>}
          {!loading && query.trim().length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">Type at least 2 characters to search.</div>
          )}
          {!loading && displayResults.agencies.length > 0 && (
            <CommandGroup heading="Agencies">
              {displayResults.agencies.map((a) => (
                <CommandItem key={a.id} value={a.id} onSelect={() => go(`/agencies/${a.id}`)}>
                  <Building2 className="size-4 text-muted-foreground" />
                  <span>{a.name}</span>
                  {a.website && <span className="ml-auto truncate text-xs text-muted-foreground">{a.website}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!loading && displayResults.contacts.length > 0 && (
            <CommandGroup heading="Contacts">
              {displayResults.contacts.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => go(c.agencyId ? `/agencies/${c.agencyId}` : `/contacts?q=${encodeURIComponent(c.firstName)}`)}
                >
                  <Users className="size-4 text-muted-foreground" />
                  <span>
                    {c.firstName} {c.lastName ?? ""}
                  </span>
                  {c.email && <span className="ml-auto truncate text-xs text-muted-foreground">{c.email}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!loading && displayResults.opportunities.length > 0 && (
            <CommandGroup heading="Opportunities">
              {displayResults.opportunities.map((o) => (
                <CommandItem key={o.id} value={o.id} onSelect={() => go(`/opportunities?highlight=${o.id}`)}>
                  <Target className="size-4 text-muted-foreground" />
                  <span>{o.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{o.stage}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!loading && displayResults.projects.length > 0 && (
            <CommandGroup heading="Projects">
              {displayResults.projects.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => go(`/projects?highlight=${p.id}`)}>
                  <Briefcase className="size-4 text-muted-foreground" />
                  <span>{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
