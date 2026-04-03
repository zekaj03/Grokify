import React, { useMemo, useState } from 'react';
import { Icons } from '../components/ui/Icons';

interface MarketSignal {
  id: string;
  market: string;
  yesPrice: number;
  noPrice: number;
  edge: number;
  volume: string;
  category: 'macro' | 'crypto' | 'tech' | 'sports' | 'geo';
}

interface WalletTrader {
  address: string;
  pnl: number;
  trades: number;
  role: 'edge' | 'arb' | 'bot';
}

const START_BALANCE = 10000;

const LIVE_SIGNALS: MarketSignal[] = [
  { id: 'm1', market: 'Fed cuts rates in Q3?', yesPrice: 64, noPrice: 36, edge: 6.2, volume: '$4.8M', category: 'macro' },
  { id: 'm2', market: 'BTC > $120k by Sep 2026?', yesPrice: 52, noPrice: 48, edge: 4.4, volume: '$8.9M', category: 'crypto' },
  { id: 'm3', market: 'Starship orbital test in 2026?', yesPrice: 77, noPrice: 23, edge: 5.1, volume: '$3.1M', category: 'tech' },
  { id: 'm4', market: 'US recession by Q4 2026?', yesPrice: 29, noPrice: 71, edge: 3.4, volume: '$6.2M', category: 'macro' },
  { id: 'm5', market: 'NFL MVP non-QB in 2026?', yesPrice: 31, noPrice: 69, edge: 2.8, volume: '$2.4M', category: 'sports' },
  { id: 'm6', market: 'Gaza ceasefire this quarter?', yesPrice: 43, noPrice: 57, edge: 4.0, volume: '$1.2M', category: 'geo' }
];

const LEADERBOARD: WalletTrader[] = [
  { address: '0x7cc...aa20', pnl: 312000, trades: 847, role: 'edge' },
  { address: '0x3f4a...c91e', pnl: 184200, trades: 1294, role: 'arb' },
  { address: '0x5e8d...3c99', pnl: 199800, trades: 432, role: 'bot' },
  { address: '0xa12b...5f3d', pnl: 97000, trades: 291, role: 'bot' },
  { address: '0x1d9e...b47a', pnl: 44200, trades: 318, role: 'arb' }
];

const ROLE_COLORS = {
  edge: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  arb: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  bot: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
};

export const TradingAgentView: React.FC = () => {
  const [walletBalance, setWalletBalance] = useState(START_BALANCE);
  const [activeMode, setActiveMode] = useState<'demo' | 'live'>('demo');
  const [copyTrades, setCopyTrades] = useState<string[]>([
    'BUY YES · Fed cuts rates in Q3? · $550',
    'BUY NO · US recession by Q4 2026? · $420'
  ]);

  const netPnl = walletBalance - START_BALANCE;

  const topSignal = useMemo(
    () => [...LIVE_SIGNALS].sort((a, b) => b.edge - a.edge)[0],
    []
  );

  const runOneCycle = () => {
    const randomSignal = LIVE_SIGNALS[Math.floor(Math.random() * LIVE_SIGNALS.length)];
    const side = Math.random() > 0.5 ? 'BUY YES' : 'BUY NO';
    const amount = 150 + Math.floor(Math.random() * 450);
    const pnlDelta = Math.round((Math.random() - 0.35) * 300);

    setWalletBalance((prev) => Math.max(0, prev + pnlDelta));
    setCopyTrades((prev) => [`${side} · ${randomSignal.market} · $${amount}`, ...prev].slice(0, 6));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Icons.Terminal className="w-8 h-8 text-emerald-400" />
            Poly Terminal Agent
          </h1>
          <p className="text-slate-400 mt-1">Paper-Trading Bot mit Copy-Engine (anfängerfreundlicher Demo-Modus).</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveMode('demo')}
            className={`px-4 py-2 rounded-lg text-sm border ${
              activeMode === 'demo' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-slate-300'
            }`}
          >
            Demo
          </button>
          <button
            onClick={() => setActiveMode('live')}
            className={`px-4 py-2 rounded-lg text-sm border ${
              activeMode === 'live' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-white/10 text-slate-300'
            }`}
          >
            Live (deaktiviert)
          </button>
          <button
            onClick={runOneCycle}
            className="px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            Zyklus ausführen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-400">Wallet</p>
          <p className="text-2xl font-bold text-white mt-1">${walletBalance.toLocaleString('en-US')}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-400">Net PnL</p>
          <p className={`text-2xl font-bold mt-1 ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPnl >= 0 ? '+' : ''}${netPnl.toLocaleString('en-US')}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-400">Signals</p>
          <p className="text-2xl font-bold text-white mt-1">{LIVE_SIGNALS.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <p className="text-xs text-slate-400">Top Edge</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{topSignal.edge.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 glass-panel rounded-xl overflow-hidden border border-white/10">
          <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-white">Live Markets</div>
          <div className="divide-y divide-white/5">
            {LIVE_SIGNALS.map((signal) => (
              <div key={signal.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-100">{signal.market}</p>
                  <span className="text-xs text-emerald-300">+{signal.edge.toFixed(1)}% edge</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span>YES {signal.yesPrice}¢</span>
                  <span>•</span>
                  <span>NO {signal.noPrice}¢</span>
                  <span>•</span>
                  <span>{signal.volume}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-3 glass-panel rounded-xl overflow-hidden border border-white/10">
          <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-white">Copytrade Engine</div>
          <div className="p-4 space-y-2">
            {copyTrades.map((entry, idx) => (
              <div key={`${entry}-${idx}`} className="text-xs rounded-lg bg-[#10101a] border border-white/10 px-3 py-2 text-slate-300">
                {entry}
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 glass-panel rounded-xl overflow-hidden border border-white/10">
          <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-white">Arber Leaderboard</div>
          <div className="p-4 space-y-2">
            {LEADERBOARD.map((trader, idx) => (
              <div key={trader.address} className="rounded-lg border border-white/10 px-3 py-2 bg-[#10101a]">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">#{idx + 1} {trader.address}</p>
                  <span className="text-emerald-400 text-xs font-semibold">+${(trader.pnl / 1000).toFixed(1)}k</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{trader.trades} trades</span>
                  <span className={`px-2 py-0.5 rounded border ${ROLE_COLORS[trader.role]}`}>{trader.role.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        Hinweis: Das ist ein Demo-Agent ohne echte Broker-Anbindung. So kannst du sicher testen, bevor Echtgeld ins Spiel kommt.
      </div>
    </div>
  );
};
