/**
 * Shopify Admin REST API Service
 *
 * Supports both:
 *  - Private App: direct token (ikaufen.myshopify.com)
 *  - OAuth App:   per-tenant tokens from DB (for SaaS resale)
 */

import { config } from '../config.js';

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: 'active' | 'draft' | 'archived';
  handle: string;
  tags: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  metafields?: ShopifyMetafield[];
}

export interface ShopifyVariant {
  id: number;
  sku: string;
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
  barcode: string | null;
}

export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
}

export interface ShopifyMetafield {
  id?: number;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  email: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  line_items: ShopifyLineItem[];
  customer: { first_name: string; last_name: string; } | null;
}

export interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string;
}

export interface ShopifyCollection {
  id: number;
  title: string;
  handle: string;
  products_count: number;
  image: { src: string } | null;
  collection_type?: 'custom' | 'smart';
}

// ─────────────────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────────────────

export class ShopifyClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(shopDomain: string, accessToken: string) {
    const version = config.shopify.apiVersion;
    this.baseUrl = `https://${shopDomain}/admin/api/${version}`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Shopify API ${res.status} on ${method} ${path}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  // ── SHOP INFO ────────────────────────────────────────

  async getShopInfo() {
    const data = await this.request<{ shop: Record<string, unknown> }>('GET', '/shop.json');
    return data.shop;
  }

  // ── PRODUCTS ─────────────────────────────────────────

  async getProducts(limit = 250, pageInfo?: string): Promise<ShopifyProduct[]> {
    let url = `/products.json?limit=${limit}&fields=id,title,body_html,vendor,product_type,status,handle,tags,variants,images`;
    if (pageInfo) url += `&page_info=${pageInfo}`;
    const data = await this.request<{ products: ShopifyProduct[] }>('GET', url);
    return data.products;
  }

  async getProduct(id: number): Promise<ShopifyProduct> {
    const data = await this.request<{ product: ShopifyProduct }>('GET', `/products/${id}.json`);
    return data.product;
  }

  async updateProduct(id: number, updates: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const data = await this.request<{ product: ShopifyProduct }>(
      'PUT',
      `/products/${id}.json`,
      { product: updates }
    );
    return data.product;
  }

  async updateProductMetafield(productId: number, metafield: ShopifyMetafield): Promise<ShopifyMetafield> {
    const data = await this.request<{ metafield: ShopifyMetafield }>(
      'POST',
      `/products/${productId}/metafields.json`,
      { metafield }
    );
    return data.metafield;
  }

  /** Bulk update multiple products — runs sequentially to respect Shopify rate limits */
  async bulkUpdateProducts(
    updates: Array<{ id: number; changes: Partial<ShopifyProduct> }>
  ): Promise<ShopifyProduct[]> {
    const results: ShopifyProduct[] = [];
    for (const { id, changes } of updates) {
      const updated = await this.updateProduct(id, changes);
      results.push(updated);
      // Shopify allows 2 req/sec on REST — stay safe
      await new Promise(r => setTimeout(r, 600));
    }
    return results;
  }

  // ── ORDERS ───────────────────────────────────────────

  async getOrders(status = 'any', limit = 50): Promise<ShopifyOrder[]> {
    const data = await this.request<{ orders: ShopifyOrder[] }>(
      'GET',
      `/orders.json?status=${status}&limit=${limit}`
    );
    return data.orders;
  }

  async getOrderCount(): Promise<number> {
    const data = await this.request<{ count: number }>('GET', '/orders/count.json?status=any');
    return data.count;
  }

  // ── COLLECTIONS ──────────────────────────────────────

  async getCustomCollections(): Promise<ShopifyCollection[]> {
    const data = await this.request<{ custom_collections: ShopifyCollection[] }>(
      'GET',
      '/custom_collections.json'
    );
    return data.custom_collections.map(c => ({ ...c, collection_type: 'custom' as const }));
  }

  async getSmartCollections(): Promise<ShopifyCollection[]> {
    const data = await this.request<{ smart_collections: ShopifyCollection[] }>(
      'GET',
      '/smart_collections.json'
    );
    return data.smart_collections.map(c => ({ ...c, collection_type: 'smart' as const }));
  }

  async getAllCollections(): Promise<ShopifyCollection[]> {
    const [custom, smart] = await Promise.all([
      this.getCustomCollections(),
      this.getSmartCollections(),
    ]);
    return [...custom, ...smart];
  }

  async addProductToCollection(collectionId: number, productId: number): Promise<void> {
    await this.request('POST', '/collects.json', {
      collect: { collection_id: collectionId, product_id: productId },
    });
  }

  // ── INVENTORY ────────────────────────────────────────

  async getInventoryLevels(locationId?: number) {
    const url = locationId
      ? `/inventory_levels.json?location_ids=${locationId}`
      : '/inventory_levels.json';
    return this.request('GET', url);
  }

  // ── ANALYTICS ────────────────────────────────────────

  async getSalesData(since: string): Promise<{ total: number; count: number }> {
    const orders = await this.request<{ orders: ShopifyOrder[] }>(
      'GET',
      `/orders.json?status=any&created_at_min=${since}&financial_status=paid&fields=id,total_price`
    );
    const total = orders.orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
    return { total, count: orders.orders.length };
  }

  // ── WEBHOOKS ─────────────────────────────────────────

  async registerWebhook(topic: string, callbackUrl: string): Promise<void> {
    await this.request('POST', '/webhooks.json', {
      webhook: { topic, address: callbackUrl, format: 'json' },
    });
  }

  async listWebhooks() {
    return this.request('GET', '/webhooks.json');
  }

  async deleteWebhook(id: number): Promise<void> {
    await this.request('DELETE', `/webhooks/${id}.json`);
  }

  // ── BLOG / PAGES ─────────────────────────────────────

  async createBlogPost(blogId: number, title: string, body: string, tags: string): Promise<unknown> {
    return this.request('POST', `/blogs/${blogId}/articles.json`, {
      article: { title, body_html: body, tags, published: true },
    });
  }

  async getBlogs(): Promise<Array<{ id: number; title: string }>> {
    const data = await this.request<{ blogs: Array<{ id: number; title: string }> }>(
      'GET',
      '/blogs.json'
    );
    return data.blogs;
  }
}

// ─────────────────────────────────────────────────────────
// FACTORY — Returns a ready-to-use client per shop
// ─────────────────────────────────────────────────────────

/**
 * For the owner's private app — reads from .env directly.
 */
export function getPrivateClient(): ShopifyClient {
  if (!config.shopify.storeDomain || !config.shopify.adminApiToken) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN in .env');
  }
  return new ShopifyClient(config.shopify.storeDomain, config.shopify.adminApiToken);
}

/**
 * For OAuth tenants — pass their stored access token.
 */
export function getClientForShop(shopDomain: string, accessToken: string): ShopifyClient {
  return new ShopifyClient(shopDomain, accessToken);
}
