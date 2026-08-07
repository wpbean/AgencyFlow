import "server-only";

export type EddConfig = {
  siteUrl: string;
  apiKey: string;
  apiToken: string;
};

export class EddApiError extends Error {}

export type EddProduct = {
  id: string;
  name: string;
  price: number | null;
};

export type EddCustomer = {
  eddCustomerId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  dateCreated: Date | null;
  purchaseCount: number;
  purchaseValue: number;
};

export type EddSale = {
  customerId: number | null;
  email: string | null;
  productIds: string[];
};

const PAGE_SIZE = 100;
const MAX_PAGES = 5000; // safety valve against a runaway/misbehaving API
const REQUEST_TIMEOUT_MS = 30_000;

export function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function parseNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value || value.startsWith("0000-00-00")) return null;
  const d = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** True when the EDD API responded with its `{ "error": "..." }` shape instead of data. */
function isEddErrorBody(body: unknown): body is { error: string } {
  return !!body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string";
}

async function eddRequest(config: EddConfig, endpoint: string, params: Record<string, string | number>): Promise<unknown> {
  const url = new URL(`${normalizeSiteUrl(config.siteUrl)}/edd-api/v2/${endpoint}`);
  url.searchParams.set("key", config.apiKey);
  url.searchParams.set("token", config.apiToken);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new EddApiError(`Could not reach ${normalizeSiteUrl(config.siteUrl)}: ${err instanceof Error ? err.message : String(err)}`);
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new EddApiError(
      `EDD API returned a non-JSON response (HTTP ${res.status}) from /${endpoint} — check the Site URL and that pretty permalinks are enabled.`
    );
  }

  if (!res.ok) {
    const message = isEddErrorBody(body) ? body.error : `HTTP ${res.status}`;
    throw new EddApiError(`EDD API error on /${endpoint}: ${message}`);
  }

  return body;
}

function describeUnexpectedBody(body: unknown): string {
  if (!body || typeof body !== "object") return `got ${JSON.stringify(body)?.slice(0, 200)}`;
  return `got keys [${Object.keys(body).join(", ")}]: ${JSON.stringify(body).slice(0, 300)}`;
}

/**
 * EDD's REST API stamps every successful response with a numeric `request_speed`,
 * including list endpoints. When a list endpoint (customers/sales/...) has zero matching
 * rows, EDD omits the list key entirely instead of returning an empty array — so a body
 * that's just `{ request_speed }` is a legitimate "no results", not a malformed response.
 */
function isEddEmptyListBody(body: unknown): boolean {
  return !!body && typeof body === "object" && typeof (body as Record<string, unknown>).request_speed === "number";
}

/**
 * Verifies the site URL + key/token can reach the EDD REST API. Checked against /customers
 * (not /products) because some EDD setups expose product listings more permissively than
 * customer data — a key/token that can list products isn't proof it can read customers/sales.
 */
export async function testEddConnection(config: EddConfig): Promise<void> {
  const body = await eddRequest(config, "customers", { number: 1 });
  if (isEddErrorBody(body)) throw new EddApiError(`EDD API error on /customers: ${body.error}`);
  if (!body || typeof body !== "object" || (!("customers" in body) && !isEddEmptyListBody(body))) {
    throw new EddApiError(`Unexpected response from /customers — ${describeUnexpectedBody(body)}`);
  }
}

function extractProduct(raw: unknown): EddProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const info = (raw as Record<string, unknown>).info as Record<string, unknown> | undefined;
  const id = info?.id;
  if (id === undefined || id === null) return null;

  const pricing = (raw as Record<string, unknown>).pricing;
  let price: number | null = null;
  if (typeof pricing === "number") price = pricing;
  else if (pricing && typeof pricing === "object") {
    const values = Object.values(pricing as Record<string, unknown>).map(parseNumber).filter((n): n is number => n !== null);
    if (values.length) price = Math.min(...values);
  }

  return {
    id: String(id),
    name: typeof info?.title === "string" ? info.title : `Product #${id}`,
    price,
  };
}

export async function fetchAllEddProducts(config: EddConfig): Promise<EddProduct[]> {
  const products: EddProduct[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await eddRequest(config, "products", { number: PAGE_SIZE, page });
    if (isEddErrorBody(body)) {
      if (page === 1) throw new EddApiError(`EDD API error on /products: ${body.error}`);
      break;
    }
    const list = (body as Record<string, unknown>)?.products;
    if (list === undefined && isEddEmptyListBody(body)) break;
    if (!Array.isArray(list)) {
      throw new EddApiError(`Unexpected /products response on page ${page} — ${describeUnexpectedBody(body)}`);
    }
    if (list.length === 0) break;
    for (const raw of list) {
      const product = extractProduct(raw);
      if (product) products.push(product);
    }
    if (list.length < PAGE_SIZE) break;
  }
  return products;
}

