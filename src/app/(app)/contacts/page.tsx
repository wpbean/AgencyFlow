import { PageHeader } from "@/components/layout/page-header";
import { ContactsExplorer } from "@/components/contacts/contacts-explorer";
import { ContactCreateTrigger } from "@/components/contacts/contact-create-trigger";
import { ContactsCsvImportDialog } from "@/components/contacts/contacts-csv-import-dialog";
import { ExportContactsButton } from "@/components/contacts/export-contacts-button";
import { listContacts, getAgencyOptions, getContactFilterOptions, type ContactListFilters, type ContactSort } from "@/db/queries/contacts";

export const metadata = { title: "Contacts" };

type SearchParams = Record<string, string | string[] | undefined>;

function parseList(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  const str = Array.isArray(value) ? value[0] : value;
  return str.split(",").filter(Boolean);
}

export default async function ContactsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const sort: ContactSort = "created";

  const filters: ContactListFilters = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    agencyId: parseList(sp.agencyId),
    jobTitle: parseList(sp.jobTitle),
    source: parseList(sp.source),
    isPrimary: sp.isPrimary === "1" ? true : undefined,
    hasEmail: sp.hasEmail === "1" ? true : undefined,
    hasPhone: sp.hasPhone === "1" ? true : undefined,
    excludeUnsubscribed: sp.excludeUnsubscribed === "1" ? true : undefined,
  };

  const [{ rows, total, pageSize }, agencyOptions, filterOptions] = await Promise.all([
    listContacts(filters, sort, page),
    getAgencyOptions(),
    getContactFilterOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle={`${total} contact${total === 1 ? "" : "s"} across your agencies`}
        actions={
          <>
            <ExportContactsButton />
            <ContactsCsvImportDialog />
            <ContactCreateTrigger agencyOptions={agencyOptions} />
          </>
        }
      />
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <ContactsExplorer
          contacts={rows}
          total={total}
          page={page}
          pageSize={pageSize}
          agencyOptions={agencyOptions}
          jobTitles={filterOptions.jobTitles}
          sources={filterOptions.sources}
        />
      </div>
    </>
  );
}
