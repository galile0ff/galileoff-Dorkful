"use client";

import { useState } from 'react';
import { Search, Copy, Zap, Activity, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

// Tekil dork kartı bileşeni
export default function DorkCard({ dork, index, target, onCopy, onSearch, onProbeURL }) {
  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  // Dork sorgusundan potansiyel yol/endpoint çıkarma
  const handleProbe = async () => {
    if (!onProbeURL) return;
    setIsProbing(true);

    try {
      // Dork içindeki inurl: değerini veya doğrudan hedef domaini belirle
      let probeTargetURL = target;
      const inurlMatch = dork.query.match(/inurl:([^\s|)]+)/i);

      if (inurlMatch && inurlMatch[1]) {
        let path = inurlMatch[1].replace(/["']/g, '');
        if (!path.startsWith('/')) path = '/' + path;
        probeTargetURL = `${target}${path}`;
      }

      const res = await onProbeURL(probeTargetURL);
      setProbeResult(res);
    } catch (e) {
      setProbeResult({ isAlive: false, error: String(e) });
    } finally {
      setIsProbing(false);
    }
  };

  return (
    <div
      className="dork-card"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="dork-category">{dork.category}</span>

            {/* Varsa Canlılık Testi Sonucu */}
            {probeResult && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 ${
                  probeResult.statusCode >= 200 && probeResult.statusCode < 300
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : probeResult.statusCode === 401 || probeResult.statusCode === 403
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}
              >
                {probeResult.isAlive ? (
                  <>
                    <ShieldCheck size={10} />
                    {probeResult.statusCode} ({probeResult.responseTimeMs}ms)
                  </>
                ) : (
                  <>
                    <ShieldAlert size={10} />
                    Kapalı
                  </>
                )}
              </span>
            )}
          </div>
          <p className="dork-description">{dork.description}</p>
        </div>
        <button
          onClick={() => onCopy(dork.query)}
          className="p-2 text-white/20 hover:text-white transition-colors shrink-0 cursor-pointer"
          title="Kopyala"
        >
          <Copy size={14} />
        </button>
      </div>

      <div className="dork-query-box">
        <code className="dork-query-code">{dork.query}</code>
      </div>

      <div className="dork-actions">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSearch(dork.query)}
            className="dork-action-btn cursor-pointer"
          >
            <Search size={12} /> Tarayıcıda Aç
          </button>

          {/* Canlı Uç Nokta Testi */}
          <button
            onClick={handleProbe}
            disabled={isProbing}
            className="dork-action-btn text-white/25 hover:text-white/80 cursor-pointer flex items-center gap-1"
            title="Bu dork sorgusunun hedefteki durumunu test et"
          >
            {isProbing ? (
              <RefreshCw size={11} className="animate-spin text-white/60" />
            ) : (
              <Activity size={11} />
            )}
            <span>{isProbing ? 'Test Ediliyor...' : 'Canlılık Testi'}</span>
          </button>
        </div>

        <Zap size={10} className="text-white/10 group-hover:text-white/30 transition-all" />
      </div>
    </div>
  );
}
