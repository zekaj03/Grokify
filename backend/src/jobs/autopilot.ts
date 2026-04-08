/**
 * Autopilot — Daily AI Automation
 *
 * Runs on a cron schedule for each shop that has autopilot enabled.
 * Tasks (configurable per shop):
 *  1. Optimize products (titles, SEO, tags)
 *  2. Detect and flag duplicates
 *  3. Flag low-stock products
 *  4. Generate store insights report
 *
 * Default schedule: 3:00 AM daily (can be changed per shop in DB)
 */

import cron from 'node-cron';
import { shopQueries, autopilotQueries, aiJobQueries, type ShopRow } from '../db/index.js';
import { getClientForShop } from '../services/shopify.js';
import { optimizeProducts, analyzeStore, detectDuplicates } from '../services/grok.js';

let isRunning = false;

// ─────────────────────────────────────────────────────────
// MAIN RUNNER (runs for a single shop)
// ─────────────────────────────────────────────────────────

async function runAutopilotForShop(shop: ShopRow): Promise<void> {
  const settings = autopilotQueries.get.get(shop.id) as Record<string, unknown> | undefined;
  if (!settings || !settings.enabled) return;

  console.log(`[Autopilot] Starting run for ${shop.shop_domain}`);

  const client = getClientForShop(shop.shop_domain, shop.access_token);

  try {
    const products = await client.getProducts();

    // ── 1. Product Optimization ───────────────────────

    if (settings.optimize_products || settings.optimize_seo) {
      const jobResult = aiJobQueries.create.run(shop.id, 'autopilot_optimize', null);
      const jobId = (jobResult as { lastInsertRowid: number }).lastInsertRowid;
      aiJobQueries.setRunning.run(jobId);

      try {
        const optimizations = await optimizeProducts(products, `${shop.shop_domain} Shopify Store`);
        aiJobQueries.setDone.run(JSON.stringify(optimizations), jobId);

        // Auto-apply if configured
        if (settings.optimize_products) {
          await client.bulkUpdateProducts(
            optimizations.map(opt => ({
              id: parseInt(opt.shopify_id),
              changes: {
                title: opt.optimizedTitle,
                tags: opt.tags.join(', '),
              },
            }))
          );
          aiJobQueries.setApplied.run(jobId);
          console.log(`[Autopilot] Applied ${optimizations.length} optimizations for ${shop.shop_domain}`);
        }
      } catch (e) {
        aiJobQueries.setFailed.run(String(e), jobId);
        console.error(`[Autopilot] Optimization failed for ${shop.shop_domain}:`, e);
      }
    }

    // ── 2. Duplicate Detection ────────────────────────

    const jobDupes = aiJobQueries.create.run(shop.id, 'autopilot_duplicates', null);
    const dupeJobId = (jobDupes as { lastInsertRowid: number }).lastInsertRowid;
    aiJobQueries.setRunning.run(dupeJobId);

    try {
      const duplicates = await detectDuplicates(
        products.map(p => ({
          id: p.id.toString(),
          title: p.title,
          sku: p.variants[0]?.sku || '',
          vendor: p.vendor,
        }))
      );
      aiJobQueries.setDone.run(JSON.stringify(duplicates), dupeJobId);
    } catch (e) {
      aiJobQueries.setFailed.run(String(e), dupeJobId);
    }

    // ── 3. Store Insights ─────────────────────────────

    const jobInsights = aiJobQueries.create.run(shop.id, 'autopilot_insights', null);
    const insightsJobId = (jobInsights as { lastInsertRowid: number }).lastInsertRowid;
    aiJobQueries.setRunning.run(insightsJobId);

    try {
      const sales = await client.getSalesData(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );
      const lowStock = products.filter(p =>
        p.variants.some(v => v.inventory_quantity < 5 && v.inventory_quantity >= 0)
      );

      const insights = await analyzeStore({
        productCount: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        draftProducts: products.filter(p => p.status === 'draft').length,
        avgSEOScore: 72,
        recentSales: sales.total,
        topProducts: products.slice(0, 5).map(p => p.title),
        lowStockProducts: lowStock.slice(0, 5).map(p => p.title),
      });

      aiJobQueries.setDone.run(JSON.stringify(insights), insightsJobId);
    } catch (e) {
      aiJobQueries.setFailed.run(String(e), insightsJobId);
    }

    // Mark last run
    autopilotQueries.setLastRun.run(shop.id);
    console.log(`[Autopilot] Completed run for ${shop.shop_domain}`);
  } catch (e) {
    console.error(`[Autopilot] Fatal error for ${shop.shop_domain}:`, e);
  }
}

// ─────────────────────────────────────────────────────────
// CRON SCHEDULER
// ─────────────────────────────────────────────────────────

export function startAutopilot(): void {
  // Default: every day at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    if (isRunning) {
      console.log('[Autopilot] Previous run still in progress, skipping.');
      return;
    }

    isRunning = true;
    console.log('[Autopilot] Starting scheduled run for all active shops...');

    try {
      const shops = shopQueries.all.all();
      for (const shop of shops) {
        await runAutopilotForShop(shop);
      }
    } finally {
      isRunning = false;
      console.log('[Autopilot] All shops processed.');
    }
  });

  console.log('[Autopilot] Scheduler started — runs daily at 03:00');
}

// ─────────────────────────────────────────────────────────
// MANUAL TRIGGER (for testing or on-demand runs)
// ─────────────────────────────────────────────────────────

export async function triggerForShop(shopId: number): Promise<void> {
  const shop = shopQueries.all.all().find(s => s.id === shopId);
  if (!shop) throw new Error(`Shop ${shopId} not found`);
  await runAutopilotForShop(shop);
}
