import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  shopify: {
    // Private App (owner's own store — no OAuth needed)
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN || '',
    adminApiToken: process.env.SHOPIFY_ADMIN_API_TOKEN || '',
    apiVersion: (process.env.SHOPIFY_API_VERSION || '2024-10') as string,

    // OAuth App (for selling to other stores)
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecret: process.env.SHOPIFY_API_SECRET || '',
    appUrl: process.env.SHOPIFY_APP_URL || 'http://localhost:3001',
    scopes: [
      'read_products', 'write_products',
      'read_orders', 'write_orders',
      'read_inventory', 'write_inventory',
      'read_customers',
      'read_analytics',
      'read_marketing_events', 'write_marketing_events',
      'read_themes', 'write_themes',
      'read_content', 'write_content',
    ],
  },

  grok: {
    apiKey: process.env.XAI_API_KEY || '',
    model: 'grok-beta',
    baseUrl: 'https://api.x.ai/v1',
  },

  db: {
    path: process.env.DB_PATH || './data/grokify.db',
  },
} as const;

export type Config = typeof config;
