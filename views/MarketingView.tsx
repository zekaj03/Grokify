import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface MarketingViewProps {
  products: Product[];
}

export const MarketingView: React.FC<MarketingViewProps> = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id || '');
  const [channel, setChannel] = useState<'instagram' | 'email' | 'ads' | 'blog'>('instagram');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const handlePost = async () => {
    setIsPosting(true);
    // Simulate Shopify API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPosting(false);
    setPostSuccess(true);
    setTimeout(() => setPostSuccess(false), 3000);
  };

  const handleGenerate = async () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setIsGenerating(true);
    setGeneratedContent('');
    setPostSuccess(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const productContext = `
      Produktname: ${product.title}
      Beschreibung: ${product.description.replace(/<[^>]*>?/gm, '')}
      Tags: ${product.tags.join(', ')}
      Vendor: ${product.vendor}
      Preis: ${product.currency} ${product.price}
      `;

      let prompt = '';
      let modelName = 'gemini-2.5-flash';
      let config: any = {};

      switch (channel) {
        case 'instagram':
          prompt = `Erstelle einen viralen Instagram-Post für dieses Produkt.
          Anforderungen:
          - Sprache: Schweizer Hochdeutsch (ss statt ß)
          - Stil: Inspirierend, Lifestyle-orientiert
          - Struktur: Caption, Emojis, 5-10 Hashtags
          
          Kontext:
          ${productContext}`;
          break;
        case 'email':
          prompt = `Schreibe eine Marketing-E-Mail für dieses Produkt.
          Anforderungen:
          - Sprache: Schweizer Hochdeutsch (ss statt ß)
          - Struktur: Betreffzeile (Knackig), Persönliche Anrede, Hauptteil (Storytelling), Call-to-Action
          
          Kontext:
          ${productContext}`;
          break;
        case 'ads':
          prompt = `Erstelle Werbetexte für Google/Facebook Ads.
          Anforderungen:
          - Sprache: Schweizer Hochdeutsch (ss statt ß)
          - Output: 3 Varianten mit je einer Headline (max 30 Zeichen) und Beschreibung (max 90 Zeichen)
          
          Kontext:
          ${productContext}`;
          break;
        case 'blog':
          // Blog posts require deep reasoning and structure
          modelName = 'gemini-3-pro-preview';
          config = { thinkingConfig: { thinkingBudget: 32768 } };
          prompt = `Schreibe einen ausführlichen Blog-Post über dieses Produkt für unseren Shopify Shop.
          Anforderungen:
          - Sprache: Schweizer Hochdeutsch (ss statt ß)
          - Autor: iKteam (Setze dies explizit in die Metadaten)
          - Format: Markdown
          - Titel: Kreativ und SEO-optimiert
          - Struktur: 
            1. Metadaten (Titel, Autor: iKteam, Datum)
            2. Einleitung (Hook)
            3. Problemstellung
            4. Die Lösung (Das Produkt)
            5. 3 Hauptvorteile
            6. Fazit
          - Tonalität: Expertenhaft, vertrauenswürdig, aber gut lesbar
          - Recherche: Erwähne relevante Schweizer Trends oder Fakten wenn möglich.
          
          Kontext:
          ${productContext}`;
          break;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: config
      });

      setGeneratedContent(response.text || 'Keine Inhalte generiert.');
    } catch (error) {
      console.error("Generierung fehlgeschlagen:", error);
      setGeneratedContent(`Fehler bei der Generierung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}. Bitte prüfen Sie den API Key.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
        {/* Left Sidebar: Controls */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 h-fit">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">Marketing Hub</h2>
                <p className="text-xs text-slate-400">Content für Social Media, Ads & Blogs</p>
            </div>

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

            <div className="space-y-2">
                <label className="text-sm text-slate-400">Kanal</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setChannel('instagram')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${channel === 'instagram' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Icons.Instagram className="w-5 h-5" />
                        <span className="text-xs">Insta</span>
                    </button>
                    <button 
                         onClick={() => setChannel('email')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${channel === 'email' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Icons.Mail className="w-5 h-5" />
                        <span className="text-xs">Email</span>
                    </button>
                    <button 
                         onClick={() => setChannel('ads')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${channel === 'ads' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Icons.Megaphone className="w-5 h-5" />
                        <span className="text-xs">Ads</span>
                    </button>
                    <button 
                         onClick={() => setChannel('blog')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${channel === 'blog' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Icons.FileText className="w-5 h-5" />
                        <span className="text-xs">Blog</span>
                    </button>
                </div>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
            >
                {isGenerating ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Sparkles className="w-4 h-4" />}
                Generieren
            </button>
        </div>

        {/* Right Content: Preview */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Icons.Search className="w-5 h-5 text-indigo-400" />
                    Vorschau {channel === 'blog' && '(Markdown)'}
                </h3>
                {generatedContent && (
                    <button 
                        onClick={() => navigator.clipboard.writeText(generatedContent)}
                        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white flex items-center gap-2 transition-colors"
                    >
                        <Icons.Copy className="w-3 h-3" /> Kopieren
                    </button>
                )}
            </div>

            <div className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-y-auto">
                {generatedContent ? generatedContent : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <Icons.Sparkles className="w-8 h-8 mb-3 opacity-20" />
                        <p>Wähle ein Produkt und klicke auf Generieren.</p>
                    </div>
                )}
            </div>
            
            {generatedContent && channel === 'instagram' && (
                <div className="mt-4 flex gap-2">
                    <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden relative group cursor-pointer border border-white/10">
                         <img src={products.find(p => p.id === selectedProduct)?.imageUrl} className="w-full h-full object-cover" />
                    </div>
                     <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden relative group cursor-pointer border border-white/10 flex items-center justify-center">
                        <span className="text-xs text-slate-500">+ Story</span>
                    </div>
                </div>
            )}

            {generatedContent && channel === 'blog' && (
                <div className="mt-4">
                     <button 
                        onClick={handlePost}
                        disabled={isPosting || postSuccess}
                        className={`w-full py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2 ${
                            postSuccess 
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                            : 'bg-white text-black hover:bg-slate-200'
                        }`}
                    >
                        {isPosting ? (
                            <>
                                <Icons.Refresh className="w-4 h-4 animate-spin" />
                                Veröffentliche auf Shopify...
                            </>
                        ) : postSuccess ? (
                            <>
                                <Icons.Check className="w-4 h-4" />
                                Erfolgreich gepostet!
                            </>
                        ) : (
                            <>
                                <Icons.Upload className="w-4 h-4" />
                                Als Blog Post veröffentlichen
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};