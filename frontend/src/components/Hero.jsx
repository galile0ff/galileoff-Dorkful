"use client";

import {
  Search,
  Plus,
  SlidersHorizontal,
  Flag,
  Globe,
  GitBranch,
  Radio,
  Shield,
  History,
  Target as TargetIcon,
  Layers,
  Settings,
  Code2,
  Network,
  FileText
} from 'lucide-react';

// Ana karşılama ve arama bölümü (Hero)
export default function Hero({
  target,
  onTargetChange,
  onTargetBlur,
  onGenerate,
  categories,
  selectedFilter,
  onFilterChange,
  onLogoClick,
  onOpenAddModal,
  onOpenManageModal,
  onOpenFindingsModal,
  findingsCount = 0,
  // Çoklu Motor & Çalışma Alanı Propları
  selectedEngine = 'google',
  onEngineChange,
  activeWorkspace,
  onOpenWorkspaceModal,
  onOpenSettingsModal,
  onOpenJSAnalysis,
  onOpenDNSMap,
  onOpenReport,
  hasDorks = false
}) {
  const ENGINES = [
    { id: 'google', label: 'Google', icon: Globe, desc: 'Web Dorkları & Hassas Dosyalar' },
    { id: 'github', label: 'GitHub', icon: GitBranch, desc: 'Sızmış Gizli Anahtarlar & .env' },
    { id: 'shodan', label: 'Shodan', icon: Radio, desc: 'Açık Portlar & Servis Keşfi' },
    { id: 'censys', label: 'Censys', icon: Shield, desc: 'Sertifika & Host Analizi' },
    { id: 'jsminer', label: 'JS Miner', icon: Code2, desc: 'JavaScript Gizli API & Secret Avcısı', isLive: true },
    { id: 'dnsmap', label: 'Ağ Haritası', icon: Network, desc: 'DNS & Reverse IP Komşu Siteler Haritası', isLive: true },
    { id: 'crtsh', label: 'CRT.sh', icon: Search, desc: 'Canlı Alt Alan Adı Keşfi', isLive: true },
    { id: 'wayback', label: 'Wayback', icon: History, desc: 'Geçmiş URL & Uç Noktalar', isLive: true },
  ];

  const handleEngineClick = (engId) => {
    if (onEngineChange) {
      onEngineChange(engId);
    }
    const currentTarget = (target && target.trim()) || (activeWorkspace && activeWorkspace.domain ? activeWorkspace.domain.trim() : '');
    if (currentTarget && onGenerate) {
      onGenerate(currentTarget, engId);
    }
  };

  return (
    <section className={`w-full flex flex-col items-center px-6 transition-all duration-300 ${hasDorks ? 'pt-14 pb-4' : 'py-2'}`}>
      <h1
        className="hero-title silver-glow cursor-pointer"
        onClick={onLogoClick}
        title="Giriş ekranına dön"
      >
        Dorkful.
      </h1>
      <p className="hero-subtitle">galileoff Dork Tool</p>

      {/* Çalışma Alanı (Target Workspace) Rozeti */}
      <div className="flex items-center justify-center my-3">
        <button
          onClick={onOpenWorkspaceModal}
          className="px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 hover:border-white/20 text-xs text-neutral-300 hover:text-white transition-all flex items-center gap-2 group cursor-pointer shadow-lg shadow-black/40"
          title="Hedef Çalışma Alanlarını Yönet"
        >
          <TargetIcon size={13} className="text-white/50 group-hover:text-white transition-colors" />
          {activeWorkspace ? (
            <>
              <span className="text-neutral-500 font-medium">Hedef:</span>
              <span className="font-semibold text-white tracking-wide">
                {activeWorkspace.name}
              </span>
              <span className="text-[10px] text-white/40 font-mono">
                ({activeWorkspace.domain || 'Domain yok'})
              </span>
            </>
          ) : (
            <span className="text-white/50 group-hover:text-white/80 transition-colors">
              Hedef Çalışma Alanı Seç / Oluştur
            </span>
          )}
          <span className="text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-white/60 group-hover:text-white ml-0.5 border border-white/10">
            Değiştir
          </span>
        </button>
      </div>

      <div className="hero-controls">
        {/* Çoklu Motor Seçici Sekmeler (Engine Switcher) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2 w-full">
          {ENGINES.map((eng) => {
            const Icon = eng.icon;
            const isSelected = selectedEngine === eng.id;
            return (
              <button
                key={eng.id}
                onClick={() => handleEngineClick(eng.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${isSelected
                  ? 'bg-white text-black font-semibold shadow-lg shadow-white/10 scale-102 border border-white'
                  : 'bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.08] border border-white/5 hover:border-white/15'
                  }`}
                title={eng.desc}
              >
                <Icon size={12} className={isSelected ? 'text-black' : 'text-white/60'} />
                <span>{eng.label}</span>
                {eng.isLive && (
                  <span className={`text-[8px] px-1 py-0.5 rounded uppercase font-mono tracking-wider ${isSelected
                    ? 'bg-black/15 text-black font-bold'
                    : 'bg-white/10 text-white/70 border border-white/10'
                    }`}>
                    Canlı
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Arama Giriş Alanı */}
        <div className="flex items-center gap-3 w-full">
          <input
            type="text"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            onBlur={onTargetBlur}
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
            placeholder={
              selectedEngine === 'crtsh' ? "Alt alan adı taranacak hedef (örn: target.com)" :
                selectedEngine === 'wayback' ? "Geçmiş arşiv taranacak hedef (örn: target.com)" :
                  selectedEngine === 'github' ? "GitHub sızıntısı için aranacak hedef / repo" :
                    selectedEngine === 'shodan' ? "Shodan için hedef domain veya IP" :
                      selectedEngine === 'censys' ? "Censys için hedef domain" :
                        selectedEngine === 'jsminer' ? "JS analizi yapılacak hedef (örn: target.com)" :
                          selectedEngine === 'dnsmap' ? "DNS & Komşu Siteler için hedef (örn: target.com)" :
                            "Hedef alan adı (örn: target.com)"
            }
            className="search-input search-input-hero"
            autoFocus
          />
          <button onClick={() => onGenerate()} className="btn-generate btn-generate-hero">
            <Search size={14} />
            <span>
              {selectedEngine === 'crtsh' || selectedEngine === 'wayback' || selectedEngine === 'jsminer' || selectedEngine === 'dnsmap' ? 'Keşfet' : 'Keşfet'}
            </span>
          </button>
        </div>

        {/* Kategori Filtre Hapları (Temiz, sarıp sarmalayan, kaydırma çubuğu olmayan yapı) */}
        <div className="filter-bar-hero">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat)}
              className={`filter-btn filter-btn-hero ${selectedFilter === cat ? 'filter-btn-active' : 'filter-btn-inactive'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hızlı Aksiyon & Yönetim Çubuğu (Kategorilerden bağımsız, tam hizalı ve dengeli) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2 pt-1 w-full max-w-2xl">
          {/* DNS & Reverse IP Ağ Haritası Butonu */}
          {onOpenDNSMap && (
            <button
              onClick={onOpenDNSMap}
              className="px-3.5 py-1.5 rounded-full border border-cyan-500/25 text-xs text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/50 bg-cyan-500/[0.04] hover:bg-cyan-500/[0.1] transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm shadow-sm"
              title="DNS Kayıtları ve Aynı Sunucudaki Komşu Siteler Haritası"
            >
              <Network size={12} className="text-cyan-400" />
              <span>Ağ Haritası</span>
            </button>
          )}

          {/* JS Secret Miner Butonu */}
          {onOpenJSAnalysis && (
            <button
              onClick={onOpenJSAnalysis}
              className="px-3.5 py-1.5 rounded-full border border-amber-500/25 text-xs text-amber-300 hover:text-amber-200 hover:border-amber-500/50 bg-amber-500/[0.04] hover:bg-amber-500/[0.1] transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
              title="JavaScript Dosyalarından Gizli API ve Secret Tara"
            >
              <Code2 size={12} className="text-amber-400" />
              <span>JS Miner</span>
            </button>
          )}

          {/* CTI & Pentest Yönetici Raporu Butonu */}
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-3.5 py-1.5 rounded-full border border-white/20 text-xs text-white/80 hover:text-white hover:border-white/40 bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm shadow-sm"
              title="CTI & Pentest Yönetici Raporu Oluştur (PDF / HTML)"
            >
              <FileText size={12} className="text-white/70" />
              <span>Rapor Al</span>
            </button>
          )}

          {/* Özel Dork Ekleme Butonu */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-full border border-dashed border-white/20 text-xs text-white/70 hover:text-white hover:border-white/50 bg-white/[0.02] hover:bg-white/[0.06] transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
            title="Yeni özel dork şablonu ekle"
          >
            <Plus size={13} className="text-white/60" />
            <span>Özel Dork</span>
          </button>

          {/* Dork & Kategori Yönetimi Butonu */}
          <button
            onClick={onOpenManageModal}
            className="px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-white/60 hover:text-white hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.06] transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
            title="Dorkları ve kategorileri düzenle veya sil"
          >
            <SlidersHorizontal size={12} className="text-white/50" />
            <span>Yönet</span>
          </button>

          {/* Bulgu Defteri & Kanıt Kasası Butonu */}
          <button
            onClick={onOpenFindingsModal}
            className={`px-3.5 py-1.5 rounded-full border text-xs transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm ${findingsCount > 0
              ? 'border-red-500/35 text-white/90 bg-red-500/15 hover:bg-red-500/25 hover:border-red-500/60'
              : 'border-white/10 text-white/60 hover:text-white hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.06]'
              }`}
            title="Bulgu Defteri ve Kanıt Kasasını Görüntüle"
          >
            <Flag size={12} className={findingsCount > 0 ? "text-red-400 fill-red-400/40" : "text-white/50"} />
            <span>Bulgular</span>
            {findingsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-500/40 text-red-200 border border-red-500/50">
                {findingsCount}
              </span>
            )}
          </button>

          {/* Ayarlar & API Kasası Butonu */}
          <button
            onClick={onOpenSettingsModal}
            className="px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-white/60 hover:text-white hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.06] transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
            title="Ayarlar ve API Anahtarları Kasası"
          >
            <Settings size={12} className="text-white/50" />
            <span>Ayarlar</span>
          </button>
        </div>
      </div>
    </section>
  );
}
