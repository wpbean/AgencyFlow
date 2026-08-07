export type CsvAgencyRow = {
  agency_name: string;
  website: string;
  country: string;
  city: string;
  email: string;
  contact_name: string;
  job_title: string;
  services: string;
  technologies: string;
  source: string;
  notes: string;
};

export const CSV_COLUMNS: (keyof CsvAgencyRow)[] = [
  "agency_name",
  "website",
  "country",
  "city",
  "email",
  "contact_name",
  "job_title",
  "services",
  "technologies",
  "source",
  "notes",
];

export const MAX_CSV_ROWS = 2000;

export function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function normalizeWebsite(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}
