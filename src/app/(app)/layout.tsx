import { Sidebar } from "@/components/layout/sidebar";
import { getFollowUpBadgeCounts } from "@/db/queries/follow-ups";
import { getUnreadConversationCount } from "@/db/queries/conversations";
import { getSettings } from "@/lib/settings";

// All pages under this layout read live data (agencies, follow-ups, settings).
// Force dynamic rendering so nothing gets frozen at build time.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [{ overdue, dueToday }, settings, unreadInboxCount] = await Promise.all([
    getFollowUpBadgeCounts(),
    getSettings(),
    getUnreadConversationCount(),
  ]);

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar followUpCount={overdue + dueToday} unreadInboxCount={unreadInboxCount} appName={settings.appName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
