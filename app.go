package main

import (
	"context"

	"dorkapp/backend/models"
	"dorkapp/backend/services"
)

// App, Wails ile Go backend iş mantığı arasındaki köprü (controller) yapısıdır.
type App struct {
	ctx           context.Context
	dorkService   *services.DorkService
	exportService *services.ExportService
	probeService  *services.ProbeService
}

// NewApp, servis bağımlılıklarıyla birlikte yeni bir App örneği oluşturur.
func NewApp() *App {
	return &App{
		dorkService:   services.NewDorkService(),
		exportService: services.NewExportService(),
		probeService:  services.NewProbeService(),
	}
}

// startup, Wails uygulaması başlatıldığında çağrılır.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GenerateDorks, verilen hedef için dork listesi üretir.
func (a *App) GenerateDorks(target string) []models.Dork {
	return a.dorkService.GenerateDorks(target)
}

// ExportJSON, dork listesini JSON dosyası olarak kullanıcının masaüstüne kaydeder.
func (a *App) ExportJSON(dorks []models.Dork) (string, error) {
	return a.exportService.ExportJSON(dorks)
}

// GetTemplates, kayıtlı tüm şablonları döner.
func (a *App) GetTemplates() []models.Template {
	return a.dorkService.GetTemplates()
}

// AddCustomDork, yeni bir özel dork şablonu ekler ve saklar.
func (a *App) AddCustomDork(template string, description string, category string) error {
	return a.dorkService.AddTemplate(models.Template{
		Template:    template,
		Description: description,
		Category:    category,
	})
}

// UpdateTemplate, mevcut bir dork şablonunu günceller.
func (a *App) UpdateTemplate(index int, template string, description string, category string) error {
	return a.dorkService.UpdateTemplate(index, models.Template{
		Template:    template,
		Description: description,
		Category:    category,
	})
}

// DeleteTemplate, belirtilen indeksteki dork şablonunu siler.
func (a *App) DeleteTemplate(index int) error {
	return a.dorkService.DeleteTemplate(index)
}

// RenameCategory, bir kategorinin adını tüm şablonlarda günceller.
func (a *App) RenameCategory(oldCategory string, newCategory string) error {
	return a.dorkService.RenameCategory(oldCategory, newCategory)
}

// DeleteCategory, belirtilen kategoriye ait tüm dorkları siler.
func (a *App) DeleteCategory(category string) error {
	return a.dorkService.DeleteCategory(category)
}

// ResetToDefaults, dork şablonlarını fabrika ayarlarına sıfırlar.
func (a *App) ResetToDefaults() error {
	return a.dorkService.ResetToDefaults()
}

// GetCategories, sistemdeki tüm benzersiz kategori isimlerini döner.
func (a *App) GetCategories() []string {
	return a.dorkService.GetCategories()
}

// ProbeTarget, hedefin HTTP/HTTPS canlılık durumunu, durum kodunu, yanıt süresini ve sunucu başlığını kontrol eder.
func (a *App) ProbeTarget(target string) models.ProbeResult {
	return a.probeService.ProbeTarget(target)
}

// ProbeURL, doğrudan verilen tam bir URL adresini test eder.
func (a *App) ProbeURL(url string) models.ProbeResult {
	return a.probeService.ProbeURL(url)
}
