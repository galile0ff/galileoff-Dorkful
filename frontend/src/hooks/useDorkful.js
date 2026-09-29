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
  ResetToDefaults,
  ProbeTarget,
  ProbeURL,
  GetFindings,
  AddFinding,
  UpdateFinding,
  DeleteFinding,
  ClearFindings,
  ExportFindingsJSON
} from '../../wailsjs/go/main/App';
import { BrowserOpenURL, ClipboardSetText } from '../../wailsjs/runtime/runtime';
import { CATEGORIES, matchCategory } from '../constants/categories';
import { formatTargetDomain } from '../utils/targetHelper';

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
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flaggingDork, setFlaggingDork] = useState(null);
  const [isFindingsModalOpen, setIsFindingsModalOpen] = useState(false);
  const [findings, setFindings] = useState([]);
  const [probeResult, setProbeResult] = useState(null);
  const [isProbing, setIsProbing] = useState(false);
  const scrollRef = useRef(null);

  // Bildirim gösterme
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Backend'den kayıtlı tüm bulguları yenileme
  const reloadFindings = useCallback(async () => {
    try {
      const fList = await GetFindings();
      if (fList) setFindings(fList);
    } catch (e) {
      console.warn("Bulgu listesi yükleme uyarısı:", e);
    }
  }, []);

  // Backend'den kayıtlı tüm şablon, kategori ve bulguları yükleme
  const reloadData = useCallback(async () => {
    try {
      const [tList, cList, fList] = await Promise.all([
        GetTemplates(),
        GetCategories(),
        GetFindings()
      ]);
      if (tList) setTemplates(tList);
      if (cList && cList.length > 0) setCategories(cList);
      if (fList) setFindings(fList);
    } catch (e) {
      console.warn("Veri yükleme uyarısı:", e);
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

  // Hedef alan adının canlılık durumunu ve HTTP başlıklarını denetleme
  const runProbeTarget = useCallback(async (targetToProbe) => {
    const t = targetToProbe !== undefined ? targetToProbe : target;
    if (!t || !t.trim()) return;
    setIsProbing(true);
    try {
      const res = await ProbeTarget(t);
      setProbeResult(res);
    } catch (e) {
      console.warn("ProbeTarget denetim hatası:", e);
      setProbeResult({ isAlive: false, error: String(e) });
    } finally {
      setIsProbing(false);
    }
  }, [target]);

  // Tekil bir endpoint / URL için HTTP denetimi çalıştırma
  const handleProbeURL = useCallback(async (url) => {
    try {
      return await ProbeURL(url);
    } catch (e) {
      return { isAlive: false, error: String(e) };
    }
  }, []);

  // Arama kutusundan odak çıkınca (blur) otomatik tamamlama
  const handleTargetBlur = useCallback(() => {
    if (target.trim()) {
      const formatted = formatTargetDomain(target);
      if (formatted !== target) {
        setTarget(formatted);
      }
    }
  }, [target]);

  // Go backend üzerinden dork üretme ve eşzamanlı hedef canlılık testi
  const handleGenerate = useCallback(async (customTarget) => {
    const rawTarget = customTarget !== undefined ? customTarget : target;
    const formatted = formatTargetDomain(rawTarget);

    if (!formatted) {
      showToast("Hedef alan adı girilmedi.");
      return;
    }

    // Arama kutusundaki hedefi de normalize edilmiş haliyle güncelle (ör: 'google' -> 'google.com')
    setTarget(formatted);

    // Hedef canlılık denetimini paralel başlat
    runProbeTarget(formatted);

    try {
      const res = await GenerateDorks(formatted);
      setDorks(res || []);
      showToast(`${res.length} Sorgu Tespit Edildi.`);
    } catch (e) {
      showToast(`Hata: ${e}`);
    }
  }, [target, showToast, runProbeTarget]);

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

  // Bulgu kaydetme (Yeni bulgu ekleme)
  const handleSaveFinding = useCallback(async ({ target, dorkQuery, category, severity, evidenceUrl, notes, mitreTechniqueId }) => {
    try {
      await AddFinding(target, dorkQuery, category, severity, evidenceUrl, notes, mitreTechniqueId || "");
      await reloadFindings();
      showToast("Bulgu CTI defterine eklendi.");
    } catch (e) {
      showToast(`Bulgu kaydetme hatası: ${e}`);
      throw e;
    }
  }, [reloadFindings, showToast]);

  // Tekil bulgu silme
  const handleDeleteFinding = useCallback(async (id) => {
    try {
      await DeleteFinding(id);
      await reloadFindings();
      showToast("Bulgu silindi.");
    } catch (e) {
      showToast(`Bulgu silme hatası: ${e}`);
    }
  }, [reloadFindings, showToast]);

  // Tüm bulguları temizleme
  const handleClearFindings = useCallback(async () => {
    try {
      await ClearFindings();
      await reloadFindings();
      showToast("Tüm bulgular temizlendi.");
    } catch (e) {
      showToast(`Temizleme hatası: ${e}`);
    }
  }, [reloadFindings, showToast]);

  // Bulguları JSON CTI raporu olarak masaüstüne aktarma
  const handleExportFindings = useCallback(async () => {
    if (findings.length === 0) {
      showToast("Dışa aktarılacak bulgu bulunmuyor.");
      return;
    }
    try {
      const path = await ExportFindingsJSON();
      showToast(`CTI Raporu kaydedildi: ${path}`);
    } catch (e) {
      showToast(`Rapor dışa aktarma hatası: ${e}`);
    }
  }, [findings, showToast]);

  // Bulgu işaretleme modalını açma / kapama
  const openFlagModal = useCallback((dork) => {
    setFlaggingDork(dork);
    setIsFlagModalOpen(true);
  }, []);

  const closeFlagModal = useCallback(() => {
    setIsFlagModalOpen(false);
    setFlaggingDork(null);
  }, []);

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
    showToast,
    navVisible,
    splashDone,
    setSplashDone,
    isAddModalOpen,
    setIsAddModalOpen,
    isManageModalOpen,
    setIsManageModalOpen,
    findings,
    isFlagModalOpen,
    flaggingDork,
    isFindingsModalOpen,
    setIsFindingsModalOpen,
    openFlagModal,
    closeFlagModal,
    handleSaveFinding,
    handleDeleteFinding,
    handleClearFindings,
    handleExportFindings,
    probeResult,
    isProbing,
    runProbeTarget,
    handleProbeURL,
    scrollRef,
    onScroll,
    scrollToTop,
    handleTargetBlur,
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
