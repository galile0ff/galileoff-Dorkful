"use client";

import { useState, useMemo } from 'react';
import {
  X,
  GitBranch,
  Search,
  ExternalLink,
  ShieldAlert,
  FileCode,
  FolderGit2,
  Copy,
  Check,
  Flag,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export default function GitHubLeaksModal({
  isOpen,
  onClose,
  target = '',
  leaks = [],
  isLoading = false,
  onRefresh,
  onFlagAsFinding
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(null);

  const safeLeaks = Array.isArray(leaks) ? leaks : [];

  // Arama filtresi
  const filteredLeaks = useMemo(() => {
    if (!searchTerm.trim()) return safeLeaks;
    const term = searchTerm.toLowerCase();
    return safeLeaks.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(term)) ||
        (l.path && l.path.toLowerCase().includes(term)) ||
        (l.repoName && l.repoName.toLowerCase().includes(term)) ||
        (l.description && l.description.toLowerCase().includes(term)) ||
        (l.query && l.query.toLowerCase().includes(term))
    );
  }, [safeLeaks, searchTerm]);

  if (!isOpen) return null;

  const handleOpenURL = (url) => {
    if (BrowserOpenURL) {
      BrowserOpenURL(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div
        className="relative w-full max-w-4xl h-[85vh] bg-[#0b0b0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-2xl text-white shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık Alanı */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/80 shadow-inner">
              <GitBranch size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Canlı GitHub Sızıntı Keşfi
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 font-mono">
                  {safeLeaks.length} Canlı Bulgu
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Hedef <span className="font-mono text-white/80 font-semibold">{target}</span> için GitHub API üzerinden taranan açık kod ve secret dosyaları.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
                title="Canlı Taramayı Yenile"
              >
                <RefreshCw size={15} className={isLoading ? "animate-spin text-white" : ""} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Arama ve Filtre Çubuğu */}
        <div className="px-6 py-3 border-b border-white/5 bg-black/40 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Dosya adı, repo, yol veya sızıntı türüne göre ara..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="text-xs text-white/40 font-mono shrink-0">
            {filteredLeaks.length} / {safeLeaks.length} Gösteriliyor
          </div>
        </div>

        {/* Gövde - Sızıntı Listesi */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-white/40">
              <RefreshCw size={28} className="animate-spin text-white/80" />
              <p className="text-xs font-mono tracking-wide">GitHub API üzerinden kod ve secret sızıntıları taranıyor...</p>
            </div>
          ) : filteredLeaks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center px-4">
              <ShieldCheck size={36} className="text-emerald-400/80 mb-1" />
              <h4 className="text-sm font-semibold text-white">Doğrudan Sızıntı Eşleşmesi Bulunamadı</h4>
              <p className="text-xs text-white/40 max-w-md">
                Otomatik kritik sorgularda açıkta bırakılmış dosya tespit edilemedi. Aşağıdaki dork listesiyle GitHub web arayüzünde manuel derin taramalar yapabilirsiniz.
              </p>
            </div>
          ) : (
            filteredLeaks.map((leak, idx) => {
              const isEnv = leak.name?.includes('.env');
              const isKey = leak.name?.includes('key') || leak.name?.includes('rsa') || leak.name?.includes('token');

              return (
                <div
                  key={`${leak.htmlUrl}-${idx}`}
                  className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all group space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isEnv ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        isKey ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-white/5 text-white/70 border border-white/10'
                      }`}>
                        <FileCode size={16} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors font-mono">
                            {leak.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 font-mono">
                            {leak.description || 'Hassas Dosya'}
                          </span>
                        </div>

                        <div className="text-[11px] text-white/40 font-mono truncate mt-0.5">
                          {leak.path}
                        </div>
                      </div>
                    </div>

                    {/* Aksiyon Butonları */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(leak.htmlUrl)}
                        className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Bağlantıyı Kopyala"
                      >
                        {copiedUrl === leak.htmlUrl ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>

                      {onFlagAsFinding && (
                        <button
                          onClick={() => onFlagAsFinding(leak)}
                          className="px-2.5 py-1 text-[11px] text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Kanıt Olarak Kaydet"
                        >
                          <Flag size={11} className="fill-red-400/40 text-red-400" />
                          <span>Kaydet</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenURL(leak.htmlUrl)}
                        className="px-2.5 py-1 text-[11px] text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="GitHub'da Aç"
                      >
                        <span>Kodu Gör</span>
                        <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Alt Bilgi: Repo ve Arama Sorgusu */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/30 font-mono">
                    <div className="flex items-center gap-1.5 truncate max-w-md">
                      <FolderGit2 size={11} className="shrink-0" />
                      <button
                        onClick={() => handleOpenURL(leak.repoUrl)}
                        className="hover:text-white hover:underline transition-colors truncate"
                      >
                        {leak.repoName}
                      </button>
                    </div>

                    <div className="text-[10px] text-white/25 truncate">
                      Sorgu: {leak.query}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Alt Bilgi Çubuğu */}
        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02] text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Terminal size={13} className="text-white/30" />
            <span>GitHub Code Search v3 API</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
