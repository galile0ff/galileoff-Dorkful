"use client";

import { useState, useMemo } from 'react';
import {
  X,
  FileCode,
  Key,
  Network,
  Search,
  ExternalLink,
  Copy,
  Check,
  Flag,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Code2,
  FileCheck2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export default function JSAnalysisModal({
  isOpen,
  onClose,
  target = '',
  result = null,
  isLoading = false,
  onRefresh,
  onFlagAsFinding
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'secrets', 'endpoints', 'scripts'
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState(null);
  const [showMasked, setShowMasked] = useState({});

  const endpoints = result?.endpoints || [];
  const secrets = result?.secrets || [];
  const scripts = result?.scripts || [];
  const error = result?.error || null;

  // Arama ve filtreleme mantığı (Tüm hooklar erken dönüşten önce çağrılıyor)
  const filteredSecrets = useMemo(() => {
    if (!searchTerm.trim()) return secrets;
    const term = searchTerm.toLowerCase();
    return secrets.filter(
      (s) =>
        (s.type && s.type.toLowerCase().includes(term)) ||
        (s.value && s.value.toLowerCase().includes(term)) ||
        (s.sourceUrl && s.sourceUrl.toLowerCase().includes(term)) ||
        (s.snippet && s.snippet.toLowerCase().includes(term))
    );
  }, [secrets, searchTerm]);

  const filteredEndpoints = useMemo(() => {
    if (!searchTerm.trim()) return endpoints;
    const term = searchTerm.toLowerCase();
    return endpoints.filter(
      (ep) =>
        (ep.endpoint && ep.endpoint.toLowerCase().includes(term)) ||
        (ep.sourceUrl && ep.sourceUrl.toLowerCase().includes(term)) ||
        (ep.snippet && ep.snippet.toLowerCase().includes(term))
    );
  }, [endpoints, searchTerm]);

  const filteredScripts = useMemo(() => {
    if (!searchTerm.trim()) return scripts;
    const term = searchTerm.toLowerCase();
    return scripts.filter((sc) => sc.url && sc.url.toLowerCase().includes(term));
  }, [scripts, searchTerm]);

  // Modal kapalıysa erken dön (Tüm hooklar yukarıda çağrıldı)
  if (!isOpen) return null;

  const handleOpenURL = (url) => {
    if (!url) return;
    if (BrowserOpenURL) {
      BrowserOpenURL(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleMask = (id) => {
    setShowMasked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Önem derecesi renk sınıfları
  const getSeverityBadge = (severity) => {
    const sev = (severity || 'high').toLowerCase();
    switch (sev) {
      case 'critical':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  // Hedef alan adını temizleme
  const cleanTargetDomain = (raw) => {
    if (!raw) return '';
    return raw.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div
        className="relative w-full max-w-5xl h-[88vh] bg-[#0b0b0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-2xl text-white shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık Alanı */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
              <FileCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  JavaScript Gizli API & Secret Avcısı
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 font-mono">
                  JS Secret Miner
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Hedef <span className="font-mono text-white/80 font-semibold">{target}</span> sayfalarından indirilen script dosyaları analiz ediliyor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
                title="Taramayı Yeniden Başlat"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin text-amber-400" : ""} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* İstatistik & Filtre Sekmeleri */}
        <div className="px-6 py-3 border-b border-white/10 bg-white/[0.01] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Sekmeler */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeTab === 'all'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
                }`}
            >
              Tümü ({secrets.length + endpoints.length})
            </button>

            <button
              onClick={() => setActiveTab('secrets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'secrets'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-white/50 hover:text-white/80'
                }`}
            >
              <Key size={13} className="text-red-400" />
              <span>Gizli Secret'lar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 font-mono">
                {secrets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'endpoints'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/50 hover:text-white/80'
                }`}
            >
              <Network size={13} className="text-cyan-400" />
              <span>Dahili API Uç Noktaları</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                {endpoints.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scripts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'scripts'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-white/50 hover:text-white/80'
                }`}
            >
              <FileCheck2 size={13} className="text-amber-400" />
              <span>Taranan Scriptler</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                {scripts.length}
              </span>
            </button>
          </div>

          {/* Arama Kutusu */}
          <div className="relative min-w-[240px] max-w-xs flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Rota, secret veya dosya ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Ana İçerik Alanı */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
                  <Code2 size={28} className="text-amber-400" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/40 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm font-medium text-white/80">JavaScript Dosyaları İndiriliyor & Taranıyor...</p>
              <p className="text-xs text-white/40 mt-1 max-w-sm font-mono">
                {target} üzerindeki bundle ve chunk dosyalarında gizli API ve secret desenleri aranıyor.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-red-200">Tarama Sırasında Hata Oluştu</h4>
                <p className="text-xs text-red-300/80 mt-1">{error}</p>
              </div>
            </div>
          ) : secrets.length === 0 && endpoints.length === 0 && scripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-white/20 mb-3">
                <ShieldCheck size={36} />
              </div>
              <p className="text-sm font-medium text-white/60">Herhangi Bir JavaScript Dosyası veya Sızıntı Bulunamadı</p>
              <p className="text-xs text-white/30 mt-1 max-w-md">
                Hedef web sayfasında taranabilecek harici script bağlantısı bulunamadı veya site erişimi kısıtlı.
              </p>
            </div>
          ) : (
            <>
              {/* 1. SECRET / SIZINTI KARTLARI */}
              {(activeTab === 'all' || activeTab === 'secrets') && filteredSecrets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/50 px-1 font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                      <Key size={13} />
                      Tespit Edilen Gizli Anahtarlar ({filteredSecrets.length})
                    </span>
                    <span>Güvenlik Riski</span>
                  </div>

                  {filteredSecrets.map((secret, idx) => {
                    const secretId = `sec-${idx}`;
                    const isMasked = !showMasked[secretId];
                    const displayVal = isMasked && secret.value.length > 8
                      ? secret.value.slice(0, 4) + '•'.repeat(Math.min(secret.value.length - 8, 24)) + secret.value.slice(-4)
                      : secret.value;

                    return (
                      <div
                        key={secretId}
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-red-500/30 transition-all flex flex-col gap-3 group shadow-sm hover:shadow-red-500/5"
                      >
                        {/* Başlık ve Butonlar */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                              <Lock size={13} className="text-red-400" />
                              {secret.type}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-mono font-medium uppercase ${getSeverityBadge(secret.severity)}`}>
                              {secret.severity || 'HIGH'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleMask(secretId)}
                              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                              title={isMasked ? "Değeri Göster" : "Değeri Gizle"}
                            >
                              {isMasked ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>

                            <button
                              onClick={() => handleCopy(secret.value)}
                              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                              title="Anahtarı Kopyala"
                            >
                              {copiedText === secret.value ? (
                                <Check size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>

                            {onFlagAsFinding && (
                              <button
                                onClick={() =>
                                  onFlagAsFinding({
                                    category: 'JS Secret Sızıntısı',
                                    description: `JavaScript Dosyasında Açıkta Bulunan ${secret.type}`,
                                    query: secret.value,
                                    evidenceUrl: secret.sourceUrl,
                                    severity: secret.severity === 'critical' ? 'Critical' : 'High',
                                    notes: `Sızıntı Türü: ${secret.type}\nDeğer: ${secret.value}\nBulunduğu Dosya: ${secret.sourceUrl}\nSnippet:\n${secret.snippet || ''}`
                                  })
                                }
                                className="px-2.5 py-1 text-[11px] text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Bulgu Defterine Kaydet"
                              >
                                <Flag size={11} className="fill-red-400/40 text-red-400" />
                                <span>Kaydet</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bulunan Secret Değeri */}
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-red-300 break-all select-all flex items-center justify-between gap-2">
                          <span>{displayVal}</span>
                        </div>

                        {/* Snippet Bağlamı */}
                        {secret.snippet && (
                          <div className="text-[11px] text-white/50 font-mono bg-white/[0.01] p-2 rounded-lg border border-white/5 truncate">
                            <span className="text-white/30 mr-1.5 select-none">// Bağlam:</span>
                            {secret.snippet}
                          </div>
                        )}

                        {/* Kaynak Script Bağlantısı */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40 font-mono">
                          <div className="flex items-center gap-1.5 truncate max-w-xl">
                            <FileCode size={11} className="shrink-0 text-white/30" />
                            <button
                              onClick={() => handleOpenURL(secret.sourceUrl)}
                              className="hover:text-white hover:underline transition-colors truncate"
                              title={secret.sourceUrl}
                            >
                              {secret.sourceUrl}
                            </button>
                          </div>
                          <button
                            onClick={() => handleOpenURL(secret.sourceUrl)}
                            className="p-1 hover:text-white text-white/30 shrink-0"
                            title="Dosyayı Yeni Sekmede Aç"
                          >
                            <ExternalLink size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. DAHİLİ API UÇ NOKTASI KARTLARI */}
              {(activeTab === 'all' || activeTab === 'endpoints') && filteredEndpoints.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-white/50 px-1 font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <Network size={13} />
                      Tespit Edilen Dahili API Rotaları ({filteredEndpoints.length})
                    </span>
                    <span>İç Endpoint Keşfi</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredEndpoints.map((ep, idx) => {
                      const cleanDom = cleanTargetDomain(target);
                      const fullTargetEndpoint = cleanDom
                        ? `https://${cleanDom}${ep.endpoint.startsWith('/') ? '' : '/'}${ep.endpoint}`
                        : '';

                      return (
                        <div
                          key={`ep-${idx}`}
                          className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-2.5 group shadow-sm hover:shadow-cyan-500/5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold shrink-0">
                                API
                              </span>
                              <span
                                className="font-mono text-xs font-semibold text-white/90 truncate select-all"
                                title={ep.endpoint}
                              >
                                {ep.endpoint}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleCopy(ep.endpoint)}
                                className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                                title="Rotayı Kopyala"
                              >
                                {copiedText === ep.endpoint ? (
                                  <Check size={12} className="text-emerald-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>

                              {fullTargetEndpoint && (
                                <button
                                  onClick={() => handleOpenURL(fullTargetEndpoint)}
                                  className="p-1 text-cyan-400/70 hover:text-cyan-300 rounded-md hover:bg-cyan-500/10 transition-colors cursor-pointer"
                                  title="Canlı Endpoint'e Git"
                                >
                                  <ExternalLink size={12} />
                                </button>
                              )}

                              {onFlagAsFinding && (
                                <button
                                  onClick={() =>
                                    onFlagAsFinding({
                                      category: 'Dahili API Rotası',
                                      description: `JavaScript İçinde Tespit Edilen API Uç Noktası: ${ep.endpoint}`,
                                      query: ep.endpoint,
                                      evidenceUrl: fullTargetEndpoint || ep.sourceUrl,
                                      severity: 'Medium',
                                      notes: `Endpoint: ${ep.endpoint}\nKaynak Script: ${ep.sourceUrl}\nSnippet: ${ep.snippet || ''}`
                                    })
                                  }
                                  className="p-1 text-amber-400/60 hover:text-amber-300 rounded-md hover:bg-amber-500/10 transition-colors cursor-pointer"
                                  title="Bulgu Defterine Kaydet"
                                >
                                  <Flag size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Snippet */}
                          {ep.snippet && (
                            <div className="text-[10px] text-white/40 font-mono bg-white/[0.01] p-1.5 rounded border border-white/5 truncate">
                              {ep.snippet}
                            </div>
                          )}

                          {/* Kaynak dosya */}
                          <div className="flex items-center justify-between text-[10px] text-white/30 font-mono truncate pt-1 border-t border-white/5">
                            <span className="truncate max-w-[280px]" title={ep.sourceUrl}>
                              {ep.sourceUrl.split('/').pop() || ep.sourceUrl}
                            </span>
                            <button
                              onClick={() => handleOpenURL(ep.sourceUrl)}
                              className="hover:text-white/70 underline truncate shrink-0 ml-2"
                            >
                              script aç
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. TARANAN SCRİPTLER SEKMESİ */}
              {(activeTab === 'all' || activeTab === 'scripts') && filteredScripts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-white/50 px-1 font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <FileCheck2 size={13} />
                      Analiz Edilen JavaScript Kaynakları ({filteredScripts.length})
                    </span>
                    <span>Script Dosyaları</span>
                  </div>

                  <div className="space-y-2">
                    {filteredScripts.map((sc, idx) => {
                      const isOk = sc.statusCode === 200;
                      const sizeKB = (sc.byteSize / 1024).toFixed(1);

                      return (
                        <div
                          key={`sc-${idx}`}
                          className="px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${isOk ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-400'
                                }`}
                            />
                            <span className="text-white/80 truncate" title={sc.url}>
                              {sc.url}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 text-white/40">
                            {isOk ? (
                              <span className="text-white/60">{sizeKB} KB</span>
                            ) : (
                              <span className="text-red-400/80">{sc.error || 'İndirilemedi'}</span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${isOk ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                            >
                              {sc.statusCode || 'ERR'}
                            </span>

                            <button
                              onClick={() => handleOpenURL(sc.url)}
                              className="p-1 hover:text-white transition-colors cursor-pointer"
                              title="Tarayıcıda İncele"
                            >
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Alt Bilgi Çubuğu */}
        <div className="px-6 py-3.5 border-t border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02] text-xs text-white/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Terminal size={13} className="text-amber-400/60" />
              <span>Dorkful JS Secret Miner</span>
            </div>
            <span>•</span>
            <span>
              {result?.scannedScripts || 0} / {result?.totalScripts || 0} dosya tarandı
            </span>
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
