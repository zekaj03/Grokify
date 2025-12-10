import React, { useState, useEffect } from 'react';
import { Icons } from '../components/ui/Icons';
import { Product } from '../types';

interface DuplicatesViewProps {
  products: Product[];
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({ products }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Product[][]>([]);
  const [progress, setProgress] = useState(0);

  // Mock checking logic
  const checkForDuplicates = () => {
    setAnalyzing(true);
    setProgress(0);

    const interval = setInterval(() => {
        setProgress(p => {
            if(p >= 100) {
                clearInterval(interval);
                return 100;
            }
            return p + 10;
        });
    }, 150);

    setTimeout(() => {
        // Mocking some duplicates for demonstration
        const duplicates = [
            [
                products[1], // Original
                { ...products[1], id: 'dup_1', title: products[1].title + ' (Copy)', status: 'draft' } as Product
            ],
            [
                products[2],
                { ...products[2], id: 'dup_2', sku: products[2].sku, status: 'archived' } as Product
            ]
        ];
        setDuplicateGroups(duplicates);
        setAnalyzing(false);
    }, 1600);
  };

  useEffect(() => {
      // Auto start check on mount if empty? No, let user click button or auto-run.
      // checkForDuplicates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Duplikate verwalten</h2>
          <p className="text-slate-400 text-sm">Finden und bereinigen Sie doppelte Produkte basierend auf Titel und SKU.</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 text-sm">
                Einstellungen
            </button>
            <button 
                onClick={checkForDuplicates}
                disabled={analyzing}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
                {analyzing ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Search className="w-4 h-4" />}
                Scan starten
            </button>
        </div>
      </div>

      {analyzing && (
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-w-md bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-slate-300 animate-pulse">Analysiere Datenbank...</p>
          </div>
      )}

      {!analyzing && duplicateGroups.length === 0 && (
           <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                   <Icons.Check className="w-10 h-10 text-emerald-500" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Keine Duplikate gefunden</h3>
               <p className="text-slate-400 max-w-md">Ihr Produktkatalog scheint sauber zu sein. Starten Sie einen neuen Scan, um sicherzugehen.</p>
           </div>
      )}

      {!analyzing && duplicateGroups.length > 0 && (
          <div className="space-y-6">
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                      <Icons.Alert className="w-5 h-5 text-amber-500" />
                      <span className="text-amber-200 font-medium">{duplicateGroups.length} Gruppen von Duplikaten gefunden</span>
                  </div>
                  <button className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors">
                      Alle Duplikate löschen (Dry Run)
                  </button>
              </div>

              {duplicateGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="glass-panel rounded-2xl overflow-hidden border border-white/10">
                      <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                          <h4 className="font-medium text-white flex items-center gap-2">
                              <Icons.Copy className="w-4 h-4 text-slate-400" />
                              Gruppe {groupIdx + 1}: "{group[0].title}"
                          </h4>
                          <span className="text-xs text-slate-500">Gleicher Titel / SKU Match</span>
                      </div>
                      <div className="divide-y divide-white/5">
                          {group.map((item, itemIdx) => (
                              <div key={itemIdx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className="text-white font-medium">{item.title}</span>
                                              {itemIdx === 0 && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded border border-emerald-500/20">ORIGINAL</span>}
                                              {itemIdx > 0 && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] rounded border border-rose-500/20">DUPLIKAT</span>}
                                          </div>
                                          <p className="text-xs text-slate-500 mt-1">SKU: {item.sku} • ID: {item.id} • Status: {item.status}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      {itemIdx > 0 && (
                                          <button className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Löschen">
                                              <Icons.Trash className="w-4 h-4" />
                                          </button>
                                      )}
                                      <button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                          <Icons.ExternalLink className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};