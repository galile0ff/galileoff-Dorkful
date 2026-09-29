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

      {/* Bulgu Olarak İşaretle (Flag as Finding) Modalı */}
      <FlagFindingModal
        isOpen={isFlagModalOpen}
        onClose={closeFlagModal}
        dork={flaggingDork}
        target={target}
        onSaveFinding={handleSaveFinding}
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
          hasDorks={dorks.length > 0}
        />

        {/* Canlı Hedef HTTP Denetim Kartı (Durum Kodu, Yanıt Süresi, Sunucu Başlığı) */}
        {probeResult && (
          <div className={`flex justify-center px-6 relative z-20 w-full ${dorks.length > 0 ? '-mt-2 mb-6' : 'mt-1 mb-2'}`}>
            <TargetProbeCard
              probeResult={probeResult}
              isProbing={isProbing}
              onReProbe={() => runProbeTarget()}
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
