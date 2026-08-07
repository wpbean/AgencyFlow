import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  Clock,
  Mail,
  Send,
  Inbox,
  Briefcase,
  Handshake,
  BarChart3,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_TOP: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Pipeline",
    items: [
      { title: "Agencies", href: "/agencies", icon: Building2 },
      { title: "Contacts", href: "/contacts", icon: Users },
      { title: "Opportunities", href: "/opportunities", icon: Target },
      { title: "EDD Customers", href: "/edd-customers", icon: ShoppingBag },
    ],
  },
  {
    label: "Outreach",
    items: [
      { title: "Follow-ups", href: "/follow-ups", icon: Clock },
      { title: "Email Templates", href: "/templates", icon: Mail },
      { title: "Campaigns", href: "/campaigns", icon: Send },
      { title: "Inbox", href: "/inbox", icon: Inbox },
    ],
  },
  {
    label: "Work",
    items: [
      { title: "Projects", href: "/projects", icon: Briefcase },
      { title: "Clients", href: "/clients", icon: Handshake },
    ],
  },
  {
    label: "Insights",
    items: [{ title: "Analytics", href: "/analytics", icon: BarChart3 }],
  },
];
