"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Globe, 
  History, 
  Search, 
  Copy, 
  ExternalLink, 
  X, 
  Check, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  Activity,
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { EventsOn, EventsOff, BrowserOpenURL } from '../../wailsjs/runtime/runtime';
import { ProbeSubdomainsBatch } from '../../wailsjs/go/main/App';

/**
 * Canlı Keşif Sonuçları Modalı (CRT.sh Subdomain & Wayback Machine Arşivi)
 * Alt alan adları için otomatik paralel HTTP canlılık testi ve canlı durum filtreleri içerir.
 * Wayback Machine için 2006'dan günümüze tarihi arşiv filtreleri ve doğrudan snapshot görüntüleme sunar.
 */
export default function ReconResultsModal({
    isOpen,
    onClose,
    type = 'crtsh', // 'crtsh' | 'wayback'
    target = '',
    subdomains = [],
    waybackUrls = [],
    isLoading = false,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedAll, setCopiedAll] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Canlılık denetimi state'leri (CRT.sh)
    const [probeResults, setProbeResults] = useState({});
    const [isProbingSubdomains, setIsProbingSubdomains] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'alive' | 'protected' | 'dead'

    // Wayback filtreleme state'leri
    const [waybackPeriod, setWaybackPeriod] = useState('all'); // 'all' | 'legacy' | 'mid' | 'recent'
    const [selectedYear, setSelectedYear] = useState('all');

    const probingInProgressRef = useRef(false);

    // Başlık ve açıklama belirleme
    const title = type === 'crtsh' 
        ? 'Sertifika & DNS Alt Alan Adları' 
        : 'Wayback Machine & Uç Nokta Arşivi';

    const subtitle = type === 'crtsh'
        ? 'Canlı Alt Alan Adı ve HTTP Durumu'
        : 'Tarihi Web Snapshot ve URL Arşivi';

    const HeaderIcon = type === 'crtsh' ? Globe : History;

    // Alt alan adları geldiğinde otomatik olarak canlılık taramasını başlat
    const startProbing = async (subdomainList) => {
        if (!subdomainList || subdomainList.length === 0 || probingInProgressRef.current) return;
        
        probingInProgressRef.current = true;
        setIsProbingSubdomains(true);

        try {
            const rawSubs = subdomainList
                .map(s => (s.subdomain || '').toLowerCase().trim())
                .filter(Boolean);

            const resRecord = await ProbeSubdomainsBatch(rawSubs);
            if (resRecord && typeof resRecord === 'object') {
                if (Array.isArray(resRecord)) {
                    const mapped = {};
                    resRecord.forEach(item => {
                        if (item && item.target) {
                            mapped[item.target.toLowerCase().trim()] = item;
                        }
                    });
                    setProbeResults(prev => ({ ...prev, ...mapped }));
                } else {
                    // Record<string, ProbeResult> nesnesi doğrudan gelir
                    const normalized = {};
                    Object.entries(resRecord).forEach(([k, v]) => {
                        normalized[k.toLowerCase().trim()] = v;
                    });
                    setProbeResults(prev => ({ ...prev, ...normalized }));
                }
            }
        } catch (err) {
            console.error("Subdomain probing failed:", err);
        } finally {
            setIsProbingSubdomains(false);
            probingInProgressRef.current = false;
        }
    };

    // Modal açıldığında olay dinleyicilerini ayarla ve gerekirse canlılık testini tetikle
    useEffect(() => {
        if (!isOpen || type !== 'crtsh') return;

        // Wails Go Event listener: anlık probe güncellemeleri
        EventsOn("subdomain-probe-update", (res) => {
            if (res && res.target) {
                const norm = res.target.toLowerCase().trim();
                setProbeResults(prev => ({
                    ...prev,
                    [norm]: res,
                    [res.target]: res
                }));
            }
        });

        // Eğer sonuçlar hazırsa ve henüz taranmadıysa hemen başlat
        if (subdomains.length > 0 && !isLoading) {
            startProbing(subdomains);
        }

        return () => {
            EventsOff("subdomain-probe-update");
            probingInProgressRef.current = false;
        };
    }, [isOpen, type, subdomains, isLoading]);

    // Canlılık istatistikleri (CRT.sh)
    const probeStats = useMemo(() => {
        let alive = 0, protectedCount = 0, dead = 0, pending = 0;
        subdomains.forEach(s => {
            const key = (s.subdomain || '').toLowerCase().trim();
            const res = probeResults[key] || probeResults[s.subdomain];
            if (!res) {
                pending++;
            } else if (!res.isAlive) {
                dead++;
            } else if (res.statusCode === 401 || res.statusCode === 403) {
                protectedCount++;
            } else if (res.statusCode >= 200 && res.statusCode < 400) {
                alive++;
            } else {
                dead++;
            }
        });
        return { total: subdomains.length, alive, protectedCount, dead, pending };
    }, [subdomains, probeResults]);

    // Wayback için mevcut yıllar ve dönem istatistikleri
    const availableYears = useMemo(() => {
        if (type !== 'wayback' || !waybackUrls) return [];
        const years = new Set();
        waybackUrls.forEach(item => {
            const y = item.year || (item.timestamp && item.timestamp.slice(0, 4));
            if (y && !isNaN(y)) years.add(y);
        });
        return Array.from(years).sort((a, b) => a.localeCompare(b));
    }, [type, waybackUrls]);

    const waybackStats = useMemo(() => {
        if (type !== 'wayback' || !waybackUrls) return { total: 0, legacy: 0, mid: 0, recent: 0 };
        let legacy = 0; // < 2015
        let mid = 0;    // 2015 - 2020
        let recent = 0; // > 2020
        waybackUrls.forEach(item => {
            const yr = parseInt(item.year || (item.timestamp && item.timestamp.slice(0, 4)), 10);
            if (!isNaN(yr)) {
                if (yr < 2015) legacy++;
                else if (yr <= 2020) mid++;
                else recent++;
            } else {
                recent++;
            }
        });
        return { total: waybackUrls.length, legacy, mid, recent };
    }, [type, waybackUrls]);

    // Arama ve filtreleme
    const filteredItems = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (type === 'crtsh') {
            return subdomains.filter(item => {
                const sub = item.subdomain ? item.subdomain.toLowerCase() : '';
                const issuer = item.issuer ? item.issuer.toLowerCase() : '';
                const matchesSearch = !query || sub.includes(query) || issuer.includes(query);

                if (!matchesSearch) return false;

                // Durum filtresi
                if (statusFilter === 'all') return true;
                const subKey = (item.subdomain || '').toLowerCase().trim();
                const p = probeResults[subKey] || probeResults[item.subdomain];
                if (!p) return statusFilter === 'all';
                if (statusFilter === 'alive') return p.isAlive && p.statusCode >= 200 && p.statusCode < 400;
                if (statusFilter === 'protected') return p.statusCode === 401 || p.statusCode === 403;
                if (statusFilter === 'dead') return !p.isAlive || p.statusCode >= 500;

                return true;
            });
        } else {
            return waybackUrls.filter(item => {
                const yr = parseInt(item.year || (item.timestamp && item.timestamp.slice(0, 4)), 10);
                const itemYearStr = item.year || (item.timestamp && item.timestamp.slice(0, 4)) || '';

                // Yıl seçimi filtresi
                if (selectedYear !== 'all' && itemYearStr !== selectedYear) {
                    return false;
                }

                // Dönem filtresi
                if (waybackPeriod === 'legacy' && (isNaN(yr) || yr >= 2015)) return false;
                if (waybackPeriod === 'mid' && (isNaN(yr) || yr < 2015 || yr > 2020)) return false;
                if (waybackPeriod === 'recent' && (isNaN(yr) || yr <= 2020)) return false;

                // Arama filtresi
                if (!query) return true;
                return (
                    (item.url && item.url.toLowerCase().includes(query)) ||
                    (item.mimeType && item.mimeType.toLowerCase().includes(query)) ||
                    (item.timestamp && item.timestamp.toLowerCase().includes(query)) ||
                    (itemYearStr && itemYearStr.includes(query))
                );
            });
        }
    }, [type, subdomains, waybackUrls, searchTerm, statusFilter, probeResults, waybackPeriod, selectedYear]);

    if (!isOpen) return null;

    // Tüm listeyi panoya kopyala
    const handleCopyAll = () => {
        let content = '';
        if (type === 'crtsh') {
            content = filteredItems.map(item => item.subdomain).join('\n');
        } else {
            content = filteredItems.map(item => item.url).join('\n');
        }
        navigator.clipboard.writeText(content);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    // Tekil satırı kopyalama
    const handleCopyItem = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    // Tarayıcıda aç
    const handleOpenInBrowser = (url) => {
        let valid = url;
        if (!valid.startsWith('http://') && !valid.startsWith('https://')) {
            valid = `https://${valid}`;
        }
        BrowserOpenURL(valid);
    };

    // Tekil subdomain canlılık rozeti render etme
    const renderProbeBadge = (subdomain) => {
        const subKey = (subdomain || '').toLowerCase().trim();
        const res = probeResults[subKey] || probeResults[subdomain];
        if (!res) {
            return isProbingSubdomains ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white/40 border border-white/5 bg-white/[0.02] flex items-center gap-1.5" title="Canlılık denetleniyor...">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                    <span>Test Ediliyor...</span>
                </span>
            ) : null;
        }

        if (!res.isAlive) {
            return (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-red-400/80 border border-red-500/20 bg-red-500/10 flex items-center gap-1" title={res.error || "Sunucuya bağlanılamadı"}>
                    <ShieldAlert size={10} />
                    <span>Kapalı</span>
                </span>
            );
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
            return (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/25 bg-emerald-500/15 flex items-center gap-1" title={`HTTP ${res.statusText || '200 OK'} • ${res.server || 'Bilinmeyen Sunucu'}`}>
                    <ShieldCheck size={10} />
                    <span>{res.statusCode} OK</span>
                    {res.responseTimeMs > 0 && <span className="text-[9px] text-emerald-400/60 font-mono">({res.responseTimeMs}ms)</span>}
                </span>
            );
        }

        if (res.statusCode === 401 || res.statusCode === 403) {
            return (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 border border-amber-500/25 bg-amber-500/15 flex items-center gap-1" title="Kimlik doğrulama veya yetki koruması">
                    <Shield size={10} />
                    <span>{res.statusCode} Korumalı</span>
                </span>
            );
        }

        if (res.statusCode >= 300 && res.statusCode < 400) {
            return (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-cyan-500/25 bg-cyan-500/15 flex items-center gap-1" title="Yönlendirme">
                    <Activity size={10} />
                    <span>{res.statusCode}</span>
                </span>
            );
        }

        return (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-white/60 border border-white/10 bg-white/5 flex items-center gap-1">
                <span>{res.statusCode}</span>
            </span>
        );
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="bg-[#0b0b0e]/95 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl shadow-black/90 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Başlığı (Monochrome Glassmorphic Header) */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/80 shadow-inner">
                            <HeaderIcon size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50">
                                    {subtitle}
                                </span>
                            </div>
                            <p className="text-xs text-white/40 font-mono mt-0.5">
                                Hedef: <span className="text-white/80 font-medium">{target}</span> 
                                {!isLoading && ` • Toplam ${subdomains.length || waybackUrls.length} kayıt`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {type === 'crtsh' && subdomains.length > 0 && (
                            <button
                                onClick={() => startProbing(subdomains)}
                                disabled={isProbingSubdomains}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/70 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                title="Tüm alt alan adlarının HTTP canlılığını yeniden test et"
                            >
                                <RefreshCw size={12} className={isProbingSubdomains ? "animate-spin text-white" : ""} />
                                <span>{isProbingSubdomains ? "Taranıyor..." : "Yeniden Test Et"}</span>
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="Kapat"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Alt Alan Adları İçin Canlı Durum İstatistik ve Filtre Sekmeleri */}
                {type === 'crtsh' && subdomains.length > 0 && (
                    <div className="px-5 py-2.5 bg-white/[0.015] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                            <span className="text-white/40 text-[11px] mr-1">Canlılık Durumu:</span>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                                    statusFilter === 'all' 
                                        ? 'bg-white text-black font-semibold' 
                                        : 'bg-white/5 text-white/50 hover:text-white'
                                }`}
                            >
                                Tümü ({subdomains.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('alive')}
                                className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                                    statusFilter === 'alive' 
                                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold' 
                                        : 'bg-white/5 text-emerald-400/70 hover:text-emerald-300'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>Canlı ({probeStats.alive})</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('protected')}
                                className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                                    statusFilter === 'protected' 
                                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold' 
                                        : 'bg-white/5 text-amber-400/70 hover:text-amber-300'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Korumalı ({probeStats.protectedCount})</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('dead')}
                                className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                                    statusFilter === 'dead' 
                                        ? 'bg-red-500/30 text-red-300 border border-red-500/40 font-semibold' 
                                        : 'bg-white/5 text-red-400/70 hover:text-red-300'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                <span>Kapalı ({probeStats.dead})</span>
                            </button>
                        </div>

                        {isProbingSubdomains && (
                            <div className="flex items-center gap-2 text-white/50 text-[11px]">
                                <RefreshCw size={11} className="animate-spin text-white/70" />
                                <span>Otomatik Canlılık Taraması Sürüyor...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Wayback Machine İçin Dönem ve Yıl Filtre Sekmeleri */}
                {type === 'wayback' && waybackUrls.length > 0 && (
                    <div className="px-5 py-2.5 bg-white/[0.015] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white/40 text-[11px] mr-1 flex items-center gap-1">
                                <History size={12} className="text-white/40" />
                                <span>Arşiv Dönemi:</span>
                            </span>
                            <button
                                onClick={() => { setWaybackPeriod('all'); setSelectedYear('all'); }}
                                className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                                    waybackPeriod === 'all' && selectedYear === 'all'
                                        ? 'bg-white text-black font-semibold' 
                                        : 'bg-white/5 text-white/50 hover:text-white'
                                }`}
                            >
                                Tümü ({waybackStats.total})
                            </button>
                            {waybackStats.legacy > 0 && (
                                <button
                                    onClick={() => { setWaybackPeriod('legacy'); setSelectedYear('all'); }}
                                    className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                                        waybackPeriod === 'legacy'
                                            ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold' 
                                            : 'bg-white/5 text-amber-400/80 hover:text-amber-200'
                                    }`}
                                    title="2015 öncesi tarihi arşiv snapshot'ları"
                                >
                                    <Clock size={11} />
                                    <span>Tarihi (2015 Öncesi) ({waybackStats.legacy})</span>
                                </button>
                            )}
                            {waybackStats.mid > 0 && (
                                <button
                                    onClick={() => { setWaybackPeriod('mid'); setSelectedYear('all'); }}
                                    className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                                        waybackPeriod === 'mid'
                                            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-semibold' 
                                            : 'bg-white/5 text-cyan-400/80 hover:text-cyan-200'
                                    }`}
                                >
                                    <span>2015 - 2020 ({waybackStats.mid})</span>
                                </button>
                            )}
                            {waybackStats.recent > 0 && (
                                <button
                                    onClick={() => { setWaybackPeriod('recent'); setSelectedYear('all'); }}
                                    className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                                        waybackPeriod === 'recent'
                                            ? 'bg-white/20 text-white border border-white/30 font-semibold' 
                                            : 'bg-white/5 text-white/60 hover:text-white'
                                    }`}
                                >
                                    <span>2021+ ({waybackStats.recent})</span>
                                </button>
                            )}
                        </div>

                        {/* Yıl Seçim Açılır Menüsü */}
                        {availableYears.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-white/40 text-[11px] flex items-center gap-1">
                                    <Calendar size={11} />
                                    <span>Yıl:</span>
                                </span>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => { setSelectedYear(e.target.value); setWaybackPeriod('all'); }}
                                    className="bg-black/70 border border-white/10 rounded-md px-2 py-0.5 text-[11px] text-white/90 focus:outline-none focus:border-white/30 cursor-pointer font-mono"
                                >
                                    <option value="all">Tüm Yıllar ({availableYears.length} Yıl)</option>
                                    {availableYears.map(yr => (
                                        <option key={yr} value={yr}>{yr}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Filtre ve Hızlı İşlem Çubuğu */}
                <div className="p-3.5 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Sonuçlarda filtrele..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors font-mono"
                        />
                        <Search size={14} className="text-white/30 absolute left-3 top-2.5" />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleCopyAll}
                            disabled={isLoading || filteredItems.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {copiedAll ? <Check size={13} className="text-white" /> : <Copy size={13} />}
                            <span>{copiedAll ? 'Tümü Kopyalandı' : 'Tümünü Kopyala'}</span>
                        </button>
                    </div>
                </div>

                {/* Sonuç Listesi / İçerik */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-8 h-8 border border-white/10 border-t-white rounded-full animate-spin mb-4" />
                            <p className="text-xs font-mono uppercase tracking-widest text-white/60">İstihbarat Verisi Toplanıyor...</p>
                            <p className="text-[11px] text-white/30 font-mono mt-1 max-w-sm">
                                {type === 'crtsh' 
                                    ? 'Subdomain.Center, HackerTarget ve CRT.sh üzerinden alt alan adları taranıyor.' 
                                    : 'Archive.org üzerinden 2006\'dan günümüze tarihi web arşivi ve AlienVault uç noktaları taranıyor.'}
                            </p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                            <AlertCircle size={28} className="text-white/40 mb-2" />
                            <p className="text-xs font-mono uppercase tracking-wider text-white">Sonuç Bulunamadı</p>
                            <p className="text-[10px] text-white/50 font-mono mt-0.5">
                                {searchTerm || statusFilter !== 'all' || waybackPeriod !== 'all' || selectedYear !== 'all' 
                                    ? 'Filtreye uygun sonuç çıkmadı.' 
                                    : 'Hedefe ait kayıt tespit edilemedi.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {type === 'crtsh' ? (
                                // CRT.sh Subdomain Görünümü + Canlılık Rozeti
                                filteredItems.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-between group gap-3"
                                    >
                                        <div className="min-w-0 pr-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-mono text-white/90 group-hover:text-white select-all">
                                                    {item.subdomain}
                                                </span>
                                                {/* Otomatik Canlılık Testi Rozeti */}
                                                {renderProbeBadge(item.subdomain)}
                                            </div>
                                            {item.issuer && (
                                                <p className="text-[10px] text-white/30 font-mono mt-0.5 truncate max-w-md">
                                                    Kaynak: {item.issuer}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => handleCopyItem(item.subdomain, idx)}
                                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                                                title="Alt Alan Adını Kopyala"
                                            >
                                                {copiedIndex === idx ? (
                                                    <span className="text-[10px] text-white font-mono px-1">Kopyalandı</span>
                                                ) : (
                                                    <Copy size={13} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleOpenInBrowser(item.subdomain)}
                                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                                                title="Tarayıcıda Aç"
                                            >
                                                <ExternalLink size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Wayback Machine Tarihi Arşiv & URL Görünümü
                                filteredItems.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-between group gap-3"
                                    >
                                        <div className="min-w-0 pr-2 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Belirgin Yıl Rozeti */}
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 shrink-0">
                                                    {item.year || (item.timestamp ? item.timestamp.slice(0, 4) : 'Arşiv')}
                                                </span>

                                                {/* HTTP Durum Kodu */}
                                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono border ${
                                                    (item.status && item.status.startsWith('2')) ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                                                    (item.status && (item.status.startsWith('3') || item.status.startsWith('4'))) ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                                    'border-white/10 bg-white/5 text-white/60'
                                                }`}>
                                                    {item.status || '200'}
                                                </span>

                                                {/* Arşiv URL'si */}
                                                <p className="text-xs font-mono text-white/90 group-hover:text-white truncate max-w-lg select-all">
                                                    {item.url}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono mt-1">
                                                {item.timestamp && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} className="text-white/30" />
                                                        <span>{item.timestamp}</span>
                                                    </span>
                                                )}
                                                <span>{item.mimeType || 'endpoint'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => handleCopyItem(item.url, idx)}
                                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                                                title="URL'yi Kopyala"
                                            >
                                                {copiedIndex === idx ? (
                                                    <span className="text-[10px] text-white font-mono px-1">Kopyalandı</span>
                                                ) : (
                                                    <Copy size={13} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleOpenInBrowser(item.snapshotUrl || item.url)}
                                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                                                title="Arşiv Kaydını Aç"
                                            >
                                                <ExternalLink size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Alt Kısım / Footer */}
                <div className="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span>
                        {type === 'crtsh' 
                            ? `Alt Alan Adı Keşfi • Toplam: ${filteredItems.length} kayıt` 
                            : `Arşiv & Uç Nokta Keşfi • Toplam: ${filteredItems.length} kayıt`}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}
