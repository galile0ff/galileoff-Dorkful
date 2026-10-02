"use client";

import { useState } from 'react';
import {
  X,
  Radio,
  ExternalLink,
  ShieldAlert,
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
  Tag
} from 'lucide-react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export default function ShodanResultsModal({
  isOpen,
  onClose,
  target = '',
  hosts = [],
  isLoading = false,
  onRefresh,
  onFlagAsFinding
}) {
  const [copiedText, setCopiedText] = useState(null);

  const safeHosts = Array.isArray(hosts) ? hosts : [];

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

  // Toplam açık port ve CVE sayıları
  const totalPorts = safeHosts.reduce((acc, h) => acc + (h.ports ? h.ports.length : 0), 0);
  const totalVulns = safeHosts.reduce((acc, h) => acc + (h.vulns ? h.vulns.length : 0), 0);

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
              <Radio size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Canlı Shodan Port & Zafiyet Analizi
                </h3>
                {safeHosts.length > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    safeHosts[0].isKeyless
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      : 'bg-white/10 text-white/80 border border-white/15'
                  }`}>
                    {safeHosts[0].isKeyless ? 'Shodan InternetDB' : 'Resmi Shodan API'}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Hedef <span className="font-mono text-white/80 font-semibold">{target}</span> için tespit edilen açık portlar, servisler ve CVE zafiyetleri.
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

        {/* İstatistik Özet Şeridi */}
        <div className="px-6 py-3 border-b border-white/5 bg-black/40 flex items-center justify-between gap-4 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-white/70">
              <Server size={13} className="text-white/40" />
              <span>{safeHosts.length} Host IP</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <Activity size={13} className="text-emerald-400" />
              <span>{totalPorts} Açık Port</span>
            </div>
            {totalVulns > 0 ? (
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <ShieldAlert size={13} />
                <span>{totalVulns} Zafiyet (CVE)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400/80">
                <ShieldCheck size={13} />
                <span>Kritik CVE Tespit Edilmedi</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-white/40">
            Shodan Network Intelligence
          </div>
        </div>

        {/* Gövde - Host Listesi */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-white/40">
              <RefreshCw size={28} className="animate-spin text-white/80" />
              <p className="text-xs font-mono tracking-wide">Shodan veritabanından açık port ve zafiyet verileri çekiliyor...</p>
            </div>
          ) : safeHosts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-4">
              <ShieldCheck size={36} className="text-emerald-400/80 mb-1" />
              <h4 className="text-sm font-semibold text-white">Shodan Kaydı Bulunamadı</h4>
              <p className="text-xs text-white/40 max-w-md">
                Hedef için Shodan üzerinde aktif açık port kaydı tespit edilemedi. Aşağıdaki dork listesiyle Shodan web arayüzünde manuel derin tarama yapabilirsiniz.
              </p>
            </div>
          ) : (
            safeHosts.map((host, idx) => (
              <div
                key={`${host.ip}-${idx}`}
                className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] border border-white/10 space-y-4"
              >
                {/* Host Başlık ve Temel Bilgiler */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs font-bold">
                      IP
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
                      </div>

                      <div className="text-[11px] text-white/40 font-mono flex items-center gap-3 mt-0.5">
                        {host.org && <span>{host.org}</span>}
                        {host.asn && <span>({host.asn})</span>}
                        {host.os && <span>OS: {host.os}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenURL(`https://www.shodan.io/host/${host.ip}`)}
                      className="px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Shodan Detayları</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* Açık Portlar */}
                <div>
                  <div className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                    <Activity size={13} className="text-emerald-400" />
                    <span>Açık Portlar ({host.ports ? host.ports.length : 0})</span>
                  </div>
                  {host.ports && host.ports.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {host.ports.map((port) => (
                        <button
                          key={port}
                          onClick={() => handleOpenURL(`http://${host.ip}:${port}`)}
                          className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-white/90 transition-all flex items-center gap-1.5 cursor-pointer group"
                          title={`${port} portunu tarayıcıda aç`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                          <span>{port}</span>
                          <ExternalLink size={10} className="text-white/30 group-hover:text-white" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 font-mono">Açık port bilgisi bulunamadı.</p>
                  )}
                </div>

                {/* Tespit Edilen Zafiyetler (CVE) */}
                {host.vulns && host.vulns.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-red-500/[0.04] border border-red-500/20 space-y-2">
                    <div className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      <span>Tespit Edilen Güvenlik Açıkları ({host.vulns.length} CVE)</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {host.vulns.map((cve) => (
                        <div
                          key={cve}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-300"
                        >
                          <button
                            onClick={() => handleOpenURL(`https://nvd.nist.gov/vuln/detail/${cve}`)}
                            className="hover:underline flex items-center gap-1"
                            title="NVD Veritabanında İncele"
                          >
                            <span>{cve}</span>
                            <ExternalLink size={10} />
                          </button>

                          {onFlagAsFinding && (
                            <button
                              onClick={() =>
                                onFlagAsFinding({
                                  query: `Shodan IP: ${host.ip} (${cve})`,
                                  description: `Shodan zafiyet tespiti: ${cve} zafiyeti ${host.ip} üzerinde açık portlarda tespit edildi.`,
                                  category: "Vulnerabilities & CVEs",
                                  evidenceUrl: `https://www.shodan.io/host/${host.ip}`
                                })
                              }
                              className="ml-1 p-0.5 text-red-400 hover:text-white rounded transition-colors"
                              title="Bulgu Olarak Kaydet"
                            >
                              <Flag size={11} className="fill-red-400/40" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hostnameler ve Etiketler */}
                {((host.hostnames && host.hostnames.length > 0) || (host.tags && host.tags.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-white/40 font-mono border-t border-white/5">
                    {host.hostnames && host.hostnames.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Globe size={11} />
                        <span>{host.hostnames.join(', ')}</span>
                      </div>
                    )}
                    {host.tags && host.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag size={11} />
                        <span>{host.tags.join(', ')}</span>
                      </div>
                    )}
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
            <span>Shodan Host Intelligence Service</span>
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
