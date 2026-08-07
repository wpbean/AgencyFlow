export type TemplateVariables = {
  first_name?: string | null;
  last_name?: string | null;
  agency_name?: string | null;
  website?: string | null;
  country?: string | null;
};

export function renderTemplate(text: string, vars: Record<string, string | null | undefined>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = vars[key];
    return value ? String(value) : "";
  });
}

export function buildGmailComposeUrl(params: { to?: string; subject: string; body: string }): string {
  const url = new URL("https://mail.google.com/mail/?view=cm&fs=1");
  if (params.to) url.searchParams.set("to", params.to);
  url.searchParams.set("su", params.subject);
  url.searchParams.set("body", params.body);
  return url.toString();
}
