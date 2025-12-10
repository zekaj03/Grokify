import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { StatMetric, Product, ViewState } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from "@google/genai";

interface DashboardViewProps {
  stats: StatMetric[];
  recentProducts: Product[];
  onNavigate: (view: ViewState) => void;
}

const data = [
  { name: 'Mo', sales: 4000 },
  { name: 'Di', sales: 3000 },
  { name: 'Mi', sales: 2000 },
  { name: 'Do', sales: 2780 },
  { name: 'Fr', sales: 1890 },
  { name: 'Sa', sales: 2390 },
  { name: 'So', sales: 3490 },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, recentProducts, onNavigate }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  
  // Optimization State
  const [optimizationStep, setOptimizationStep] = useState<'select' | 'processing' | 'results'>('select');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<any[]>([]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  const getTargetView = (label: string): ViewState | null => {
    if (label.includes('Produkte')) return 'products';
    if (label.includes('SEO')) return 'seo';
    if (label.includes('KI-Optimierungen')) return 'autopilot';
    return null;
  };

  const handleOpenOptimization = () => {
    // Default select all products
    setSelectedProductIds(recentProducts.map(p => p.id));
    setOptimizationStep('select');
    setShowOptimizationModal(true);
  };

  const toggleProductSelection = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(prev => prev.filter(pid => pid !== id));
    } else {
      setSelectedProductIds(prev => [...prev, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === recentProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(recentProducts.map(p => p.id));
    }
  };

  const runBulkOptimization = async () => {
    if (selectedProductIds.length === 0) return;
    
    setOptimizationStep('processing');
    setOptimizationResults([]);

    const productsToOptimize = recentProducts.filter(p => selectedProductIds.includes(p.id));

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Single Prompt for ALL selected products to save costs
        const prompt = `Du bist ein Senior E-Commerce Manager für die Schweiz.
        Führe eine **Komplett-Optimierung** für folgende Produkte durch.
        
        INPUT DATA:
        ${JSON.stringify(productsToOptimize.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            tags: p.tags
        })))}
        
        AUFGABEN FÜR JEDES PRODUKT:
        1. Optimiere den Titel (Verkaufspsychologie, Schweizerdeutsch).
        2. Erstelle perfekte SEO Metadaten (Titel & Description).
        3. Generiere 5 präzise Tags.
        4. Ermittle die Google Produktkategorie (ID).
        5. Entscheide ob eine GTIN notwendig ist (identifier_exists).
        
        OUTPUT FORMAT (JSON Array):
        [
            {
                "id": "ID des Produkts",
                "optimizedTitle": "...",
                "seoTitle": "...",
                "seoDescription": "...",
                "tags": ["..."],
                "googleCategory": "...",
                "identifierExists": boolean,
                "changesSummary": "Kurzfassung der Optimierung"
            }
        ]`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 4096 } // Higher budget for bulk processing
            }
        });

        const results = JSON.parse(response.text || '[]');
        setOptimizationResults(results);
        setOptimizationStep('results');

    } catch (e) {
        console.error("Bulk Optimization failed", e);
        // Error handling could be better here, e.g. show error state
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Welcome Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Guten Morgen, Admin</h1>
          <p className="text-slate-400 mt-1">Hier ist der Überblick über deinen Shopify Store "ikaufen.ch".</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleSync}
             disabled={isSyncing}
             className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
           >
              <Icons.Refresh className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
              {isSyncing ? 'Syncing...' : 'Sync'}
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = Icons[stat.icon as keyof typeof Icons] || Icons.BarChart;
          const colorClasses = {
            indigo: 'bg-indigo-500/10 text-indigo-400',
            emerald: 'bg-emerald-500/10 text-emerald-400',
            amber: 'bg-amber-500/10 text-amber-400',
            rose: 'bg-rose-500/10 text-rose-400',
          };
          
          const targetView = getTargetView(stat.label);

          return (
            <div 
              key={idx} 
              onClick={() => targetView && onNavigate(targetView)}
              className={`glass-panel p-6 rounded-2xl border-l-4 border-l-transparent transition-all duration-300 group relative ${targetView ? 'cursor-pointer hover:bg-white/5 hover:border-l-indigo-500' : ''}`}
            >
              {targetView && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  <Icons.ArrowRight className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {stat.trend >= 0 ? <Icons.TrendingUp className="w-3 h-3" /> : <Icons.TrendingUp className="w-3 h-3 rotate-180" />}
                  {Math.abs(stat.trend)}%
                </div>
              </div>
              <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Umsatzentwicklung (CHF)</h3>
            <select className="bg-[#1a1a2e] border border-white/10 text-slate-300 text-sm rounded-lg px-3 py-1 outline-none">
              <option>Letzte 7 Tage</option>
              <option>Letzte 30 Tage</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `CHF ${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#ffffff20', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Dropdown Logic */}
        <div className="glass-panel p-6 rounded-2xl h-fit">
          <h3 className="text-lg font-semibold text-white mb-6">Schnellaktionen</h3>
          <div className="space-y-3">
            <button 
                onClick={handleOpenOptimization}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/50 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Icons.Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Komplett-Optimierung</p>
                  <p className="text-slate-400 text-xs">Titel, SEO, Tags, GTIN (Bulk)</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button 
                onClick={handleOpenOptimization}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Icons.Tag className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">GTIN Befreiung</p>
                  <p className="text-slate-400 text-xs">Google Merchant Fix</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

             <button 
                onClick={handleOpenOptimization}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 transition-all"
             >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Icons.Hash className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">ART-Nummern generieren</p>
                  <p className="text-slate-400 text-xs">Format: ART-XXXX</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

             <button 
                onClick={handleOpenOptimization}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/50 transition-all"
             >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Icons.Filter className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">Auto-Kategorisierung</p>
                  <p className="text-slate-400 text-xs">KI-basiert</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

             <button 
                onClick={() => onNavigate('duplicates')}
                className="w-full group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/50 transition-all"
             >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Icons.Copy className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium text-sm">Duplikate verwalten</p>
                  <p className="text-slate-400 text-xs">3 Potentielle gefunden</p>
                </div>
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Complete Optimization Modal */}
      {showOptimizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowOptimizationModal(false)}></div>
            <div className="bg-[#0f0f16] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 bg-[#0a0a0f] flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Icons.Zap className="w-5 h-5 text-indigo-500" />
                        Komplett-Optimierung (All-in-One)
                    </h3>
                    <button onClick={() => setShowOptimizationModal(false)} className="text-slate-400 hover:text-white">
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* STEP 1: SELECT PRODUCTS */}
                    {optimizationStep === 'select' && (
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-slate-400">Wähle die Produkte für die Massen-Optimierung:</p>
                                <button onClick={toggleSelectAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                                    {selectedProductIds.length === recentProducts.length ? 'Alle abwählen' : 'Alle auswählen'}
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {recentProducts.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => toggleProductSelection(p.id)}
                                        className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${selectedProductIds.includes(p.id) ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedProductIds.includes(p.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                                            {selectedProductIds.includes(p.id) && <Icons.Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="w-10 h-10 rounded bg-slate-800 overflow-hidden shrink-0">
                                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${selectedProductIds.includes(p.id) ? 'text-white' : 'text-slate-400'}`}>{p.title}</p>
                                            <p className="text-xs text-slate-500">Score: {p.seoScore}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PROCESSING */}
                    {optimizationStep === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <Icons.Refresh className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-lg">Grok arbeitet...</h4>
                                <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                                    Analysiere {selectedProductIds.length} Produkte gleichzeitig.
                                    Optimiere SEO, Tags und Merchant Daten.
                                    <br />
                                    <span className="text-xs text-indigo-400 font-mono mt-4 block p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                        ⚡ 1 SINGLE API CALL OPTIMIZATION
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULTS */}
                    {optimizationStep === 'results' && (
                        <div className="p-6 space-y-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                                <Icons.Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                <div>
                                    <h4 className="text-emerald-400 font-medium text-sm">Bulk Optimierung erfolgreich</h4>
                                    <p className="text-slate-300 text-xs mt-0.5">{optimizationResults.length} Produkte wurden aktualisiert.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {optimizationResults.map((res, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                                            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">ID: {res.id}</span>
                                            <span className="text-xs text-emerald-400 ml-auto flex items-center gap-1"><Icons.Sparkles className="w-3 h-3" /> Optimiert</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Neuer Titel</label>
                                                <p className="text-sm text-white line-clamp-1" title={res.optimizedTitle}>{res.optimizedTitle}</p>
                                            </div>
                                             <div>
                                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tags</label>
                                                <div className="flex gap-1 flex-wrap h-6 overflow-hidden">
                                                    {res.tags?.map((t: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] bg-white/10 px-1.5 rounded text-slate-300">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Änderungen</label>
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
                    
                    {optimizationStep === 'select' && (
                        <button 
                            onClick={runBulkOptimization}
                            disabled={selectedProductIds.length === 0}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Icons.Zap className="w-4 h-4" />
                            Optimierung starten ({selectedProductIds.length})
                        </button>
                    )}

                    {optimizationStep === 'results' && (
                        <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20">
                            Alle anwenden
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};