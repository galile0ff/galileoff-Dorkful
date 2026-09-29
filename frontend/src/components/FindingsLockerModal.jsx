"use client";

import { useState, useMemo } from 'react';
import {
  X,
  Flag,
  Trash2,
  Download,
  ExternalLink,
  Copy,
  Search,
  Calendar,
  Globe,
  Link as LinkIcon,
  ShieldAlert,
  Layers,
  Sparkles
} from 'lucide-react';
import { BrowserOpenURL, ClipboardSetText } from '../../wailsjs/runtime/runtime';

export default function FindingsLockerModal({
  isOpen,
  onClose,
  findings = [],
  onDeleteFinding,
  onClearFindings,
  onExportFindings,
  onShowToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  // Filtrelenmiş bulgular listesi
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSeverity = selectedSeverity === 'All' || f.severity === selectedSeverity;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (f.target && f.target.toLowerCase().includes(q)) ||
        (f.dorkQuery && f.dorkQuery.toLowerCase().includes(q)) ||
        (f.notes && f.notes.toLowerCase().includes(q)) ||
        (f.evidenceUrl && f.evidenceUrl.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q));

      return matchesSeverity && matchesSearch;
    });
  }, [findings, selectedSeverity, searchQuery]);

  // Risk istatistikleri
  const stats = useMemo(() => {
    const counts = { All: findings.length, Critical: 0, High: 0, Medium: 0, Low: 0 };
    findings.forEach((f) => {
      if (counts[f.severity] !== undefined) {
        counts[f.severity]++;
      }
    });
    return counts;
  }, [findings]);

  if (!isOpen) return null;

  const copyText = (text, label = "Metin") => {
    ClipboardSetText(text);
    if (onShowToast) onShowToast(`${label} panoya kopyalandı.`);
  };

  const openURL = (url) => {
    if (!url) return;
    let validURL = url;
    if (!validURL.startsWith('http')) validURL = `https://${validURL}`;
    BrowserOpenURL(validURL);
  };

  // Severity rozeti
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Kritik
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Yüksek
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Orta
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Düşük
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[86vh] bg-neutral-950 border border-white/15 rounded-2xl flex flex-col shadow-2xl text-white shadow-white/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            ÜST BAŞLIK & AKSİYONLAR
           ========================================================= */}
        <div className="px-6 pt-5 pb-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
              <Flag size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-semibold text-white tracking-tight silver-glow">
                  Bulgu Defteri & Kanıt Kasası
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80 text-[11px] font-mono">
                  {findings.length} Kayıt
                </span>
              </div>
              <p className="text-xs text-white/50">
                CTI operasyonu sırasında tespit edilen ve doğrulanmış güvenlik kanıtları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {findings.length > 0 && (
              <>
                <button
                  onClick={onExportFindings}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white font-medium tracking-wide flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  title="Tüm bulguları JSON raporu olarak masaüstüne aktar"
                >
                  <Download size={13} />
                  <span>Rapor Al (JSON)</span>
                </button>
                <button
                  onClick={onClearFindings}
                  className="p-2 text-white/30 hover:text-red-400 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  title="Tüm Bulguları Temizle"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =========================================================
            METRİK VE İSTATİSTİK KARTLARI
           ========================================================= */}
        <div className="px-6 py-3.5 border-b border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-2.5 shrink-0 bg-neutral-900/30">
          {/* Hepsi */}
          <button
            onClick={() => setSelectedSeverity('All')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'All'
                ? 'bg-white/10 border-white/30 ring-1 ring-white/20'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
            }`}
          >
            <div className="text-[11px] text-white/50 flex items-center justify-between">
              <span>Toplam Bulgu</span>
              <Layers size={12} className="text-white/40" />
            </div>
            <div className="text-lg font-mono font-semibold text-white mt-1">{stats.All}</div>
          </button>

          {/* Kritik */}
          <button
            onClick={() => setSelectedSeverity(selectedSeverity === 'Critical' ? 'All' : 'Critical')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'Critical'
                ? 'bg-red-500/15 border-red-500/40 ring-1 ring-red-500/30'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
            }`}
          >
            <div className="text-[11px] text-white/50 flex items-center justify-between">
              <span>Kritik</span>
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <div className="text-lg font-mono font-semibold text-red-400 mt-1">{stats.Critical}</div>
          </button>

          {/* Yüksek */}
          <button
            onClick={() => setSelectedSeverity(selectedSeverity === 'High' ? 'All' : 'High')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'High'
                ? 'bg-orange-500/15 border-orange-500/40 ring-1 ring-orange-500/30'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
            }`}
          >
            <div className="text-[11px] text-white/50 flex items-center justify-between">
              <span>Yüksek</span>
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <div className="text-lg font-mono font-semibold text-orange-400 mt-1">{stats.High}</div>
          </button>

          {/* Orta */}
          <button
            onClick={() => setSelectedSeverity(selectedSeverity === 'Medium' ? 'All' : 'Medium')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'Medium'
                ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
            }`}
          >
            <div className="text-[11px] text-white/50 flex items-center justify-between">
              <span>Orta</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-lg font-mono font-semibold text-amber-400 mt-1">{stats.Medium}</div>
          </button>

          {/* Düşük */}
          <button
            onClick={() => setSelectedSeverity(selectedSeverity === 'Low' ? 'All' : 'Low')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSeverity === 'Low'
                ? 'bg-blue-500/15 border-blue-500/40 ring-1 ring-blue-500/30'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
            }`}
          >
            <div className="text-[11px] text-white/50 flex items-center justify-between">
              <span>Düşük</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-lg font-mono font-semibold text-blue-400 mt-1">{stats.Low}</div>
          </button>
        </div>

        {/* =========================================================
            ARAMA VE FİLTRELEME ÇUBUĞU
           ========================================================= */}
        <div className="px-6 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-neutral-900/50">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hedef, dork, kanıt linki veya notlarda filtrele..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => {
              const label =
                sev === 'All'
                  ? 'Tümü'
                  : sev === 'Critical'
                  ? 'Kritik'
                  : sev === 'High'
                  ? 'Yüksek'
                  : sev === 'Medium'
                  ? 'Orta'
                  : 'Düşük';

              const isSelected = selectedSeverity === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-semibold border-white shadow-sm'
                      : 'bg-white/[0.04] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            BULGU KARTLARI LİSTESİ
           ========================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3.5">
          {filteredFindings.length === 0 ? (
            <div className="empty-state">
              <Flag size={48} strokeWidth={1} className="mb-3 opacity-30 text-white animate-pulse" />
              <p className="empty-state-text">Kayıtlı Bulgu Yok</p>
              <p className="text-xs text-white/40 max-w-sm text-center mt-2 font-sans normal-case">
                {searchQuery || selectedSeverity !== 'All'
                  ? 'Arama kriterlerinize uyan kayıtlı bulgu bulunamadı.'
                  : 'Dork kartlarındaki bayrak simgesine tıklayarak tespit ettiğiniz açık URL veya admin panellerini buraya ekleyebilirsiniz.'}
              </p>
            </div>
          ) : (
            filteredFindings.map((f, idx) => (
              <div
                key={f.id || idx}
                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-xl p-4 sm:p-5 transition-all duration-200 space-y-3 shadow-lg shadow-black/20"
              >
                {/* Üst Satır: Risk Rozeti, Hedef Domain, Kategori, Tarih ve Sil Butonu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getSeverityBadge(f.severity)}

                    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-white/95 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      <Globe size={12} className="text-white/40" />
                      <span>{f.target}</span>
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 px-2 py-0.5 rounded bg-white/[0.04]">
                      {f.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-white/30 font-mono flex items-center gap-1">
                      <Calendar size={11} className="text-white/30" />
                      {formatDate(f.createdAt)}
                    </span>

                    <button
                      onClick={() => onDeleteFinding(f.id)}
                      className="p-1.5 text-white/20 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      title="Bulguyu Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Dork Sorgusu */}
                {f.dorkQuery && (
                  <div className="dork-query-box flex items-center justify-between gap-3">
                    <code className="dork-query-code text-xs text-white/70 font-mono break-all">
                      {f.dorkQuery}
                    </code>
                    <button
                      onClick={() => copyText(f.dorkQuery, "Dork Sorgusu")}
                      className="p-1 text-white/30 hover:text-white rounded transition-colors cursor-pointer shrink-0"
                      title="Dork Sorgusunu Kopyala"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                )}

                {/* Kanıt URL'si */}
                {f.evidenceUrl && (
                  <div className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2">
                    <div className="flex items-center gap-2 truncate text-xs font-mono">
                      <LinkIcon size={12} className="text-white/40 shrink-0" />
                      <span className="text-white/40 shrink-0">Kanıt Linki:</span>
                      <span className="text-cyan-400/90 hover:underline truncate cursor-pointer" onClick={() => openURL(f.evidenceUrl)}>
                        {f.evidenceUrl}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyText(f.evidenceUrl, "Kanıt Linki")}
                        className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="URL Kopyala"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => openURL(f.evidenceUrl)}
                        className="p-1.5 text-white/30 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        title="Tarayıcıda Doğrudan Aç"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Analist / CTI Notları */}
                {f.notes && (
                  <div className="bg-black/40 border-l-2 border-white/30 rounded-r-lg p-3 text-xs text-white/80 leading-relaxed font-sans">
                    <span className="text-white/40 font-mono text-[10px] uppercase tracking-wider block mb-1">
                      Analist Kanıt Notu
                    </span>
                    <p className="italic">"{f.notes}"</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
