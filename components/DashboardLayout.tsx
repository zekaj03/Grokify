import React from 'react';
import { Icons } from './ui/Icons';
import { ViewState } from '../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onToggleChat: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView,
  onToggleChat 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'autopilot', label: 'Grok Dashboard', icon: Icons.Brain },
    { id: 'intelligence', label: 'Market Intelligence', icon: Icons.Eye },
    { id: 'trading', label: 'Trading Agent', icon: Icons.BarChart },
    { id: 'products', label: 'Produkte', icon: Icons.Products },
    { id: 'duplicates', label: 'Duplikate', icon: Icons.Copy },
    { id: 'collections', label: 'Kollektionen', icon: Icons.Collections },
    { id: 'media', label: 'Media Optimizer', icon: Icons.ImagePlus }, // New
    { id: 'optimizer', label: 'Text Optimizer', icon: Icons.Optimizer },
    { id: 'seo', label: 'SEO Analyse', icon: Icons.SEO },
    { id: 'marketing', label: 'Marketing Hub', icon: Icons.Marketing },
    { id: 'backup', label: 'Backup & Restore', icon: Icons.Database }, // New
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-dark-bg text-slate-300">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0f0f16]/60 backdrop-blur-md flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20 border border-white/10 relative">
            <span className="font-bold text-white text-lg">G</span>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm border border-white">+</div>
          </div>
          <span className="font-bold text-xl text-white tracking-tight">Grokify</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewState)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Icons.User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">ikaufen.ch</p>
              <p className="text-xs text-emerald-400 truncate">Online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center text-slate-500 text-sm">
            <span className="hover:text-slate-300 cursor-pointer">Shopify</span>
            <span className="mx-2">/</span>
            <span className="text-slate-200 capitalize">{currentView}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Suche..." 
                className="bg-[#1a1a2e] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
            
            <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full relative">
              <Icons.Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            <button 
              onClick={onToggleChat}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Icons.Sparkles className="w-4 h-4" />
              <span>Ask Grok</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};