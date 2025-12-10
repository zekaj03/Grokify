import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { Product } from '../types';

interface SEOViewProps {
  products: Product[];
}

export const SEOView: React.FC<SEOViewProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'trends'>('analysis');
  const [selectedFilter, setSelectedFilter] = useState<'critical' | 'missing_meta' | 'optimized'>('critical');

  const lowScoreProducts = products.filter(p => p.seoScore < 70);
  const missingMeta = products.filter(p => !p.metafields.seoDescription);
  const optimizedProducts = products.filter(p => p.seoScore >= 70);

  const getFilteredProducts = () => {
    switch (selectedFilter) {
      case 'missing_meta': return missingMeta;
      case 'optimized': return optimizedProducts;
      case 'critical': default: return lowScoreProducts;
    }
  };

  const displayedProducts = getFilteredProducts();

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-white">SEO & Trends</h2>
                <p className="text-slate-400 text-sm">Optimierung für Suchmaschinen und Social Media Viralität.</p>
            </div>
             <div className="flex bg-[#1a1a2e] p-1 rounded-lg border border-white/10">
                 <button 
                    onClick={() => setActiveTab('analysis')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analysis' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                     Analyse
                 </button>
                 <button 
                    onClick={() => setActiveTab('trends')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'trends' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                     Trend Radar
                 </button>
             </div>
        </div>

        {activeTab === 'analysis' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div 
                        onClick={() => setSelectedFilter('critical')}
                        className={`glass-panel p-6 rounded-2xl relative overflow-hidden group cursor-pointer transition-all border border-transparent ${selectedFilter === 'critical' ? 'ring-1 ring-indigo-500 bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Icons.Search className="w-24 h-24 text-indigo-500" />
                        </div>
                        <h3 className="text-slate-400 text-sm font-medium mb-2">Durchschnittlicher SEO Score</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">72</span>
                            <span className="text-sm text-slate-500 mb-1">/ 100</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[72%]"></div>
                        </div>
                         {selectedFilter === 'critical' && (
                            <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 p-1.5 rounded-lg">
                                <Icons.Check className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <div 
                        onClick={() => setSelectedFilter('missing_meta')}
                        className={`glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500 cursor-pointer transition-all ${selectedFilter === 'missing_meta' ? 'ring-1 ring-amber-500 bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <h3 className="text-slate-400 text-sm font-medium mb-2">Fehlende Meta-Beschreibungen</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{missingMeta.length}</span>
                            <span className="text-sm text-amber-400 mb-1">Produkte</span>
                        </div>
                        <div className="mt-4 text-xs text-amber-300 flex items-center gap-1 group-hover:underline">
                            Anzeigen <Icons.ChevronRight className="w-3 h-3" />
                        </div>
                    </div>

                    <div 
                        onClick={() => setSelectedFilter('optimized')}
                        className={`glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 cursor-pointer transition-all ${selectedFilter === 'optimized' ? 'ring-1 ring-emerald-500 bg-white/10' : 'hover:bg-white/5'}`}
                    >
                        <h3 className="text-slate-400 text-sm font-medium mb-2">Optimierte Produkte</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">{optimizedProducts.length}</span>
                            <span className="text-sm text-emerald-400 mb-1">Produkte</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h3 className="font-semibold text-white">
                            {selectedFilter === 'critical' && 'Kritische Probleme'}
                            {selectedFilter === 'missing_meta' && 'Produkte ohne Meta-Beschreibung'}
                            {selectedFilter === 'optimized' && 'Bereits optimierte Produkte'}
                        </h3>
                        <div className="flex gap-2">
                            {displayedProducts.length > 0 && selectedFilter !== 'optimized' && (
                                <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
                                    <Icons.Sparkles className="w-3 h-3" />
                                    Auto-Fix All ({displayedProducts.length})
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {displayedProducts.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                                <Icons.Check className="w-12 h-12 mb-4 opacity-20 text-emerald-500" />
                                <p>Alles sauber! Keine Produkte in dieser Liste.</p>
                            </div>
                        ) : (
                            displayedProducts.map(p => (
                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden border border-white/10 shrink-0">
                                            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{p.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs flex items-center gap-1 ${p.seoScore < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    <Icons.Alert className="w-3 h-3" /> Score: {p.seoScore}
                                                </span>
                                                <span className="text-xs text-slate-500">•</span>
                                                <span className="text-xs text-slate-500">
                                                    {!p.metafields.seoDescription ? 'Meta Beschreibung fehlt' : 'SEO geprüft'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border border-white/5">
                                        <Icons.Sparkles className="w-3 h-3" /> Fixen
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'trends' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-2xl">
                         <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Icons.Hash className="w-5 h-5 text-indigo-400" /> Viral Potential
                         </h3>
                         <div className="space-y-4">
                             {products.slice(0, 3).map((p, i) => (
                                 <div key={p.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <span className="text-lg font-bold text-slate-500">#{i + 1}</span>
                                         <div className="w-10 h-10 rounded bg-slate-800 overflow-hidden">
                                             <img src={p.imageUrl} className="w-full h-full object-cover" />
                                         </div>
                                         <div className="text-sm text-white font-medium">{p.title}</div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                                             <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${90 - i * 15}%` }}></div>
                                         </div>
                                         <span className="text-xs text-slate-400">{90 - i * 15}/100</span>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>

                     <div className="glass-panel p-6 rounded-2xl">
                         <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Icons.TrendingUp className="w-5 h-5 text-emerald-400" /> Trending Keywords
                         </h3>
                         <div className="flex flex-wrap gap-2">
                             {['#SwissDesign', '#Nachhaltig', '#Winter2024', '#Geschenkidee', '#Handmade', '#Zürich', '#Bern', '#AlpenChic'].map((tag, i) => (
                                 <span key={i} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-slate-300 transition-colors cursor-pointer">
                                     {tag}
                                 </span>
                             ))}
                         </div>
                         <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                             <h4 className="text-sm font-medium text-indigo-300 mb-1">Grok Insight</h4>
                             <p className="text-xs text-slate-400">
                                 "Nachhaltige Produkte aus Zirbenholz verzeichnen diese Woche einen Anstieg von 45% im Suchvolumen. Optimieren Sie Ihre Tags für 'Bio' und 'Swiss Made'."
                             </p>
                         </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};