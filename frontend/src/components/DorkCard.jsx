"use client";

import { useState } from 'react';
import { Search, Copy, Zap, Activity, ShieldCheck, ShieldAlert, RefreshCw, Flag, Shield, Cpu } from 'lucide-react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

// Tekil dork kartı bileşeni
export default function DorkCard({
  dork,
  index,
  target,
  isFlagged,
  onCopy,
  onSearch,
  onProbeURL,
  onFlag
}) {
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
      className={`dork-card transition-all ${isFlagged ? 'border-red-500/30 shadow-red-950/20 shadow-lg' : ''}`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="dork-category">{dork.category}</span>

            {/* Arama Motoru Rozeti (Google, GitHub, Shodan, Censys) */}
            {dork.engine && dork.engine !== 'google' && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-medium border uppercase bg-white/[0.04] text-white/60 border-white/10 tracking-wider">
                {dork.engine}
              </span>
            )}

            {/* Teknoloji Eşleşmesi Rozeti (TechTag) */}
            {dork.techTag && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center gap-1"
                title={`${dork.techTag} teknolojisiyle uyumlu dork`}
              >
                <Cpu size={10} className="text-amber-400" />
                <span>{dork.techTag}</span>
              </span>
            )}

            {/* MITRE ATT&CK Eşleşmesi Rozeti */}
            {dork.mitre && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  BrowserOpenURL(dork.mitre.url);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 transition-all flex items-center gap-1 cursor-pointer"
                title={`MITRE ATT&CK: ${dork.mitre.technique} (${dork.mitre.tactic}) - Resmi sayfayı aç`}
              >
                <Shield size={10} className="text-red-400" />
                <span>{dork.mitre.techniqueId}</span>
              </button>
            )}

            {/* Bulgu Rozeti */}
            {isFlagged && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Flag size={9} className="fill-red-400" />
                Bulgu
              </span>
            )}

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

        {/* Sağ Üst Aksiyonlar: Bulgu İşaretle & Kopyala */}
        <div className="flex items-center gap-1 shrink-0">
          {onFlag && (
            <button
              onClick={() => onFlag(dork)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isFlagged
                  ? 'text-red-400 hover:text-red-300 bg-red-500/10'
                  : 'text-white/20 hover:text-red-400 hover:bg-white/5'
              }`}
              title={isFlagged ? "Bulgu defterinde kayıtlı (Düzenle)" : "Bulgu olarak işaretle (Flag as Finding)"}
            >
              <Flag size={14} className={isFlagged ? 'fill-red-400' : ''} />
            </button>
          )}

          <button
            onClick={() => onCopy(dork.query)}
            className="p-2 text-white/20 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Kopyala"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      <div className="dork-query-box">
        <code className="dork-query-code">{dork.query}</code>
      </div>

      <div className="dork-actions">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSearch(dork.query, dork.searchUrl)}
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

          {/* Bulgu Olarak İşaretle Butonu */}
          {onFlag && (
            <button
              onClick={() => onFlag(dork)}
              className={`dork-action-btn cursor-pointer flex items-center gap-1 ${
                isFlagged
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-white/25 hover:text-red-400'
              }`}
              title="Bu dork sonucunu CTI bulgusu olarak deftere ekle"
            >
              <Flag size={11} className={isFlagged ? 'fill-red-400' : ''} />
              <span>{isFlagged ? 'Bulgu Kaydedildi' : 'Bulgu Ekle'}</span>
            </button>
          )}
        </div>

        <Zap size={10} className="text-white/10 group-hover:text-white/30 transition-all" />
      </div>
    </div>
  );
}
