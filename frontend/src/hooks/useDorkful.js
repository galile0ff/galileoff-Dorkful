"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  GenerateDorks,
  ExportJSON,
  AddCustomDork,
  GetTemplates,
  GetCategories,
  UpdateTemplate,
  DeleteTemplate,
  RenameCategory,
  DeleteCategory,
  ResetToDefaults
} from '../../wailsjs/go/main/App';
import { BrowserOpenURL, ClipboardSetText } from '../../wailsjs/runtime/runtime';
import { CATEGORIES, matchCategory } from '../constants/categories';

// useDorkful hook'u: Uygulamanın tüm durum ve servis yönetimini sağlar
export function useDorkful() {
  const [target, setTarget] = useState("");
  const [dorks, setDorks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [categories, setCategories] = useState(CATEGORIES);
  const [templates, setTemplates] = useState([]);
  const [toast, setToast] = useState(null);
  const [navVisible, setNavVisible] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const scrollRef = useRef(null);

  // Bildirim gösterme
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Backend'den kayıtlı tüm şablon ve kategorileri yükleme
  const reloadData = useCallback(async () => {
    try {
      const [tList, cList] = await Promise.all([
        GetTemplates(),
        GetCategories()
      ]);
      if (tList) setTemplates(tList);
      if (cList && cList.length > 0) setCategories(cList);
    } catch (e) {
      console.warn("Şablon yükleme uyarısı:", e);
    }
  }, []);

  // İlk açılışta verileri yükle
  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Sayfa kaydırma dinleyicisi (Sadece sonuçlar varken ve aşağı inildiğinde navbar gelir)
  const onScroll = useCallback((e) => {
    const top = e.target.scrollTop;
    setNavVisible(top > 200);
  }, []);

  // Sayfanın en üstüne yumuşak kaydırma
  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Go backend üzerinden dork üretme
  const handleGenerate = useCallback(async (customTarget) => {
    const activeTarget = customTarget !== undefined ? customTarget : target;
    if (!activeTarget.trim()) {
      showToast("Hedef domain girilmedi.");
      return;
    }
    try {
      const res = await GenerateDorks(activeTarget);
      setDorks(res || []);
      showToast(`${res.length} Sorgu Tespit Edildi.`);
    } catch (e) {
      showToast(`Hata: ${e}`);
    }
  }, [target, showToast]);

  // Çalışma zamanında yeni özel dork ekleme
  const handleAddCustomDork = useCallback(async ({ template, description, category }) => {
    try {
      await AddCustomDork(template, description, category);
      await reloadData();
      showToast("Özel dork şablonu başarıyla eklendi.");

      // Eğer mevcut bir hedef girilmişse, yeni dorku anında listeye yansıt
      if (target.trim()) {
        const res = await GenerateDorks(target);
        setDorks(res || []);
      }
    } catch (e) {
      showToast(`Dork ekleme hatası: ${e}`);
      throw e;
    }
  }, [target, reloadData, showToast]);

  // Dork şablonu güncelleme
  const handleUpdateDork = useCallback(async (index, { template, description, category }) => {
    try {
      await UpdateTemplate(index, template, description, category);
      await reloadData();
      showToast("Dork şablonu güncellendi.");

      if (target.trim()) {
        const res = await GenerateDorks(target);
        setDorks(res || []);
      }
    } catch (e) {
      showToast(`Güncelleme hatası: ${e}`);
    }
  }, [target, reloadData, showToast]);

  // Dork şablonu silme
  const handleDeleteDork = useCallback(async (index) => {
    try {
      await DeleteTemplate(index);
      await reloadData();
      showToast("Dork şablonu silindi.");

      if (target.trim()) {
        const res = await GenerateDorks(target);
        setDorks(res || []);
      }
    } catch (e) {
      showToast(`Silme hatası: ${e}`);
    }
  }, [target, reloadData, showToast]);

  // Kategori adını toplu değiştirme
  const handleRenameCategory = useCallback(async (oldCategory, newCategory) => {
    try {
      await RenameCategory(oldCategory, newCategory);
      await reloadData();
      showToast(`Kategori '${newCategory}' olarak güncellendi.`);

      if (filter === oldCategory) {
        setFilter(newCategory);
      }
      if (target.trim()) {
        const res = await GenerateDorks(target);
        setDorks(res || []);
      }
    } catch (e) {
      showToast(`Kategori güncelleme hatası: ${e}`);
    }
  }, [filter, target, reloadData, showToast]);

  // Kategori ve tüm dorklarını silme
  const handleDeleteCategory = useCallback(async (category) => {
    try {
      await DeleteCategory(category);
      await reloadData();
      if (filter === category) {
        setFilter("All");
      }
      showToast(`'${category}' kategorisi ve dorkları silindi.`);

      if (target.trim()) {
        const res = await GenerateDorks(target);
        setDorks(res || []);
      }
    } catch (e) {
      showToast(`Kategori silme hatası: ${e}`);
    }
  }, [filter, target, reloadData, showToast]);

  // Varsayılan fabrika ayarlarına sıfırlama
  const handleResetToDefaults = useCallback(async () => {
    try {
      await ResetToDefaults();
      await reloadData();
      setFilter("All");
      showToast("Tüm dorklar varsayılan ayarlara sıfırlandı.");

      if (target.trim()) {
        const res = await GenerateDorks(target);
        setDorks(res || []);
      }
    } catch (e) {
      showToast(`Sıfırlama hatası: ${e}`);
    }
  }, [target, reloadData, showToast]);

  // Go backend üzerinden JSON dışa aktarma
  const handleExport = useCallback(async () => {
    if (dorks.length === 0) return;
    try {
      const path = await ExportJSON(dorks);
      showToast(`Kaydedildi: ${path}`);
    } catch (e) {
      showToast(`Hata: ${e}`);
    }
  }, [dorks, showToast]);

  // Varsayılan tarayıcıda arama sorgusunu açma
  const executeSearch = useCallback((query) => {
    BrowserOpenURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  }, []);

  // Panoya kopyalama
  const copyToClipboard = useCallback((text) => {
    ClipboardSetText(text);
    showToast("Kopyalandı.");
  }, [showToast]);

  // Seçilen kategoriye göre filtrelenmiş dorklar
  const filteredDorks = useMemo(() => {
    return dorks.filter(d => matchCategory(d.category, filter));
  }, [dorks, filter]);

  return {
    target,
    setTarget,
    dorks,
    filter,
    setFilter,
    categories,
    templates,
    filteredDorks,
    toast,
    navVisible,
    splashDone,
    setSplashDone,
    isAddModalOpen,
    setIsAddModalOpen,
    isManageModalOpen,
    setIsManageModalOpen,
    scrollRef,
    onScroll,
    scrollToTop,
    handleGenerate,
    handleAddCustomDork,
    handleUpdateDork,
    handleDeleteDork,
    handleRenameCategory,
    handleDeleteCategory,
    handleResetToDefaults,
    handleExport,
    executeSearch,
    copyToClipboard,
  };
}
