import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { OptimizationTone, Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface OptimizerViewProps {
  products: Product[];
}

export const OptimizerView: React.FC<OptimizerViewProps> = ({ products }) => {
  const [selectedTone, setSelectedTone] = useState<OptimizationTone>(OptimizationTone.PROFESSIONAL);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState<string | null>(null);
  
  // Image Optimization State
  const [optimizeImages, setOptimizeImages] = useState(false);
  const [optimizedImages, setOptimizedImages] = useState<string[] | null>(null);
  const [demoImages, setDemoImages] = useState<string[]>([]);

  const demoProduct = products[0];

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizedImages(null);
    setOptimizedText(null);

    // Mock extra images for demo purposes if image optimization is selected
    const currentDemoImages = optimizeImages ? [
        ...demoProduct.images,
        'https://picsum.photos/400/400?random=101',
        'https://picsum.photos/400/400?random=102',
        'https://picsum.photos/400/400?random=103',
        'https://picsum.photos/400/400?random=104'
    ] : demoProduct.images;
    
    if (optimizeImages) {
        setDemoImages(currentDemoImages);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 1. Text Optimization
      const textPrompt = `Optimiere diesen Produkttitel und die Beschreibung für einen Schweizer Shopify Store.
      Produkt: ${demoProduct.title}
      Aktuelle Beschreibung: ${demoProduct.description}
      
      Gewünschter Tonfall: ${selectedTone}
      
      Erstelle EINEN kurzen, konvertierungsstarken Satz, der Titel und USP kombiniert.`;
      
      const textResponsePromise = ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: textPrompt,
          config: { thinkingConfig: { thinkingBudget: 1024 } }
      });

      // 2. Image Optimization (Parallel if selected)
      let imageResponsePromise = Promise.resolve(null);
      if (optimizeImages) {
          const imagePrompt = `Analysiere diese 6 Produktbilder. 
          Aufgabe: Wähle die besten 4 Bilder aus, die das Produkt attraktiv präsentieren.
          Kriterien: Hohe Qualität, gute Belichtung, Fokus auf Produkt, Vielfalt (Detail vs Gesamt).
          
          Output als JSON Array der Indices: [0, 2, 3, 5]`;

          // In a real app, we would pass image bytes here. 
          // For demo, we rely on the model simulating the selection logic or reacting to descriptions.
          imageResponsePromise = ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: imagePrompt,
             config: { 
                 responseMimeType: 'application/json',
                 thinkingConfig: { thinkingBudget: 2048 } 
             }
          }) as any;
      }

      const [textResponse, imageResponse] = await Promise.all([textResponsePromise, imageResponsePromise]);

      setOptimizedText(textResponse.text || "Keine Optimierung möglich.");

      if (optimizeImages && imageResponse) {
          // Simulate parsing indices or just picking a subset for the demo visual
          // In reality: JSON.parse(imageResponse.text) -> indices
          // Here we assume successful selection of best 4
          const bestIndices = [0, 1, 3, 4]; 
          setOptimizedImages(bestIndices.map(i => currentDemoImages[i]));
      }

    } catch (e) {
      setOptimizedText("Fehler bei der Verbindung zu Grok.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Grok Optimizer</h2>
        <p className="text-slate-400">KI-gestützte Optimierung für Titel, Beschreibungen, SEO und Medien auf Schweizerdeutsch.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config Panel */}
        <div className="glass-panel p-6 rounded-2xl h-fit lg:col-span-1 border border-white/10 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Icons.Settings className="w-5 h-5 text-indigo-400" />
            Konfiguration
          </h3>
          
          <div className="space-y-8">
            {/* Tonalität Selector - Segmented Control Style */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tonalität</label>
              <div className="bg-[#0a0a0f] p-1 rounded-xl border border-white/10 flex relative">
                {[
                  { id: OptimizationTone.PROFESSIONAL, label: 'Sachlich' },
                  { id: OptimizationTone.CASUAL, label: 'Locker' },
                  { id: OptimizationTone.LUXURY, label: 'Premium' },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative z-10 ${
                      selectedTone === tone.id
                        ? 'text-white shadow-lg'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {selectedTone === tone.id && (
                        <div className="absolute inset-0 bg-indigo-600 rounded-lg -z-10 animate-in fade-in zoom-in-95 duration-200"></div>
                    )}
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Aktionen auswählen</label>
               
               <label className="flex items-center gap-3 p-3 rounded-xl bg-[#12121a] border border-white/5 cursor-pointer hover:border-indigo-500/30 transition-colors group">
                 <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="peer appearance-none w-5 h-5 rounded border border-slate-600 checked:bg-indigo-600 checked:border-indigo-600 transition-colors" />
                    <Icons.Check className="w-3.5 h-3.5 text-white absolute left-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                 </div>
                 <span className="text-sm text-slate-300 group-hover:text-white transition-colors">SEO Titel optimieren</span>
               </label>

               <label className="flex items-center gap-3 p-3 rounded-xl bg-[#12121a] border border-white/5 cursor-pointer hover:border-indigo-500/30 transition-colors group">
                 <div className="relative flex items-center">
                    <input type="checkbox" defaultChecked className="peer appearance-none w-5 h-5 rounded border border-slate-600 checked:bg-indigo-600 checked:border-indigo-600 transition-colors" />
                    <Icons.Check className="w-3.5 h-3.5 text-white absolute left-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                 </div>
                 <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Beschreibung generieren (HTML)</span>
               </label>

               <label className="flex items-start gap-3 p-3 rounded-xl bg-[#12121a] border border-white/5 cursor-pointer hover:border-indigo-500/30 transition-colors group">
                 <div className="relative flex items-center mt-0.5">
                    <input 
                        type="checkbox" 
                        checked={optimizeImages}
                        onChange={(e) => setOptimizeImages(e.target.checked)}
                        className="peer appearance-none w-5 h-5 rounded border border-slate-600 checked:bg-indigo-600 checked:border-indigo-600 transition-colors" 
                    />
                    <Icons.Check className="w-3.5 h-3.5 text-white absolute left-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                 </div>
                 <div className="flex flex-col">
                     <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Bilder optimieren</span>
                     <span className="text-[10px] text-slate-500 mt-0.5">Auswahl der besten 4 (KI-Vision)</span>
                 </div>
               </label>
            </div>

            <button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
                {isOptimizing ? (
                    <>
                        <Icons.Refresh className="w-5 h-5 animate-spin" />
                        Optimiere...
                    </>
                ) : (
                    <>
                        <Icons.Zap className="w-5 h-5" />
                        Jetzt Generieren
                    </>
                )}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden lg:col-span-2 border border-white/10 shadow-2xl flex flex-col">
             {/* Mock Background Decoration */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2 relative z-10">
                <Icons.Search className="w-5 h-5 text-emerald-400" />
                Vorschau (Live)
            </h3>

            <div className="space-y-8 flex-1 relative z-10">
                {/* Original State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Text</p>
                        <div className="p-5 rounded-xl bg-[#0a0a0f] border border-white/10 text-slate-400 text-sm italic min-h-[100px] shadow-inner">
                            "{demoProduct.title}"
                        </div>
                    </div>
                    {optimizeImages && (
                        <div className="space-y-3">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Bilder ({demoImages.length || demoProduct.images.length})</p>
                             <div className="grid grid-cols-3 gap-2">
                                 {(demoImages.length > 0 ? demoImages : demoProduct.images).map((img, i) => (
                                     <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10 opacity-60 bg-black">
                                         <img src={img} className="w-full h-full object-cover" />
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center -my-2">
                    <div className="bg-[#1a1a2e] border border-white/10 p-2 rounded-full shadow-xl z-20">
                        <Icons.ArrowRight className="text-indigo-500 w-5 h-5 rotate-90" />
                    </div>
                </div>

                {/* Optimized State */}
                <div className="space-y-4">
                     <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                        <Icons.Sparkles className="w-3 h-3" />
                        Grok Optimized Results
                     </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className={`p-5 rounded-xl border transition-all duration-500 min-h-[120px] shadow-lg ${optimizedText ? 'bg-indigo-900/10 border-indigo-500/30 text-white shadow-indigo-500/10' : 'bg-[#0f0f16] border-dashed border-white/10 text-slate-600 flex items-center justify-center'}`}>
                             {optimizedText ? optimizedText : <span className="opacity-50">Warte auf Text-Optimierung...</span>}
                        </div>

                        {optimizeImages && (
                            <div className={`p-5 rounded-xl border transition-all duration-500 min-h-[120px] shadow-lg ${optimizedImages ? 'bg-indigo-900/10 border-indigo-500/30 shadow-indigo-500/10' : 'bg-[#0f0f16] border-dashed border-white/10'}`}>
                                {optimizedImages ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {optimizedImages.map((img, i) => (
                                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-indigo-500/30 relative shadow-md group">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[10px] px-1.5 rounded-sm shadow-sm font-bold">
                                                    #{i+1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                        <Icons.Image className="w-8 h-8 mb-2 opacity-30" />
                                        <span className="text-sm opacity-50">Warte auf Bild-Selektion...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {(optimizedText || optimizedImages) && (
                     <div className="flex gap-4 pt-6 mt-4 border-t border-white/5 animate-in slide-in-from-bottom-2 fade-in">
                        <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transform active:scale-95">
                            <Icons.Check className="w-4 h-4" />
                            Änderungen übernehmen
                        </button>
                        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 border border-white/10 transition-colors">
                            <Icons.Copy className="w-4 h-4" />
                        </button>
                     </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};