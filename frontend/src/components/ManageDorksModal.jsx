"use client";

import { useState, useMemo, useEffect } from 'react';
import {
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
  FolderEdit,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import ModalShell from './ModalShell';

export default function ManageDorksModal({
  isOpen,
  onClose,
  initialTab = "dorks", // "dorks" | "add" | "categories"
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
  const [activeTab, setActiveTab] = useState(initialTab); // "dorks" | "add" | "categories"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  // Dork Düzenleme Durumu
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ template: "", description: "", category: "" });

  // Yeni Dork Ekleme Form State'i (Konsolide edildi)
  const [newTemplate, setNewTemplate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Admin");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  // Kategori Yeniden Adlandırma Durumu
  const [renamingCategory, setRenamingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const safeTemplates = Array.isArray(templates) ? templates : [];

  // initialTab değiştiğinde veya modal açıldığında güncelle
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Kategori bazlı dork sayıları
  const categoryStats = useMemo(() => {
    const counts = {};
    safeTemplates.forEach((t) => {
      const cat = t.Category || t.category || "Custom";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [safeTemplates]);

  // Filtrelenmiş şablon listesi
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

  // Yeni dork ekleme gönderimi
  const handleCreateDork = async (e) => {
    if (e) e.preventDefault();
    setAddError("");
    setAddSuccess(false);

    if (!newTemplate.trim()) {
      setAddError("Lütfen bir dork şablonu girin.");
      return;
    }
    if (!newDescription.trim()) {
      setAddError("Lütfen bir açıklama girin.");
      return;
    }

    const finalCategory = isCustomCategory
      ? (customCategory.trim() || "Custom")
      : newCategory;

    try {
      if (onAddDork) {
        await onAddDork({
          template: newTemplate.trim(),
          description: newDescription.trim(),
          category: finalCategory,
        });
      }

      setNewTemplate("");
      setNewDescription("");
      setCustomCategory("");
      setIsCustomCategory(false);
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setActiveTab("dorks");
      }, 1000);
    } catch (err) {
      setAddError(`Hata: ${err}`);
    }
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

  const availableCategories = categories.filter((c) => c !== "All");

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Dork & Şablon Stüdyosu"
      subtitle={`${safeTemplates.length} dork şablonu ve ${availableCategories.length} kategori kayıtlı`}
      icon={SlidersHorizontal}
      maxWidth="max-w-4xl"
      badge="Dork Studio"
      headerActions={
        <div className="flex items-center gap-1.5">
          {onResetToDefaults && (
            <button
              onClick={onResetToDefaults}
              className="glass-btn-ghost !text-[11px] text-white/50 hover:text-white"
              title="Varsayılanlara Sıfırla"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Varsayılanlar</span>
            </button>
          )}
        </div>
      }
    >
      {/* Raycast / Linear Tarzı Sekme Seçici */}
      <div className="px-5 sm:px-6 py-2.5 border-b border-white/[0.08] bg-white/[0.015] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("dorks")}
            className={`glass-tab-btn ${activeTab === "dorks" ? "glass-tab-btn-active" : "glass-tab-btn-inactive"}`}
          >
            <span>Dorklar ({safeTemplates.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`glass-tab-btn ${activeTab === "add" ? "glass-tab-btn-active" : "glass-tab-btn-inactive"}`}
          >
            <Plus size={12} />
            <span>Yeni Dork Ekle</span>
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`glass-tab-btn ${activeTab === "categories" ? "glass-tab-btn-active" : "glass-tab-btn-inactive"}`}
          >
            <Tag size={12} />
            <span>Kategoriler ({availableCategories.length})</span>
          </button>
        </div>

        {/* Dork Arama Çubuğu (Yalnızca dorklar sekmesinde gösterilir) */}
        {activeTab === "dorks" && (
          <div className="relative min-w-[180px] max-w-xs shrink-0">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Şablon veya açıklama ara..."
              className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/15 focus:border-white/30 text-white placeholder-white/30 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* Modal Gövdesi */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar">
        {/* =========================================================
            TAB 1: DORK LİSTESİ & DÜZENLEME
           ========================================================= */}
        {activeTab === "dorks" && (
          <div className="flex flex-col gap-4">
            {/* Kategori Filtresi Hapları */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategoryFilter("All")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedCategoryFilter === "All"
                    ? "bg-white text-black font-semibold"
                    : "bg-white/[0.03] text-white/50 hover:text-white"
                }`}
              >
                Tümü ({safeTemplates.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    selectedCategoryFilter === cat
                      ? "bg-white text-black font-semibold"
                      : "bg-white/[0.03] text-white/50 hover:text-white"
                  }`}
                >
                  {cat} ({categoryStats[cat] || 0})
                </button>
              ))}
            </div>

            {/* Dork Listesi */}
            <div className="flex flex-col gap-2.5">
              {filteredTemplates.map((t) => {
                const isEditing = editingIndex === t.originalIndex;

                if (isEditing) {
                  return (
                    <div
                      key={t.originalIndex}
                      className="p-4 rounded-2xl bg-white/[0.04] border border-white/20 flex flex-col gap-3"
                    >
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-white/50 uppercase">Şablon Formülü</label>
                        <input
                          type="text"
                          value={editForm.template}
                          onChange={(e) => setEditForm({ ...editForm, template: e.target.value })}
                          className="glass-input font-mono text-xs text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-mono text-white/50 uppercase">Açıklama</label>
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="glass-input text-xs text-white"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="glass-input text-xs"
                        >
                          {availableCategories.map((cat) => (
                            <option key={cat} value={cat} className="bg-neutral-900 text-white">
                              {cat}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="glass-btn-secondary !py-1 text-xs"
                          >
                            İptal
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="glass-btn-primary !py-1 text-xs"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={t.originalIndex}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 flex items-center justify-between gap-4 transition-all group"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/5 shrink-0">
                          {t.category}
                        </span>
                        <p className="text-xs font-medium text-white/90 truncate">
                          {t.description}
                        </p>
                      </div>
                      <code className="text-[11px] font-mono text-white/50 truncate mt-1">
                        {t.template}
                      </code>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(t)}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteDork(t.originalIndex)}
                        className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="py-16 text-center text-white/40 text-xs">
                  Aramanızla eşleşen dork şablonu bulunamadı.
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: YENİ DORK EKLE (KONSOLİDE FORM)
           ========================================================= */}
        {activeTab === "add" && (
          <form onSubmit={handleCreateDork} className="max-w-xl mx-auto flex flex-col gap-5 py-2">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-2">
                  <Sparkles size={14} className="text-white/60" />
                  Yeni Dork Şablonu Oluştur
                </span>
                <button
                  type="button"
                  onClick={() => setNewTemplate((prev) => prev + "{target}")}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-mono transition-colors border border-white/10 cursor-pointer"
                  title="Şablona {target} yer tutucusu ekle"
                >
                  + &#123;target&#125; Ekle
                </button>
              </div>

              {/* Şablon Girişi */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase text-white/50">Dork Şablonu</label>
                <input
                  type="text"
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  placeholder="site:{target} inurl:admin ext:php"
                  className="glass-input font-mono text-xs"
                />
                <p className="text-[10px] text-white/40">
                  Arama yapılacak alan adını temsil etmek için <code>&#123;target&#125;</code> ifadesini kullanın.
                </p>
              </div>

              {/* Açıklama */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase text-white/50">Açıklama / Başlık</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Yönetici Giriş Panelleri ve PHP Dosyaları"
                  className="glass-input text-xs"
                />
              </div>

              {/* Kategori Seçimi */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-mono uppercase text-white/50">Kategori</label>
                <div className="flex items-center gap-3">
                  <select
                    disabled={isCustomCategory}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
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

              {addError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                  {addError}
                </div>
              )}

              {addSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  <span>Şablon başarıyla eklendi!</span>
                </div>
              )}

              <button
                type="submit"
                className="glass-btn-primary mt-2 py-2.5 text-xs font-semibold"
              >
                <Plus size={14} />
                <span>Şablonu Kaydet</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================================
            TAB 3: KATEGORİ YÖNETİMİ
           ========================================================= */}
        {activeTab === "categories" && (
          <div className="flex flex-col gap-3">
            {availableCategories.map((cat) => {
              const count = categoryStats[cat] || 0;
              const isRenaming = renamingCategory === cat;

              return (
                <div
                  key={cat}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Tag size={15} className="text-white/40" />
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="glass-input !py-1 text-xs"
                          placeholder="Yeni ad..."
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCategoryRename(cat)}
                          className="glass-btn-primary !py-1 text-xs"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => setRenamingCategory(null)}
                          className="glass-btn-secondary !py-1 text-xs"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-white">{cat}</span>
                        <span className="text-[10px] font-mono text-white/40 px-2 py-0.5 rounded-full bg-white/5">
                          {count} Dork
                        </span>
                      </div>
                    )}
                  </div>

                  {!isRenaming && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setRenamingCategory(cat);
                          setNewCategoryName(cat);
                        }}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                        title="Kategoriyi Yeniden Adlandır"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
                        title="Kategoriyi Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
