import React, { useState } from 'react';
import { Icons } from '../components/ui/Icons';
import { Product } from '../types';
import { grok } from '../services/grok';

interface AutomationViewProps {
  products: Product[];
}

type AgentStatus = 'idle' | 'analyzing' | 'working' | 'completed';
type TaskType = 'bundling' | 'landing_page' | 'dead_stock';

interface AutoTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  impact: string;
  status: 'pending' | 'active' | 'done';
  data?: any;
}

export const AutomationView: React.FC<AutomationViewProps> = ({ products }) => {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const [tasks, setTasks] = useState<AutoTask[]>([
    {
      id: 't1',
      type: 'bundling',
      title: 'Smart Bundle Opportunity',
      description: 'Analyse zeigt: "Diffuser" und "Gesichtscreme" werden oft zusammen gekauft.',
      impact: '+15% AOV (Order Value)',
      status: 'pending',
      data: { products: ['Alpenluft Premium Diffuser', 'Gletscherwasser Gesichtscreme'] }
    },
    {
      id: 't2',
      type: 'landing_page',
      title: 'Kampagne: Winter Sale',
      description: 'Erstelle eine High-Conversion Landingpage für den kommenden Ausverkauf.',
      impact: 'Steigert Conversion Rate',
      status: 'pending'
    },
    {
      id: 't3',
      type: 'dead_stock',
      title: 'Inventar Bereinigung',
      description: 'Produkt "Fondue-Set" hat geringe Rotation. Rabatt-Aktion starten?',
      impact: 'Liquidität freisetzen',
      status: 'pending'
    }
  ]);

  const addToLog = (msg: string) => {
    setConsoleLog(prev => [...prev, `> ${msg}`]);
  };

  const executeTask = async (task: AutoTask) => {
    setActiveTask(task.id);
    setGeneratedResult(null);
    setConsoleLog([]);
    addToLog(`Initialisiere Agent für: ${task.type}...`);
    addToLog(`Lade Kontextdaten aus Shopify API...`);

    try {
      let prompt = '';
      
      if (task.type === 'bundling') {
        addToLog(`Aktiviere Grok Neural Core für Margen-Analyse...`);
        prompt = `Du bist ein E-Commerce Stratege. Erstelle ein unwiderstehliches Produkt-Bundle aus: ${task.data.products.join(' + ')}.
        Analysiere psychologische Preispunkte und Kundenbedürfnisse.
        
        Output als JSON:
        {
          "title": "Kreativer Bundle Name",
          "description": "Verkaufsstarke Beschreibung (Schweizerdeutsch)",
          "price": "Kalkulierter Bundle Preis (Original ist ca 180 CHF)",
          "discount": "Rabatt in %",
          "sku": "Generierte SKU",
          "tags": ["tag1", "tag2"]
        }`;
      } else if (task.type === 'landing_page') {
        addToLog(`Aktiviere Grok für UX/UI Design...`);
        prompt = `Du bist ein Senior UX Designer. Erstelle die Struktur für eine "Winter Sale" Landing Page für einen Schweizer Shop.
        Berücksichtige Conversion-Optimierung (CRO) und lokale Design-Präferenzen.
        
        Output als JSON:
        {
          "headline": "Hero Headline",
          "subheadline": "Subheadline",
          "sections": [
            {"title": "Section Title", "content": "Section Content"}
          ],
          "cta": "Call to Action Text",
          "colorScheme": "Vorschlag für Farben"
        }`;
      } else if (task.type === 'dead_stock') {
        addToLog(`Aktiviere Grok für Abverkaufs-Strategie...`);
        prompt = `Du bist ein Marketing-Experte. Erstelle eine E-Mail Kampagne um das "Fondue-Set" abzuverkaufen.
        Der Ton soll dringend aber exklusiv wirken.
        
        Output als JSON:
        {
          "subject": "Betreffzeile",
          "previewText": "Vorschautext",
          "emailBody": "Text für die Email",
          "discountCode": "Generierter Code"
        }`;
      }

      addToLog('Sende Daten an xAI API...');
      
      const result = await grok.generateJSON(
          "Du bist ein Grok AI Autonomous Agent.",
          prompt
      );

      addToLog('Verarbeite Antwort...');
      setGeneratedResult(result);
      addToLog('Task erfolgreich ausgeführt.');
      
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'done' } : t));

    } catch (e) {
      addToLog(`Fehler: ${e}`);
      console.error(e);
    } finally {
      setActiveTask(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Icons.Brain className="w-8 h-8 text-indigo-500" />
            Grok Autopilot
          </h1>
          <p className="text-slate-400 mt-1">Autonome Shop-Optimierung & Strategie-Exekution.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          SYSTEM ONLINE
        </div>
      </div>

      {/* Agents Section - Unified Panel */}
      <div className="glass-panel p-1 rounded-2xl shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
            {[
            { name: 'Merchandising Agent', status: 'Scanning Orders', icon: Icons.Merge, color: 'indigo' },
            { name: 'Frontend Designer', status: 'Idle', icon: Icons.Layout, color: 'purple' },
            { name: 'Inventory Bot', status: 'Analyzing Stock', icon: Icons.Bot, color: 'amber' },
            ].map((agent, idx) => (
            <div key={idx} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className={`p-3 rounded-xl bg-${agent.color}-500/10 text-${agent.color}-400 ring-1 ring-${agent.color}-500/20 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                <agent.icon className="w-6 h-6" />
                </div>
                <div>
                <h3 className="font-medium text-white">{agent.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    {agent.status === 'Idle' ? <span className="w-1.5 h-1.5 rounded-full bg-slate-600"/> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"/>}
                    {agent.status}
                </p>
                </div>
            </div>
            ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Task Feed (Left Column - 4 cols) */}
        <div className="lg:col-span-4 glass-panel p-0 rounded-2xl overflow-hidden flex flex-col border-r-0">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Icons.Zap className="w-4 h-4 text-amber-400" /> Opportunity Feed
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-[#0a0a0f]/50">
                {tasks.map(task => (
                    <div 
                        key={task.id} 
                        className={`group p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                            activeTask === task.id ? 'bg-indigo-600/10 border-indigo-500/50' :
                            task.status === 'done' ? 'border-emerald-500/20 bg-emerald-500/5 opacity-75' : 
                            'border-white/5 bg-[#12121a] hover:bg-white/5 hover:border-white/10'
                        }`}
                        onClick={() => executeTask(task)}
                    >
                        {activeTask === task.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 animate-pulse"></div>}
                        
                        <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                 task.type === 'bundling' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 
                                 task.type === 'landing_page' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                             }`}>
                                 {task.type.replace('_', ' ')}
                             </span>
                             {task.status === 'done' && <Icons.Check className="w-4 h-4 text-emerald-500" />}
                             {activeTask === task.id && <Icons.Refresh className="w-3 h-3 text-indigo-400 animate-spin" />}
                        </div>
                        <h4 className="text-white font-medium text-sm mb-1 group-hover:text-indigo-300 transition-colors">{task.title}</h4>
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/5 w-fit px-2 py-1 rounded">
                            <Icons.TrendingUp className="w-3 h-3" /> {task.impact}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Console / Output (Right Column - 8 cols) */}
        <div className="lg:col-span-8 glass-panel p-0 rounded-2xl overflow-hidden flex flex-col relative shadow-2xl">
             <div className="p-3 border-b border-white/5 bg-[#08080c] flex justify-between items-center">
                <div className="flex gap-2 px-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                </div>
                <h3 className="font-mono text-xs text-slate-500 flex items-center gap-2">
                    <Icons.Terminal className="w-3 h-3" /> Grok_Kernel_v4.1 :: Thinking Mode
                </h3>
            </div>
            
            <div className="flex-1 bg-[#050508] p-6 font-mono text-sm overflow-y-auto custom-scrollbar relative">
                {/* Scanlines effect overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
                
                {!generatedResult && consoleLog.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-slate-800 select-none">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 rounded-full"></div>
                            <Icons.Brain className="w-24 h-24 mb-6 opacity-20 relative z-10" />
                        </div>
                        <p className="font-medium text-slate-600">Bereit für Instruktionen</p>
                        <p className="text-xs text-slate-700 mt-2">Wähle eine Opportunity aus dem Feed</p>
                     </div>
                )}

                {/* Logs */}
                <div className="space-y-1.5 mb-8 text-slate-400/80">
                    {consoleLog.map((log, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-slate-600 select-none">{new Date().toLocaleTimeString('de-CH', {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
                            <span className="text-indigo-500/50 select-none">➜</span>
                            <span>{log.replace('> ', '')}</span>
                        </div>
                    ))}
                    {activeTask && (
                         <div className="flex gap-2 animate-pulse">
                            <span className="text-slate-600">...</span>
                            <span className="text-indigo-400">Thinking</span>
                            <span className="w-2 h-5 bg-indigo-500/50 block"></span>
                        </div>
                    )}
                </div>

                {/* Result Display - Floating Card Style */}
                {generatedResult && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 pb-10">
                        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <Icons.Check className="w-3 h-3" /> TASK EXECUTION COMPLETE
                        </div>
                        
                        <div className="bg-[#0f0f16] border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
                            {/* Glow effect */}
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                            {/* Bundle View */}
                            {generatedResult.title && generatedResult.sku && (
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl text-white font-bold tracking-tight">{generatedResult.title}</h2>
                                            <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-lg">{generatedResult.description}</p>
                                        </div>
                                        <div className="text-right bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div className="text-3xl font-bold text-white tracking-tight">{generatedResult.price} <span className="text-lg text-slate-500 font-normal">CHF</span></div>
                                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mt-1">Sparvorteil: {generatedResult.discount}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {generatedResult.tags?.map((t: string) => (
                                            <span key={t} className="px-2.5 py-1 bg-white/10 rounded-md text-xs font-medium text-slate-300 border border-white/5">{t}</span>
                                        ))}
                                    </div>
                                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                                        <Icons.Products className="w-4 h-4" />
                                        In Shopify erstellen
                                    </button>
                                </div>
                            )}

                            {/* Landing Page View */}
                            {generatedResult.headline && (
                                <div className="space-y-6 relative z-10">
                                    <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02]">
                                        <h1 className="text-3xl font-bold text-white text-center mb-3 tracking-tight">{generatedResult.headline}</h1>
                                        <p className="text-center text-slate-400 text-lg font-light">{generatedResult.subheadline}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {generatedResult.sections?.map((s: any, i: number) => (
                                            <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                <h4 className="font-bold text-indigo-300 mb-2 text-sm uppercase tracking-wide">{s.title}</h4>
                                                <p className="text-sm text-slate-400 leading-relaxed">{s.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-4">
                                         <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                                            <Icons.Layout className="w-4 h-4" />
                                            Preview
                                        </button>
                                        <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-all border border-white/10">
                                            Code kopieren
                                        </button>
                                    </div>
                                </div>
                            )}

                             {/* Email View */}
                            {generatedResult.subject && (
                                <div className="space-y-6 relative z-10">
                                    <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl">
                                        <div className="border-b border-slate-200 pb-4 mb-6">
                                            <div className="flex gap-2 text-sm mb-1">
                                                <span className="text-slate-500 font-medium w-16">Subject:</span>
                                                <span className="text-slate-900 font-semibold">{generatedResult.subject}</span>
                                            </div>
                                            <div className="flex gap-2 text-sm">
                                                <span className="text-slate-500 font-medium w-16">Preview:</span>
                                                <span className="text-slate-600">{generatedResult.previewText}</span>
                                            </div>
                                        </div>
                                        <div className="prose prose-slate prose-sm max-w-none">
                                             <p className="whitespace-pre-wrap leading-relaxed">{generatedResult.emailBody}</p>
                                        </div>
                                        <div className="mt-8 text-center">
                                            <div className="inline-block px-6 py-3 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 font-mono font-bold text-lg tracking-widest text-slate-700">
                                                {generatedResult.discountCode}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                                        <Icons.Mail className="w-4 h-4" />
                                        Kampagne in Klaviyo erstellen
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};