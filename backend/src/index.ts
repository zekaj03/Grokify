/**
 * Grokify Backend — Main Entry Point
 *
 * Express server that connects:
 *  - Shopify Admin API (real product/order data)
 *  - Grok AI (all AI calls, secure server-side)
 *  - SQLite DB (multi-tenant shop storage)
 *  - Shopify Webhooks (real-time events)
 *  - Autopilot Cron (daily automated tasks)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';

// Routes
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import aiRouter from './routes/ai.js';
import webhooksRouter from './routes/webhooks.js';

// Jobs
import { startAutopilot } from './jobs/autopilot.js';

// DB init (runs schema on first start)
import './db/index.js';

const app = express();

// ─────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────

app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Raw body needed for Shopify webhook HMAC verification — must come before JSON parser
app.use('/webhooks', express.raw({ type: 'application/json' }), (req, _res, next) => {
  (req as express.Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────

app.use('/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ai', aiRouter);
app.use('/webhooks', webhooksRouter);

// ── Health check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    shopify: config.shopify.storeDomain ? 'configured' : 'not configured',
    ai: config.grok.apiKey ? 'configured' : 'demo mode',
  });
});

// ── Autopilot trigger (for manual runs via dashboard) ────
app.post('/api/autopilot/run', async (_req, res) => {
  try {
    const { triggerForShop } = await import('./jobs/autopilot.js');
    const { shopQueries } = await import('./db/index.js');
    const shops = shopQueries.all.all();
    if (shops.length === 0) {
      res.status(400).json({ error: 'No active shops' });
      return;
    }
    // Run in background, don't block response
    triggerForShop(shops[0].id).catch(console.error);
    res.json({ message: 'Autopilot triggered', shopId: shops[0].id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// ── Autopilot settings ───────────────────────────────────
app.get('/api/autopilot/settings', async (req, res) => {
  const { requireAuth } = await import('./middleware/auth.js');
  const { autopilotQueries } = await import('./db/index.js');

  requireAuth(req, res, () => {
    const { shop } = req as express.Request & { shop: { id: number } };
    const settings = autopilotQueries.get.get(shop.id);
    res.json({ settings: settings || null });
  });
});

app.put('/api/autopilot/settings', async (req, res) => {
  const { requireAuth } = await import('./middleware/auth.js');
  const { autopilotQueries } = await import('./db/index.js');

  requireAuth(req, res, () => {
    const { shop } = req as express.Request & { shop: { id: number } };
    const { enabled, optimize_products, optimize_seo, auto_tag, auto_collections, price_monitoring, schedule_cron } = req.body;

    autopilotQueries.update.run(
      enabled ? 1 : 0,
      optimize_products ? 1 : 0,
      optimize_seo ? 1 : 0,
      auto_tag ? 1 : 0,
      auto_collections ? 1 : 0,
      price_monitoring ? 1 : 0,
      schedule_cron || '0 3 * * *',
      shop.id
    );

    res.json({ success: true });
  });
});

// ── 404 ──────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─────────────────────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────────────────────

async function start() {
  // Auto-register owner's private app on startup if env vars are set
  if (config.shopify.storeDomain && config.shopify.adminApiToken) {
    try {
      const { shopQueries, autopilotQueries } = await import('./db/index.js');
      const { shopQueries: sq } = await import('./db/index.js');
      shopQueries.upsert.run(config.shopify.storeDomain, config.shopify.adminApiToken);
      const shop = shopQueries.findByDomain.get(config.shopify.storeDomain);
      if (shop) {
        autopilotQueries.upsert.run(shop.id);
        console.log(`[Startup] Auto-registered shop: ${config.shopify.storeDomain}`);
      }
    } catch (e) {
      console.warn('[Startup] Could not auto-register shop:', e);
    }
  }

  // Start autopilot scheduler
  startAutopilot();

  app.listen(config.port, () => {
    console.log(`\n🚀 Grokify Backend running on http://localhost:${config.port}`);
    console.log(`   Health:   http://localhost:${config.port}/health`);
    console.log(`   Frontend: ${config.frontendUrl}`);
    console.log(`   Shop:     ${config.shopify.storeDomain || 'not configured'}`);
    console.log(`   AI:       ${config.grok.apiKey ? 'Grok AI ready' : 'Demo mode (no XAI_API_KEY)'}`);
    console.log('');
  });
}

start().catch(console.error);
