import { leadScoreLabel } from "@/lib/scoring";
import { ToneBadge } from "@/components/common/tone-badge";

export function LeadScoreBadge({ score }: { score: number }) {
  const { label, tone } = leadScoreLabel(score);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold tabular-nums">{score}</span>
      <ToneBadge tone={tone}>{label}</ToneBadge>
    </div>
  );
}
