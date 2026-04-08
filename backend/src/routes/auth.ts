/**
 * Auth Routes
 *
 * Two flows:
 *  1. /auth/private  — owner's private app login (ikaufen.myshopify.com)
 *  2. /auth/install  — Shopify OAuth install for new SaaS customers
 *  3. /auth/callback — OAuth callback handler
 */

import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import db, { shopQueries, autopilotQueries } from '../db/index.js';
import { issueToken } from '../middleware/auth.js';
import { getPrivateClient, getClientForShop } from '../services/shopify.js';

const router = Router();

// ─────────────────────────────────────────────────────────
// PRIVATE APP LOGIN (for the owner — no OAuth dance needed)
// ─────────────────────────────────────────────────────────

/**
 * POST /auth/private
 * Body: { shopDomain, accessToken }
 *
 * Use this for your own ikaufen.myshopify.com setup.
 * Also called on first startup if SHOPIFY_STORE_DOMAIN is set.
 */
router.post('/private', async (req: Request, res: Response) => {
  const shopDomain = (req.body.shopDomain as string) || config.shopify.storeDomain;
  const accessToken = (req.body.accessToken as string) || config.shopify.adminApiToken;

  if (!shopDomain || !accessToken) {
    res.status(400).json({ error: 'shopDomain and accessToken are required' });
    return;
  }

  try {
    // Verify credentials against Shopify
    const client = getClientForShop(shopDomain, accessToken);
    const shopInfo = await client.getShopInfo();

    // Store in DB
    shopQueries.upsert.run(shopDomain, accessToken);
    const shop = shopQueries.findByDomain.get(shopDomain)!;

    // Ensure autopilot row exists
    autopilotQueries.upsert.run(shop.id);

    const token = issueToken(shopDomain);
    res.json({ token, shopDomain, shopInfo });
  } catch (e) {
    console.error('[Auth] Private login failed:', e);
    res.status(400).json({ error: 'Could not connect to Shopify. Check your credentials.' });
  }
});

// ─────────────────────────────────────────────────────────
// OAUTH INSTALL (for new SaaS customers)
// ─────────────────────────────────────────────────────────

// In-memory nonce store (replace with Redis/DB for production clusters)
const pendingNonces = new Map<string, string>();

/**
 * GET /auth/install?shop=storename.myshopify.com
 *
 * Share this URL with new customers. They click it, get redirected
 * to Shopify's permission screen, then back to /auth/callback.
 */
router.get('/install', (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop || !shop.endsWith('.myshopify.com')) {
    res.status(400).send('Missing or invalid shop parameter');
    return;
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  pendingNonces.set(shop, nonce);

  // Nonces expire after 10 minutes
  setTimeout(() => pendingNonces.delete(shop), 10 * 60 * 1000);

  const scopes = config.shopify.scopes.join(',');
  const redirectUri = encodeURIComponent(`${config.shopify.appUrl}/auth/callback`);
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${config.shopify.apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${nonce}`;

  res.redirect(installUrl);
});

/**
 * GET /auth/callback
 * Shopify redirects here after merchant approves permissions.
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { shop, code, state, hmac } = req.query as Record<string, string>;

  // 1. Validate nonce
  const expectedNonce = pendingNonces.get(shop);
  if (!expectedNonce || expectedNonce !== state) {
    res.status(403).send('Invalid state / nonce mismatch');
    return;
  }
  pendingNonces.delete(shop);

  // 2. Validate HMAC signature (Shopify security check)
  if (!verifyHmac(req.query as Record<string, string>, config.shopify.apiSecret)) {
    res.status(403).send('HMAC validation failed');
    return;
  }

  try {
    // 3. Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.shopify.apiKey,
        client_secret: config.shopify.apiSecret,
        code,
      }),
    });

    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
    const { access_token } = await tokenRes.json() as { access_token: string };

    // 4. Store shop + token
    shopQueries.upsert.run(shop, access_token);
    const shopRow = shopQueries.findByDomain.get(shop)!;
    autopilotQueries.upsert.run(shopRow.id);

    // 5. Register essential webhooks
    const client = getClientForShop(shop, access_token);
    const callbackBase = `${config.shopify.appUrl}/webhooks`;
    for (const topic of ['products/create', 'products/update', 'orders/create', 'app/uninstalled']) {
      try {
        await client.registerWebhook(topic, `${callbackBase}/${topic.replace('/', '-')}`);
      } catch {
        // Webhook might already exist — not fatal
      }
    }

    // 6. Issue JWT and redirect to dashboard
    const token = issueToken(shop);
    res.redirect(`${config.frontendUrl}?token=${token}&shop=${shop}`);
  } catch (e) {
    console.error('[Auth] OAuth callback failed:', e);
    res.status(500).send('OAuth failed. Please try again.');
  }
});

// ─────────────────────────────────────────────────────────
// HMAC VERIFICATION HELPER
// ─────────────────────────────────────────────────────────

function verifyHmac(params: Record<string, string>, secret: string): boolean {
  const { hmac, ...rest } = params;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('&');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
}

export default router;
