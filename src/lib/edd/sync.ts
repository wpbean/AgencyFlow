import "server-only";
import { db } from "@/db";
import { eddCustomers, eddProducts, eddCustomerProducts } from "@/db/schema";
import { fetchAllEddProducts, fetchAllEddCustomers, fetchAllEddSales, type EddConfig } from "./client";
import { getEddIntegration, upsertEddIntegration } from "./settings";

let syncInFlight = false;

export function isEddSyncRunning(): boolean {
  return syncInFlight;
}

/**
 * Kicks off a full sync and returns once it has *started* — the sync itself keeps running
 * after this resolves. That's safe here because the app runs as a long-lived Node process
 * under PM2 (see ecosystem.config.js), not a serverless function whose lifetime ends with
 * the response. Callers should poll getEddIntegration() for progress.
 */
export async function startEddSync(): Promise<void> {
  if (syncInFlight) throw new Error("A sync is already running.");

  const integration = await getEddIntegration();
  if (!integration?.siteUrl || !integration.apiKey || !integration.apiToken) {
    throw new Error("Connect Easy Digital Downloads before syncing.");
  }

  const config: EddConfig = { siteUrl: integration.siteUrl, apiKey: integration.apiKey, apiToken: integration.apiToken };

  syncInFlight = true;
  await upsertEddIntegration({ syncStatus: "syncing", syncError: null });

  const debug: { customersSample?: string; salesSample?: string } = {};

  runSync(config, debug)
    .then(async (stats) => {
      await upsertEddIntegration({
        syncStatus: "success",
        syncError: null,
        lastSyncedAt: new Date(),
        lastSyncStats: stats,
        lastSyncDebug: debug,
      });
    })
    .catch(async (err) => {
      await upsertEddIntegration({
        syncStatus: "error",
        syncError: err instanceof Error ? err.message : String(err),
        lastSyncDebug: debug,
      });
    })
    .finally(() => {
      syncInFlight = false;
    });
}

function truncate(value: unknown): string {
  return JSON.stringify(value).slice(0, 1000);
}

async function runSync(
  config: EddConfig,
  debug: { customersSample?: string; salesSample?: string }
): Promise<{ products: number; customers: number; orders: number }> {
  const products = await fetchAllEddProducts(config);
  const knownProductIds = new Set(products.map((p) => p.id));

  for (const product of products) {
    await db
      .insert(eddProducts)
      .values({ id: product.id, name: product.name, price: product.price, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: eddProducts.id,
        set: { name: product.name, price: product.price, updatedAt: new Date() },
      });
  }

  const customers = await fetchAllEddCustomers(config, {
    onFirstPageRaw: (raw) => {
      debug.customersSample = truncate(raw);
    },
  });
  const localIdByEddCustomerId = new Map<number, string>();
  const localIdByEmail = new Map<string, string>();

  for (const customer of customers) {
    const [row] = await db
      .insert(eddCustomers)
      .values({
        eddCustomerId: customer.eddCustomerId,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        dateCreated: customer.dateCreated,
        purchaseCount: customer.purchaseCount,
        purchaseValue: customer.purchaseValue,
      })
      .onConflictDoUpdate({
        target: eddCustomers.eddCustomerId,
        set: {
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          dateCreated: customer.dateCreated,
          purchaseCount: customer.purchaseCount,
          purchaseValue: customer.purchaseValue,
          updatedAt: new Date(),
        },
      })
      .returning({ id: eddCustomers.id });
    localIdByEddCustomerId.set(customer.eddCustomerId, row.id);
    localIdByEmail.set(customer.email, row.id);
  }

  // Orders (sales) are the only source for which products a customer bought — the
  // customers endpoint only exposes aggregate stats. Rebuild the association table
  // from scratch each sync since there's no reliable per-row diff to apply.
  const sales = await fetchAllEddSales(config, {
    onFirstPageRaw: (raw) => {
      debug.salesSample = truncate(raw);
    },
  });
  const productIdsByLocalCustomerId = new Map<string, Set<string>>();

  for (const sale of sales) {
    if (sale.productIds.length === 0) continue;
    const localId =
      (sale.customerId !== null && localIdByEddCustomerId.get(sale.customerId)) ||
      (sale.email && localIdByEmail.get(sale.email)) ||
      null;
    if (!localId) continue;

    const set = productIdsByLocalCustomerId.get(localId) ?? new Set<string>();
    for (const productId of sale.productIds) {
      // Skip products no longer returned by /products (deleted/unpublished) — the FK
      // on edd_customer_products requires a matching edd_products row.
      if (knownProductIds.has(productId)) set.add(productId);
    }
    productIdsByLocalCustomerId.set(localId, set);
  }

  await db.delete(eddCustomerProducts);
  for (const [localCustomerId, productIds] of productIdsByLocalCustomerId) {
    for (const productId of productIds) {
      await db.insert(eddCustomerProducts).values({ eddCustomerId: localCustomerId, productId }).onConflictDoNothing();
    }
  }

  return { products: products.length, customers: customers.length, orders: sales.length };
}
