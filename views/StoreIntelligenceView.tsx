import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface StoreIntelligenceViewProps {
  products: Product[];
}

type Tab = 'competitor' | 'translation' | 'reputation';

export const StoreIntelligenceView: React.FC<StoreIntelligenceViewProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<Tab>('competitor');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Translation State
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id);
  const [targetLang, setTargetLang] = useState<'fr' | 'it'>('fr');
  const [translationOutput, setTranslationOutput] = useState('');

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setTranslationOutput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = 'gemini-3-pro-preview';
      
      if (activeTab === 'competitor') {
        const product = products.find(p => p.id === selectedProduct);
        const prompt = `Führe eine Konkurrenzanalyse für den Schweizer E-Commerce Markt durch für das Produkt: "${product?.title}".
        Berücksichtige typische Konkurrenten wie Galaxus, Digitec, Microspot, Interdiscount.
        Denke tiefgründig über Preisstrategien und Marktlücken nach.
        
        Output als JSON:
        {
          "marketPriceAverage": "Durchschnittspreis in CHF",
          "competitors": [
            { "name": "Galaxus", "price": "Preis", "status": "In Stock" },
            { "name": "Fust", "price": "Preis", "status": "Low Stock" }
          ],
          "strategy": "Empfehlung für Preisstrategie (z.B. Unterbieten oder Premium-Positionierung)",
          "opportunity": "Eine Lücke im Markt (z.B. Bundle anbieten)"
        }`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { 
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingBudget: 32768 }
          }
        });
        setAnalysisResult(JSON.parse(response.text || '{}'));

      } else if (activeTab === 'translation') {
        // Translation might not need deep thinking, but consistency is good.
        const product = products.find(p => p.id === selectedProduct);
        const langName = targetLang === 'fr' ? 'Französisch (Schweiz/Romandie)' : 'Italienisch (Schweiz/Tessin)';
        
        const prompt = `Übersetze diesen Produkt-Content professionell ins ${langName}.
        Beachte lokale Nuancen, Dialekte und kulturelle Gepflogenheiten der Schweiz.
        
        Titel: ${product?.title}
        Beschreibung: ${product?.description}
        
        Format:
        **Titel:** [Übersetzter Titel]
        
        **Beschreibung:**
        [Übersetzte Beschreibung]`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash', // Flash is usually sufficient for translation, but user asked for "relevant" complex queries.
          contents: prompt,
        });
        setTranslationOutput(response.text || '');
      } else if (activeTab === 'reputation') {
         // Reputation analysis benefits from reasoning
         const prompt = `Analysiere fiktive Kundenbewertungen für "ikaufen.ch" und generiere eine Zusammenfassung sowie eine Antwort-Strategie.
         Simuliere verschiedene Kundenpersönlichkeiten.
         
         Output als JSON:
         {
           "sentimentScore": 85,
           "commonIssues": ["Lieferzeit bei A-Post", "Verpackung zu gross"],
           "positiveHighlights": ["Kundenservice sehr freundlich", "Produktqualität top"],
           "suggestedReply": "Entwurf für eine Antwort auf Kritik bezüglich Lieferzeit"
         }`;
         
         const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                thinkingConfig: { thinkingBudget: 32768 }
            }
          });
          setAnalysisResult(JSON.parse(response.text || '{}'));
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Icons.Eye className="w-8 h-8 text-indigo-500" />
            Market Intelligence
          </h1>
          <p className="text-slate-400 mt-1">Spionage, Lokalisierung & Reputation für ikaufen.ch</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        {[
          { id: 'competitor', label: 'Konkurrenz Spion', icon: Icons.Gavel },
          { id: 'translation', label: 'Swiss Polyglot', icon: Icons.Languages },
          { id: 'reputation', label: 'Review Guard', icon: Icons.Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`pb-4 px-4 flex items-center gap-2 font-medium text-sm transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-indigo-400 border-indigo-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
          <h3 className="text-lg font-semibold text-white">
            {activeTab === 'competitor' && 'Produkt-Vergleich'}
            {activeTab === 'translation' && 'Übersetzung'}
            {activeTab === 'reputation' && 'Reputations-Check'}
          </h3>

          {activeTab !== 'reputation' && (
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Produkt wählen</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'translation' && (
            <div className="space-y-2">
                <label className="text-sm text-slate-400">Zielsprache</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setTargetLang('fr')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${targetLang === 'fr' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <span className="text-lg">🇫🇷</span>
                        <span className="text-xs">Français</span>
                    </button>
                     <button 
                        onClick={() => setTargetLang('it')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${targetLang === 'it' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <span className="text-lg">🇮🇹</span>
                        <span className="text-xs">Italiano</span>
                    </button>
                </div>
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            {isAnalyzing ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Zap className="w-4 h-4" />}
            {activeTab === 'competitor' ? 'Markt scannen' : activeTab === 'translation' ? 'Übersetzen' : 'Analysieren'}
          </button>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl min-h-[400px] relative">
            {!analysisResult && !translationOutput && !isAnalyzing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                    <Icons.Eye className="w-16 h-16 mb-4 opacity-10" />
                    <p>Starten Sie die Analyse für ikaufen.ch</p>
                </div>
            )}
            
            {isAnalyzing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400">
                    <Icons.Refresh className="w-12 h-12 mb-4 animate-spin" />
                    <p className="animate-pulse">Grok scannt das Schweizer Web...</p>
                </div>
            )}

            {/* Competitor Result */}
            {activeTab === 'competitor' && analysisResult && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Marktdurchschnitt</p>
                            <p className="text-2xl font-bold text-white">{analysisResult.marketPriceAverage}</p>
                        </div>
                         <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex-1">
                            <p className="text-xs text-indigo-300 uppercase tracking-wider mb-1">Strategie Empfehlung</p>
                            <p className="text-sm text-white">{analysisResult.strategy}</p>
                        </div>
                    </div>

                    <h4 className="text-white font-medium mb-3">Mitbewerber Live-Check</h4>
                    <div className="space-y-2">
                        {analysisResult.competitors?.map((comp: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-slate-300 font-medium">{comp.name}</span>
                                <div className="flex items-center gap-4">
                                     <span className={`text-xs px-2 py-0.5 rounded ${comp.status === 'In Stock' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {comp.status}
                                     </span>
                                     <span className="text-white font-bold">{comp.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Translation Result */}
            {activeTab === 'translation' && translationOutput && (
                <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">
                            Übersetzung ({targetLang === 'fr' ? 'FR' : 'IT'})
                        </h3>
                        <button 
                            onClick={() => navigator.clipboard.writeText(translationOutput)}
                            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white flex items-center gap-2"
                        >
                            <Icons.Copy className="w-3 h-3" /> Copy
                        </button>
                    </div>
                    <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap">
                        {translationOutput}
                    </div>
                    <div className="mt-4 flex gap-2">
                         <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium transition-colors">
                            Als {targetLang.toUpperCase()} Version speichern
                         </button>
                    </div>
                </div>
            )}

            {/* Reputation Result */}
             {activeTab === 'reputation' && analysisResult && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-6">
                         <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="60" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                                <circle cx="64" cy="64" r="60" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray="377" strokeDashoffset={377 - (377 * analysisResult.sentimentScore / 100)} className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="absolute text-center">
                                <span className="text-3xl font-bold text-white">{analysisResult.sentimentScore}</span>
                                <span className="block text-xs text-slate-500">Sentiment</span>
                            </div>
                         </div>
                         <div className="flex-1 space-y-4">
                            <div>
                                <h4 className="text-xs uppercase text-emerald-400 font-bold mb-1">Highlights</h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.positiveHighlights?.map((h: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 text-xs rounded border border-emerald-500/20">{h}</span>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-xs uppercase text-rose-400 font-bold mb-1">Issues</h4>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.commonIssues?.map((h: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-rose-500/10 text-rose-300 text-xs rounded border border-rose-500/20">{h}</span>
                                    ))}
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                            <Icons.Sparkles className="w-4 h-4 text-indigo-400" /> Antwort-Vorschlag
                        </h4>
                        <p className="text-sm text-slate-300 italic">"{analysisResult.suggestedReply}"</p>
                        <button className="mt-3 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-500 transition-colors">
                            Auf Google Reviews posten
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};