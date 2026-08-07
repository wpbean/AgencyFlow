import { ToneBadge } from "@/components/common/tone-badge";
import type { ConversationLinkStatus } from "@/db/schema";

export function ConversationLinkBadge({ linkStatus }: { linkStatus: ConversationLinkStatus }) {
  return linkStatus === "LINKED" ? <ToneBadge tone="primary">Linked</ToneBadge> : <ToneBadge tone="neutral">Unlinked</ToneBadge>;
}
