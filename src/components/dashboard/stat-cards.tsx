import Link from "next/link";
import {
  Building2,
  Sparkles,
  MailQuestion,
  Clock,
  ThumbsUp,
  Target,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/db/queries/dashboard";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  tone: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex flex-row items-center justify-between gap-3 p-4 transition-colors hover:border-primary/40">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${tone}`}>
          <Icon className="size-4.5" />
        </div>
      </Card>
    </Link>
  );
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: "Total Agencies", value: stats.totalAgencies, icon: Building2, href: "/agencies", tone: "bg-info/15 text-info" },
    { label: "New Leads", value: stats.newLeads, icon: Sparkles, href: "/agencies?status=NEW", tone: "bg-primary/15 text-primary" },
    { label: "Waiting for Reply", value: stats.waitingForReply, icon: MailQuestion, href: "/agencies?status=CONTACTED,FOLLOW_UP", tone: "bg-warning/15 text-warning" },
    { label: "Follow-ups Today", value: stats.followUpsToday, icon: Clock, href: "/follow-ups", tone: "bg-danger/15 text-danger" },
    { label: "Interested", value: stats.interested, icon: ThumbsUp, href: "/agencies?status=INTERESTED", tone: "bg-success/15 text-success" },
    { label: "Active Opportunities", value: stats.activeOpportunities, icon: Target, href: "/opportunities", tone: "bg-info/15 text-info" },
    { label: "Clients", value: stats.clients, icon: Handshake, href: "/clients", tone: "bg-success/15 text-success" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
