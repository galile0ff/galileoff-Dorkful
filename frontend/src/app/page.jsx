"use client";

import { useState, useMemo, useRef, useCallback } from 'react';
import { GenerateDorks, ExportJSON } from '../../wailsjs/go/main/App';
import { BrowserOpenURL, ClipboardSetText } from '../../wailsjs/runtime/runtime';
import { Search, Copy, Download, Zap, MousePointer2 } from 'lucide-react';
import './globals.css';

export default function Home() {
  const [target, setTarget] = useState("");
  const [dorks, setDorks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [navVisible, setNavVisible] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const scrollRef = useRef(null);

  const categories = [
    "All", "Files", "Admin", "Data", "Dir", "APIs", "IoT"
  ];

  // 1px bile kaydırılınca navbar gelir, sadece tepede (0) hero geri döner
  const onScroll = useCallback((e) => {
    const top = e.target.scrollTop;
    setNavVisible(top > 300);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = async () => {
    if (!target.trim()) {
      showToast("Hedef domain girilmedi.");
      return;
    }
    try {
      const res = await GenerateDorks(target);
      setDorks(res || []);
      setFilter("All");
      showToast(`${res.length} Sorgu Tespit Edildi.`);
    } catch (e) {
      showToast(`Hata: ${e}`);
    }
  };

  const handleExport = async () => {
    if (dorks.length === 0) return;
    try {
      const path = await ExportJSON(dorks);
      showToast(`Kaydedildi: ${path}`);
    } catch (e) {
      showToast(`Hata: ${e}`);
    }
  };

  const executeSearch = (query) => {
    BrowserOpenURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  };

  const copyToClipboard = (text) => {
    ClipboardSetText(text);
    showToast("Kopyalandı.");
  };

  const filteredDorks = useMemo(() => {
    if (filter === "All") return dorks;
    return dorks.filter(d => {
      if (filter === "Dir") return d.category.includes("Dir");
      if (filter === "Admin") return d.category.includes("Admin");
      if (filter === "Data") return d.category.includes("Sensitive");
      return d.category === filter;
    });
  }, [dorks, filter]);

  // Filtre butonunu oluşturucu (tekrar eden kodu kısaltır)
  const renderFilters = (sizeClass) => (
    categories.map(cat => (
      <button
        key={cat}
        onClick={() => setFilter(cat)}
        className={`filter-btn ${sizeClass} ${filter === cat ? 'filter-btn-active' : 'filter-btn-inactive'
          }`}
      >
        {cat}
      </button>
    ))
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">

      {/* Açılış Ekranı */}
      <div
        className={`splash-screen ${splashDone ? 'dismissed' : ''}`}
        onClick={() => setSplashDone(true)}
      >
        <div className="splash-center">
          {/* İnce genişleyen halkalar */}
          <div className="splash-ring" />
          <div className="splash-ring splash-ring-2" />

          {/* Morfoz eden sıvı arka plan */}
          <div className="splash-blob" />

          {/* Ana başlık: blur'dan netliğe — infinite döngü */}
          <h1
            className="splash-logo"
            style={{ animation: 'splashTitleReveal 4s ease-in-out infinite' }}
          >
            Dorkful.
          </h1>
        </div>

        {/* Ortadan büyüyen ince çizgi — infinite döngü */}
        <div
          className="splash-line"
          style={{ animation: 'splashLineGrow 4s ease-in-out infinite 0.5s' }}
        />

        <p className="splash-subtitle">Advanced Dork Intelligence</p>
        <p className="splash-hint">click anywhere</p>
      </div>

      {/* Arka plan blobları */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Sticky Navbar — hero ekrandan çıkınca transform ile kayarak gelir */}
      <nav className={`navbar ${navVisible ? 'visible' : ''}`}>
        <div className="navbar-inner">
          <h2
            className="navbar-brand silver-glow cursor-pointer"
            onClick={() => setSplashDone(false)}
            title="Giriş ekranına dön"
          >
            Dorkful.
          </h2>

          <div className="navbar-controls">
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Target..."
              className="search-input-nav"
            />
            <button onClick={handleGenerate} className="btn-generate btn-generate-nav">
              <Search size={12} />
            </button>

            <div className="filter-bar">
              {renderFilters('filter-btn-nav')}
            </div>

            {dorks.length > 0 && (
              <button onClick={handleExport} className="btn-icon" title="Dışa Aktar">
                <Download size={14} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Ana kaydırma alanı */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full w-full overflow-y-auto custom-scrollbar relative z-10"
      >
        {/* Hero Bölümü — navbar varken opacity 0 olur, pointer-events kaybolur */}
        <section className={`hero-section ${navVisible ? 'hidden-by-nav' : ''}`}>
          <h1
            className="hero-title silver-glow cursor-pointer"
            onClick={() => setSplashDone(false)}
            title="Giriş ekranına dön"
          >
            Dorkful.
          </h1>
          <p className="hero-subtitle">Monochrome Intelligence</p>

          <div className="hero-controls">
            <div className="flex items-center gap-3 w-full">
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Target domain..."
                className="search-input search-input-hero"
                autoFocus
              />
              <button onClick={handleGenerate} className="btn-generate btn-generate-hero">
                <Search size={14} />
                <span>Generate</span>
              </button>
            </div>

            <div className="filter-bar filter-bar-hero">
              {renderFilters('filter-btn-hero')}
            </div>
          </div>
        </section>

        {/* Sonuç Listesi */}
        <div className="max-w-3xl mx-auto px-6 pb-32 flex flex-col gap-5 items-center">
          {dorks.length === 0 ? (
            <div className="empty-state">
              <MousePointer2 size={56} strokeWidth={1} className="mb-4 animate-bounce" />
              <p className="empty-state-text">Operasyon Bekliyor</p>
            </div>
          ) : filteredDorks.length === 0 ? (
            <p className="text-xs text-white/30 font-mono italic mt-16">
              Bu filtrede eşleşme yok.
            </p>
          ) : (
            filteredDorks.map((dork, i) => (
              <div
                key={i}
                className="dork-card"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <span className="dork-category">{dork.category}</span>
                    <p className="dork-description">{dork.description}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(dork.query)}
                    className="p-2 text-white/20 hover:text-white transition-colors shrink-0"
                    title="Kopyala"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="dork-query-box">
                  <code className="dork-query-code">{dork.query}</code>
                </div>

                <div className="dork-actions">
                  <button
                    onClick={() => executeSearch(dork.query)}
                    className="dork-action-btn"
                  >
                    <Search size={12} /> Tarayıcıda Aç
                  </button>
                  <Zap size={10} className="text-white/10 group-hover:text-white/30 transition-all" />
                </div>
              </div>
            ))
          )}

          {dorks.length > 0 && (
            <button onClick={handleExport} className="btn-export">
              <Download size={14} /> Dışa Aktar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
