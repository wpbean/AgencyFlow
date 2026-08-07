import { ToneBadge } from "@/components/common/tone-badge";
import { AGENCY_STATUS_META } from "@/lib/labels";
import type { AgencyStatus } from "@/db/schema";

export function AgencyStatusBadge({ status }: { status: AgencyStatus }) {
  const meta = AGENCY_STATUS_META[status];
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}
