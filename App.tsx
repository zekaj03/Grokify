import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { OptimizerView } from './views/OptimizerView';
import { SEOView } from './views/SEOView';
import { MarketingView } from './views/MarketingView';
import { CollectionsView } from './views/CollectionsView';
import { AutomationView } from './views/AutomationView';
import { StoreIntelligenceView } from './views/StoreIntelligenceView';
import { DuplicatesView } from './views/DuplicatesView';
import { BackupView } from './views/BackupView';
import { MediaView } from './views/MediaView';
import { GrokChat } from './components/GrokChat';
import { TradingAgentView } from './views/TradingAgentView';
import { ViewState, Product, ProductStatus } from './types';
import { MOCK_STATS } from './services/mockData';
import { auth, handleOAuthCallback, productsApi, ordersApi, type ApiProduct, type DashboardStats } from './services/api';
import { Icons } from './components/ui/Icons';

// Map Shopify API product → internal Product type
function mapApiProduct(p: ApiProduct): Product {
  const variant = p.variants?.[0];
  return {
    id: p.id.toString(),
    title: p.title,
    description: p.body_html || '',
    sku: variant?.sku || '',
    price: parseFloat(variant?.price || '0'),
    compareAtPrice: variant?.compare_at_price ? parseFloat(variant.compare_at_price) : undefined,
    currency: 'CHF',
    status: p.status === 'active' ? ProductStatus.ACTIVE
          : p.status === 'draft'  ? ProductStatus.DRAFT
          : ProductStatus.ARCHIVED,
    inventory: variant?.inventory_quantity ?? 0,
    imageUrl: p.images?.[0]?.src || `https://picsum.photos/400/400?random=${p.id}`,
    images: p.images?.map(i => i.src) || [],
    tags: p.tags ? p.tags.split(', ').filter(Boolean) : [],
    vendor: p.vendor || '',
    productType: p.product_type || '',
    handle: p.handle || '',
    seoScore: 70, // Will be enriched by AI audit
    metafields: {},
  };
}

// Build StatMetrics from real dashboard stats
function buildStats(stats: DashboardStats) {
  return [
    {
      label: 'Gesamtumsatz (MTD)',
      value: `CHF ${stats.revenue.mtd.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      trend: stats.revenue.trend,
      icon: 'DollarSign',
      color: 'emerald' as const,
    },
    {
      label: 'Aktive Produkte',
      value: stats.products.active.toLocaleString('de-CH'),
      trend: 0,
      icon: 'Package',
      color: 'indigo' as const,
    },
    {
      label: 'SEO Score (Ø)',
      value: `${stats.seo.avgScore}/100`,
      trend: 0,
      icon: 'Search',
      color: 'amber' as const,
    },
    {
      label: 'Bestellungen (MTD)',
      value: stats.revenue.orderCount.toLocaleString('de-CH'),
      trend: 0,
      icon: 'Zap',
      color: 'rose' as const,
    },
  ];
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState(MOCK_STATS);

  // ── Auth check on mount ───────────────────────────────
  useEffect(() => {
    // Handle OAuth callback (?token=...&shop=...)
    const wasCallback = handleOAuthCallback();
    if (wasCallback || auth.isLoggedIn()) {
      setIsAuthenticated(true);
    }
  }, []);

  // ── Load real data once authenticated ────────────────
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [productsRes, statsRes] = await Promise.allSettled([
        productsApi.list(),
        ordersApi.stats(),
      ]);

      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value.products.map(mapApiProduct));
      }
      if (statsRes.status === 'fulfilled') {
        setStats(buildStats(statsRes.value));
      }
    } catch (e) {
      console.error('[App] Data load failed:', e);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = (shopDomain: string) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    auth.clear();
    setIsAuthenticated(false);
    setProducts([]);
    setStats(MOCK_STATS);
  };

  // ── Login Screen ─────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // ── Loading State ────────────────────────────────────
  if (isLoadingData && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Icons.Refresh className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-400">Verbinde mit Shopify...</p>
          <p className="text-slate-600 text-xs">{auth.getShop()}</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView stats={stats} recentProducts={products} onNavigate={setCurrentView} />;
      case 'autopilot':
        return <AutomationView products={products} />;
      case 'intelligence':
        return <StoreIntelligenceView products={products} />;
      case 'products':
        return <ProductsView products={products} setProducts={setProducts} />;
      case 'duplicates':
        return <DuplicatesView products={products} />;
      case 'collections':
        return <CollectionsView />;
      case 'media':
        return <MediaView products={products} />;
      case 'backup':
        return <BackupView />;
      case 'optimizer':
        return <OptimizerView products={products} />;
      case 'seo':
        return <SEOView products={products} />;
      case 'marketing':
        return <MarketingView products={products} />;
      case 'trading':
        return <TradingAgentView />;
      default:
        return <DashboardView stats={stats} recentProducts={products} onNavigate={setCurrentView} />;
    }
  };

  return (
    <DashboardLayout
      currentView={currentView}
      onChangeView={setCurrentView}
      onToggleChat={() => setIsChatOpen(!isChatOpen)}
    >
      {/* Sync bar */}
      {isLoadingData && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-indigo-600 animate-pulse" />
      )}

      {renderView()}
      <GrokChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </DashboardLayout>
  );
}

export default App;
