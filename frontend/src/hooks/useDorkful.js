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
  ExportFindingsJSON,
  CreateWorkspace,
  GetWorkspaces,
  UpdateWorkspace,
  DeleteWorkspace,
  GetActiveWorkspaceID,
  SetActiveWorkspaceID,
  FetchSubdomains,
  FetchWaybackURLs,
  GenerateMultiEngineDorks
} from '../../wailsjs/go/main/App';
import { BrowserOpenURL, ClipboardSetText } from '../../wailsjs/runtime/runtime';
import { CATEGORIES, matchCategory } from '../constants/categories';
import { formatTargetDomain } from '../utils/targetHelper';

// Motor etiketleri formatlayıcı (Google, Github, Shodan, Censys, vb.)
const ENGINE_LABELS = {
  google: 'Google',
  github: 'Github',
  shodan: 'Shodan',
  censys: 'Censys',
  crtsh: 'CRT.sh',
  wayback: 'Wayback'
};

const formatEngineName = (eng) =>
  ENGINE_LABELS[eng?.toLowerCase()] || (eng ? eng.charAt(0).toUpperCase() + eng.slice(1).toLowerCase() : '');

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

  // Çoklu Motor & Canlı Keşif State'leri
  const [selectedEngine, setSelectedEngine] = useState("google"); // 'google' | 'github' | 'shodan' | 'censys' | 'crtsh' | 'wayback'
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  // CRT.sh ve Wayback Canlı Keşif Sonuçları
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [reconType, setReconType] = useState('crtsh');
  const [reconTarget, setReconTarget] = useState('');
  const [subdomains, setSubdomains] = useState([]);
  const [waybackUrls, setWaybackUrls] = useState([]);
  const [isReconLoading, setIsReconLoading] = useState(false);

  // Aktif çalışma alanı nesnesi
  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId) || null;
  }, [workspaces, activeWorkspaceId]);

  // Bildirim gösterme
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Çalışma alanlarını yükleme
  const reloadWorkspaces = useCallback(async () => {
    try {
      const [wList, activeId] = await Promise.all([
        GetWorkspaces(),
        GetActiveWorkspaceID()
      ]);
      if (wList) setWorkspaces(wList);
      if (activeId) setActiveWorkspaceId(activeId);
    } catch (e) {
      console.warn("Çalışma alanı yükleme hatası:", e);
    }
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

  // Backend'den kayıtlı tüm şablon, kategori, bulgu ve çalışma alanlarını yükleme
  const reloadData = useCallback(async () => {
    try {
      const [tList, cList, fList, wList, activeId] = await Promise.all([
        GetTemplates(),
        GetCategories(),
        GetFindings(),
        GetWorkspaces(),
        GetActiveWorkspaceID()
      ]);
      if (tList) setTemplates(tList);
      if (cList && cList.length > 0) setCategories(cList);
      if (fList) setFindings(fList);
      if (wList) setWorkspaces(wList);
      if (activeId) setActiveWorkspaceId(activeId);
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

  // Go backend üzerinden dork üretme veya CRT/Wayback keşif çalıştırma
  const handleGenerate = useCallback(async (customTarget, engineOverride) => {
    const rawTarget = customTarget !== undefined ? customTarget : target;
    const formatted = formatTargetDomain(rawTarget);
    const engine = engineOverride || selectedEngine;

    if (engineOverride && engineOverride !== selectedEngine) {
      setSelectedEngine(engineOverride);
    }

    if (!formatted) {
      showToast("Hedef alan adı girilmedi.");
      return;
    }

    // Arama kutusundaki hedefi normalize edilmiş haliyle güncelle
    setTarget(formatted);

    // CRT.sh Alt Alan Adı Keşfi
    if (engine === 'crtsh') {
      setReconType('crtsh');
      setReconTarget(formatted);
      setIsReconModalOpen(true);
      setIsReconLoading(true);
      try {
        const res = await FetchSubdomains(formatted);
        setSubdomains(res || []);
        showToast(`${res ? res.length : 0} alt alan adı tespit edildi.`);
      } catch (e) {
        showToast(`CRT.sh hatası: ${e}`);
      } finally {
        setIsReconLoading(false);
      }
      return;
    }

    // Wayback Machine Geçmiş URL Keşfi
    if (engine === 'wayback') {
      setReconType('wayback');
      setReconTarget(formatted);
      setIsReconModalOpen(true);
      setIsReconLoading(true);
      try {
        const res = await FetchWaybackURLs(formatted);
        setWaybackUrls(res || []);
        showToast(`${res ? res.length : 0} tarihi URL tespit edildi.`);
      } catch (e) {
        showToast(`Wayback hatası: ${e}`);
      } finally {
        setIsReconLoading(false);
      }
      return;
    }

    // Hedef canlılık denetimini paralel başlat
    runProbeTarget(formatted);

    // Google Standart Dorkları
    if (engine === 'google') {
      try {
        const res = await GenerateDorks(formatted);
        setDorks(res || []);
        showToast(`${res ? res.length : 0} Google sorgusu tespit edildi.`);
      } catch (e) {
        showToast(`Hata: ${e}`);
      }
      return;
    }

    // GitHub, Shodan, Censys Dorkları
    try {
      const targetProfile = activeWorkspace || {
        id: "temp",
        name: formatted.split('.')[0] || "Target",
        domain: formatted,
        asn: "",
        ipRange: "",
        githubOrg: formatted.split('.')[0] || ""
      };

      const res = await GenerateMultiEngineDorks(engine, targetProfile);
      setDorks(res || []);
      const engineLabel = formatEngineName(engine);
      showToast(`${res ? res.length : 0} ${engineLabel} sorgusu oluşturuldu.`);
    } catch (e) {
      const engineLabel = formatEngineName(engine);
      showToast(`${engineLabel} sorgu hatası: ${e}`);
    }
  }, [target, selectedEngine, activeWorkspace, runProbeTarget, showToast]);

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

  // Varsayılan tarayıcıda arama sorgusunu açma (varsa doğrudan searchUrl, yoksa google query)
  const executeSearch = useCallback((query, searchUrl) => {
    if (searchUrl) {
      BrowserOpenURL(searchUrl);
    } else {
      BrowserOpenURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    }
  }, []);

  // Panoya kopyalama
  const copyToClipboard = useCallback((text) => {
    ClipboardSetText(text);
    showToast("Kopyalandı.");
  }, [showToast]);

  // Çalışma alanı seçimi
  const handleSelectWorkspace = useCallback(async (wsId) => {
    try {
      await SetActiveWorkspaceID(wsId);
      setActiveWorkspaceId(wsId);
      const ws = workspaces.find(w => w.id === wsId);
      if (ws && ws.domain) {
        setTarget(ws.domain);
        showToast(`'${ws.name}' çalışma alanına geçildi.`);
      }
    } catch (e) {
      showToast(`Çalışma alanı seçim hatası: ${e}`);
    }
  }, [workspaces, showToast]);

  // Yeni çalışma alanı oluşturma
  const handleCreateWorkspace = useCallback(async (nameOrObj, domain, company, asn, ipRange, githubOrg) => {
    try {
      let n = nameOrObj, d = domain, c = company, a = asn, ip = ipRange, gh = githubOrg;
      if (typeof nameOrObj === 'object' && nameOrObj !== null) {
        n = nameOrObj.name;
        d = nameOrObj.domain;
        c = nameOrObj.company;
        a = nameOrObj.asn;
        ip = nameOrObj.ipRange;
        gh = nameOrObj.githubOrg;
      }
      const created = await CreateWorkspace(n || "", d || "", c || "", a || "", ip || "", gh || "");
      await reloadWorkspaces();
      if (created && created.id) {
        setActiveWorkspaceId(created.id);
        if (created.domain) setTarget(created.domain);
      }
      showToast("Çalışma alanı oluşturuldu.");
    } catch (e) {
      showToast(`Oluşturma hatası: ${e}`);
      throw e;
    }
  }, [reloadWorkspaces, showToast]);

  // Çalışma alanı güncelleme
  const handleUpdateWorkspace = useCallback(async (idOrObj, name, domain, company, asn, ipRange, githubOrg) => {
    try {
      let i = idOrObj, n = name, d = domain, c = company, a = asn, ip = ipRange, gh = githubOrg;
      if (typeof idOrObj === 'object' && idOrObj !== null) {
        i = idOrObj.id;
        n = idOrObj.name;
        d = idOrObj.domain;
        c = idOrObj.company;
        a = idOrObj.asn;
        ip = idOrObj.ipRange;
        gh = idOrObj.githubOrg;
      }
      await UpdateWorkspace(i || "", n || "", d || "", c || "", a || "", ip || "", gh || "");
      await reloadWorkspaces();
      showToast("Çalışma alanı güncellendi.");
    } catch (e) {
      showToast(`Güncelleme hatası: ${e}`);
      throw e;
    }
  }, [reloadWorkspaces, showToast]);

  // Çalışma alanı silme
  const handleDeleteWorkspace = useCallback(async (id) => {
    try {
      await DeleteWorkspace(id);
      await reloadWorkspaces();
      showToast("Çalışma alanı silindi.");
    } catch (e) {
      showToast(`Silme hatası: ${e}`);
      throw e;
    }
  }, [reloadWorkspaces, showToast]);

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
    // Çoklu Motor & Keşif State/Aksiyonları
    selectedEngine,
    setSelectedEngine,
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    handleSelectWorkspace,
    handleCreateWorkspace,
    handleUpdateWorkspace,
    handleDeleteWorkspace,
    reloadWorkspaces,
    // CRT.sh & Wayback Modal State/Aksiyonları
    isReconModalOpen,
    setIsReconModalOpen,
    reconType,
    reconTarget,
    subdomains,
    waybackUrls,
    isReconLoading,
  };
}
