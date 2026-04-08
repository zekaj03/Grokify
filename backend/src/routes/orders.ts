/**
 * Orders Routes
 *
 * GET /api/orders         — recent orders from Shopify
 * GET /api/orders/stats   — revenue stats + KPIs
 */

import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getClientForShop } from '../services/shopify.js';

const router = Router();
router.use(requireAuth);

// ── ORDERS LIST ──────────────────────────────────────────

router.get('/', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const status = (req.query.status as string) || 'any';
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 250);

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const orders = await client.getOrders(status, limit);
    res.json({ orders, count: orders.length });
  } catch (e) {
    console.error('[Orders] Fetch failed:', e);
    res.status(502).json({ error: 'Could not fetch orders from Shopify' });
  }
});

// ── REVENUE STATS (KPIs for Dashboard) ──────────────────

router.get('/stats', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);

    // MTD (month to date)
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    // Previous month
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const [mtd, prev] = await Promise.all([
      client.getSalesData(mtdStart),
      client.getSalesData(prevStart),
    ]);

    const trend = prev.total > 0
      ? Math.round(((mtd.total - prev.total) / prev.total) * 100 * 10) / 10
      : 0;

    const [products, orderCount] = await Promise.all([
      client.getProducts(250),
      client.getOrderCount(),
    ]);

    const activeProducts = products.filter(p => p.status === 'active').length;
    const avgSEOScore = 72; // Will be enriched once SEO analysis runs

    res.json({
      revenue: {
        mtd: mtd.total,
        orderCount: mtd.count,
        trend,
        currency: 'CHF',
      },
      products: {
        total: products.length,
        active: activeProducts,
        draft: products.filter(p => p.status === 'draft').length,
        archived: products.filter(p => p.status === 'archived').length,
      },
      seo: { avgScore: avgSEOScore },
      orders: { total: orderCount },
    });
  } catch (e) {
    console.error('[Orders] Stats failed:', e);
    res.status(502).json({ error: 'Could not fetch stats' });
  }
});

export default router;
