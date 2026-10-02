"use client";

import { useState, useMemo } from 'react';
import {
  X,
  Shield,
  Search,
  ExternalLink,
  Server,
  Network,
  Copy,
  Check,
  Flag,
  RefreshCw,
  ShieldCheck,
  Globe,
  Terminal,
  Activity,
  MapPin
} from 'lucide-react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export default function CensysResultsModal({
  isOpen,
  onClose,
  target = '',
  hosts = [],
  isLoading = false,
  onRefresh,
  onFlagAsFinding
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState(null);

  const safeHosts = Array.isArray(hosts) ? hosts : [];

  // Arama filtresi
  const filteredHosts = useMemo(() => {
    if (!searchTerm.trim()) return safeHosts;
    const term = searchTerm.toLowerCase();
    return safeHosts.filter(
      (h) =>
        (h.ip && h.ip.toLowerCase().includes(term)) ||
        (h.name && h.name.toLowerCase().includes(term)) ||
        (h.asn && h.asn.toLowerCase().includes(term)) ||
        (h.asName && h.asName.toLowerCase().includes(term)) ||
        (h.country && h.country.toLowerCase().includes(term)) ||
        (h.services && h.services.some((s) => s.toLowerCase().includes(term)))
    );
  }, [safeHosts, searchTerm]);

  if (!isOpen) return null;

  const handleOpenURL = (url) => {
    if (BrowserOpenURL) {
      BrowserOpenURL(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div
        className="relative w-full max-w-4xl h-[85vh] bg-[#0b0b0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-2xl text-white shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık Alanı */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/80 shadow-inner">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Canlı Censys Host & Servis Keşfi
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-mono">
                  {safeHosts.length} Host Eşleşmesi
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Hedef <span className="font-mono text-white/80 font-semibold">{target}</span> için Censys Search API v2 üzerinden taranan aktif ana bilgisayarlar ve servisler.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
                title="Canlı Taramayı Yenile"
              >
                <RefreshCw size={15} className={isLoading ? "animate-spin text-white" : ""} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Arama ve Filtre Çubuğu */}
        <div className="px-6 py-3 border-b border-white/5 bg-black/40 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="IP, servis (örn: 443/HTTPS), ülke veya ASN'e göre filtrele..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="text-xs text-white/40 font-mono shrink-0">
            {filteredHosts.length} / {safeHosts.length} Gösteriliyor
          </div>
        </div>

        {/* Gövde - Host Listesi */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-white/40">
              <RefreshCw size={28} className="animate-spin text-white/80" />
              <p className="text-xs font-mono tracking-wide">Censys Search API üzerinden hostlar ve servisler taranıyor...</p>
            </div>
          ) : filteredHosts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-4">
              <ShieldCheck size={36} className="text-cyan-400/80 mb-1" />
              <h4 className="text-sm font-semibold text-white">Eşleşen Censys Host Kaydı Bulunamadı</h4>
              <p className="text-xs text-white/40 max-w-md">
                Hedef için Censys API sorgusunda doğrudan host kaydı dönmedi. Aşağıdaki dork listesiyle Censys web arayüzünde manuel derin arama yapabilirsiniz.
              </p>
            </div>
          ) : (
            filteredHosts.map((host, idx) => (
              <div
                key={`${host.ip}-${idx}`}
                className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] border border-white/10 space-y-3.5"
              >
                {/* Host Başlık Bilgisi */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                      HOST
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white tracking-wide">
                          {host.ip}
                        </span>
                        <button
                          onClick={() => handleCopy(host.ip)}
                          className="text-white/40 hover:text-white transition-colors"
                          title="IP Kopyala"
                        >
                          {copiedText === host.ip ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                        {host.name && (
                          <span className="text-xs text-white/50 font-mono">
                            ({host.name})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-white/40 font-mono flex items-center gap-3 mt-0.5">
                        {host.country && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {host.country} {host.countryCode ? `(${host.countryCode})` : ''}
                          </span>
                        )}
                        {host.asn && (
                          <span className="flex items-center gap-1">
                            <Network size={11} />
                            {host.asn} {host.asName ? `- ${host.asName}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onFlagAsFinding && (
                      <button
                        onClick={() =>
                          onFlagAsFinding({
                            query: `Censys Host: ${host.ip}`,
                            description: `Censys host keşfi: ${host.ip} (${host.services ? host.services.join(', ') : 'Servisler'}) - ${host.asn || ''}`,
                            category: "Infrastructure & Hosts",
                            evidenceUrl: `https://search.censys.io/hosts/${host.ip}`
                          })
                        }
                        className="px-2.5 py-1.5 text-xs text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Kanıt Olarak Kaydet"
                      >
                        <Flag size={11} className="fill-red-400/40 text-red-400" />
                        <span>Kaydet</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenURL(`https://search.censys.io/hosts/${host.ip}`)}
                      className="px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Censys'de İncele</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* Çalışan Servisler */}
                <div>
                  <div className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                    <Activity size={13} className="text-cyan-400" />
                    <span>Çalışan Servisler & Portlar ({host.services ? host.services.length : 0})</span>
                  </div>

                  {host.services && host.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {host.services.map((srv, sIdx) => {
                        const port = srv.split('/')[0];
                        return (
                          <button
                            key={`${srv}-${sIdx}`}
                            onClick={() => handleOpenURL(`http://${host.ip}:${port}`)}
                            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-white/90 transition-all flex items-center gap-1.5 cursor-pointer group"
                            title={`${srv} servisini aç`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                            <span>{srv}</span>
                            <ExternalLink size={10} className="text-white/30 group-hover:text-white" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 font-mono">Aktif servis bilgisi bulunamadı.</p>
                  )}
                </div>

                {/* Son Gözlemlenme Tarihi */}
                {host.lastUpdated && (
                  <div className="text-[10px] text-white/30 font-mono pt-1 border-t border-white/5">
                    Son Gözlemlenme: {host.lastUpdated}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Alt Bilgi Çubuğu */}
        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02] text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-white/30" />
            <span>Censys Search API v2</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
