import Link from "next/link";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EddCustomersExplorer } from "@/components/edd/edd-customers-explorer";
import { Button } from "@/components/ui/button";
import {
  listEddCustomers,
  getEddProductOptions,
  getEddCustomerCounts,
  type EddCustomerListFilters,
} from "@/db/queries/edd-customers";

export const metadata = { title: "EDD Customers" };

type SearchParams = Record<string, string | string[] | undefined>;

function parseList(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  const str = Array.isArray(value) ? value[0] : value;
  return str.split(",").filter(Boolean);
}

export default async function EddCustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  const filters: EddCustomerListFilters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    productId: parseList(sp.productId),
    synced: sp.synced === "1" ? true : sp.synced === "0" ? false : undefined,
  };

  const [{ rows, total, pageSize }, productOptions, counts] = await Promise.all([
    listEddCustomers(filters, "created", page),
    getEddProductOptions(),
    getEddCustomerCounts(),
  ]);

  return (
    <>
      <PageHeader
        title="EDD Customers"
        subtitle={`${counts.total} synced customer${counts.total === 1 ? "" : "s"} from Easy Digital Downloads · ${counts.synced} added to Contacts`}
        actions={
          <Button variant="outline" size="lg" className="gap-1.5" asChild>
            <Link href="/settings">
              <Settings2 className="size-4" /> Manage Connection
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <EddCustomersExplorer customers={rows} total={total} page={page} pageSize={pageSize} productOptions={productOptions} />
      </div>
    </>
  );
}
