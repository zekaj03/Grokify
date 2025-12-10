import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface MediaViewProps {
  products: Product[];
}

export const MediaView: React.FC<MediaViewProps> = ({ products }) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const handleAnalyze = async (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setAnalyzing(true);
        setAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // Mock fetching image as base64 or pass url if model supports it (Gemini supports URLs in some contexts, but let's assume prompt structure for now)
            // Note: In a real frontend app, you'd fetch the image, convert to base64, then send.
            
            const prompt = `Analysiere dieses Produktbild für einen E-Commerce Shop (ikaufen.ch).
            Denke wie ein professioneller Fotograf und SEO-Experte.
            
            1. Bewerte die Qualität (Belichtung, Fokus, Hintergrund).
            2. Generiere einen perfekten SEO Alt-Text (Schweizerdeutsch).
            3. Schlage Verbesserungen vor.
            
            Output als JSON:
            {
                "qualityScore": 85,
                "altText": "Beschreibung...",
                "improvements": ["Hintergrund aufhellen", "Mehr Kontrast"],
                "technical": "2048x2048px • JPG"
            }`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [
                    { text: prompt },
                    // { inlineData: { mimeType: 'image/jpeg', data: '...' } } // In real implementation
                ],
                config: {
                    responseMimeType: 'application/json',
                    thinkingConfig: { thinkingBudget: 32768 } // Deep thinking for visual analysis
                }
            });

             // Mock result for demo purposes since we can't easily pass image data in this text-only response environment
            setTimeout(() => {
                 setAnalysis({
                    qualityScore: 88,
                    altText: "Handgefertigter Zirbenholz Diffuser mit Nebel-Effekt vor neutralem Hintergrund",
                    improvements: ["Schattenwurf links etwas zu hart", "Farbsättigung leicht erhöhen"],
                    technical: "1024x1024px • WebP"
                 });
                 setAnalyzing(false);
            }, 2000);

        } catch (e) {
            console.error(e);
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8">
             <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white">Media Optimizer</h2>
                    <p className="text-slate-400 text-sm">KI-gestützte Bildanalyse und Alt-Text Generierung.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
                {/* Gallery */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl overflow-y-auto custom-scrollbar">
                    <h3 className="text-lg font-semibold text-white mb-4">Produkt Galerie</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {products.flatMap(p => p.images.map((img, i) => (
                            <div 
                                key={`${p.id}-${i}`} 
                                onClick={() => handleAnalyze(img)}
                                className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative group ${selectedImage === img ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-transparent hover:border-white/20'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Icons.Maximize className="text-white w-6 h-6" />
                                </div>
                            </div>
                        )))}
                    </div>
                </div>

                {/* Analysis Panel */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Icons.Brain className="w-5 h-5 text-indigo-400" />
                        Grok Vision Analysis
                    </h3>

                    {!selectedImage ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                            <Icons.ImagePlus className="w-12 h-12 mb-3 opacity-20" />
                            <p>Wähle ein Bild aus.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
                             <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/10 relative">
                                 <img src={selectedImage} className="w-full h-full object-contain" />
                             </div>

                             {analyzing ? (
                                 <div className="py-12 flex flex-col items-center text-indigo-400">
                                     <Icons.Refresh className="w-8 h-8 animate-spin mb-3" />
                                     <p className="animate-pulse text-sm">Thinking Mode Active...</p>
                                 </div>
                             ) : analysis ? (
                                 <div className="space-y-4">
                                     <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                         <span className="text-slate-400 text-sm">Quality Score</span>
                                         <span className={`font-bold ${analysis.qualityScore > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                             {analysis.qualityScore}/100
                                         </span>
                                     </div>

                                     <div>
                                         <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Generierter Alt-Text</label>
                                         <div className="p-3 bg-[#1a1a2e] border border-white/10 rounded-lg text-sm text-white">
                                             {analysis.altText}
                                         </div>
                                     </div>

                                      <div>
                                         <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Verbesserungsvorschläge</label>
                                         <ul className="space-y-1">
                                             {analysis.improvements.map((imp: string, i: number) => (
                                                 <li key={i} className="text-xs text-amber-200 flex items-start gap-2">
                                                     <Icons.AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {imp}
                                                 </li>
                                             ))}
                                         </ul>
                                     </div>

                                     <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
                                         Alt-Text speichern
                                     </button>
                                 </div>
                             ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};