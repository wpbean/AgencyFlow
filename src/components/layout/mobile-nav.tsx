"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Zap, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-0">
          <SheetTitle asChild>
            <div className="flex h-14 items-center gap-2 px-4">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Zap className="size-4" />
              </div>
              <span className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div onClick={() => setOpen(false)} className="flex flex-1 flex-col overflow-y-auto">
          <SidebarNav collapsed={false} />
          <div className="border-t p-3">
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-sidebar-accent",
                pathname.startsWith("/settings") ? "text-sidebar-primary" : "text-sidebar-foreground/70"
              )}
            >
              <Settings className="size-4" />
              Settings
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
