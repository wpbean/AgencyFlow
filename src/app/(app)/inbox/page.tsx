import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";

export default function InboxIndexPage() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <EmptyState icon={MessageSquare} title="Select a conversation" description="Pick a reply from the list to view the thread." />
    </div>
  );
}
