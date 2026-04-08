/**
 * Shopify Webhook Handlers
 *
 * Shopify calls these URLs in real-time when shop events happen.
 * Each webhook is verified with HMAC before processing.
 *
 * Registered topics:
 *  - products/create  → log + refresh cache
 *  - products/update  → refresh cache
 *  - orders/create    → log for analytics
 *  - app/uninstalled  → deactivate shop in DB
 */

import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import db, { shopQueries, productCacheQueries } from '../db/index.js';

const router = Router();

// ─────────────────────────────────────────────────────────
// HMAC VERIFICATION MIDDLEWARE
// ─────────────────────────────────────────────────────────

function verifyShopifyWebhook(req: Request, res: Response): boolean {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!hmac || !rawBody) {
    res.status(401).json({ error: 'Missing HMAC' });
    return false;
  }

  const expected = crypto
    .createHmac('sha256', config.shopify.apiSecret || config.shopify.adminApiToken)
    .update(rawBody)
    .digest('base64');

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
    res.status(401).json({ error: 'HMAC mismatch' });
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────
// SHARED HANDLER LOGIC
// ─────────────────────────────────────────────────────────

function getShopFromHeader(req: Request): ReturnType<typeof shopQueries.findByDomain.get> | null {
  const domain = req.headers['x-shopify-shop-domain'] as string;
  if (!domain) return null;
  return shopQueries.findByDomain.get(domain) ?? null;
}

function logWebhookEvent(shopId: number, topic: string, payload: unknown): void {
  try {
    db.prepare(
      'INSERT INTO webhook_events (shop_id, topic, payload) VALUES (?, ?, ?)'
    ).run(shopId, topic, JSON.stringify(payload));
  } catch (e) {
    console.error('[Webhook] Log failed:', e);
  }
}

// ─────────────────────────────────────────────────────────
// PRODUCTS/CREATE
// ─────────────────────────────────────────────────────────

router.post('/products-create', async (req: Request, res: Response) => {
  if (!verifyShopifyWebhook(req, res)) return;

  const shop = getShopFromHeader(req);
  if (!shop) { res.status(200).end(); return; }

  const product = req.body;
  logWebhookEvent(shop.id, 'products/create', product);

  // Add to product cache
  productCacheQueries.upsert.run(shop.id, product.id.toString(), JSON.stringify(product));

  console.log(`[Webhook] products/create — ${shop.shop_domain} — ${product.title}`);
  res.status(200).end();
});

// ─────────────────────────────────────────────────────────
// PRODUCTS/UPDATE
// ─────────────────────────────────────────────────────────

router.post('/products-update', async (req: Request, res: Response) => {
  if (!verifyShopifyWebhook(req, res)) return;

  const shop = getShopFromHeader(req);
  if (!shop) { res.status(200).end(); return; }

  const product = req.body;
  logWebhookEvent(shop.id, 'products/update', product);

  // Refresh cache entry
  productCacheQueries.upsert.run(shop.id, product.id.toString(), JSON.stringify(product));

  console.log(`[Webhook] products/update — ${shop.shop_domain} — ${product.title}`);
  res.status(200).end();
});

// ─────────────────────────────────────────────────────────
// ORDERS/CREATE
// ─────────────────────────────────────────────────────────

router.post('/orders-create', async (req: Request, res: Response) => {
  if (!verifyShopifyWebhook(req, res)) return;

  const shop = getShopFromHeader(req);
  if (!shop) { res.status(200).end(); return; }

  const order = req.body;
  logWebhookEvent(shop.id, 'orders/create', order);

  console.log(
    `[Webhook] orders/create — ${shop.shop_domain} — Order #${order.order_number} CHF ${order.total_price}`
  );
  res.status(200).end();
});

// ─────────────────────────────────────────────────────────
// APP/UNINSTALLED
// ─────────────────────────────────────────────────────────

router.post('/app-uninstalled', (req: Request, res: Response) => {
  if (!verifyShopifyWebhook(req, res)) return;

  const domain = req.headers['x-shopify-shop-domain'] as string;
  if (domain) {
    db.prepare("UPDATE shops SET is_active = 0, updated_at = datetime('now') WHERE shop_domain = ?")
      .run(domain);
    console.log(`[Webhook] app/uninstalled — ${domain} deactivated`);
  }
  res.status(200).end();
});

export default router;
