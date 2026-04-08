/**
 * Grokify API Client (Frontend)
 *
 * All calls go to the backend. The JWT token is stored in localStorage
 * after login and sent with every request.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─────────────────────────────────────────────────────────
// TOKEN MANAGEMENT
// ─────────────────────────────────────────────────────────

export const auth = {
  getToken: (): string | null => localStorage.getItem('grokify_token'),
  setToken: (token: string) => localStorage.setItem('grokify_token', token),
  getShop: (): string | null => localStorage.getItem('grokify_shop'),
  setShop: (shop: string) => localStorage.setItem('grokify_shop', shop),
  clear: () => {
    localStorage.removeItem('grokify_token');
    localStorage.removeItem('grokify_shop');
  },
  isLoggedIn: (): boolean => !!localStorage.getItem('grokify_token'),
};

// Read token from URL params on OAuth callback
export function handleOAuthCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const shop = params.get('shop');
  if (token && shop) {
    auth.setToken(token);
    auth.setShop(shop);
    window.history.replaceState({}, '', '/');
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────
// HTTP CLIENT
// ─────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = auth.getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    auth.clear();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body);
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body);

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────

export const authApi = {
  /** Login with private app credentials (owner's store) */
  loginPrivate: (shopDomain: string, accessToken: string) =>
    post<{ token: string; shopDomain: string; shopInfo: Record<string, unknown> }>('/auth/private', {
      shopDomain,
      accessToken,
    }),

  /** Get Shopify OAuth install URL for a new customer's store */
  getInstallUrl: (shop: string) => `${BASE_URL}/auth/install?shop=${shop}`,
};

// ─────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────

export interface ApiProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: 'active' | 'draft' | 'archived';
  handle: string;
  tags: string;
  variants: Array<{
    id: number;
    sku: string;
    price: string;
    compare_at_price: string | null;
    inventory_quantity: number;
    barcode: string | null;
  }>;
  images: Array<{ id: number; src: string; alt: string | null }>;
}

export const productsApi = {
  list: () => get<{ products: ApiProduct[]; count: number; from_cache?: boolean }>('/api/products'),
  get: (id: number) => get<{ product: ApiProduct }>(`/api/products/${id}`),
  update: (id: number, changes: Partial<ApiProduct>) => put<{ product: ApiProduct }>(`/api/products/${id}`, changes),
  sync: () => post<{ synced: number; synced_at: string }>('/api/products/sync'),
  bulkUpdate: (updates: Array<{ id: number; changes: Partial<ApiProduct> }>) =>
    post<{ updated: ApiProduct[]; count: number }>('/api/products/bulk-update', { updates }),
};

// ─────────────────────────────────────────────────────────
// ORDERS & STATS
// ─────────────────────────────────────────────────────────

export interface DashboardStats {
  revenue: { mtd: number; orderCount: number; trend: number; currency: string };
  products: { total: number; active: number; draft: number; archived: number };
  seo: { avgScore: number };
  orders: { total: number };
}

export const ordersApi = {
  list: (status?: string, limit?: number) =>
    get<{ orders: unknown[]; count: number }>(`/api/orders?status=${status || 'any'}&limit=${limit || 50}`),
  stats: () => get<DashboardStats>('/api/orders/stats'),
};

// ─────────────────────────────────────────────────────────
// AI
// ─────────────────────────────────────────────────────────

export interface OptimizationResult {
  shopify_id: string;
  optimizedTitle: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  googleCategory: string;
  identifierExists: boolean;
  changesSummary: string;
}

export const aiApi = {
  optimize: (productIds?: number[], applyImmediately = false) =>
    post<{ jobId: number; optimizations: OptimizationResult[]; applied: boolean; count: number }>(
      '/api/ai/optimize',
      { productIds, applyImmediately }
    ),

  applyJob: (jobId: number) =>
    post<{ applied: number; jobId: number }>(`/api/ai/jobs/${jobId}/apply`),

  seoAudit: (productId: number) =>
    post<{ productId: number; audit: unknown }>('/api/ai/seo-audit', { productId }),

  generateMarketing: (
    productId: number,
    type: 'instagram' | 'facebook' | 'email' | 'blog' | 'google_ads',
    tone?: 'professional' | 'casual' | 'luxury'
  ) =>
    post<{ productId: number; type: string; content: string }>(
      '/api/ai/marketing',
      { productId, type, tone }
    ),

  storeInsights: () =>
    post<{ insights: unknown }>('/api/ai/store-insights'),

  detectDuplicates: () =>
    post<{ duplicates: unknown[]; count: number }>('/api/ai/detect-duplicates'),

  getJobs: () =>
    get<{ jobs: unknown[] }>('/api/ai/jobs'),
};

// ─────────────────────────────────────────────────────────
// AUTOPILOT
// ─────────────────────────────────────────────────────────

export const autopilotApi = {
  getSettings: () => get<{ settings: unknown }>('/api/autopilot/settings'),
  updateSettings: (settings: Record<string, unknown>) =>
    put('/api/autopilot/settings', settings),
  trigger: () => post('/api/autopilot/run'),
};
