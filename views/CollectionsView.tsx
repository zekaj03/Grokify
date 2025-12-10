import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { Collection } from '../types';
import { MOCK_COLLECTIONS, MOCK_PRODUCTS } from '../services/mockData';
import { GoogleGenAI } from "@google/genai";

export const CollectionsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'uncategorized'>('overview');
    const [isAutoAssigning, setIsAutoAssigning] = useState(false);
    
    // Mock products without collection
    const uncategorizedProducts = MOCK_PRODUCTS.slice(0, 3);

    const handleAutoAssign = async () => {
        setIsAutoAssigning(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // Using thinking mode to decide complex categorization logic
            const prompt = `Analysiere diese Produkte und weise sie den passenden Kollektionen zu.
            
            Produkte: ${uncategorizedProducts.map(p => p.title).join(', ')}
            Verfügbare Kollektionen: ${MOCK_COLLECTIONS.map(c => c.title).join(', ')}
            
            Entscheide logisch basierend auf Semantik, Saison und Produkttyp.
            Denke Schritt für Schritt, warum ein Produkt passt.
            
            Output JSON:
            [{ "product": "Name", "collection": "Name", "reason": "Begründung" }]`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    thinkingConfig: { thinkingBudget: 32768 }
                }
            });
            console.log(response.text);
            // Simulate processing time and success
            setTimeout(() => setIsAutoAssigning(false), 2000);
        } catch (e) {
            console.error(e);
            setIsAutoAssigning(false);
        }
    };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-white">Kollektionen</h2>
                <p className="text-slate-400 text-sm">Organisieren Sie Ihre Produkte in Kategorien.</p>
            </div>
             <div className="flex bg-[#1a1a2e] p-1 rounded-lg border border-white/10">
                 <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                     Übersicht
                 </button>
                 <button 
                    onClick={() => setActiveTab('uncategorized')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'uncategorized' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                     Ohne Kollektion
                     <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 rounded-full">{uncategorizedProducts.length}</span>
                 </button>
             </div>
        </div>

        {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_COLLECTIONS.map(col => (
                    <div key={col.id} className="glass-panel p-0 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer">
                        <div className="h-32 bg-slate-800 relative overflow-hidden">
                            <img src={col.image} alt={col.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-4 right-4">
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${col.type === 'smart' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'}`}>
                                    {col.type === 'smart' ? 'Automatisch' : 'Manuell'}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-1">{col.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{col.productsCount} Produkte</p>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#12121a]"></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-[#12121a]"></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-500 border-2 border-[#12121a]"></div>
                                </div>
                                <span className="text-xs text-slate-500 pl-2">+ {col.productsCount - 3} weitere</span>
                            </div>
                            
                            <button className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors">
                                Bearbeiten
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Add New Card */}
                <div className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center min-h-[300px] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all cursor-pointer bg-white/[0.02]">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <Icons.Layers className="w-6 h-6" />
                    </div>
                    <span className="font-medium">Kollektion erstellen</span>
                </div>
            </div>
        ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500 bg-amber-500/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Icons.AlertTriangle className="w-5 h-5 text-amber-500" />
                            {uncategorizedProducts.length} Produkte sind nicht sichtbar
                        </h3>
                        <p className="text-sm text-amber-200/80">Diese Produkte sind keiner Kollektion zugewiesen und erscheinen möglicherweise nicht im Shop.</p>
                    </div>
                    <button 
                        onClick={handleAutoAssign}
                        disabled={isAutoAssigning}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        {isAutoAssigning ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Brain className="w-4 h-4" />}
                        Smart Auto-Assign (Thinking)
                    </button>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 border-b border-white/5 text-slate-400">
                            <tr>
                                <th className="p-4">Produkt</th>
                                <th className="p-4">Typ</th>
                                <th className="p-4">Vorschlag (Grok)</th>
                                <th className="p-4 text-right">Aktion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {uncategorizedProducts.map(p => (
                                <tr key={p.id} className="hover:bg-white/5">
                                    <td className="p-4 text-white font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden">
                                            <img src={p.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                        {p.title}
                                    </td>
                                    <td className="p-4 text-slate-400">{p.productType}</td>
                                    <td className="p-4">
                                        {isAutoAssigning ? (
                                            <div className="h-2 w-24 bg-indigo-500/30 rounded animate-pulse"></div>
                                        ) : (
                                            <span className="text-indigo-400 italic text-xs border border-indigo-500/30 px-2 py-1 rounded">
                                                {p.productType === 'Home & Garden' ? 'Wohnen & Accessoires' : 'Neuheiten'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-slate-400 hover:text-white">
                                            <Icons.Edit className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};