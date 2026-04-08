import React, { useState } from 'react';
import { authApi, auth } from '../services/api';
import { Icons } from './ui/Icons';

interface LoginScreenProps {
  onLogin: (shopDomain: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'private' | 'oauth'>('private');
  const [shopDomain, setShopDomain] = useState('ikaufen.myshopify.com');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePrivateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { token, shopDomain: domain } = await authApi.loginPrivate(shopDomain, accessToken);
      auth.setToken(token);
      auth.setShop(domain);
      onLogin(domain);
    } catch (e) {
      setError((e as Error).message || 'Verbindung fehlgeschlagen. Bitte Zugangsdaten prüfen.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthInstall = () => {
    const shop = shopDomain.endsWith('.myshopify.com') ? shopDomain : `${shopDomain}.myshopify.com`;
    window.location.href = authApi.getInstallUrl(shop);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Icons.Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Grokify</h1>
          </div>
          <p className="text-slate-400">KI-gesteuterter Shopify Manager</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
          <button
            onClick={() => setMode('private')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'private' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mein Shop
          </button>
          <button
            onClick={() => setMode('oauth')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'oauth' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Neuer Kunde
          </button>
        </div>

        {/* Private App Login */}
        {mode === 'private' && (
          <form onSubmit={handlePrivateLogin} className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Shop Domain</label>
                <input
                  type="text"
                  value={shopDomain}
                  onChange={e => setShopDomain(e.target.value)}
                  placeholder="ikaufen.myshopify.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Admin API Access Token
                  <span className="ml-2 text-xs text-slate-500">(Settings → Apps → Develop Apps)</span>
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxx"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm flex items-center gap-2">
                <Icons.AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !shopDomain || !accessToken}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <><Icons.Refresh className="w-4 h-4 animate-spin" /> Verbinden...</>
              ) : (
                <><Icons.Zap className="w-4 h-4" /> Mit Shopify verbinden</>
              )}
            </button>
          </form>
        )}

        {/* OAuth Install (for selling to other stores) */}
        {mode === 'oauth' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <p className="text-indigo-400 text-sm font-medium mb-1">Für neue Kunden / Verkauf</p>
                <p className="text-slate-400 text-xs">
                  Der Kunde gibt seine Shopify-Domain ein. Grokify verbindet sich automatisch über Shopify OAuth.
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Kunden Shop Domain</label>
                <input
                  type="text"
                  value={shopDomain}
                  onChange={e => setShopDomain(e.target.value)}
                  placeholder="kundenstore.myshopify.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleOAuthInstall}
              disabled={!shopDomain}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Icons.ArrowRight className="w-4 h-4" />
              Grokify in Shopify installieren
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-6">
          Grokify SaaS · Powered by Grok AI & Shopify
        </p>
      </div>
    </div>
  );
};
