"use client";

import { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Tag,
  Check,
  Code2,
  FileText,
  SlidersHorizontal,
  FolderEdit
} from 'lucide-react';

export default function ManageDorksModal({
  isOpen,
  onClose,
  templates = [],
  categories = [],
  onAddDork,
  onUpdateDork,
  onDeleteDork,
  onRenameCategory,
  onDeleteCategory,
  onResetToDefaults,
  onOpenAddModal
}) {
  const [activeTab, setActiveTab] = useState("dorks"); // "dorks" | "categories"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Düzenleme durumu
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ template: "", description: "", category: "" });

  // Kategori yeniden adlandırma durumu
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const safeTemplates = Array.isArray(templates) ? templates : [];

  // Kategori bazlı dork sayıları (Hook'lar koşulsuz olarak en üstte çağrılır)
  const categoryStats = useMemo(() => {
    const counts = {};
    safeTemplates.forEach((t) => {
      const cat = t.Category || t.category || "Custom";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [safeTemplates]);

  // Filtrelenmiş şablon listesi (Hook'lar koşulsuz olarak en üstte çağrılır)
  const filteredTemplates = useMemo(() => {
    return safeTemplates
      .map((t, originalIndex) => ({
        originalIndex,
        template: t.Template || t.template || "",
        description: t.Description || t.description || "",
        category: t.Category || t.category || "Custom",
      }))
      .filter((t) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          t.template.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q);

        const matchesCat =
          selectedCategoryFilter === "All" || t.category === selectedCategoryFilter;

        return matchesSearch && matchesCat;
      });
  }, [safeTemplates, searchQuery, selectedCategoryFilter]);

  // Düzenlemeyi başlat
  const handleStartEdit = (t) => {
    setEditingIndex(t.originalIndex);
    setEditForm({
      template: t.template,
      description: t.description,
      category: t.category,
    });
  };

  // Düzenlemeyi kaydet
  const handleSaveEdit = async () => {
    if (!editForm.template.trim() || !editForm.description.trim()) return;
    await onUpdateDork(editingIndex, editForm);
    setEditingIndex(null);
  };

  // Kategori adını değiştir
  const handleSaveCategoryRename = async (oldCat) => {
    if (!newCategoryName.trim() || newCategoryName.trim() === oldCat) {
      setRenamingCategory(null);
      return;
    }
    await onRenameCategory(oldCat, newCategoryName.trim());
    setRenamingCategory(null);
    setNewCategoryName("");
  };

  // React Rules of Hooks uyarınca koşullu çıkış TÜM HOOK'LARDAN SONRA yapılır
  if (!isOpen) return null;

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
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Dork & Kategori Yöneticisi
              </h3>
              <p className="text-xs text-white/50">
                Kayıtlı dorkları düzenleyin, silin veya kategorileri yönetin ({safeTemplates.length} dork kayıtlı).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sekme Değiştirici */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab("dorks")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "dorks"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Dorklar ({safeTemplates.length})
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "categories"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Kategoriler ({Object.keys(categoryStats).length})
              </button>
            </div>

            {/* Kapat */}
            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =========================================================
            SEKME 1: DORK LİSTESİ VE DÜZENLEME
           ========================================================= */}
        {activeTab === "dorks" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Arama ve Filtre Kontrolleri */}
            <div className="px-6 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-neutral-900/40">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative w-full max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Dork ara veya filtrele..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/25 outline-none focus:border-white/30 font-mono"
                  />
                </div>

                {/* Kategori Filtresi */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-white/30 cursor-pointer"
                >
                  <option value="All" className="bg-neutral-900">Tüm Kategoriler</option>
                  {Object.keys(categoryStats).map((cat) => (
                    <option key={cat} value={cat} className="bg-neutral-900">
                      {cat} ({categoryStats[cat]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  Yeni Ekle
                </button>
                <button
                  onClick={onResetToDefaults}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  title="Tüm dorkları orijinal fabrika ayarlarına sıfırla"
                >
                  <RotateCcw size={12} />
                  <span>Sıfırla</span>
                </button>
              </div>
            </div>

            {/* Dork Listesi */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-3">
              {filteredTemplates.length === 0 ? (
                <div className="py-20 text-center text-xs text-white/30 font-mono">
                  Eşleşen dork bulunamadı.
                </div>
              ) : (
                filteredTemplates.map((t) => {
                  const isEditing = editingIndex === t.originalIndex;

                  if (isEditing) {
                    return (
                      <div
                        key={t.originalIndex}
                        className="p-4 rounded-xl bg-white/[0.07] border border-white/25 flex flex-col gap-3 animate-fadeIn"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white/90">Dork Düzenle</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="px-2.5 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                            >
                              İptal
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-white text-black rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                              <Check size={12} /> Kaydet
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editForm.template}
                            onChange={(e) => setEditForm({ ...editForm, template: e.target.value })}
                            placeholder="Dork şablonu..."
                            className="w-full px-3 py-1.5 bg-neutral-900 border border-white/15 rounded-lg text-xs font-mono text-white outline-none focus:border-white/40"
                          />
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Açıklama..."
                            className="w-full px-3 py-1.5 bg-neutral-900 border border-white/15 rounded-lg text-xs text-white outline-none focus:border-white/40"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">Kategori:</span>
                            <input
                              type="text"
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              placeholder="Kategori adı..."
                              className="px-3 py-1.5 bg-neutral-900 border border-white/15 rounded-lg text-xs text-white outline-none focus:border-white/40 w-48"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={t.originalIndex}
                      className="group p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition-all flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/10 text-white/70 border border-white/10">
                            {t.category}
                          </span>
                          {t.mitre && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              {t.mitre.techniqueId}
                            </span>
                          )}
                          <p className="text-xs text-white/80 font-medium truncate">
                            {t.description}
                          </p>
                        </div>
                        <code className="text-[11px] font-mono text-white/50 break-all bg-black/40 px-2 py-1 rounded border border-white/5">
                          {t.template}
                        </code>
                      </div>

                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                        <button
                          onClick={() => handleStartEdit(t)}
                          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteDork(t.originalIndex)}
                          className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            SEKME 2: KATEGORİ YÖNETİMİ
           ========================================================= */}
        {activeTab === "categories" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-3">
            <p className="text-xs text-white/50 mb-2">
              Kategorileri yeniden adlandırabilir veya bir kategori altındaki tüm dorkları silebilirsiniz.
            </p>

            {Object.keys(categoryStats).map((cat) => {
              const isRenaming = renamingCategory === cat;
              const count = categoryStats[cat];

              return (
                <div
                  key={cat}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70">
                      <Tag size={16} />
                    </div>

                    {!isRenaming ? (
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {cat}
                        </h4>
                        <span className="text-[11px] text-white/40">
                          {count} adet dork şablonu içeriyor
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Yeni kategori adı..."
                          className="px-3 py-1.5 bg-neutral-900 border border-white/20 rounded-lg text-xs text-white outline-none focus:border-white/40 max-w-xs"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCategoryRename(cat)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white text-black rounded-lg hover:bg-neutral-200 cursor-pointer"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => setRenamingCategory(null)}
                          className="px-2 py-1 text-xs text-white/50 hover:text-white cursor-pointer"
                        >
                          İptal
                        </button>
                      </div>
                    )}
                  </div>

                  {!isRenaming && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setRenamingCategory(cat);
                          setNewCategoryName(cat);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors cursor-pointer"
                      >
                        <FolderEdit size={12} />
                        Yeniden Adlandır
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                        title="Bu kategoriye ait tüm dorkları sil"
                      >
                        <Trash2 size={12} />
                        Kategoriyi Sil
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
