"use client";

import { useState } from 'react';
import './globals.css';
import { useDorkful } from '../hooks/useDorkful';
import SplashScreen from '../components/SplashScreen';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import DorkList from '../components/DorkList';
import Toast from '../components/Toast';
import ManageDorksModal from '../components/ManageDorksModal';
import TargetProbeCard from '../components/TargetProbeCard';
import FlagFindingModal from '../components/FlagFindingModal';
import FindingsLockerModal from '../components/FindingsLockerModal';
import WorkspaceModal from '../components/WorkspaceModal';
import SettingsModal from '../components/SettingsModal';
import ExecutiveReportModal from '../components/ExecutiveReportModal';
import ReconHubModal from '../components/ReconHubModal';
import AmbientBackground from '../components/AmbientBackground';

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
    isManageModalOpen,
    manageModalTab,
    openManageModal,
    closeManageModal,
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
    // Merkezi İstihbarat & Keşif Hub
    isReconHubOpen,
    reconHubTab,
    openReconHub,
    closeReconHub,
    // CRT.sh & Wayback
    reconType,
    reconTarget,
    subdomains,
    waybackUrls,
    isReconLoading,
    handleScanCRT,
    handleScanWayback,
    // Ayarlar & API Kasası
    settings,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    handleSaveSettings,
    handleTestAPIKey,
    // GitHub Canlı Kod Sızıntısı
    githubLeaks,
    isGitHubLoading,
    handleScanGitHubLeaks,
    // Shodan Canlı Port & Zafiyet
    shodanHosts,
    isShodanLoading,
    handleScanShodan,
    // Censys Canlı Host & Servis
    censysHosts,
    isCensysLoading,
    handleScanCensys,
    // JS Secret Miner (JavaScript Gizli API & Secret Avcısı)
    jsAnalysisResult,
    isJSAnalysisLoading,
    handleScanJavaScript,
    // Akıllı Teknoloji Parmak İzi (Tech Fingerprinting)
    selectedTechFilter,
    setSelectedTechFilter,
    // DNS & Reverse IP Ağ Haritası
    dnsMapResult,
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

      {/* Konsolide Dork & Şablon Stüdyosu (Ekle & Yönet) */}
      <ManageDorksModal
        isOpen={isManageModalOpen}
        initialTab={manageModalTab}
        onClose={closeManageModal}
        templates={templates}
        categories={categories}
        onAddDork={handleAddCustomDork}
        onUpdateDork={handleUpdateDork}
        onDeleteDork={handleDeleteDork}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Merkezi İstihbarat & Keşif Merkezi (Ağ Haritası, Shodan, Censys, GitHub, JS Miner, CRT.sh/Wayback) */}
      <ReconHubModal
        isOpen={isReconHubOpen}
        onClose={closeReconHub}
        initialTab={reconHubTab}
        target={target}
        onSelectNewTarget={(newTarget) => {
          setTarget(newTarget);
          handleScanDNSMap(newTarget);
        }}
        // DNS Map
        dnsMapResult={dnsMapResult}
        isDNSMapLoading={isDNSMapLoading}
        onRefreshDNSMap={handleScanDNSMap}
        // Shodan
        shodanHosts={shodanHosts}
        isShodanLoading={isShodanLoading}
        onRefreshShodan={handleScanShodan}
        // Censys
        censysHosts={censysHosts}
        isCensysLoading={isCensysLoading}
        onRefreshCensys={handleScanCensys}
        // GitHub
        githubLeaks={githubLeaks}
        isGitHubLoading={isGitHubLoading}
        onRefreshGitHub={handleScanGitHubLeaks}
        // JS Miner
        jsAnalysisResult={jsAnalysisResult}
        isJSAnalysisLoading={isJSAnalysisLoading}
        onRefreshJS={handleScanJavaScript}
        // CRT.sh & Wayback
        subdomains={subdomains}
        waybackUrls={waybackUrls}
        isReconLoading={isReconLoading}
        reconType={reconType}
        onRefreshCRT={handleScanCRT}
        onRefreshWayback={handleScanWayback}
        // Bulgular & Ayarlar
        onFlagAsFinding={(finding) => {
          openFlagModal({
            query: finding.query || target,
            description: finding.description,
            category: finding.category || "Security Finding",
            evidenceUrl: finding.evidenceUrl || finding.evidenceURL || target,
            evidenceURL: finding.evidenceUrl || finding.evidenceURL || target,
            severity: finding.severity || "Medium",
            notes: finding.notes || ""
          });
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
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

      {/* Ayarlar & API Kasası Modalı */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onTestAPIKey={handleTestAPIKey}
        onResetToDefaults={handleResetToDefaults}
        onClearFindings={handleClearFindings}
        onOpenManageModal={() => openManageModal('dorks')}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenFindingsModal={() => setIsFindingsModalOpen(true)}
        templatesCount={templates.length}
        workspacesCount={workspaces.length}
        findingsCount={findings.length}
        onShowToast={showToast}
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

      {/* Bulgu Olarak İşaretle (Flag as Finding) Modalı */}
      <FlagFindingModal
        isOpen={isFlagModalOpen}
        onClose={closeFlagModal}
        dork={flaggingDork}
        target={target}
        onSaveFinding={handleSaveFinding}
      />

      {/* Dinamik Ambient Işık Haleleri ve Siber Doku Efekti */}
      <AmbientBackground />

      {/* Toast Bildirimi */}
      <Toast message={toast} />

      {/* Üst Navigasyon Çubuğu */}
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
        onOpenAddModal={() => openManageModal('add')}
        onOpenManageModal={() => openManageModal('dorks')}
        onOpenFindingsModal={() => setIsFindingsModalOpen(true)}
        findingsCount={findings.length}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenReconHub={() => openReconHub('dnsmap')}
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
          onOpenAddModal={() => openManageModal('add')}
          onOpenManageModal={() => openManageModal('dorks')}
          onOpenFindingsModal={() => setIsFindingsModalOpen(true)}
          findingsCount={findings.length}
          selectedEngine={selectedEngine}
          onEngineChange={setSelectedEngine}
          activeWorkspace={activeWorkspace}
          onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenReconHub={() => openReconHub('dnsmap')}
          onOpenJSAnalysis={() => openReconHub('jsminer')}
          onOpenDNSMap={() => openReconHub('dnsmap')}
          onOpenReport={() => setIsReportModalOpen(true)}
          hasDorks={dorks.length > 0}
        />

        {/* Canlı Hedef HTTP Denetim Kartı */}
        {probeResult && (
          <div className={`flex justify-center px-6 relative z-20 w-full ${dorks.length > 0 ? '-mt-1 mb-5' : 'mt-1 mb-2'}`}>
            <TargetProbeCard
              probeResult={probeResult}
              isProbing={isProbing}
              onReProbe={() => runProbeTarget()}
              selectedTechFilter={selectedTechFilter}
              onSelectTech={setSelectedTechFilter}
            />
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
