"use client";

import { useRef } from 'react';
import { Search, Download, Plus, SlidersHorizontal, Flag, Target, Settings, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

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
  onOpenReport
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

        {/* Sağ Bölüm: Sabit Hizalı Aksiyon Butonları */}
        <div className="nav-actions">
          <button
            onClick={onOpenWorkspaceModal}
            className="btn-icon"
            title="Hedef Çalışma Alanları (Target Workspaces)"
          >
            <Target size={14} />
          </button>

          <button
            onClick={onOpenAddModal}
            className="btn-icon"
            title="Özel Dork Ekle"
          >
            <Plus size={14} />
          </button>

          <button
            onClick={onOpenManageModal}
            className="btn-icon"
            title="Dork ve Kategorileri Yönet"
          >
            <SlidersHorizontal size={14} />
          </button>

          <button
            onClick={onOpenSettingsModal}
            className="btn-icon"
            title="Ayarlar & API Kasası"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={onOpenFindingsModal}
            className="btn-icon relative"
            title="Bulgu Defteri ve Kanıt Kasası"
          >
            <Flag size={14} className={findingsCount > 0 ? "text-red-400 fill-red-400/40" : ""} />
            {findingsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-mono font-bold text-white flex items-center justify-center shadow-sm">
                {findingsCount}
              </span>
            )}
          </button>

          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="btn-icon"
              title="CTI & Pentest Yönetici Raporu (PDF / HTML)"
            >
              <FileText size={14} />
            </button>
          )}

          {hasDorks && (
            <button onClick={onExport} className="btn-icon" title="Dışa Aktar">
              <Download size={14} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
