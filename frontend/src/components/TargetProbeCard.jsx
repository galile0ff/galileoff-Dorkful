"use client";

import { Activity, ShieldCheck, ShieldAlert, Clock, Server, RefreshCw, Globe } from 'lucide-react';

export default function TargetProbeCard({ probeResult, isProbing, onReProbe }) {
  if (!probeResult && !isProbing) return null;

  if (isProbing) {
    return (
      <div className="w-full max-w-2xl px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center justify-between animate-fadeIn">
        <div className="flex items-center gap-2.5 text-xs text-white/60">
          <RefreshCw size={14} className="animate-spin text-white/80" />
          <span>Hedef canlılık durumu ve sunucu başlıkları denetleniyor...</span>
        </div>
      </div>
    );
  }

  const { url, statusCode, statusText, responseTimeMs, server, isAlive, error } = probeResult;

  // Durum koduna göre renk ve stil belirleme
  const getStatusBadge = () => {
    if (!isAlive || error) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/25 flex items-center gap-1.5">
          <ShieldAlert size={12} />
          Erişilemedi
        </span>
      );
    }
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
          <ShieldCheck size={12} />
          {statusText || `${statusCode} OK`}
        </span>
      );
    }
    if (statusCode === 401 || statusCode === 403) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1.5">
          <ShieldAlert size={12} />
          {statusText || `${statusCode} Korumalı`}
        </span>
      );
    }
    if (statusCode >= 300 && statusCode < 400) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 flex items-center gap-1.5">
          <Activity size={12} />
          {statusText || `${statusCode} Yönlendirme`}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center gap-1.5">
        <Activity size={12} />
        {statusText || `${statusCode}`}
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl px-5 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 transition-all animate-fadeIn">
      {/* Sol: Durum rozeti ve URL */}
      <div className="flex items-center gap-3">
        {getStatusBadge()}
        <div className="flex items-center gap-1.5 text-xs text-white/70 font-mono">
          <Globe size={13} className="text-white/40" />
          <span className="truncate max-w-[240px]">{url}</span>
        </div>
      </div>

      {/* Sağ: Metrikler (Yanıt süresi, sunucu başlığı ve Yenile) */}
      <div className="flex items-center gap-3 text-xs">
        {responseTimeMs > 0 && (
          <div className="flex items-center gap-1 text-white/60 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5" title="HTTP Yanıt Süresi">
            <Clock size={11} className="text-white/40" />
            <span>{responseTimeMs}ms</span>
          </div>
        )}

        {server && (
          <div className="flex items-center gap-1 text-white/70 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5" title="Sunucu / Web Server Başlığı">
            <Server size={11} className="text-white/40" />
            <span className="truncate max-w-[140px]">{server}</span>
          </div>
        )}

        {onReProbe && (
          <button
            onClick={onReProbe}
            className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Hedefi Yeniden Test Et"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
