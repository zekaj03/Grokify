import React, { useState } from 'react';
import { Icons } from './ui/Icons';
import { Product, ProductStatus } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ProductEditorProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

type Tab = 'basis' | 'google' | 'seo' | 'media';

export const ProductEditor: React.FC<ProductEditorProps> = ({ product, isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<Tab>('basis');
  const [editedProduct, setEditedProduct] = useState<Product | null>(product);
  const [altTexts, setAltTexts] = useState<Record<number, string>>({});
  const [isGeneratingAlt, setIsGeneratingAlt] = useState(false);

  React.useEffect(() => {
    setEditedProduct(product);
    setAltTexts({});
  }, [product]);

  if (!isOpen || !editedProduct) return null;

  const handleSave = () => {
    // Logic to save, including alt texts if we were persisting them
    console.log("Saving product with alt texts:", altTexts);
    onSave(editedProduct);
    onClose();
  };

  const handleGenerateAltTexts = async () => {
    if (!editedProduct) return;
    setIsGeneratingAlt(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';

        const promises = editedProduct.images.map(async (img, index) => {
             const prompt = `Du bist ein SEO-Experte für Schweizer E-Commerce.
             Generiere einen präzisen, beschreibenden Alt-Text (Alternativtext) für ein Produktbild.
             
             Produkt: ${editedProduct.title}
             Beschreibung: ${editedProduct.description.replace(/<[^>]*>?/gm, '')}
             Bild-Kontext: Bild Nr. ${index + 1} der Galerie.
             
             Anforderungen:
             - Sprache: Schweizer Hochdeutsch (kein ß)
             - Max. 125 Zeichen
             - Fokus auf Barrierefreiheit und SEO Keywords
             - Beschreibe was zu sehen wäre (simuliert basierend auf Produktkontext)
             
             Gib NUR den Text zurück, ohne Anführungszeichen.`;

             const result = await ai.models.generateContent({
                 model: model,
                 contents: prompt
             });
             return { index, text: result.text.trim() };
        });

        const results = await Promise.all(promises);
        const newAltTexts = { ...altTexts };
        results.forEach(r => {
            newAltTexts[r.index] = r.text;
        });
        setAltTexts(newAltTexts);

    } catch (e) {
        console.error("Alt text generation failed", e);
    } finally {
        setIsGeneratingAlt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-2xl bg-[#0f0f16] h-full shadow-2xl flex flex-col border-l border-white/10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-[#0a0a0f]">
          <div>
            <h2 className="text-lg font-semibold text-white">Produkt bearbeiten</h2>
            <p className="text-xs text-slate-400 truncate w-64">{editedProduct.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
              <Icons.Close className="w-5 h-5" />
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <Icons.Save className="w-4 h-4" />
              Speichern
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-white/10 flex gap-6 bg-[#0a0a0f]">
          {[
            { id: 'basis', label: 'Basisdaten', icon: Icons.Products },
            { id: 'google', label: 'Google Merchant', icon: Icons.ShoppingBag },
            { id: 'seo', label: 'SEO', icon: Icons.Globe },
            { id: 'media', label: 'Medien', icon: Icons.Image },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
          
          {/* Basis Tab */}
          {activeTab === 'basis' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Titel</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedProduct.title}
                    onChange={(e) => setEditedProduct({...editedProduct, title: e.target.value})}
                    className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                  />
                  <button className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20" title="KI Optimierung">
                    <Icons.Sparkles className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Beschreibung (HTML)</label>
                <div className="relative">
                    <textarea
                        rows={6}
                        value={editedProduct.description}
                        onChange={(e) => setEditedProduct({...editedProduct, description: e.target.value})}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none font-mono text-sm"
                    />
                    <button className="absolute right-2 bottom-2 text-xs bg-indigo-600 text-white px-2 py-1 rounded flex items-center gap-1">
                        <Icons.Sparkles className="w-3 h-3" /> Umschreiben
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Preis (CHF)</label>
                  <input
                    type="number"
                    value={editedProduct.price}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Vergleichspreis</label>
                  <input
                    type="number"
                    value={editedProduct.compareAtPrice || ''}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-sm text-slate-400">SKU</label>
                  <input
                    type="text"
                    value={editedProduct.sku}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Inventar</label>
                  <input
                    type="number"
                    value={editedProduct.inventory}
                    className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

               <div className="space-y-2">
                <label className="text-sm text-slate-400">Tags (Kommagetrennt)</label>
                <div className="flex gap-2 flex-wrap p-2 bg-[#1a1a2e] border border-white/10 rounded-lg">
                    {editedProduct.tags.map(tag => (
                        <span key={tag} className="bg-white/10 px-2 py-1 rounded text-xs text-slate-300 flex items-center gap-1">
                            {tag} <Icons.Close className="w-3 h-3 cursor-pointer" />
                        </span>
                    ))}
                    <input type="text" placeholder="+ Tag" className="bg-transparent text-sm outline-none text-white min-w-[60px]" />
                </div>
              </div>
            </div>
          )}

          {/* Google Merchant Tab */}
          {activeTab === 'google' && (
            <div className="space-y-6">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                    <Icons.Alert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-amber-300">Google Merchant Hinweis</h4>
                        <p className="text-xs text-amber-400/80 mt-1">Stellen Sie sicher, dass eine GTIN vorhanden ist, oder aktivieren Sie "GTIN Befreiung".</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-slate-400">Google Produktkategorie (ID)</label>
                    <div className="flex gap-2">
                         <input
                            type="text"
                            value={editedProduct.metafields.google?.googleProductCategory || ''}
                            placeholder="z.B. 568"
                            className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                        />
                        <button className="text-xs bg-white/5 border border-white/10 px-3 rounded hover:bg-white/10 text-slate-300">
                            Liste suchen
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm text-slate-400">GTIN / EAN</label>
                        <input
                            type="text"
                            value={editedProduct.metafields.google?.gtin || ''}
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">MPN</label>
                        <input
                            type="text"
                            value={editedProduct.metafields.google?.mpn || ''}
                            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                    <input 
                        type="checkbox" 
                        checked={!editedProduct.metafields.google?.identifierExists}
                        className="rounded bg-slate-800 border-slate-600 text-indigo-500" 
                    />
                    <div>
                        <span className="text-sm text-slate-200 block">GTIN Befreiung (Custom Product)</span>
                        <span className="text-xs text-slate-500">Setzt "identifier_exists" auf "no"</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm text-slate-400">Zustand</label>
                        <select className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none">
                            <option value="new">Neu</option>
                            <option value="used">Gebraucht</option>
                            <option value="refurbished">Generalüberholt</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">Geschlecht</label>
                        <select className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none">
                            <option value="unisex">Unisex</option>
                            <option value="male">Herren</option>
                            <option value="female">Damen</option>
                        </select>
                    </div>
                </div>
            </div>
          )}

           {/* SEO Tab */}
           {activeTab === 'seo' && (
            <div className="space-y-6">
                <div className="glass-panel p-4 rounded-xl">
                    <h4 className="text-sm text-slate-400 mb-2">Google Vorschau</h4>
                    <div className="font-sans">
                         <div className="text-xs text-slate-400 mb-1">ikaufen.ch › produkte › {editedProduct.handle}</div>
                        <div className="text-xl text-[#8ab4f8] hover:underline cursor-pointer truncate">
                            {editedProduct.metafields.seoTitle || editedProduct.title}
                        </div>
                        <div className="text-sm text-slate-400 line-clamp-2">
                            {editedProduct.metafields.seoDescription || editedProduct.description.replace(/<[^>]*>?/gm, '')}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                         <label className="text-sm text-slate-400">Meta Titel</label>
                         <span className="text-xs text-emerald-400">Optimal (45/60)</span>
                    </div>
                    <input
                        type="text"
                        value={editedProduct.metafields.seoTitle || editedProduct.title}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                </div>

                 <div className="space-y-2">
                    <div className="flex justify-between">
                         <label className="text-sm text-slate-400">Meta Beschreibung</label>
                         <span className="text-xs text-amber-400">Zu kurz (80/160)</span>
                    </div>
                    <textarea
                        rows={3}
                        value={editedProduct.metafields.seoDescription || ''}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                </div>

                 <div className="space-y-2">
                    <label className="text-sm text-slate-400">URL Handle</label>
                    <input
                        type="text"
                        value={editedProduct.handle}
                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                    />
                </div>

                 <button className="w-full py-3 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 rounded-xl hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2">
                    <Icons.Sparkles className="w-4 h-4" />
                    SEO mit Grok optimieren
                 </button>
            </div>
           )}

            {/* Media Tab */}
            {activeTab === 'media' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-white">Produktbilder</h3>
                        <button 
                            onClick={handleGenerateAltTexts}
                            disabled={isGeneratingAlt}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            {isGeneratingAlt ? <Icons.Refresh className="w-3 h-3 animate-spin" /> : <Icons.Sparkles className="w-3 h-3" />}
                            KI Alt-Texte generieren (Alle)
                        </button>
                    </div>

                    <div className="space-y-4">
                        {editedProduct.images?.map((img, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-24 h-24 bg-black rounded-lg overflow-hidden shrink-0 border border-white/10 relative group">
                                     <img src={img} alt={altTexts[idx] || ""} className="w-full h-full object-cover" />
                                     {idx === 0 && <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded">Main</span>}
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <Icons.Maximize className="w-4 h-4 text-white" />
                                     </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                     <div className="flex justify-between items-center">
                                        <label className="text-xs text-slate-400 font-medium">Alt Text (SEO)</label>
                                        {altTexts[idx] && <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"><Icons.Check className="w-3 h-3" /> Generiert</span>}
                                     </div>
                                     <textarea 
                                        value={altTexts[idx] || ''}
                                        onChange={(e) => setAltTexts({...altTexts, [idx]: e.target.value})}
                                        placeholder="Beschreibe das Bild für Suchmaschinen..."
                                        className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none h-16 resize-none"
                                     />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors">
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                         
                         <div className="p-8 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all cursor-pointer">
                            <Icons.ImagePlus className="w-8 h-8 mb-2" />
                            <span className="text-sm">Bild hochladen</span>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};