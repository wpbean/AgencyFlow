import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { agencies } from "@/db/schema";

type Agency = typeof agencies.$inferSelect;
type Tag = { id: string; name: string; color: string };

export function OverviewTab({ agency, tags }: { agency: Agency; tags: Tag[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{agency.description || "No description yet."}</p>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {(agency.services ?? []).length === 0 && <span className="text-sm text-muted-foreground">—</span>}
              {(agency.services ?? []).map((s) => (
                <Badge key={s} variant="secondary" className="font-normal">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Technologies</p>
            <div className="flex flex-wrap gap-1.5">
              {(agency.technologies ?? []).length === 0 && <span className="text-sm text-muted-foreground">—</span>}
              {(agency.technologies ?? []).map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
              {tags.map((t) => (
                <Badge key={t.id} variant="outline">
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
          {agency.notes && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Notes</p>
              <p className="whitespace-pre-wrap text-sm">{agency.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <DetailRow label="Company Size" value={agency.companySize} />
          <DetailRow label="Timezone" value={agency.timezone} />
          <DetailRow label="Source" value={agency.source} />
          <DetailRow label="Country" value={agency.country} />
          <DetailRow label="City" value={agency.city} />
          <DetailRow label="Added" value={agency.createdAt.toLocaleDateString()} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value || "—"}</span>
    </div>
  );
}
