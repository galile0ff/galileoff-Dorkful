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
        onGenerate={handleGenerate}
        categories={categories}
        selectedFilter={filter}
        onFilterChange={setFilter}
        hasDorks={dorks.length > 0}
        onExport={handleExport}
        onLogoClick={scrollToTop}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenManageModal={() => setIsManageModalOpen(true)}
      />

      {/* Ana Kaydırma Alanı */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full w-full overflow-y-auto custom-scrollbar relative z-10"
      >
        {/* Hero Karşılama ve Arama Bölümü */}
        <Hero
          target={target}
          onTargetChange={setTarget}
          onGenerate={handleGenerate}
          categories={categories}
          selectedFilter={filter}
          onFilterChange={setFilter}
          onLogoClick={() => setSplashDone(false)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenManageModal={() => setIsManageModalOpen(true)}
        />

        {/* Dork Sonuç Listesi */}
        <DorkList
          totalDorksCount={dorks.length}
          filteredDorks={filteredDorks}
          onCopy={copyToClipboard}
          onSearch={executeSearch}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}
