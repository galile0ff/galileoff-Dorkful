"use client";

import { useRef } from 'react';
import { Search, Download, Plus, SlidersHorizontal, Flag, Target, Settings, ChevronLeft, ChevronRight, FileText, Globe, Activity } from 'lucide-react';

// Sabit üst navigasyon çubuğu (Sticky Navbar)
export default function Navbar({
  isVisible,
  target,
  onTargetChange,
  onTargetBlur,
  onGenerate,
  categories,
  selectedFilter,
  onFilterChange,
  hasDorks,
  onExport,
  onLogoClick,
  onOpenAddModal,
  onOpenManageModal,
  onOpenFindingsModal,
  findingsCount = 0,
  onOpenWorkspaceModal,
  onOpenSettingsModal,
  onOpenReport,
  onOpenReconHub
}) {
  const filterScrollRef = useRef(null);

  const scrollFilters = (offset) => {
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${isVisible ? 'visible' : ''}`}>
      <div className="navbar-inner">
        {/* Sol Bölüm: Logo ve Kompakt Arama */}
        <div className="flex items-center gap-2.5 shrink-0">
          <h2
            className="navbar-brand silver-glow cursor-pointer select-none"
            onClick={onLogoClick}
            title="En üste kaydır"
          >
            Dorkful.
          </h2>

          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              onBlur={onTargetBlur}
              onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
              placeholder="Hedef alan adı..."
              className="search-input-nav"
            />
            <button
              onClick={() => onGenerate()}
              className="btn-generate btn-generate-nav"
              title="Keşfet"
            >
              <Search size={12} />
            </button>
          </div>
        </div>

        {/* Orta Bölüm: Taşmayan, Esnek ve Kaydırılabilir Kategori Filtresi */}
        <div className="relative flex-1 min-w-0 flex items-center px-1">
          <button
            type="button"
            onClick={() => scrollFilters(-160)}
            className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors cursor-pointer mr-1 z-10"
            title="Sola kaydır"
          >
            <ChevronLeft size={13} />
          </button>

          <div
            ref={filterScrollRef}
            className="filter-bar-nav"
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onFilterChange(cat)}
                className={`filter-btn filter-btn-nav ${
                  selectedFilter === cat ? 'filter-btn-active' : 'filter-btn-inactive'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollFilters(160)}
            className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors cursor-pointer ml-1 z-10"
            title="Sağa kaydır"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Sağ Bölüm: Sadeleştirilmiş ve Hizalı Aksiyon Butonları */}
        <div className="nav-actions flex items-center gap-1.5 shrink-0">
          {/* Keşif Merkezi */}
          <button
            onClick={() => onOpenReconHub && onOpenReconHub()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.08] text-xs font-medium transition-all cursor-pointer"
            title="İstihbarat & Keşif Merkezi"
          >
            <Activity size={13} className="text-emerald-400" />
            <span className="hidden md:inline">Keşif</span>
          </button>

          {/* Dork Studio */}
          <button
            onClick={onOpenManageModal}
            className="btn-icon"
            title="Dork Studio (Şablonlar & Yeni Ekle)"
          >
            <SlidersHorizontal size={13} />
          </button>

          {/* Bulgu Defteri */}
          <button
            onClick={onOpenFindingsModal}
            className="btn-icon relative"
            title="Bulgu Defteri"
          >
            <Flag size={13} className={findingsCount > 0 ? "text-red-400 fill-red-400/40" : ""} />
            {findingsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-sm">
                {findingsCount}
              </span>
            )}
          </button>

          {/* Ayarlar */}
          <button
            onClick={onOpenSettingsModal}
            className="btn-icon"
            title="Ayarlar & API Kasası"
          >
            <Settings size={13} />
          </button>

          {/* Dışa Aktar */}
          {hasDorks && (
            <button onClick={onExport} className="btn-icon" title="JSON Olarak Dışa Aktar">
              <Download size={13} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
