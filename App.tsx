import React, { useState } from 'react';
import { DashboardLayout } from './components/DashboardLayout';
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
import { ViewState, Product } from './types';
import { MOCK_PRODUCTS, MOCK_STATS } from './services/mockData';
import { Icons } from './components/ui/Icons';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView stats={MOCK_STATS} recentProducts={products} onNavigate={setCurrentView} />;
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
        return <DashboardView stats={MOCK_STATS} recentProducts={products} onNavigate={setCurrentView} />;
    }
  };

  return (
    <DashboardLayout 
      currentView={currentView} 
      onChangeView={setCurrentView}
      onToggleChat={() => setIsChatOpen(!isChatOpen)}
    >
      {renderView()}
      <GrokChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </DashboardLayout>
  );
}

export default App;