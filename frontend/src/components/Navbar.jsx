"use client";

import { Search, Download, Plus, SlidersHorizontal, Flag } from 'lucide-react';

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
  findingsCount = 0
}) {
  return (
    <nav className={`navbar ${isVisible ? 'visible' : ''}`}>
      <div className="navbar-inner">
        <h2
          className="navbar-brand silver-glow cursor-pointer"
          onClick={onLogoClick}
          title="En üste kaydır"
        >
          Dorkful.
        </h2>

        <div className="navbar-controls">
          <input
            type="text"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            onBlur={onTargetBlur}
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
            placeholder="Target..."
            className="search-input-nav"
          />
          <button onClick={() => onGenerate()} className="btn-generate btn-generate-nav">
            <Search size={12} />
          </button>

          <div className="filter-bar">
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
