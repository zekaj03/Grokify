/**
 * Products Routes
 *
 * GET  /api/products          — list all from Shopify (with cache)
 * GET  /api/products/:id      — single product
 * PUT  /api/products/:id      — update product in Shopify
 * POST /api/products/sync     — force re-sync from Shopify
 */

import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getClientForShop } from '../services/shopify.js';
import { productCacheQueries } from '../db/index.js';

const router = Router();
router.use(requireAuth);

// ── LIST ─────────────────────────────────────────────────

router.get('/', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const products = await client.getProducts();

    // Update cache
    const upsert = productCacheQueries.upsert;
    for (const p of products) {
      upsert.run(shop.id, p.id.toString(), JSON.stringify(p));
    }

    res.json({ products, count: products.length, synced_at: new Date().toISOString() });
  } catch (e) {
    console.error('[Products] Fetch failed:', e);

    // Fallback to cache if Shopify is unreachable
    const cached = productCacheQueries.list.all(shop.id);
    if (cached.length > 0) {
      res.json({
        products: cached.map(r => JSON.parse(r.data as unknown as string)),
        count: cached.length,
        from_cache: true,
      });
    } else {
      res.status(502).json({ error: 'Could not reach Shopify and no cache available' });
    }
  }
});

// ── SINGLE PRODUCT ───────────────────────────────────────

router.get('/:id', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const id = parseInt(req.params.id);

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const product = await client.getProduct(id);
    res.json({ product });
  } catch (e) {
    res.status(404).json({ error: 'Product not found' });
  }
});

// ── UPDATE ───────────────────────────────────────────────

router.put('/:id', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const id = parseInt(req.params.id);
  const updates = req.body;

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const updated = await client.updateProduct(id, updates);

    // Refresh cache entry
    productCacheQueries.upsert.run(shop.id, id.toString(), JSON.stringify(updated));

    res.json({ product: updated });
  } catch (e) {
    console.error('[Products] Update failed:', e);
    res.status(500).json({ error: 'Failed to update product in Shopify' });
  }
});

// ── BULK UPDATE ──────────────────────────────────────────

router.post('/bulk-update', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const { updates } = req.body as {
    updates: Array<{ id: number; changes: Record<string, unknown> }>;
  };

  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400).json({ error: 'updates array is required' });
    return;
  }

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const results = await client.bulkUpdateProducts(updates);

    // Refresh cache
    for (const p of results) {
      productCacheQueries.upsert.run(shop.id, p.id.toString(), JSON.stringify(p));
    }

    res.json({ updated: results, count: results.length });
  } catch (e) {
    console.error('[Products] Bulk update failed:', e);
    res.status(500).json({ error: 'Bulk update failed' });
  }
});

// ── FORCE SYNC ───────────────────────────────────────────

router.post('/sync', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const products = await client.getProducts(250);

    // Clear old cache and refill
    productCacheQueries.clear.run(shop.id);
    for (const p of products) {
      productCacheQueries.upsert.run(shop.id, p.id.toString(), JSON.stringify(p));
    }

    res.json({ synced: products.length, synced_at: new Date().toISOString() });
  } catch (e) {
    console.error('[Products] Sync failed:', e);
    res.status(502).json({ error: 'Sync failed' });
  }
});

export default router;
