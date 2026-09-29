package services

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"dorkapp/backend/data"
	"dorkapp/backend/models"
)

// DorkService, dork üretme, filtreleme, düzenleme, silme ve kalıcı saklama işlemlerini yönetir.
type DorkService struct {
	mu          sync.RWMutex
	templates   []models.Template
	storagePath string
}

// NewDorkService, varsayılan veya önceden kaydedilmiş şablonları yükleyerek DorkService başlatır.
func NewDorkService() *DorkService {
	storagePath := getCustomStoragePath()
	service := &DorkService{
		templates:   []models.Template{},
		storagePath: storagePath,
	}

	// Diskten kayıtlı şablonları yükle, yoksa varsayılanları kullan
	if !service.loadSavedTemplates() {
		service.templates = append([]models.Template{}, data.DefaultTemplates...)
	}

	return service
}

// CleanTargetDomain, alan adını temizler, protokol ve yolları ayıklar, gerekirse '.com' uzantısı ekler.
func CleanTargetDomain(target string) string {
	clean := strings.TrimSpace(target)
	clean = strings.TrimPrefix(clean, "https://")
	clean = strings.TrimPrefix(clean, "http://")
	if idx := strings.Index(clean, "/"); idx != -1 {
		clean = clean[:idx]
	}
	if idx := strings.Index(clean, "?"); idx != -1 {
		clean = clean[:idx]
	}
	if idx := strings.Index(clean, "#"); idx != -1 {
		clean = clean[:idx]
	}
	clean = strings.TrimSpace(clean)

	// Nokta içermiyorsa ve 'localhost' değilse varsayılan olarak '.com' ekle
	if clean != "" && !strings.Contains(clean, ".") && !strings.EqualFold(clean, "localhost") {
		clean = clean + ".com"
	}
	return strings.ToLower(clean)
}

