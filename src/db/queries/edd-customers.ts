import "server-only";
import { db } from "@/db";
import { eddCustomers, eddCustomerProducts, eddProducts, emailSuppressions } from "@/db/schema";
import { eq, desc, asc, like, or, and, inArray, sql, exists, isNull, isNotNull, type SQL } from "drizzle-orm";

export type EddCustomerListFilters = {
  q?: string;
  productId?: string[];
  synced?: boolean;
  excludeUnsubscribed?: boolean;
};

export type EddCustomerSort = "created" | "purchases" | "spent" | "name";

const PAGE_SIZE = 25;

const customerSelection = {
  id: eddCustomers.id,
  eddCustomerId: eddCustomers.eddCustomerId,
  contactId: eddCustomers.contactId,
  firstName: eddCustomers.firstName,
  lastName: eddCustomers.lastName,
  email: eddCustomers.email,
  purchaseCount: eddCustomers.purchaseCount,
  purchaseValue: eddCustomers.purchaseValue,
  dateCreated: eddCustomers.dateCreated,
  // SQLite has no boolean type — .mapWith(Boolean) converts the raw 0/1 it
  // returns into a real JS boolean, otherwise `0 && <Badge/>` renders a stray "0".
  isUnsubscribed: sql<boolean>`${emailSuppressions.email} is not null`.mapWith(Boolean),
  createdAt: eddCustomers.createdAt,
};

// Joined (not stored) on lowercased email, same pattern as contacts — see
// src/db/queries/contacts.ts for why this isn't a stored column.
const suppressionJoinCondition = sql`lower(${eddCustomers.email}) = ${emailSuppressions.email}`;

function buildConditions(filters: EddCustomerListFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(
      or(like(eddCustomers.firstName, term), like(eddCustomers.lastName, term), like(eddCustomers.email, term))!
    );
  }
  if (filters.productId?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(eddCustomerProducts)
          .where(
            and(
              eq(eddCustomerProducts.eddCustomerId, eddCustomers.id),
              inArray(eddCustomerProducts.productId, filters.productId)
            )
          )
      )
    );
  }
  if (filters.synced === true) conditions.push(isNotNull(eddCustomers.contactId));
  if (filters.synced === false) conditions.push(isNull(eddCustomers.contactId));
  if (filters.excludeUnsubscribed) conditions.push(isNull(emailSuppressions.email));
  return conditions;
}

export async function listEddCustomers(filters: EddCustomerListFilters, sort: EddCustomerSort, page: number) {
  const where = and(...buildConditions(filters));

  const orderBy = {
    created: desc(eddCustomers.dateCreated),
    purchases: desc(eddCustomers.purchaseCount),
    spent: desc(eddCustomers.purchaseValue),
    name: asc(eddCustomers.firstName),
  }[sort];

  const [rows, totalRes] = await Promise.all([
    db
      .select(customerSelection)
      .from(eddCustomers)
      .leftJoin(emailSuppressions, suppressionJoinCondition)
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)` })
      .from(eddCustomers)
      .leftJoin(emailSuppressions, suppressionJoinCondition)
      .where(where),
  ]);

  const ids = rows.map((r) => r.id);
  const productRows = ids.length
    ? await db
        .select({ eddCustomerId: eddCustomerProducts.eddCustomerId, productId: eddProducts.id, productName: eddProducts.name })
        .from(eddCustomerProducts)
        .innerJoin(eddProducts, eq(eddCustomerProducts.productId, eddProducts.id))
        .where(inArray(eddCustomerProducts.eddCustomerId, ids))
    : [];

  const productsByCustomerId = new Map<string, { id: string; name: string }[]>();
  for (const p of productRows) {
    const list = productsByCustomerId.get(p.eddCustomerId) ?? [];
    list.push({ id: p.productId, name: p.productName });
    productsByCustomerId.set(p.eddCustomerId, list);
  }

  return {
    rows: rows.map((r) => ({ ...r, products: productsByCustomerId.get(r.id) ?? [] })),
    total: totalRes[0].count,
    pageSize: PAGE_SIZE,
  };
}

export type EddCustomerRow = Awaited<ReturnType<typeof listEddCustomers>>["rows"][number];

export async function listEddCustomersForExport(filters: EddCustomerListFilters) {
  const where = and(...buildConditions(filters));
  return db
    .select(customerSelection)
    .from(eddCustomers)
    .leftJoin(emailSuppressions, suppressionJoinCondition)
    .where(where)
    .orderBy(desc(eddCustomers.dateCreated));
}

export async function getEddProductOptions() {
  return db.select({ id: eddProducts.id, name: eddProducts.name }).from(eddProducts).orderBy(asc(eddProducts.name));
}

export async function getEddCustomerCounts() {
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(eddCustomers);
  const [{ synced }] = await db
    .select({ synced: sql<number>`count(*)` })
    .from(eddCustomers)
    .where(isNotNull(eddCustomers.contactId));
  return { total, synced };
}
