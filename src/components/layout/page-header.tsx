import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { GlobalSearch } from "./global-search";
import { QuickAddMenu } from "./quick-add-menu";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-col gap-4 border-b bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav />
        {backHref && (
          <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <GlobalSearch />
        <QuickAddMenu />
      </div>
    </div>
  );
}