// GenerateDorks, verilen hedef alan adı veya IP için dork listesini oluşturur.
func (s *DorkService) GenerateDorks(target string) []models.Dork {
	cleanTarget := CleanTargetDomain(target)
	if cleanTarget == "" {
		return []models.Dork{}
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	dorks := make([]models.Dork, 0, len(s.templates))
	for _, t := range s.templates {
		query := strings.ReplaceAll(t.Template, "{target}", cleanTarget)
		dorks = append(dorks, models.Dork{
			Query:       query,
			Description: t.Description,
			Category:    t.Category,
		})
	}
	return dorks
}

// AddTemplate, çalışma zamanında yeni bir şablon ekler ve diske kaydeder.
func (s *DorkService) AddTemplate(t models.Template) error {
	trimmedQuery := strings.TrimSpace(t.Template)
	trimmedDesc := strings.TrimSpace(t.Description)
	trimmedCat := strings.TrimSpace(t.Category)

	if trimmedQuery == "" {
		return errors.New("dork sorgu şablonu boş olamaz")
	}
	if trimmedDesc == "" {
		return errors.New("dork açıklaması boş olamaz")
	}
	if trimmedCat == "" {
		trimmedCat = "Custom"
	}

	newTemplate := models.Template{
		Template:    trimmedQuery,
		Description: trimmedDesc,
		Category:    trimmedCat,
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.templates = append(s.templates, newTemplate)
	return s.saveTemplates()
}

// UpdateTemplate, belirtilen indeksteki dork şablonunu günceller.
func (s *DorkService) UpdateTemplate(index int, t models.Template) error {
	trimmedQuery := strings.TrimSpace(t.Template)
	trimmedDesc := strings.TrimSpace(t.Description)
	trimmedCat := strings.TrimSpace(t.Category)

	if trimmedQuery == "" {
		return errors.New("dork sorgu şablonu boş olamaz")
	}
	if trimmedDesc == "" {
		return errors.New("dork açıklaması boş olamaz")
	}
	if trimmedCat == "" {
		trimmedCat = "Custom"
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if index < 0 || index >= len(s.templates) {
		return errors.New("geçersiz şablon indeksi")
	}

	s.templates[index] = models.Template{
		Template:    trimmedQuery,
		Description: trimmedDesc,
		Category:    trimmedCat,
	}

	return s.saveTemplates()
}

// DeleteTemplate, belirtilen indeksteki şablonu siler.
func (s *DorkService) DeleteTemplate(index int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if index < 0 || index >= len(s.templates) {
		return errors.New("geçersiz şablon indeksi")
	}

	s.templates = append(s.templates[:index], s.templates[index+1:]...)
	return s.saveTemplates()
}

// RenameCategory, mevcut bir kategorinin adını tüm şablonlarda toplu olarak değiştirir.
func (s *DorkService) RenameCategory(oldCategory string, newCategory string) error {
	trimmedOld := strings.TrimSpace(oldCategory)
	trimmedNew := strings.TrimSpace(newCategory)

	if trimmedOld == "" || trimmedNew == "" {
		return errors.New("kategori isimleri boş olamaz")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	updatedCount := 0
	for i := range s.templates {
		if strings.EqualFold(s.templates[i].Category, trimmedOld) {
			s.templates[i].Category = trimmedNew
			updatedCount++
		}
	}

	if updatedCount == 0 {
		return errors.New("güncellenecek kategori bulunamadı")
	}

	return s.saveTemplates()
}

// DeleteCategory, belirtilen kategoriye ait tüm şablonları siler.
func (s *DorkService) DeleteCategory(category string) error {
	trimmedCat := strings.TrimSpace(category)
	if trimmedCat == "" {
		return errors.New("kategori adı boş olamaz")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	filtered := make([]models.Template, 0, len(s.templates))
	for _, t := range s.templates {
		if !strings.EqualFold(t.Category, trimmedCat) {
			filtered = append(filtered, t)
		}
	}

	s.templates = filtered
	return s.saveTemplates()
}

// ResetToDefaults, tüm şablonları fabrika ayarlarına (orijinal varsayılanlara) sıfırlar.
func (s *DorkService) ResetToDefaults() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.templates = append([]models.Template{}, data.DefaultTemplates...)
	if s.storagePath != "" {
		_ = os.Remove(s.storagePath)
	}
	return nil
}

// GetTemplates, kayıtlı tüm şablonları döner.
func (s *DorkService) GetTemplates() []models.Template {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.Template, len(s.templates))
	copy(result, s.templates)
	return result
}

// GetCategories, mevcut şablonlardaki benzersiz kategorilerin listesini döner.
func (s *DorkService) GetCategories() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	categoryMap := make(map[string]bool)
	order := []string{"All"}

	for _, t := range s.templates {
		if t.Category != "" && !categoryMap[t.Category] {
			categoryMap[t.Category] = true
			order = append(order, t.Category)
		}
	}

	return order
}

// getCustomStoragePath, şablonların saklanacağı dosya yolunu döner.
// Dosya çalışan uygulamanın derleme dizininde (build/bin/templates.json) saklanır.
// Bu sayede uygulama kapatılıp açıldığında veriler korunur;
// ancak yeni bir build alındığında çıktı klasörü yenilendiği için sıfırlanır.
func getCustomStoragePath() string {
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		// Go run gibi sistem geçici (temp) dizininde değilse .exe'nin yanına yaz
		if !strings.Contains(strings.ToLower(exePath), "temp") {
			return filepath.Join(exeDir, "templates.json")
		}
	}

	// Geliştirme veya temp ortamında doğrudan build/bin klasörüne yaz
	_ = os.MkdirAll(filepath.Join("build", "bin"), 0755)
	return filepath.Join("build", "bin", "templates.json")
}

// loadSavedTemplates, diskte kayıtlı şablonları yükler.
func (s *DorkService) loadSavedTemplates() bool {
	if s.storagePath == "" {
		return false
	}

	fileBytes, err := os.ReadFile(s.storagePath)
	if err != nil {
		return false
	}

	var loaded []models.Template
	if err := json.Unmarshal(fileBytes, &loaded); err == nil && len(loaded) > 0 {
		s.templates = loaded
		return true
	}

	return false
}

// saveTemplates, tüm şablonları diske kaydeder.
func (s *DorkService) saveTemplates() error {
	if s.storagePath == "" {
		return nil
	}

	fileBytes, err := json.MarshalIndent(s.templates, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.storagePath, fileBytes, 0644)
}
