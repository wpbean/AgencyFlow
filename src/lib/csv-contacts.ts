export type CsvContactRow = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  agency_name: string;
  source: string;
  linkedin_url: string;
  is_primary: string;
  notes: string;
};

export const CSV_CONTACT_COLUMNS: (keyof CsvContactRow)[] = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "job_title",
  "agency_name",
  "source",
  "linkedin_url",
  "is_primary",
  "notes",
];

export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "1", "yes"].includes(value.trim().toLowerCase());
}
