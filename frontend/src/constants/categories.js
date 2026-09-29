// Dork kategorileri ve filtreleme listesi
export const CATEGORIES = [
  "All",
  "Files",
  "Admin",
  "Data",
  "Dir",
  "APIs",
  "IoT"
];

// Filtre eşleştirme mantığı
export const matchCategory = (dorkCategory, selectedFilter) => {
  if (selectedFilter === "All") return true;
  if (selectedFilter === "Dir") return dorkCategory.includes("Dir");
  if (selectedFilter === "Admin") return dorkCategory.includes("Admin");
  if (selectedFilter === "Data") return dorkCategory.includes("Sensitive");
  return dorkCategory === selectedFilter;
};
