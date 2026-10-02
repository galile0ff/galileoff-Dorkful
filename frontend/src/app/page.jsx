"use client";

import './globals.css';
import { useDorkful } from '../hooks/useDorkful';
import SplashScreen from '../components/SplashScreen';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import DorkList from '../components/DorkList';
import Toast from '../components/Toast';
import AddDorkModal from '../components/AddDorkModal';
import ManageDorksModal from '../components/ManageDorksModal';
import TargetProbeCard from '../components/TargetProbeCard';
import FlagFindingModal from '../components/FlagFindingModal';
import FindingsLockerModal from '../components/FindingsLockerModal';
import WorkspaceModal from '../components/WorkspaceModal';
import ReconResultsModal from '../components/ReconResultsModal';
import SettingsModal from '../components/SettingsModal';
import GitHubLeaksModal from '../components/GitHubLeaksModal';
import ShodanResultsModal from '../components/ShodanResultsModal';
import CensysResultsModal from '../components/CensysResultsModal';
import JSAnalysisModal from '../components/JSAnalysisModal';
import DNSNetworkMapModal from '../components/DNSNetworkMapModal';
import ExecutiveReportModal from '../components/ExecutiveReportModal';

export default function Home() {
  const {
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
    // Çoklu Motor & Keşif
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
    // CRT.sh & Wayback Modal
    isReconModalOpen,
    setIsReconModalOpen,
    reconType,
    reconTarget,
    subdomains,
    waybackUrls,
    isReconLoading,
    // Ayarlar & API Kasası
    settings,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    handleSaveSettings,
    handleTestAPIKey,
    // GitHub Canlı Kod Sızıntısı
    githubLeaks,
    isGitHubModalOpen,
    setIsGitHubModalOpen,
    isGitHubLoading,
    handleScanGitHubLeaks,
    // Shodan Canlı Port & Zafiyet
    shodanHosts,
    isShodanModalOpen,
    setIsShodanModalOpen,
    isShodanLoading,
    handleScanShodan,
    // Censys Canlı Host & Servis
    censysHosts,
    isCensysModalOpen,
    setIsCensysModalOpen,
    isCensysLoading,
    handleScanCensys,
    // JS Secret Miner (JavaScript Gizli API & Secret Avcısı)
    jsAnalysisResult,
    isJSAnalysisModalOpen,
    setIsJSAnalysisModalOpen,
    isJSAnalysisLoading,
    handleScanJavaScript,
    // Akıllı Teknoloji Parmak İzi (Tech Fingerprinting)
    selectedTechFilter,
    setSelectedTechFilter,
    // DNS & Reverse IP Ağ Haritası
    dnsMapResult,
    isDNSMapModalOpen,
    setIsDNSMapModalOpen,
    isDNSMapLoading,
    handleScanDNSMap,
    // CTI & Pentest Yönetici Raporu
    isReportModalOpen,
    setIsReportModalOpen,
  } = useDorkful();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* Açılış Karşılama Ekranı */}
      <SplashScreen
        isDismissed={splashDone}
        onDismiss={() => setSplashDone(true)}
      />

      {/* Özel Dork Ekleme Modalı */}
      <AddDorkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddDork={handleAddCustomDork}
        categories={categories}
      />

      {/* Dork & Kategori Yönetimi Modalı */}
      <ManageDorksModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        templates={templates}
        categories={categories}
        onAddDork={handleAddCustomDork}
        onUpdateDork={handleUpdateDork}
        onDeleteDork={handleDeleteDork}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetToDefaults={handleResetToDefaults}
        onOpenAddModal={() => {
          setIsManageModalOpen(false);
          setIsAddModalOpen(true);
        }}
      />


      {/* Bulgu Defteri & Kanıt Kasası (Findings Locker) Modalı */}
      <FindingsLockerModal
        isOpen={isFindingsModalOpen}
        onClose={() => setIsFindingsModalOpen(false)}
        findings={findings}
        onDeleteFinding={handleDeleteFinding}
        onClearFindings={handleClearFindings}
        onExportFindings={handleExportFindings}
        onShowToast={showToast}
      />

      {/* Hedef Çalışma Alanları (Target Workspaces) Modalı */}
      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={handleCreateWorkspace}
        onUpdateWorkspace={handleUpdateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      {/* Canlı Keşif Sonuçları (CRT.sh & Wayback Machine) Modalı */}
      <ReconResultsModal
        isOpen={isReconModalOpen}
        onClose={() => setIsReconModalOpen(false)}
        type={reconType}
        target={reconTarget}
        subdomains={subdomains}
        waybackUrls={waybackUrls}
        isLoading={isReconLoading}
      />

      {/* Ayarlar & API Kasası Modalı */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onTestAPIKey={handleTestAPIKey}
        onResetToDefaults={handleResetToDefaults}
        onClearFindings={handleClearFindings}
        onOpenManageModal={() => setIsManageModalOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenFindingsModal={() => setIsFindingsModalOpen(true)}
        templatesCount={templates.length}
        workspacesCount={workspaces.length}
        findingsCount={findings.length}
        onShowToast={showToast}
      />

      {/* Canlı GitHub Sızıntı Keşfi Modalı */}
      <GitHubLeaksModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        target={target}
        leaks={githubLeaks}
        isLoading={isGitHubLoading}
        onRefresh={handleScanGitHubLeaks}
        onFlagAsFinding={(leak) => {
          openFlagModal({
            query: leak.query,
            description: `${leak.description} - ${leak.repoName} (${leak.path})`,
            category: "Secrets & Config",
            evidenceUrl: leak.htmlUrl,
            evidenceURL: leak.htmlUrl
          });
        }}
      />

      {/* Canlı Shodan Port & Zafiyet Analizi Modalı */}
      <ShodanResultsModal
        isOpen={isShodanModalOpen}
        onClose={() => setIsShodanModalOpen(false)}
        target={target}
        hosts={shodanHosts}
        isLoading={isShodanLoading}
        onRefresh={handleScanShodan}
        onFlagAsFinding={(finding) => {
          openFlagModal({
            query: finding.query,
            description: finding.description,
            category: finding.category || "Port & Vulnerability",
            evidenceUrl: finding.evidenceUrl || finding.evidenceURL,
            evidenceURL: finding.evidenceUrl || finding.evidenceURL
          });
        }}
      />

      {/* Canlı Censys Host & Servis Keşfi Modalı */}
      <CensysResultsModal
        isOpen={isCensysModalOpen}
        onClose={() => setIsCensysModalOpen(false)}
        target={target}
        hosts={censysHosts}
        isLoading={isCensysLoading}
        onRefresh={handleScanCensys}
        onFlagAsFinding={(finding) => {
          openFlagModal({
            query: finding.query,
            description: finding.description,
            category: finding.category || "Network & Infrastructure",
            evidenceUrl: finding.evidenceUrl || finding.evidenceURL,
            evidenceURL: finding.evidenceUrl || finding.evidenceURL
          });
        }}
      />

      {/* JavaScript Gizli API & Secret Avcısı (JS Secret Miner) Modalı */}
      <JSAnalysisModal
        isOpen={isJSAnalysisModalOpen}
        onClose={() => setIsJSAnalysisModalOpen(false)}
        target={target}
        result={jsAnalysisResult}
        isLoading={isJSAnalysisLoading}
        onRefresh={() => handleScanJavaScript(target)}
        onFlagAsFinding={(finding) => {
          openFlagModal({
            query: finding.query,
            description: finding.description,
            category: finding.category || "JS Secret Sızıntısı",
            evidenceUrl: finding.evidenceUrl,
            evidenceURL: finding.evidenceUrl,
            severity: finding.severity || "High",
            notes: finding.notes || ""
          });
        }}
      />

      {/* DNS & Reverse IP Ağ Haritası Modalı */}
      <DNSNetworkMapModal
        isOpen={isDNSMapModalOpen}
        onClose={() => setIsDNSMapModalOpen(false)}
        target={target}
        result={dnsMapResult}
        isLoading={isDNSMapLoading}
        onRefresh={() => handleScanDNSMap(target)}
        onSelectNewTarget={(newTarget) => {
          setTarget(newTarget);
          handleScanDNSMap(newTarget);
        }}
        onFlagAsFinding={(finding) => {
          openFlagModal({
            query: finding.query || target,
            description: finding.description || "DNS & Reverse IP Altyapı Tespiti",
            category: finding.category || "Network & Infrastructure",
            evidenceUrl: finding.evidenceUrl || target,
            evidenceURL: finding.evidenceUrl || target,
            severity: finding.severity || "Medium",
            notes: finding.notes || ""
          });
        }}
      />

      {/* CTI & Pentest Yönetici Raporu Modalı */}
      <ExecutiveReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        target={target}
        activeWorkspace={activeWorkspace}
        probeResult={probeResult}
        findings={findings}
        shodanHosts={shodanHosts}
        censysHosts={censysHosts}
        githubLeaks={githubLeaks}
        jsAnalysisResult={jsAnalysisResult}
        dnsMapResult={dnsMapResult}
      />

      {/* Bulgu Olarak İşaretle (Flag as Finding) Modalı - Diğer tüm keşif modallarının en üstünde açılır */}
      <FlagFindingModal
        isOpen={isFlagModalOpen}
        onClose={closeFlagModal}
        dork={flaggingDork}
        target={target}
        onSaveFinding={handleSaveFinding}
      />

      {/* Arka plan ışık efektleri */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      {/* Toast Bildirimi */}
      <Toast message={toast} />

      {/* Üst Navigasyon Çubuğu (Yalnızca sonuçlarda aşağı kaydırıldığında yukarıdan zarifçe iner) */}
      <Navbar
        isVisible={navVisible}
        target={target}
        onTargetChange={setTarget}
        onTargetBlur={handleTargetBlur}
        onGenerate={handleGenerate}
        categories={categories}
        selectedFilter={filter}
        onFilterChange={setFilter}
        hasDorks={dorks.length > 0}
        onExport={handleExport}
        onLogoClick={scrollToTop}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenManageModal={() => setIsManageModalOpen(true)}
        onOpenFindingsModal={() => setIsFindingsModalOpen(true)}
        findingsCount={findings.length}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Ana Kaydırma Alanı */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={`h-full w-full relative z-10 transition-all ${
          dorks.length > 0
            ? 'overflow-y-auto custom-scrollbar'
            : 'overflow-hidden flex flex-col justify-center items-center'
        }`}
      >
        {/* Hero Karşılama ve Arama Bölümü */}
        <Hero
          target={target}
          onTargetChange={setTarget}
          onTargetBlur={handleTargetBlur}
          onGenerate={handleGenerate}
          categories={categories}
          selectedFilter={filter}
          onFilterChange={setFilter}
          onLogoClick={() => setSplashDone(false)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenManageModal={() => setIsManageModalOpen(true)}
          onOpenFindingsModal={() => setIsFindingsModalOpen(true)}
          findingsCount={findings.length}
          selectedEngine={selectedEngine}
          onEngineChange={setSelectedEngine}
          activeWorkspace={activeWorkspace}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenJSAnalysis={() => handleScanJavaScript(target)}
          onOpenDNSMap={() => handleScanDNSMap(target)}
          onOpenReport={() => setIsReportModalOpen(true)}
          hasDorks={dorks.length > 0}
        />

        {/* Canlı Hedef HTTP Denetim Kartı (Durum Kodu, Yanıt Süresi, Sunucu Başlığı, Teknoloji Parmak İzleri) */}
        {probeResult && (
          <div className={`flex justify-center px-6 relative z-20 w-full ${dorks.length > 0 ? '-mt-2 mb-6' : 'mt-1 mb-2'}`}>
            <TargetProbeCard
              probeResult={probeResult}
              isProbing={isProbing}
              onReProbe={() => runProbeTarget()}
              selectedTechFilter={selectedTechFilter}
              onSelectTech={setSelectedTechFilter}
            />
          </div>
        )}

        {/* GitHub Canlı Sızıntı Bilgi ve İnceleme Çubuğu */}
        {selectedEngine === 'github' && (dorks || []).length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-6 mb-4 relative z-20">
            {settings?.githubToken && settings.githubToken.trim() ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/80">
                    GitHub Token Aktif: <strong className="text-white font-mono">{(githubLeaks || []).length} adet</strong> canlı kod sızıntısı tespit edildi.
                  </span>
                </div>
                <button
                  onClick={() => setIsGitHubModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-white/20 active:scale-95"
                >
                  <span>Sızıntıları Gör ({(githubLeaks || []).length})</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs text-amber-300/90">
                  <span>Canlı GitHub sızıntı taraması (API) için ücretsiz Token ekleyebilirsiniz.</span>
                </div>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs transition-colors cursor-pointer border border-amber-500/30"
                >
                  Token Ekle
                </button>
              </div>
            )}
          </div>
        )}

        {/* Shodan Canlı Port & Zafiyet Bilgi ve İnceleme Çubuğu */}
        {selectedEngine === 'shodan' && (dorks || []).length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-6 mb-4 relative z-20">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40">
              <div className="flex items-center gap-2.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${(shodanHosts || []).length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
                <span className="text-white/80">
                  {settings?.shodanKey && settings.shodanKey.trim() ? (
                    <>Shodan API Aktif: <strong className="text-white font-mono">{(shodanHosts || []).reduce((acc, h) => acc + (h.ports ? h.ports.length : 0), 0)} port</strong> ve <strong className="text-white font-mono">{(shodanHosts || []).reduce((acc, h) => acc + (h.vulns ? h.vulns.length : 0), 0)} CVE</strong> tespit edildi.</>
                  ) : (
                    <>Shodan InternetDB (Ücretsiz): <strong className="text-white font-mono">{(shodanHosts || []).reduce((acc, h) => acc + (h.ports ? h.ports.length : 0), 0)} port</strong> ve zafiyet verisi hazır.</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(!settings?.shodanKey || !settings.shodanKey.trim()) && (
                  <button
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors cursor-pointer border border-white/10"
                    title="Resmi API Key Ekle"
                  >
                    Key Ekle
                  </button>
                )}
                <button
                  onClick={() => setIsShodanModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-white/20 active:scale-95"
                >
                  <span>Port & CVE Analizini Gör</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Censys Canlı Host & Servis Bilgi ve İnceleme Çubuğu */}
        {selectedEngine === 'censys' && (dorks || []).length > 0 && (
          <div className="w-full max-w-3xl mx-auto px-6 mb-4 relative z-20">
            {(settings?.censysId && settings.censysId.trim()) || (settings?.censysSecret && settings.censysSecret.trim()) ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-white/80">
                    Censys API Aktif: <strong className="text-white font-mono">{(censysHosts || []).length} adet</strong> aktif ana bilgisayar keşfedildi.
                  </span>
                </div>
                <button
                  onClick={() => setIsCensysModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-white/20 active:scale-95"
                >
                  <span>Hostları İncele ({(censysHosts || []).length})</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs text-cyan-300/90">
                  <span>Canlı Censys host taraması için Ayarlar'dan API Token ekleyebilirsiniz.</span>
                </div>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs transition-colors cursor-pointer border border-cyan-500/30"
                >
                  API Ekle
                </button>
              </div>
            )}
          </div>
        )}

        {/* JS Secret Miner Canlı Bilgi ve İnceleme Çubuğu */}
        {selectedEngine === 'jsminer' && (
          <div className="w-full max-w-3xl mx-auto px-6 mb-4 relative z-20">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40">
              <div className="flex items-center gap-2.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${jsAnalysisResult ? 'bg-amber-400 animate-pulse' : 'bg-white/40'}`} />
                <span className="text-white/80">
                  {jsAnalysisResult ? (
                    <>JS Analizi Tamamlandı: <strong className="text-white font-mono">{jsAnalysisResult.scannedScripts || 0} dosya</strong>, <strong className="text-red-400 font-mono">{(jsAnalysisResult.secrets || []).length} secret</strong>, <strong className="text-cyan-400 font-mono">{(jsAnalysisResult.endpoints || []).length} dahili API rotası</strong>.</>
                  ) : (
                    <>Hedef web sayfasının JavaScript dosyalarındaki gizli API ve secret'ları tarayın.</>
                  )}
                </span>
              </div>
              <button
                onClick={() => handleScanJavaScript(target)}
                disabled={isJSAnalysisLoading}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-semibold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-400/20 active:scale-95 disabled:opacity-50"
              >
                <span>{isJSAnalysisLoading ? 'Taranıyor...' : 'Analiz Raporunu Aç'}</span>
              </button>
            </div>
          </div>
        )}

        {/* DNS & Reverse IP Ağ Haritası Bilgi ve İnceleme Çubuğu */}
        {selectedEngine === 'dnsmap' && (
          <div className="w-full max-w-3xl mx-auto px-6 mb-4 relative z-20">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg shadow-black/40">
              <div className="flex items-center gap-2.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${dnsMapResult ? 'bg-cyan-400 animate-pulse' : 'bg-white/40'}`} />
                <span className="text-white/80">
                  {dnsMapResult ? (
                    <>Ağ Topolojisi Çıkarıldı: <strong className="text-white font-mono">{(dnsMapResult.records || []).length} DNS kaydı</strong>, <strong className="text-cyan-400 font-mono">{(dnsMapResult.coHostedDomains || []).length} komşu alan adı</strong>, <strong className="text-amber-400 font-mono">{(dnsMapResult.nodes || []).length} düğüm</strong>.</>
                  ) : (
                    <>Hedef alan adının DNS topolojisini ve aynı sunucudaki (Reverse IP) komşu siteleri haritalayın.</>
                  )}
                </span>
              </div>
              <button
                onClick={() => handleScanDNSMap(target)}
                disabled={isDNSMapLoading}
                className="px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-white/20 active:scale-95 disabled:opacity-50"
              >
                <span>{isDNSMapLoading ? 'Topoloji Çıkarılıyor...' : 'Ağ Haritasını Aç'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Dork Sonuç Listesi */}
        <DorkList
          totalDorksCount={dorks.length}
          filteredDorks={filteredDorks}
          target={target}
          findings={findings}
          onCopy={copyToClipboard}
          onSearch={executeSearch}
          onProbeURL={handleProbeURL}
          onFlag={openFlagModal}
        />
      </div>
    </div>
  );
}
