"use client";

import { useState, useEffect } from 'react';
import {
  X,
  Key,
  Shield,
  Radio,
  GitBranch,
  Globe,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  Database,
  Trash2,
  Layers,
  Target,
  Flag,
  Loader2
} from 'lucide-react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestAPIKey,
  onResetToDefaults,
  onClearFindings,
  onOpenManageModal,
  onOpenWorkspaceModal,
  onOpenFindingsModal,
  templatesCount = 0,
  workspacesCount = 0,
  findingsCount = 0,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState("keys"); // "keys" | "network" | "data"

  // Form State
  const [form, setForm] = useState({
    shodanKey: "",
    githubToken: "",
    censysId: "",
    censysSecret: "",
    autoProbeTarget: true,
    probeTimeoutSec: 6,
    customUserAgent: "",
    defaultSearchEngine: "google"
  });

  // Şifreli alanların görünürlük durumları
  const [showShodan, setShowShodan] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [showCensysSecret, setShowCensysSecret] = useState(false);
  const [showCensysPat, setShowCensysPat] = useState(false);
  const [useLegacyCensys, setUseLegacyCensys] = useState(false);

  // Test durumları ve sonuçları
  const [testingEngine, setTestingEngine] = useState(null); // "shodan" | "github" | "censys"
  const [testResults, setTestResults] = useState({});

  // Ayarlar modal açıldığında mevcut ayarları forma yükle
  useEffect(() => {
    if (settings) {
      setForm({
        shodanKey: settings.shodanKey || "",
        githubToken: settings.githubToken || "",
        censysId: settings.censysId || "",
        censysSecret: settings.censysSecret || "",
        autoProbeTarget: settings.autoProbeTarget !== false,
        probeTimeoutSec: settings.probeTimeoutSec || 6,
        customUserAgent: settings.customUserAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-Security-Tool/1.0",
        defaultSearchEngine: settings.defaultSearchEngine || "google"
      });
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  // Dış bağlantıyı varsayılan tarayıcıda aç
  const handleOpenLink = (url) => {
    if (BrowserOpenURL) {
      BrowserOpenURL(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // API Anahtarı Testi
  const handleTestKey = async (engine) => {
    setTestingEngine(engine);
    setTestResults(prev => ({ ...prev, [engine]: null }));

    try {
      let key1 = "";
      let key2 = "";

      if (engine === "shodan") {
        key1 = form.shodanKey;
      } else if (engine === "github") {
        key1 = form.githubToken;
      } else if (engine === "censys") {
        key1 = form.censysId;
        key2 = form.censysSecret;
      }

      const res = await onTestAPIKey(engine, key1, key2);
      setTestResults(prev => ({ ...prev, [engine]: res }));
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [engine]: {
          success: false,
          message: `Test hatası: ${e}`,
          details: ""
        }
      }));
    } finally {
      setTestingEngine(null);
    }
  };

  // Ayarları Kaydet
  const handleSave = async () => {
    try {
      await onSaveSettings(form);
      if (onShowToast) onShowToast("Ayarlar başarıyla kaydedildi.");
      onClose();
    } catch (e) {
      if (onShowToast) onShowToast(`Hata: ${e}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div
        className="relative w-full max-w-3xl h-[85vh] bg-[#0b0b0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-2xl text-white shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık & Sekmeler */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/80 shadow-inner">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Ayarlar & API Kasası
              </h3>
              <p className="text-xs text-white/50">
                İstihbarat motoru API anahtarlarını, tarama ve uygulama tercihlerini yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sekme Değiştirici */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab("keys")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "keys"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Key size={13} />
                <span>API Kasası</span>
              </button>
              <button
                onClick={() => setActiveTab("network")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "network"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Globe size={13} />
                <span>Ağ & Tarama</span>
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "data"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Database size={13} />
                <span>Veri & Bakım</span>
              </button>
            </div>

            {/* Kapat */}
            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Gövde - Sekmelere Göre İçerik */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* 1. SEKME: API KASASI */}
          {activeTab === "keys" && (
            <div className="space-y-6">
              {/* Bilgi Kutusu */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <Shield size={18} className="text-white/70 shrink-0 mt-0.5" />
                <div className="text-xs text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">Yerel Güvenlik Koruması:</span> Girdiğiniz tüm API anahtarları yalnızca bu bilgisayarda yerel dosyanızda (<span className="font-mono text-white/90">settings.json</span>) saklanır; asla üçüncü parti sunuculara veya harici servislere iletilmez.
                </div>
              </div>

              {/* Shodan API Kartı */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                      <Radio size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Shodan API</h4>
                        {form.shodanKey.trim() ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15 font-mono">
                            Resmi API Modu
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            Keysiz InternetDB Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Açık portlar, zafiyetler (CVE) ve host servis istihbaratı.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenLink("https://account.shodan.io")}
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors cursor-pointer group"
                  >
                    <span>Ücretsiz Key Al</span>
                    <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showShodan ? "text" : "password"}
                    value={form.shodanKey}
                    onChange={(e) => setForm({ ...form, shodanKey: e.target.value })}
                    placeholder="Shodan API Anahtarınız (Boş bırakılırsa keysiz InternetDB kullanılır)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-24 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowShodan(!showShodan)}
                      className="p-1.5 text-white/40 hover:text-white transition-colors"
                      title={showShodan ? "Gizle" : "Göster"}
                    >
                      {showShodan ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      disabled={testingEngine === "shodan" || !form.shodanKey.trim()}
                      onClick={() => handleTestKey("shodan")}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {testingEngine === "shodan" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Test Et"
                      )}
                    </button>
                  </div>
                </div>

                {/* Test Sonucu */}
                {testResults.shodan && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResults.shodan.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {testResults.shodan.success ? (
                      <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                    )}
                    <div>
                      <div className="font-semibold">{testResults.shodan.message}</div>
                      {testResults.shodan.details && (
                        <div className="text-[11px] opacity-80 font-mono mt-0.5">
                          {testResults.shodan.details}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* GitHub Token Kartı */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                      <GitBranch size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">GitHub Personal Access Token</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 font-mono">
                          Kod Arama / Secrets
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Hedef organizasyon ve repolarda sızan .env, API key ve token araması için.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenLink("https://github.com/settings/tokens")}
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors cursor-pointer group"
                  >
                    <span>Ücretsiz Token Al</span>
                    <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showGithub ? "text" : "password"}
                    value={form.githubToken}
                    onChange={(e) => setForm({ ...form, githubToken: e.target.value })}
                    placeholder="ghp_... veya github_pat_... (Read-only token yeterlidir)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-24 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowGithub(!showGithub)}
                      className="p-1.5 text-white/40 hover:text-white transition-colors"
                      title={showGithub ? "Gizle" : "Göster"}
                    >
                      {showGithub ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      disabled={testingEngine === "github" || !form.githubToken.trim()}
                      onClick={() => handleTestKey("github")}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {testingEngine === "github" ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Test Et"
                      )}
                    </button>
                  </div>
                </div>

                {/* Test Sonucu */}
                {testResults.github && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResults.github.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {testResults.github.success ? (
                      <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                    )}
                    <div>
                      <div className="font-semibold">{testResults.github.message}</div>
                      {testResults.github.details && (
                        <div className="text-[11px] opacity-80 font-mono mt-0.5">
                          {testResults.github.details}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Censys API v2 Kartı */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Censys Search API (v2)</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 font-mono">
                          Hosts & SSL Certs
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        Global internet taraması, sertifika şeffaflığı ve açık servis analizi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseLegacyCensys(!useLegacyCensys)}
                      className="text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      {useLegacyCensys ? "Tekli Token (PAT) Modu" : "Eski İkili Mod (ID + Secret)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLink("https://platform.censys.io/")}
                      className="text-xs text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1 transition-colors cursor-pointer group"
                    >
                      <span>Censys Platform</span>
                      <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Censys Bilgi Notu */}
                <div className="p-3 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20 text-xs text-white/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                    <AlertCircle size={13} />
                    <span>Censys API Desteği (PAT & Legacy)</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Censys&apos;in oluşturduğu tek satırlık <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded font-mono">censys_...</code> Personal Access Token (PAT) anahtarını doğrudan aşağıdaki kutucuğa yapıştırabilirsiniz. Sistem bu anahtarla canlı servis ve host keşfini otomatik gerçekleştirecektir.
                  </p>
                </div>

                {!useLegacyCensys ? (
                  /* Tek Satırlık Modern PAT Modu */
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] text-white/50">
                        Censys API Token (Personal Access Token)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCensysPat(!showCensysPat)}
                        className="text-[11px] text-white/40 hover:text-white"
                      >
                        {showCensysPat ? "Gizle" : "Göster"}
                      </button>
                    </div>
                    <input
                      type={showCensysPat ? "text" : "password"}
                      value={form.censysId}
                      onChange={(e) => setForm({ ...form, censysId: e.target.value })}
                      placeholder="censys_... (Platform Token'ınızı buraya yapıştırın)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-cyan-500/40 transition-all"
                    />
                  </div>
                ) : (
                  /* Eski İkili Mod (API ID & Secret) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/50 block mb-1.5">API ID</label>
                      <input
                        type="text"
                        value={form.censysId}
                        onChange={(e) => setForm({ ...form, censysId: e.target.value })}
                        placeholder="Censys API ID..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] text-white/50">API Secret</label>
                        <button
                          type="button"
                          onClick={() => setShowCensysSecret(!showCensysSecret)}
                          className="text-[11px] text-white/40 hover:text-white"
                        >
                          {showCensysSecret ? "Gizle" : "Göster"}
                        </button>
                      </div>
                      <input
                        type={showCensysSecret ? "text" : "password"}
                        value={form.censysSecret}
                        onChange={(e) => setForm({ ...form, censysSecret: e.target.value })}
                        placeholder="Censys API Secret..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    disabled={testingEngine === "censys" || (!form.censysId.trim() && !form.censysSecret.trim())}
                    onClick={() => handleTestKey("censys")}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {testingEngine === "censys" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      "Censys API'yi Test Et"
                    )}
                  </button>
                </div>

                {/* Test Sonucu */}
                {testResults.censys && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResults.censys.success
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}
                  >
                    {testResults.censys.success ? (
                      <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-400" />
                    )}
                    <div>
                      <div className="font-semibold">{testResults.censys.message}</div>
                      {testResults.censys.details && (
                        <div className="text-[11px] opacity-80 font-mono mt-0.5">
                          {testResults.censys.details}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. SEKME: AĞ VE TARAMA AYARLARI */}
          {activeTab === "network" && (
            <div className="space-y-6">
              {/* Otomatik Canlılık Denetimi */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Otomatik Canlılık Denetimi</h4>
                  <p className="text-xs text-white/50 mt-1 max-w-lg">
                    Yeni bir hedef girildiğinde veya Keşfet butonuna basıldığında arka planda hedefin HTTP/HTTPS canlılık durumunu, yanıt süresini ve sunucu başlığını otomatik sorgula.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoProbeTarget}
                    onChange={(e) => setForm({ ...form, autoProbeTarget: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/80"></div>
                </label>
              </div>

              {/* İstek Zaman Aşımı (Timeout) */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">HTTP Zaman Aşımı (Timeout)</h4>
                  <span className="text-xs font-mono text-white/80 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {form.probeTimeoutSec} saniye
                  </span>
                </div>
                <p className="text-xs text-white/50">
                  Canlılık kontrollerinde ve API isteklerinde bir sunucunun yanıt vermesini beklenecek azami süre.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  {[3, 6, 10, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setForm({ ...form, probeTimeoutSec: sec })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                        form.probeTimeoutSec === sec
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "bg-white/5 text-white/60 hover:text-white border border-white/5"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Varsayılan Arama Motoru */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <h4 className="text-sm font-semibold text-white">Başlangıç Varsayılan Arama Motoru</h4>
                <p className="text-xs text-white/50">
                  Uygulama açıldığında ilk seçili gelen istihbarat arama motoru.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'google', label: 'Google Dorkları' },
                    { id: 'github', label: 'GitHub Sızıntıları' },
                    { id: 'shodan', label: 'Shodan Servis Keşfi' },
                    { id: 'censys', label: 'Censys Host/Sertifika' },
                    { id: 'crtsh', label: 'CRT.sh Canlı Subdomain' },
                    { id: 'wayback', label: 'Wayback Tarihi URL' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm({ ...form, defaultSearchEngine: m.id })}
                      className={`p-2.5 rounded-xl text-xs text-left transition-all border cursor-pointer ${
                        form.defaultSearchEngine === m.id
                          ? "bg-white text-black font-semibold border-white shadow-sm"
                          : "bg-white/5 text-white/60 hover:text-white border-white/5"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Özel User-Agent */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <h4 className="text-sm font-semibold text-white">Özel HTTP User-Agent</h4>
                <p className="text-xs text-white/50">
                  Canlılık testlerinde sunuculara iletilecek kimlik başlığı.
                </p>
                <input
                  type="text"
                  value={form.customUserAgent}
                  onChange={(e) => setForm({ ...form, customUserAgent: e.target.value })}
                  placeholder="Mozilla/5.0..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* 3. SEKME: VERİ VE BAKIM */}
          {activeTab === "data" && (
            <div className="space-y-6">
              {/* İstatistik Rozetleri */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-white/5 text-white">
                    <Layers size={18} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white font-mono">{templatesCount}</div>
                    <div className="text-[11px] text-white/40">Dork Şablonu</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-white/5 text-white">
                    <Target size={18} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white font-mono">{workspacesCount}</div>
                    <div className="text-[11px] text-white/40">Hedef Çalışma Alanı</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-white/5 text-white">
                    <Flag size={18} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white font-mono">{findingsCount}</div>
                    <div className="text-[11px] text-white/40">Kayıtlı Bulgu</div>
                  </div>
                </div>
              </div>

              {/* Hızlı Yönlendirmeler */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <h4 className="text-sm font-semibold text-white">Hızlı Modüller</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenManageModal) onOpenManageModal();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs text-white/80 hover:text-white transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Dorkları Yönet</span>
                    <Layers size={14} className="text-white/40" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenWorkspaceModal) onOpenWorkspaceModal();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs text-white/80 hover:text-white transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Çalışma Alanları</span>
                    <Target size={14} className="text-white/40" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenFindingsModal) onOpenFindingsModal();
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs text-white/80 hover:text-white transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Bulgu Defteri</span>
                    <Flag size={14} className="text-white/40" />
                  </button>
                </div>
              </div>

              {/* Sıfırlama ve Temizleme İşlemleri */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <h4 className="text-sm font-semibold text-white">Sıfırlama ve Bakım</h4>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <div className="text-xs font-medium text-white">Dork Şablonlarını Fabrika Ayarlarına Döndür</div>
                    <div className="text-[11px] text-white/40">Eklenen özel dorkları sıfırlar ve 60+ CTI şablonunu varsayılana getirir.</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Tüm dork şablonları fabrika ayarlarına sıfırlanacak. Onaylıyor musunuz?")) {
                        await onResetToDefaults();
                        if (onShowToast) onShowToast("Dork şablonları fabrika ayarlarına sıfırlandı.");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-xs text-white/80 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RotateCcw size={13} />
                    <span>Şablonları Sıfırla</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-red-500/[0.03] border border-red-500/15">
                  <div>
                    <div className="text-xs font-medium text-red-300">Tüm Güvenlik Bulgularını Temizle</div>
                    <div className="text-[11px] text-red-200/50">Bulgu defterindeki tüm işaretlenmiş dork kayıtlarını ve kanıtları siler.</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Kayıtlı tüm bulgular kalıcı olarak silinecek. Emin misiniz?")) {
                        await onClearFindings();
                        if (onShowToast) onShowToast("Tüm bulgular temizlendi.");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-300 hover:text-red-200 border border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                    <span>Bulguları Temizle</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <button
            type="button"
            onClick={() => {
              setForm({
                shodanKey: "",
                githubToken: "",
                censysId: "",
                censysSecret: "",
                autoProbeTarget: true,
                probeTimeoutSec: 6,
                customUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-Security-Tool/1.0",
                defaultSearchEngine: "google"
              });
              if (onShowToast) onShowToast("Form varsayılan değerlere sıfırlandı.");
            }}
            className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Varsayılanlara Dön</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-black bg-white hover:bg-neutral-200 transition-all shadow-lg shadow-white/10 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>Kaydet ve Kapat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
