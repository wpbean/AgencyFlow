import { PageHeader } from "@/components/layout/page-header";
import { AgenciesFilters } from "@/components/agencies/agencies-filters";
import { AgenciesTable } from "@/components/agencies/agencies-table";
import { AgencyCreateDialog } from "@/components/agencies/agency-create-dialog";
import { CsvImportDialog } from "@/components/agencies/csv-import-dialog";
import { ExportCsvButton } from "@/components/agencies/export-csv-button";
import { PaginationBar } from "@/components/common/pagination-bar";
import { Card } from "@/components/ui/card";
import { listAgencies, getAgencyFilterOptions, type AgencyListFilters, type AgencySort } from "@/db/queries/agencies";
import type { AgencyStatus, Priority } from "@/db/schema";

export const metadata = { title: "Agencies" };

type SearchParams = Record<string, string | string[] | undefined>;

function parseList<T extends string>(value: string | string[] | undefined): T[] | undefined {
  if (!value) return undefined;
  const str = Array.isArray(value) ? value[0] : value;
  return str.split(",").filter(Boolean) as T[];
}

export default async function AgenciesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sort = (sp.sort as AgencySort) || "updated";

  const filters: AgencyListFilters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    status: parseList<AgencyStatus>(sp.status),
    country: parseList<string>(sp.country),
    priority: parseList<Priority>(sp.priority),
    source: typeof sp.source === "string" ? [sp.source] : undefined,
    minScore: sp.minScore ? Number(sp.minScore) : undefined,
  };

  const [{ rows, total, pageSize }, filterOptions] = await Promise.all([
    listAgencies(filters, sort, page),
    getAgencyFilterOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Agencies"
        subtitle={`${total} agenc${total === 1 ? "y" : "ies"} in your pipeline`}
        actions={
          <>
            <ExportCsvButton />
            <CsvImportDialog />
            <AgencyCreateDialog />
          </>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <AgenciesFilters countries={filterOptions.countries} sources={filterOptions.sources} />
        <Card className="p-0">
          <AgenciesTable agencies={rows} />
          <PaginationBar page={page} pageSize={pageSize} total={total} />
        </Card>
      </div>
    </>
  );
}
