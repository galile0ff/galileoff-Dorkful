"use client";

import { useState } from 'react';
import { X, Plus, Sparkles, Tag, FileText, Code2 } from 'lucide-react';

export default function AddDorkModal({ isOpen, onClose, onAddDork, categories }) {
  const [template, setTemplate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Admin");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleInsertTarget = () => {
    setTemplate((prev) => prev + "{target}");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!template.trim()) {
      setError("Lütfen bir dork şablonu girin.");
      return;
    }
    if (!description.trim()) {
      setError("Lütfen bir açıklama girin.");
      return;
    }

    const finalCategory = isCustomCategory
      ? (customCategory.trim() || "Custom")
      : category;

    try {
      await onAddDork({
        template: template.trim(),
        description: description.trim(),
        category: finalCategory,
      });

      // Formu sıfırla
      setTemplate("");
      setDescription("");
      setCustomCategory("");
      setIsCustomCategory(false);
      onClose();
    } catch (err) {
      setError(`Hata: ${err}`);
    }
  };

  const availableCategories = categories.filter((c) => c !== "All");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-2xl p-6 shadow-2xl text-white shadow-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Kapat"
        >
          <X size={18} />
        </button>

        {/* Modal Başlığı */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              Özel Dork Şablonu Ekle
            </h3>
            <p className="text-xs text-white/50">
              Çalışma zamanında yeni Google Dork arama şablonu tanımlayın.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Dork Şablonu */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                <Code2 size={14} className="text-white/40" />
                Dork Sorgu Şablonu
              </label>
              <button
                type="button"
                onClick={handleInsertTarget}
                className="text-[11px] font-mono text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition-colors"
                title="Sorgu içine {target} etiketini ekler"
              >
                + &#123;target&#125; Ekle
              </button>
            </div>
            <input
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Örn: site:{target} inurl:admin.php | inurl:login"
              className="w-full px-3.5 py-2.5 bg-neutral-900/90 border border-white/15 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/40 font-mono transition-colors"
              autoFocus
            />
            <span className="text-[11px] text-white/40">
              İpucu: Hedef alan adının geleceği yere <code>&#123;target&#125;</code> yazın.
            </span>
          </div>

          {/* Açıklama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
              <FileText size={14} className="text-white/40" />
              Açıklama
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: PHP tabanlı admin giriş panelleri"
              className="w-full px-3.5 py-2.5 bg-neutral-900/90 border border-white/15 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          {/* Kategori Seçimi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
              <Tag size={14} className="text-white/40" />
              Kategori
            </label>
            {!isCustomCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__NEW__") {
                      setIsCustomCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-neutral-900/90 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-white/40 transition-colors"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-neutral-900 text-white">
                      {cat}
                    </option>
                  ))}
                  <option value="__NEW__" className="bg-neutral-900 text-white/70">
                    + Yeni Kategori Tanımla...
                  </option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Yeni kategori adı (örn: Cloud, WordPress)..."
                  className="flex-1 px-3.5 py-2.5 bg-neutral-900/90 border border-white/15 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-3 py-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                >
                  Listeden Seç
                </button>
              </div>
            )}
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              Dork Şablonunu Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
