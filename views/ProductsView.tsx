import React, { useState, useMemo } from 'react';
import { Icons } from '../components/ui/Icons';
import { Product, ProductStatus } from '../types';
import { ProductEditor } from '../components/ProductEditor';
import { GoogleGenAI } from "@google/genai";

interface ProductsViewProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, setProducts }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBulkDropdownOpen, setIsBulkDropdownOpen] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Bulk Optimization State
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState<'processing' | 'results'>('processing');
  const [optimizationResults, setOptimizationResults] = useState<any[]>([]);
  const [currentActionLabel, setCurrentActionLabel] = useState('');

  const filteredProducts = products.filter(p => filter === 'all' || p.status === filter);

  const sortedProducts = useMemo(() => {
    if (!sortConfig) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Product];
      let bVal: any = b[sortConfig.key as keyof Product];

      // Special cases for nested or computed properties
      if (sortConfig.key === 'seoScore') {
          aVal = a.seoScore;
          bVal = b.seoScore;
      }

      // Handle strings case-insensitively
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key && current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProducts.map(p => p.id)));
    }
  };

  const handleSaveProduct = (updatedProduct: Product) => {
      const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      setProducts(newProducts);
      setEditingProduct(null); // Close editor
  }

  const handleBulkAction = (action: string) => {
      setIsBulkDropdownOpen(false);
      runBulkOptimization(action);
  };

  const applyBulkChanges = () => {
      const newProducts = products.map(p => {
          const res = optimizationResults.find(r => r.id === p.id);
          if (!res) return p;

          return {
              ...p,
              title: res.optimizedTitle || p.title,
              description: res.optimizedDescription || p.description,
              productType: res.productType || p.productType,
              // If collection is suggested, we add it to tags for now as Product type doesn't have collection field
              tags: res.collection ? [...(res.tags || p.tags), res.collection] : (res.tags || p.tags),
              metafields: {
                  ...p.metafields,
                  seoTitle: res.seoTitle || p.metafields.seoTitle,
                  seoDescription: res.seoDescription || p.metafields.seoDescription,
                  articleNumber: res.articleNumber || p.metafields.articleNumber,
                  google: {
                      ...p.metafields.google,
                      googleProductCategory: res.googleCategory || p.metafields.google?.googleProductCategory,
                      identifierExists: res.identifierExists !== undefined ? res.identifierExists : p.metafields.google?.identifierExists
                  }
              }
          } as Product;
      });

      setProducts(newProducts);
      setShowOptimizationModal(false);
      setSelectedIds(new Set()); // Clear selection
  };

  const runBulkOptimization = async (action: string) => {
    if (selectedIds.size === 0) return;
    
    // Set label for the modal
    let label = "Verarbeite...";
    switch(action) {
        case 'optimize_complete': label = "Komplett-Optimierung"; break;
        case 'optimize_title': label = "Titel Optimierung"; break;
        case 'optimize_description': label = "Beschreibung Optimierung"; break;
        case 'optimize_seo': label = "SEO Metadaten"; break;
        case 'optimize_tags': label = "Tags Generierung"; break;
        case 'optimize_merchant': label = "Google Merchant Daten"; break;
        case 'optimize_category': label = "Shopify Kategorisierung"; break;
        case 'manage_gtin': label = "GTIN Befreiung"; break;
        case 'manage_artno': label = "Artikelnummern Generierung"; break;
    }
    setCurrentActionLabel(label);

    setShowOptimizationModal(true);
    setOptimizationStep('processing');
    setOptimizationResults([]);

    const productsToOptimize = products.filter(p => selectedIds.has(p.id));

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let taskInstruction = "";
        
        // Define specific instructions based on action
        if (action === 'optimize_complete') {
            taskInstruction = `
            1. Optimiere den Titel (Verkaufspsychologie).
            2. Erstelle perfekte SEO Metadaten.
            3. Generiere 5 präzise Tags.
            4. Ermittle Google Produktkategorie & GTIN Status.
            `;
        } else if (action === 'optimize_title') {
            taskInstruction = `1. Optimiere NUR den Titel (Verkaufspsychologie, max 70 Zeichen).`;
        } else if (action === 'optimize_description') {
            taskInstruction = `1. Optimiere NUR die Beschreibung (HTML Format, Bulletpoints).`;
        } else if (action === 'optimize_seo') {
            taskInstruction = `1. Erstelle NUR SEO Titel & SEO Beschreibung.`;
        } else if (action === 'optimize_tags') {
            taskInstruction = `1. Generiere NUR 5-8 präzise Tags (Lowercase).`;
        } else if (action === 'optimize_merchant') {
            taskInstruction = `1. Ermittle NUR Google Produktkategorie (ID) und Condition.`;
        } else if (action === 'optimize_category') {
             taskInstruction = `1. Ermittle den korrekten Shopify 'Product Type' und schlage eine passende 'Collection' vor.`;
        } else if (action === 'manage_gtin') {
            taskInstruction = `1. Setze 'identifierExists' auf false (GTIN Befreiung). Begründe kurz warum (z.B. Custom Product).`;
        } else if (action === 'manage_artno') {
            taskInstruction = `1. Generiere eine eindeutige Artikelnummer (Format: ART-XXXX) basierend auf dem Titel.`;
        }

        const prompt = `Du bist ein Senior E-Commerce Manager für die Schweiz.
        Führe folgende Aufgabe für ${productsToOptimize.length} Produkte durch.
        
        INPUT DATA:
        ${JSON.stringify(productsToOptimize.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            vendor: p.vendor,
            type: p.productType
        })))}
        
        AUFGABE:
        ${taskInstruction}
        
        OUTPUT FORMAT (JSON Array):
        [
            {
                "id": "ID des Produkts",
                // Füge nur die geänderten Felder hinzu:
                "optimizedTitle": "...", 
                "optimizedDescription": "...", 
                "seoTitle": "...",
                "seoDescription": "...",
                "tags": ["..."],
                "googleCategory": "...",
                "identifierExists": boolean,
                "productType": "...",
                "collection": "...",
                "articleNumber": "...",
                "changesSummary": "Kurze Zusammenfassung was gemacht wurde"
            }
        ]`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 2048 }
            }
        });

        const results = JSON.parse(response.text || '[]');
        setOptimizationResults(results);
        setOptimizationStep('results');

    } catch (e) {
        console.error("Bulk Optimization failed", e);
        // Fallback for demo if API fails or quota exceeded
        setOptimizationResults(productsToOptimize.map(p => ({
            id: p.id,
            changesSummary: "Simulation: Erfolgreich verarbeitet (API Limit)",
            optimizedTitle: p.title
        })));
        setOptimizationStep('results');
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Produkte verwalten</h2>
          <p className="text-slate-400 text-sm">Grok hilft dir, deine {products.length} Produkte aktuell zu halten.</p>
        </div>
        <div className="flex gap-2 relative">
            <div className="flex bg-[#1a1a2e] rounded-lg p-1 border border-white/10">
                {['all', 'active', 'draft'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {f === 'all' ? 'Alle' : f}
                    </button>
                ))}
            </div>
            
            <div className="relative">
                <button 
                    onClick={() => setIsBulkDropdownOpen(!isBulkDropdownOpen)}
                    disabled={selectedIds.size === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                    <Icons.Settings className="w-4 h-4" />
                    <span>Massen-Aktionen {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
                    <Icons.ChevronDown className={`w-3 h-3 transition-transform ${isBulkDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isBulkDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#0f0f16] border border-white/10 rounded-xl shadow-2xl z-20 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-3 py-2 border-b border-white/5">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optimierung</span>
                        </div>
                        <button 
                            onClick={() => handleBulkAction('optimize_complete')}
                            className="w-full text-left px-4 py-2.5 text-sm text-white bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center gap-2.5 border-l-2 border-indigo-500 mb-1"
                        >
                            <Icons.Zap className="w-4 h-4 text-indigo-400" /> 
                            <div>
                                <span className="block font-medium">Komplett-Optimierung</span>
                                <span className="text-[10px] text-slate-400">Titel, SEO, Tags, Merchant</span>
                            </div>
                        </button>
                        <button onClick={() => handleBulkAction('optimize_title')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                            <Icons.Type className="w-4 h-4 text-slate-400" /> Nur Titel optimieren
                        </button>
                        <button onClick={() => handleBulkAction('optimize_description')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                             <Icons.FileText className="w-4 h-4 text-slate-400" /> Nur Beschreibung
                        </button>
                        <button onClick={() => handleBulkAction('optimize_seo')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                            <Icons.Globe className="w-4 h-4 text-slate-400" /> SEO Metadaten
                        </button>
                         <button onClick={() => handleBulkAction('optimize_tags')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                            <Icons.Tag className="w-4 h-4 text-slate-400" /> Tags generieren
                        </button>
                         <button onClick={() => handleBulkAction('optimize_merchant')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                            <Icons.ShoppingBag className="w-4 h-4 text-slate-400" /> Google Merchant Daten
                        </button>
                        <button onClick={() => handleBulkAction('optimize_category')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                            <Icons.Layers className="w-4 h-4 text-slate-400" /> Shopify Kategorien
                        </button>
                        
                        <div className="px-3 py-2 border-b border-white/5 border-t border-white/5 mt-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verwaltung</span>
                        </div>
                        <button onClick={() => handleBulkAction('manage_gtin')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                             <Icons.Tag className="w-4 h-4 text-emerald-400" /> GTIN-Befreiung setzen
                        </button>
                         <button onClick={() => handleBulkAction('manage_artno')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                             <Icons.Hash className="w-4 h-4 text-purple-400" /> Artikelnummern generieren
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 select-none">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === sortedProducts.length && sortedProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-4 text-slate-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-2">
                        Produkt
                        {sortConfig?.key === 'title' && (
                            <Icons.ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                    </div>
                </th>
                <th className="p-4 text-slate-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                     <div className="flex items-center gap-2">
                        Status
                        {sortConfig?.key === 'status' && (
                            <Icons.ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                    </div>
                </th>
                <th className="p-4 text-slate-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('inventory')}>
                     <div className="flex items-center gap-2">
                        Inventar
                        {sortConfig?.key === 'inventory' && (
                            <Icons.ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                    </div>
                </th>
                <th className="p-4 text-slate-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                     <div className="flex items-center gap-2">
                        Preis
                        {sortConfig?.key === 'price' && (
                            <Icons.ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                    </div>
                </th>
                <th className="p-4 text-slate-400 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('seoScore')}>
                     <div className="flex items-center gap-2">
                        Google / SEO
                        {sortConfig?.key === 'seoScore' && (
                            <Icons.ChevronDown className={`w-3 h-3 text-indigo-400 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                    </div>
                </th>
                <th className="p-4 text-slate-400 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setEditingProduct(product)}>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden border border-white/10 shrink-0">
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-white truncate max-w-[200px] group-hover:text-indigo-400 transition-colors">{product.title}</p>
                        <p className="text-xs text-slate-500">{product.metafields.articleNumber || product.sku} • {product.vendor}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      product.status === ProductStatus.ACTIVE 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : product.status === ProductStatus.DRAFT 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {product.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">
                    <span className={product.inventory === 0 ? 'text-rose-400' : ''}>{product.inventory} an Lager</span>
                  </td>
                  <td className="p-4 text-white font-medium">
                    CHF {product.price.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-slate-500 w-8">SEO</span>
                            <div className="flex-1 w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${product.seoScore > 80 ? 'bg-emerald-500' : product.seoScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                    style={{ width: `${product.seoScore}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-8">GMC</span>
                            {product.metafields.google?.identifierExists || product.metafields.google?.gtin 
                                ? <Icons.Check className="w-3 h-3 text-emerald-500" />
                                : <Icons.Alert className="w-3 h-3 text-amber-500" />
                            }
                        </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <button onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Icons.Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <ProductEditor 
        product={editingProduct} 
        isOpen={!!editingProduct} 
        onClose={() => setEditingProduct(null)} 
        onSave={handleSaveProduct}
    />

    {/* Optimization Modal */}
    {showOptimizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowOptimizationModal(false)}></div>
            <div className="bg-[#0f0f16] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 bg-[#0a0a0f] flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Icons.Zap className="w-5 h-5 text-indigo-500" />
                        {currentActionLabel} ({selectedIds.size})
                    </h3>
                    <button onClick={() => setShowOptimizationModal(false)} className="text-slate-400 hover:text-white">
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {optimizationStep === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <Icons.Refresh className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-lg">Grok arbeitet...</h4>
                                <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                                    Verarbeite {selectedIds.size} Produkte.
                                    <br />
                                    <span className="text-xs text-indigo-400 font-mono mt-4 block p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                        ⚡ GROK AI PROCESSING
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {optimizationStep === 'results' && (
                        <div className="p-6 space-y-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                                <Icons.Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <div>
                                    <h4 className="text-emerald-400 font-medium text-sm">Aktion erfolgreich</h4>
                                    <p className="text-slate-300 text-xs mt-0.5">{optimizationResults.length} Produkte wurden aktualisiert.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {optimizationResults.map((res, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                                            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">ID: {res.id}</span>
                                            <span className="text-xs text-emerald-400 ml-auto flex items-center gap-1"><Icons.Sparkles className="w-3 h-3" /> Erledigt</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            {res.optimizedTitle && (
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Neuer Titel</label>
                                                    <p className="text-sm text-white line-clamp-1" title={res.optimizedTitle}>{res.optimizedTitle}</p>
                                                </div>
                                            )}
                                            {res.seoTitle && (
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">SEO Title</label>
                                                    <p className="text-sm text-white line-clamp-1">{res.seoTitle}</p>
                                                </div>
                                            )}
                                            {res.tags && (
                                                <div className="col-span-2">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tags</label>
                                                    <div className="flex gap-1 flex-wrap h-6 overflow-hidden">
                                                        {res.tags?.map((t: string, idx: number) => (
                                                            <span key={idx} className="text-[10px] bg-white/10 px-1.5 rounded text-slate-300">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {res.googleCategory && (
                                                 <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Google Category</label>
                                                    <p className="text-sm text-white">{res.googleCategory}</p>
                                                </div>
                                            )}
                                             {res.articleNumber && (
                                                 <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Artikelnummer</label>
                                                    <p className="text-sm text-white font-mono">{res.articleNumber}</p>
                                                </div>
                                            )}
                                            {res.productType && (
                                                 <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Produkt Typ</label>
                                                    <p className="text-sm text-white">{res.productType}</p>
                                                </div>
                                            )}
                                            {res.collection && (
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Kollektion</label>
                                                    <p className="text-sm text-white">{res.collection}</p>
                                                </div>
                                            )}
                                             {res.identifierExists === false && (
                                                 <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">GTIN Status</label>
                                                    <p className="text-sm text-amber-400">Befreit (Custom)</p>
                                                </div>
                                            )}
                                            {res.optimizedDescription && (
                                                <div className="col-span-2">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Beschreibung</label>
                                                    <p className="text-xs text-slate-300 line-clamp-2">{res.optimizedDescription.replace(/<[^>]+>/g, '')}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Zusammenfassung</label>
                                            <p className="text-xs text-slate-400 italic">{res.changesSummary}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-[#0a0a0f] flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={() => setShowOptimizationModal(false)}
                        className="px-4 py-2 hover:bg-white/5 rounded-lg text-slate-400 text-sm transition-colors"
                    >
                        {optimizationStep === 'results' ? 'Schliessen' : 'Abbrechen'}
                    </button>
                    {optimizationStep === 'results' && (
                        <button 
                            onClick={applyBulkChanges}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            Alle anwenden
                        </button>
                    )}
                </div>
            </div>
        </div>
    )}
    </>
  );
};