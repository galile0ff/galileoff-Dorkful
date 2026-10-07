"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Flag,
  Globe,
  GitBranch,
  Radio,
  Shield,
  Target as TargetIcon,
  Settings,
  Activity,
  FileText,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';

// Ana karşılama ve sadeleştirilmiş komut/arama bölümü (Hero)
export default function Hero({
  target,
  onTargetChange,
  onTargetBlur,
  onGenerate,
  categories,
  selectedFilter,
  onFilterChange,
  onLogoClick,
  onOpenManageModal,
  onOpenFindingsModal,
  findingsCount = 0,
  // Çoklu Motor & Çalışma Alanı Propları
  selectedEngine = 'google',
  onEngineChange,
  activeWorkspace,
  onOpenWorkspaceModal,
  onOpenSettingsModal,
  onOpenReport,
  onOpenReconHub,
  hasDorks = false
}) {
  const [engineMenuOpen, setEngineMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const engineMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Temel arama motorları
  const ENGINES = [
    { id: 'google', label: 'Google', icon: Globe, desc: 'Web Dorkları & Hassas Belgeler' },
    { id: 'github', label: 'GitHub', icon: GitBranch, desc: 'Canlı Kod Sızıntıları & Secretlar' },
    { id: 'shodan', label: 'Shodan', icon: Radio, desc: 'Açık Portlar, Servisler & CVE' },
    { id: 'censys', label: 'Censys', icon: Shield, desc: 'Hostlar, Sertifikalar & Servisler' }
  ];

  const currentEngineObj = ENGINES.find(e => e.id === selectedEngine) || ENGINES[0];
  const CurrentIcon = currentEngineObj.icon;

  // Dışarı tıklandığında menüleri kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (engineMenuRef.current && !engineMenuRef.current.contains(e.target)) {
        setEngineMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectEngine = (engId) => {
    setEngineMenuOpen(false);
    if (onEngineChange) {
      onEngineChange(engId);
    }
    const currentTarget = (target && target.trim()) || (activeWorkspace && activeWorkspace.domain ? activeWorkspace.domain.trim() : '');
    if (currentTarget && onGenerate) {
      onGenerate(currentTarget, engId);
    }
  };

  return (
    <section className={`w-full flex flex-col items-center px-4 sm:px-6 transition-all duration-300 ${hasDorks ? 'pt-10 pb-3' : 'py-3'}`}>
      {/* Logo ve Başlık */}
      <h1
        className="hero-title silver-glow cursor-pointer select-none"
        onClick={onLogoClick}
        title="Giriş ekranına dön"
      >
        Dorkful.
      </h1>
      <p className="hero-subtitle">galileoff Dork Tool</p>

      {/* Sade Hedef Çalışma Alanı Rozeti */}
      <div className="flex items-center justify-center my-2.5">
        <button
          onClick={onOpenWorkspaceModal}
          className="px-3 py-1 rounded-full bg-white/[0.025] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-xs text-white/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xl group shadow-sm"
          title="Hedef Çalışma Alanını Yönet veya Değiştir"
        >
          <TargetIcon size={12} className="text-white/40 group-hover:text-emerald-400 transition-colors" />
          {activeWorkspace ? (
            <span className="font-mono text-white/90 font-medium">
              {activeWorkspace.domain || activeWorkspace.name}
            </span>
          ) : (
            <span>Çalışma Alanı Seç</span>
          )}
          <span className="text-[10px] text-white/30 group-hover:text-white/60 ml-0.5">▾</span>
        </button>
      </div>

      <div className={`hero-controls max-w-2xl w-full relative ${engineMenuOpen ? 'z-50' : 'z-20'}`}>
        {/* Raycast / Spotlight Tarzı Odaklanmış Arama Çubuğu */}
        <div className={`relative flex items-center w-full rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 focus-within:border-white/35 backdrop-blur-2xl transition-all shadow-xl shadow-black/40 group p-1.5 ${engineMenuOpen ? 'z-50' : 'z-20'}`}>
          {/* Kompakt Motor Seçici Açılır Menüsü */}
          <div className="relative shrink-0 z-50" ref={engineMenuRef}>
            <button
              type="button"
              onClick={() => setEngineMenuOpen(!engineMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.06] text-xs font-medium cursor-pointer transition-all"
              title="Arama Motoru Seç"
            >
              <CurrentIcon size={13} className="text-white/70" />
              <span className="hidden sm:inline">{currentEngineObj.label}</span>
              <ChevronDown size={11} className={`text-white/40 transition-transform ${engineMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {engineMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-[#0c0c0e] border border-white/20 backdrop-blur-3xl p-1.5 shadow-2xl shadow-black/95 z-[9999] animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40 border-b border-white/[0.06] mb-1">
                  Arama Motoru
                </div>
                {ENGINES.map((eng) => {
                  const Icon = eng.icon;
                  const isSelected = selectedEngine === eng.id;
                  return (
                    <button
                      key={eng.id}
                      onClick={() => handleSelectEngine(eng.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-white text-black font-semibold'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={13} className={isSelected ? 'text-black' : 'text-white/50'} />
                        <span>{eng.label}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-black/60' : 'text-white/30'}`}>
                        {eng.id === 'google' ? 'Dork' : 'Canlı'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ana Arama Giriş Inputu */}
          <input
            type="text"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            onBlur={onTargetBlur}
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
            placeholder={
              selectedEngine === 'github' ? "GitHub sızıntı hedefi (örn: target.com)" :
              selectedEngine === 'shodan' ? "Shodan için hedef alan adı veya IP" :
              selectedEngine === 'censys' ? "Censys için hedef alan adı" :
              "Hedef alan adı (örn: target.com)"
            }
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-sm px-3 py-1 font-mono tracking-tight"
            autoFocus
          />

          {/* Keşfet Butonu */}
          <button
            onClick={() => onGenerate()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm shadow-white/20"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Keşfet</span>
          </button>
        </div>

        {/* Kategori Filtre Hapları (Sadeleştirilmiş ve Hafif) */}
        {hasDorks && categories && categories.length > 0 && (
          <div className="filter-bar-hero mt-3 relative z-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onFilterChange(cat)}
                className={`filter-btn filter-btn-hero ${
                  selectedFilter === cat ? 'filter-btn-active' : 'filter-btn-inactive'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Konsolide Linear / Raycast Hızlı Komut Barı */}
        <div className={`flex items-center justify-center gap-2 mt-3 pt-1 w-full relative ${moreMenuOpen ? 'z-40' : 'z-10'}`}>
          {/* Merkezi İstihbarat & Keşif Merkezi */}
          <button
            onClick={() => onOpenReconHub && onOpenReconHub()}
            className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-white hover:text-white hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-sm group active:scale-95"
            title="Tüm Canlı Keşif Araçları (Ağ Haritası, Shodan, Censys, GitHub, JS Miner, Arşiv)"
          >
            <Activity size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Keşif Merkezi</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Dork & Şablon Stüdyosu */}
          <button
            onClick={onOpenManageModal}
            className="px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs text-white/70 hover:text-white hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm active:scale-95"
            title="Dork Şablonlarını İncele veya Yeni Dork Ekle"
          >
            <SlidersHorizontal size={12} className="text-white/60" />
            <span>Dork Studio</span>
          </button>

          {/* Bulgu Defteri */}
          <button
            onClick={onOpenFindingsModal}
            className={`px-3 py-1.5 rounded-xl border text-xs transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm active:scale-95 ${
              findingsCount > 0
                ? 'border-red-500/30 text-white bg-red-500/15 hover:bg-red-500/25 hover:border-red-500/50'
                : 'border-white/[0.08] text-white/70 hover:text-white hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06]'
            }`}
            title="Kayıtlı Bulgular ve Güvenlik Notları"
          >
            <Flag size={12} className={findingsCount > 0 ? "text-red-400 fill-red-400/40" : "text-white/50"} />
            <span>Bulgular</span>
            {findingsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500/40 text-red-200">
                {findingsCount}
              </span>
            )}
          </button>

          {/* Daha Fazla `···` Menüsü (Rapor, Çalışma Alanı, Ayarlar) */}
          <div className="relative z-40" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="p-1.5 px-2 rounded-xl border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer backdrop-blur-sm active:scale-95"
              title="Diğer Araçlar & Ayarlar"
            >
              <MoreHorizontal size={14} />
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[#0c0c0e] border border-white/20 backdrop-blur-3xl p-1.5 shadow-2xl shadow-black/95 z-[9999] animate-fadeIn">
                {onOpenReport && (
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onOpenReport();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                  >
                    <FileText size={13} className="text-white/50" />
                    <span>Yönetici Raporu</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenWorkspaceModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left"
                >
                  <TargetIcon size={13} className="text-white/50" />
                  <span>Çalışma Alanları</span>
                </button>
                <button
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onOpenSettingsModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer text-left border-t border-white/[0.06] mt-1 pt-2"
                >
                  <Settings size={13} className="text-white/50" />
                  <span>Ayarlar & API Kasası</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
