"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Zap, Settings, Bell, Inbox, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const COLLAPSE_KEY = "agencyflow:sidebar-collapsed";

export function Sidebar({
  followUpCount,
  unreadInboxCount,
  appName,
}: {
  followUpCount: number;
  unreadInboxCount: number;
  appName: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe read of localStorage
    setMounted(true);
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        mounted && "transition-[width] duration-150",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 px-4", collapsed && "justify-center px-0")}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Zap className="size-4" />
        </div>
        {!collapsed && <span className="truncate text-sm font-semibold tracking-tight">{appName}</span>}
      </div>

      <SidebarNav collapsed={collapsed} />

      <div className="flex flex-col gap-1 border-t border-sidebar-border p-3">
        <SidebarBottomLink
          href="/follow-ups"
          icon={Bell}
          label="Notifications"
          collapsed={collapsed}
          badge={followUpCount > 0 ? followUpCount : undefined}
          active={pathname.startsWith("/follow-ups")}
        />
        <SidebarBottomLink
          href="/inbox"
          icon={Inbox}
          label="Inbox"
          collapsed={collapsed}
          badge={unreadInboxCount > 0 ? unreadInboxCount : undefined}
          active={pathname.startsWith("/inbox")}
        />
        <SidebarBottomLink
          href="/settings"
          icon={Settings}
          label="Settings"
          collapsed={collapsed}
          active={pathname.startsWith("/settings")}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn("mt-1 justify-start gap-2.5 text-sidebar-foreground/60", collapsed && "justify-center px-0")}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Collapse"}
        </Button>
        {!collapsed && <div className="px-2.5 pt-1 text-[11px] text-sidebar-foreground/30">v0.1.0</div>}
      </div>
    </aside>
  );
}

function SidebarBottomLink({
  href,
  icon: Icon,
  label,
  collapsed,
  badge,
  active,
}: {
  href: string;
  icon: typeof Bell;
  label: string;
  collapsed: boolean;
  badge?: number;
  active?: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active ? "text-sidebar-primary" : "text-sidebar-foreground/70",
        collapsed && "justify-center px-0"
      )}
    >
      <span className="relative flex">
        <Icon className="size-4 shrink-0" />
        {!!badge && (
          <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-danger-foreground">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="flex flex-1 items-center justify-between truncate">
          {label}
          {!!badge && <span className="text-xs text-sidebar-foreground/40">{badge}</span>}
        </span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
