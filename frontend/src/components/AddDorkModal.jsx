"use client";

import { useState } from 'react';
import { Plus, Tag, Sparkles } from 'lucide-react';
import ModalShell from './ModalShell';

/**
 * Bağımsız Özel Dork Ekleme Penceresi (ModalShell ile güncellendi)
 * Dork Studio ile entegre çalışır.
 */
export default function AddDorkModal({ isOpen, onClose, onAddDork, categories = [] }) {
  const [template, setTemplate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Admin");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Özel Dork Şablonu Ekle"
      subtitle="Kendi dork sorgunuzu sisteme şablon olarak kaydedin"
      icon={Sparkles}
      maxWidth="max-w-lg"
      badge="Yeni Dork"
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
        {/* Şablon */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono uppercase text-white/50">Dork Şablonu</label>
            <button
              type="button"
              onClick={() => setTemplate((prev) => prev + "{target}")}
              className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-mono transition-colors border border-white/10 cursor-pointer"
            >
              + &#123;target&#125;
            </button>
          </div>
          <input
            type="text"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="site:{target} inurl:admin ext:php"
            className="glass-input font-mono text-xs"
            autoFocus
          />
        </div>

        {/* Açıklama */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase text-white/50">Açıklama</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Yönetici Giriş Panelleri"
            className="glass-input text-xs"
          />
        </div>

        {/* Kategori */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-mono uppercase text-white/50">Kategori</label>
          <div className="flex items-center gap-3">
            <select
              disabled={isCustomCategory}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input text-xs flex-1 disabled:opacity-40"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c} className="bg-neutral-900 text-white">
                  {c}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCustomCategory}
                onChange={(e) => setIsCustomCategory(e.target.checked)}
                className="rounded accent-white"
              />
              <span>Özel Kategori</span>
            </label>
          </div>

          {isCustomCategory && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Yeni kategori adı..."
              className="glass-input text-xs mt-1"
            />
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="glass-btn-primary mt-2 py-2.5 text-xs font-semibold"
        >
          <Plus size={14} />
          <span>Şablonu Ekle</span>
        </button>
      </form>
    </ModalShell>
  );
}