function extractCustomer(raw: unknown): EddCustomer | null {
  if (!raw || typeof raw !== "object") return null;
  const info = (raw as Record<string, unknown>).info as Record<string, unknown> | undefined;
  const stats = (raw as Record<string, unknown>).stats as Record<string, unknown> | undefined;
  const eddCustomerId = parseNumber(info?.id ?? info?.customer_id);
  const email = typeof info?.email === "string" ? info.email.trim().toLowerCase() : null;
  if (!eddCustomerId || !email) return null;

  return {
    eddCustomerId,
    email,
    firstName: typeof info?.first_name === "string" && info.first_name ? info.first_name : null,
    lastName: typeof info?.last_name === "string" && info.last_name ? info.last_name : null,
    dateCreated: parseDate(info?.date_created),
    purchaseCount: parseNumber(stats?.total_purchases) ?? 0,
    purchaseValue: parseNumber(stats?.total_spent) ?? 0,
  };
}

export async function fetchAllEddCustomers(
  config: EddConfig,
  opts?: { onPage?: (soFar: number) => void; onFirstPageRaw?: (raw: unknown) => void }
): Promise<EddCustomer[]> {
  const customers: EddCustomer[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await eddRequest(config, "customers", { number: PAGE_SIZE, page });
    if (page === 1) opts?.onFirstPageRaw?.(body);
    if (isEddErrorBody(body)) {
      if (page === 1) throw new EddApiError(`EDD API error on /customers: ${body.error}`);
      break;
    }
    const list = (body as Record<string, unknown>)?.customers;
    if (list === undefined && isEddEmptyListBody(body)) break;
    if (!Array.isArray(list)) {
      throw new EddApiError(`Unexpected /customers response on page ${page} — ${describeUnexpectedBody(body)}`);
    }
    if (list.length === 0) break;
    let extractedOnPage = 0;
    for (const raw of list) {
      const customer = extractCustomer(raw);
      if (customer) {
        customers.push(customer);
        extractedOnPage++;
      }
    }
    if (page === 1 && extractedOnPage === 0) {
      throw new EddApiError(
        `EDD returned ${list.length} customer row(s) on page 1 but none matched the expected shape — ${describeUnexpectedBody(list[0])}`
      );
    }
    opts?.onPage?.(customers.length);
    if (list.length < PAGE_SIZE) break;
  }
  return customers;
}

function extractSale(raw: unknown): EddSale | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const customerId = parseNumber(rec.customer_id);
  const email = typeof rec.email === "string" && rec.email ? rec.email.trim().toLowerCase() : null;
  if (!customerId && !email) return null;

  const products = Array.isArray(rec.products) ? rec.products : [];
  const productIds = products
    .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>).id : undefined))
    .filter((id): id is string | number => id !== undefined && id !== null)
    .map((id) => String(id));

  return { customerId, email, productIds };
}

export async function fetchAllEddSales(
  config: EddConfig,
  opts?: { onPage?: (soFar: number) => void; onFirstPageRaw?: (raw: unknown) => void }
): Promise<EddSale[]> {
  const sales: EddSale[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await eddRequest(config, "sales", { number: PAGE_SIZE, page });
    if (page === 1) opts?.onFirstPageRaw?.(body);
    if (isEddErrorBody(body)) {
      if (page === 1) throw new EddApiError(`EDD API error on /sales: ${body.error}`);
      break;
    }
    const list = (body as Record<string, unknown>)?.sales;
    if (list === undefined && isEddEmptyListBody(body)) break;
    if (!Array.isArray(list)) {
      throw new EddApiError(`Unexpected /sales response on page ${page} — ${describeUnexpectedBody(body)}`);
    }
    if (list.length === 0) break;
    let extractedOnPage = 0;
    for (const raw of list) {
      const sale = extractSale(raw);
      if (sale) {
        sales.push(sale);
        extractedOnPage++;
      }
    }
    if (page === 1 && extractedOnPage === 0) {
      throw new EddApiError(
        `EDD returned ${list.length} sale row(s) on page 1 but none matched the expected shape — ${describeUnexpectedBody(list[0])}`
      );
    }
    opts?.onPage?.(sales.length);
    if (list.length < PAGE_SIZE) break;
  }
  return sales;
}
