import Link from "next/link";
import { format } from "date-fns";
import { Handshake } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getClientAgencies } from "@/db/queries/projects";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const clients = await getClientAgencies();

  return (
    <>
      <PageHeader title="Clients" subtitle={`${clients.length} agenc${clients.length === 1 ? "y" : "ies"} converted to clients`} />
      <div className="p-4 sm:p-6">
        {clients.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No clients yet"
            description="Agencies appear here once you move their status to Client."
          />
        ) : (
          <Card className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Client</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Active Projects</TableHead>
                    <TableHead>Total Projects</TableHead>
                    <TableHead>Last Project</TableHead>
                    <TableHead>Client Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`/agencies/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
                      <TableCell>
                        {c.activeProjects > 0 ? (
                          <Badge variant="outline" className="border-success/20 bg-success/15 text-success">
                            {c.activeProjects} active
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.totalProjects}</TableCell>
                      <TableCell className="text-muted-foreground">{c.lastProject?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{format(c.updatedAt, "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
