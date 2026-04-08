/**
 * Grok AI Service (Backend)
 *
 * All AI calls go through here — API key stays on server, never exposed to browser.
 * Supports product optimization, SEO, marketing copy, and autopilot analysis.
 */

import { config } from '../config.js';
import type { ShopifyProduct } from './shopify.js';

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokResponse {
  choices: Array<{ message: { content: string } }>;
}

// ─────────────────────────────────────────────────────────
// CORE CLIENT
// ─────────────────────────────────────────────────────────

async function callGrok(messages: GrokMessage[], temperature = 0.7): Promise<string> {
  if (!config.grok.apiKey) {
    console.warn('[Grok] No XAI_API_KEY found — returning mock response.');
    return mockFallback(messages);
  }

  const res = await fetch(`${config.grok.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.grok.apiKey}`,
    },
    body: JSON.stringify({
      model: config.grok.model,
      messages,
      temperature,
      stream: false,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Grok API error ${res.status}: ${txt}`);
  }

  const data = await res.json() as GrokResponse;
  return data.choices[0].message.content;
}

async function callGrokJSON<T>(system: string, user: string): Promise<T> {
  const raw = await callGrok([
    { role: 'system', content: system + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown fences.' },
    { role: 'user', content: user },
  ], 0.3);

  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error('[Grok] JSON parse failed:', cleaned.slice(0, 200));
    throw new Error('AI returned invalid JSON');
  }
}

// ─────────────────────────────────────────────────────────
// PRODUCT OPTIMIZATION
// ─────────────────────────────────────────────────────────

export interface ProductOptimization {
  shopify_id: string;
  optimizedTitle: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  googleCategory: string;
  identifierExists: boolean;
  changesSummary: string;
}

export async function optimizeProducts(
  products: Pick<ShopifyProduct, 'id' | 'title' | 'body_html' | 'tags' | 'product_type' | 'vendor'>[],
  shopContext = 'Schweizer Online-Shop'
): Promise<ProductOptimization[]> {
  const system = `Du bist ein Senior E-Commerce Manager für einen ${shopContext}.
  Du optimierst Produkte für maximale Conversion, SEO-Sichtbarkeit und Google Shopping.
  Sprache: Deutsch (Schweiz). Ton: professionell, verkaufsstark.`;

  const user = `Optimiere folgende Produkte und gib ein JSON-Array zurück.

INPUT:
${JSON.stringify(products.map(p => ({
    id: p.id.toString(),
    title: p.title,
    description: p.body_html?.replace(/<[^>]*>/g, '').slice(0, 300),
    tags: p.tags,
    type: p.product_type,
    vendor: p.vendor,
  })), null, 2)}

OUTPUT FORMAT (JSON Array):
[
  {
    "shopify_id": "Produkt-ID als String",
    "optimizedTitle": "Optimierter Titel (max 70 Zeichen, verkaufsstark)",
    "seoTitle": "SEO-Titel (max 60 Zeichen, Keyword vorne)",
    "seoDescription": "Meta-Description (max 155 Zeichen, Call-to-Action)",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "googleCategory": "Google Produktkategorie-ID (z.B. 111, 345, 568)",
    "identifierExists": true,
    "changesSummary": "Kurze Begründung der Änderungen (1 Satz)"
  }
]`;

  return callGrokJSON<ProductOptimization[]>(system, user);
}

// ─────────────────────────────────────────────────────────
// SEO ANALYSIS
// ─────────────────────────────────────────────────────────

export interface SEOAudit {
  score: number;
  issues: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; fix: string }>;
  keywords: string[];
  recommendations: string[];
}

export async function auditProductSEO(product: ShopifyProduct): Promise<SEOAudit> {
  const system = 'Du bist ein SEO-Experte für E-Commerce in der Schweiz. Analysiere Produkte für Google Shopping und organische Suche.';
  const user = `Analysiere dieses Produkt für SEO:

Titel: ${product.title}
Beschreibung: ${product.body_html?.replace(/<[^>]*>/g, '').slice(0, 500)}
Tags: ${product.tags}
Typ: ${product.product_type}

Gib ein JSON-Objekt zurück:
{
  "score": 0-100,
  "issues": [{"severity": "critical|warning|info", "message": "Problem", "fix": "Lösung"}],
  "keywords": ["keyword1", "keyword2"],
  "recommendations": ["Empfehlung 1", "Empfehlung 2"]
}`;

  return callGrokJSON<SEOAudit>(system, user);
}

// ─────────────────────────────────────────────────────────
// MARKETING CONTENT
// ─────────────────────────────────────────────────────────

export async function generateMarketingContent(
  type: 'instagram' | 'facebook' | 'email' | 'blog' | 'google_ads',
  product: Pick<ShopifyProduct, 'title' | 'body_html' | 'tags'>,
  tone: 'professional' | 'casual' | 'luxury' = 'professional'
): Promise<string> {
  const typeGuide: Record<string, string> = {
    instagram: 'Instagram Post (max 150 Wörter, 5-10 Hashtags, Emoji erlaubt)',
    facebook: 'Facebook Post (max 250 Wörter, Link-Preview freundlich)',
    email: 'E-Mail Newsletter Abschnitt (Betreff + Body, HTML)',
    blog: 'Blog-Artikel (min 400 Wörter, SEO-optimiert, mit H2/H3)',
    google_ads: '3 Google Ads Varianten (Headline max 30Z, Description max 90Z)',
  };

  const system = `Du bist ein Marketing-Texter für einen Schweizer Online-Shop. Ton: ${tone}.`;
  const user = `Erstelle einen ${typeGuide[type]} für:

Produkt: ${product.title}
Beschreibung: ${product.body_html?.replace(/<[^>]*>/g, '').slice(0, 300)}
Tags: ${product.tags}

Gib nur den fertigen Text zurück, keine Erklärungen.`;

  return callGrok([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]);
}

// ─────────────────────────────────────────────────────────
// STORE ANALYTICS SUMMARY
// ─────────────────────────────────────────────────────────

export interface StoreInsights {
  summary: string;
  topOpportunities: string[];
  warnings: string[];
  suggestedActions: Array<{ action: string; priority: 'high' | 'medium' | 'low'; estimatedImpact: string }>;
}

export async function analyzeStore(storeData: {
  productCount: number;
  activeProducts: number;
  draftProducts: number;
  avgSEOScore: number;
  recentSales: number;
  topProducts: string[];
  lowStockProducts: string[];
}): Promise<StoreInsights> {
  const system = 'Du bist ein E-Commerce-Berater für Schweizer Online-Shops. Analysiere Store-Daten und gib konkrete, umsetzbare Empfehlungen.';
  const user = `Analysiere diesen Shop und gib Handlungsempfehlungen:

${JSON.stringify(storeData, null, 2)}

Gib ein JSON-Objekt zurück:
{
  "summary": "1-2 Sätze Gesamtbewertung",
  "topOpportunities": ["Chance 1", "Chance 2", "Chance 3"],
  "warnings": ["Warnung 1", "Warnung 2"],
  "suggestedActions": [
    {"action": "Was tun", "priority": "high|medium|low", "estimatedImpact": "Erwarteter Effekt"}
  ]
}`;

  return callGrokJSON<StoreInsights>(system, user);
}

// ─────────────────────────────────────────────────────────
// DUPLICATE DETECTION
// ─────────────────────────────────────────────────────────

export interface DuplicateGroup {
  reason: string;
  products: Array<{ id: string; title: string }>;
}

export async function detectDuplicates(
  products: Array<{ id: string; title: string; sku: string; vendor: string }>
): Promise<DuplicateGroup[]> {
  const system = 'Du bist ein Datenqualitäts-Experte für E-Commerce. Erkenne Duplikate und ähnliche Produkte.';
  const user = `Analysiere diese Produktliste auf Duplikate und ähnliche Einträge:

${JSON.stringify(products)}

Gib ein JSON-Array zurück:
[
  {
    "reason": "Warum diese Produkte Duplikate sind",
    "products": [{"id": "ID", "title": "Titel"}]
  }
]

Wenn keine Duplikate: leeres Array []`;

  return callGrokJSON<DuplicateGroup[]>(system, user);
}

// ─────────────────────────────────────────────────────────
// FALLBACK / MOCK (when no API key)
// ─────────────────────────────────────────────────────────

function mockFallback(messages: GrokMessage[]): string {
  const last = messages[messages.length - 1].content.toLowerCase();
  if (last.includes('json')) {
    return JSON.stringify([
      {
        shopify_id: '1',
        optimizedTitle: '[DEMO] Premium Produkt - Swiss Made',
        seoTitle: 'Premium Produkt kaufen | Swiss Made',
        seoDescription: 'Hochwertiges Produkt aus der Schweiz. Jetzt online bestellen.',
        tags: ['swiss-made', 'premium', 'qualität'],
        googleCategory: '111',
        identifierExists: true,
        changesSummary: 'Demo-Modus: Kein XAI_API_KEY gesetzt.',
      },
    ]);
  }
  return '🤖 Demo-Modus: Bitte XAI_API_KEY in der .env Datei setzen.';
}
