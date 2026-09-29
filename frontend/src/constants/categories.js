// Dork kategorileri ve filtreleme listesi
export const CATEGORIES = [
  "All",
  "Files & Documents",
  "Config & Secrets",
  "Admin & Portals",
  "Database & Backups",
  "Open Directories & Git",
  "APIs & Endpoints",
  "Cloud & Buckets",
  "Errors & Debug",
  "Cameras & IoT"
];

// Filtre eşleştirme mantığı (Tam ve esnek kategori eşleştirmesi)
export const matchCategory = (dorkCategory, selectedFilter) => {
  if (!selectedFilter || selectedFilter === "All") return true;
  if (!dorkCategory) return false;
  return dorkCategory.toLowerCase().trim() === selectedFilter.toLowerCase().trim();
};
