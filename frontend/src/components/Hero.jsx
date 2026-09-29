"use client";

import { Search, Plus, SlidersHorizontal } from 'lucide-react';

// Ana karşılama ve arama bölümü (Hero)
export default function Hero({
  target,
  onTargetChange,
  onGenerate,
  categories,
  selectedFilter,
  onFilterChange,
  onLogoClick,
  onOpenAddModal,
  onOpenManageModal
}) {
  return (
    <section className="hero-section">
      <h1
        className="hero-title silver-glow cursor-pointer"
        onClick={onLogoClick}
        title="Giriş ekranına dön"
      >
        Dorkful.
      </h1>
      <p className="hero-subtitle">Monochrome Intelligence</p>

      <div className="hero-controls">
        {/* Arama Giriş Alanı */}
        <div className="flex items-center gap-3 w-full">
          <input
            type="text"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
            placeholder="Hedef alan adı (örn: target.com)..."
            className="search-input search-input-hero"
            autoFocus
          />
          <button onClick={() => onGenerate()} className="btn-generate btn-generate-hero">
            <Search size={14} />
            <span>Generate</span>
          </button>
        </div>

        {/* Kategori Filtre Hapları (Temiz, sarıp sarmalayan, kaydırma çubuğu olmayan yapı) */}
        <div className="filter-bar-hero">
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

          {/* Özel Dork Ekleme Butonu */}
          <button
            onClick={onOpenAddModal}
            className="filter-btn filter-btn-hero border border-dashed border-white/25 text-white/70 hover:text-white hover:border-white/60 bg-white/[0.03] hover:bg-white/[0.08] flex items-center gap-1.5"
            title="Yeni özel dork şablonu ekle"
          >
            <Plus size={13} className="text-white/70" />
            <span>Özel Dork</span>
          </button>

          {/* Dork & Kategori Yönetimi Butonu */}
          <button
            onClick={onOpenManageModal}
            className="filter-btn filter-btn-hero border border-white/10 text-white/50 hover:text-white hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.06] flex items-center gap-1.5"
            title="Dorkları ve kategorileri düzenle veya sil"
          >
            <SlidersHorizontal size={12} className="text-white/50" />
            <span>Yönet</span>
          </button>
        </div>
      </div>
    </section>
  );
}
