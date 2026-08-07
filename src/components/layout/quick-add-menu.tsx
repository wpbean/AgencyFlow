"use client";

import Link from "next/link";
import { Plus, Building2, Users, Clock, Target, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const QUICK_ADD_ITEMS = [
  { label: "New Agency", href: "/agencies?new=1", icon: Building2 },
  { label: "New Contact", href: "/contacts?new=1", icon: Users },
  { label: "New Follow-up", href: "/follow-ups?new=1", icon: Clock },
  { label: "New Opportunity", href: "/opportunities?new=1", icon: Target },
  { label: "New Project", href: "/projects?new=1", icon: Briefcase },
];

export function QuickAddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Quick Add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Create new</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {QUICK_ADD_ITEMS.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <item.icon className="size-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
