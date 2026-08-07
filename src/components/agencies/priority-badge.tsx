import { ToneBadge } from "@/components/common/tone-badge";
import { PRIORITY_META } from "@/lib/labels";
import type { Priority } from "@/db/schema";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_META[priority];
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}
