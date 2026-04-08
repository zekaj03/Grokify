/**
 * AI Routes — all Grok AI operations
 *
 * POST /api/ai/optimize          — optimize selected products + write to Shopify
 * POST /api/ai/seo-audit         — SEO audit for a single product
 * POST /api/ai/marketing         — generate marketing content
 * POST /api/ai/store-insights    — full store analysis
 * POST /api/ai/detect-duplicates — find duplicate products
 * GET  /api/ai/jobs              — list AI job history
 * POST /api/ai/jobs/:id/apply    — push AI job results to Shopify
 */

import { Router, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getClientForShop } from '../services/shopify.js';
import {
  optimizeProducts,
  auditProductSEO,
  generateMarketingContent,
  analyzeStore,
  detectDuplicates,
  type ProductOptimization,
} from '../services/grok.js';
import { aiJobQueries } from '../db/index.js';

const router = Router();
router.use(requireAuth);

// ── PRODUCT OPTIMIZATION ─────────────────────────────────

router.post('/optimize', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const { productIds, applyImmediately = false } = req.body as {
    productIds?: number[];
    applyImmediately?: boolean;
  };

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    let products = await client.getProducts();

    if (productIds?.length) {
      products = products.filter(p => productIds.includes(p.id));
    }

    if (products.length === 0) {
      res.status(400).json({ error: 'No products found' });
      return;
    }

    // Create job record
    const jobResult = aiJobQueries.create.run(shop.id, 'optimize_products', JSON.stringify({ productIds }));
    const jobId = (jobResult as { lastInsertRowid: number }).lastInsertRowid;
    aiJobQueries.setRunning.run(jobId);

    // Run AI
    const optimizations = await optimizeProducts(products);

    // Save results
    aiJobQueries.setDone.run(JSON.stringify(optimizations), jobId);

    // Apply to Shopify if requested
    if (applyImmediately) {
      await applyOptimizationsToShopify(client, optimizations);
      aiJobQueries.setApplied.run(jobId);
    }

    res.json({
      jobId,
      optimizations,
      applied: applyImmediately,
      count: optimizations.length,
    });
  } catch (e) {
    console.error('[AI] Optimize failed:', e);
    res.status(500).json({ error: 'AI optimization failed' });
  }
});

// ── APPLY JOB RESULTS TO SHOPIFY ─────────────────────────

router.post('/jobs/:id/apply', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const jobId = parseInt(req.params.id);

  const jobs = aiJobQueries.listForShop.all(shop.id);
  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  if (job.applied) {
    res.status(400).json({ error: 'Job already applied' });
    return;
  }
  if (!job.output) {
    res.status(400).json({ error: 'Job has no output to apply' });
    return;
  }

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const optimizations = JSON.parse(job.output) as ProductOptimization[];
    const updated = await applyOptimizationsToShopify(client, optimizations);
    aiJobQueries.setApplied.run(jobId);

    res.json({ applied: updated.length, jobId });
  } catch (e) {
    console.error('[AI] Apply job failed:', e);
    res.status(500).json({ error: 'Failed to apply changes to Shopify' });
  }
});

// ── SEO AUDIT ────────────────────────────────────────────

router.post('/seo-audit', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const { productId } = req.body as { productId: number };

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const product = await client.getProduct(productId);
    const audit = await auditProductSEO(product);

    res.json({ productId, audit });
  } catch (e) {
    console.error('[AI] SEO audit failed:', e);
    res.status(500).json({ error: 'SEO audit failed' });
  }
});

// ── MARKETING CONTENT ────────────────────────────────────

router.post('/marketing', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const { productId, type, tone } = req.body as {
    productId: number;
    type: 'instagram' | 'facebook' | 'email' | 'blog' | 'google_ads';
    tone?: 'professional' | 'casual' | 'luxury';
  };

  if (!productId || !type) {
    res.status(400).json({ error: 'productId and type are required' });
    return;
  }

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const product = await client.getProduct(productId);
    const content = await generateMarketingContent(type, product, tone);

    res.json({ productId, type, content });
  } catch (e) {
    console.error('[AI] Marketing generation failed:', e);
    res.status(500).json({ error: 'Content generation failed' });
  }
});

// ── STORE INSIGHTS ───────────────────────────────────────

router.post('/store-insights', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const [products, sales] = await Promise.all([
      client.getProducts(),
      client.getSalesData(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      ),
    ]);

    const activeProducts = products.filter(p => p.status === 'active');
    const lowStock = products.filter(p =>
      p.variants.some(v => v.inventory_quantity < 5 && v.inventory_quantity >= 0)
    );

    const insights = await analyzeStore({
      productCount: products.length,
      activeProducts: activeProducts.length,
      draftProducts: products.filter(p => p.status === 'draft').length,
      avgSEOScore: 72,
      recentSales: sales.total,
      topProducts: activeProducts.slice(0, 5).map(p => p.title),
      lowStockProducts: lowStock.slice(0, 5).map(p => p.title),
    });

    res.json({ insights });
  } catch (e) {
    console.error('[AI] Store insights failed:', e);
    res.status(500).json({ error: 'Store analysis failed' });
  }
});

// ── DUPLICATE DETECTION ──────────────────────────────────

router.post('/detect-duplicates', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;

  try {
    const client = getClientForShop(shop.shop_domain, shop.access_token);
    const products = await client.getProducts();

    const duplicates = await detectDuplicates(
      products.map(p => ({
        id: p.id.toString(),
        title: p.title,
        sku: p.variants[0]?.sku || '',
        vendor: p.vendor,
      }))
    );

    res.json({ duplicates, count: duplicates.length });
  } catch (e) {
    console.error('[AI] Duplicate detection failed:', e);
    res.status(500).json({ error: 'Duplicate detection failed' });
  }
});

// ── JOB HISTORY ──────────────────────────────────────────

router.get('/jobs', async (req, res: Response) => {
  const { shop } = req as AuthenticatedRequest;
  const jobs = aiJobQueries.listForShop.all(shop.id);
  res.json({ jobs });
});

// ─────────────────────────────────────────────────────────
// HELPER: Apply optimizations to Shopify
// ─────────────────────────────────────────────────────────

async function applyOptimizationsToShopify(
  client: ReturnType<typeof getClientForShop>,
  optimizations: ProductOptimization[]
) {
  return client.bulkUpdateProducts(
    optimizations.map(opt => ({
      id: parseInt(opt.shopify_id),
      changes: {
        title: opt.optimizedTitle,
        tags: opt.tags.join(', '),
        metafields: [
          {
            namespace: 'global',
            key: 'title_tag',
            value: opt.seoTitle,
            type: 'single_line_text_field',
          },
          {
            namespace: 'global',
            key: 'description_tag',
            value: opt.seoDescription,
            type: 'single_line_text_field',
          },
        ],
      },
    }))
  );
}

export default router;
