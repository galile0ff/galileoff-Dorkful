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
	findingService *services.FindingService
}

// NewApp, servis bağımlılıklarıyla birlikte yeni bir App örneği oluşturur.
func NewApp() *App {
	return &App{
		dorkService:   services.NewDorkService(),
		exportService: services.NewExportService(),
		probeService:  services.NewProbeService(),
		findingService: services.NewFindingService(),
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

// GetFindings, kaydedilmiş tüm bulguları döner.
func (a *App) GetFindings() []models.Finding {
	return a.findingService.GetFindings()
}

// AddFinding, yeni bir güvenlik bulgusu veya kanıt kaydı ekler.
func (a *App) AddFinding(target string, dorkQuery string, category string, severity string, evidenceURL string, notes string, mitreTechniqueID string) (models.Finding, error) {
	var mitre *models.MitreAttack
	switch mitreTechniqueID {
	case "T1552.001":
		mitre = services.MitreCredentialsInFiles
	case "T1190":
		mitre = services.MitreExploitPublicFacing
	case "T1594":
		mitre = services.MitreSearchVictimWebsites
	case "T1596":
		mitre = services.MitreTechnicalDatabases
	case "T1592.002":
		mitre = services.MitreGatherHostSoftware
	case "T1593.002":
		mitre = services.MitreSearchEngines
	default:
		mitre = services.ResolveMitreAttack(category, dorkQuery)
	}
	return a.findingService.AddFinding(target, dorkQuery, category, models.FindingSeverity(severity), evidenceURL, notes, mitre)
}

// UpdateFinding, mevcut bir bulgunun ayrıntılarını günceller.
func (a *App) UpdateFinding(id string, severity string, evidenceURL string, notes string) error {
	return a.findingService.UpdateFinding(id, models.FindingSeverity(severity), evidenceURL, notes)
}

// DeleteFinding, belirtilen kimlikteki bulguyu siler.
func (a *App) DeleteFinding(id string) error {
	return a.findingService.DeleteFinding(id)
}

// ClearFindings, tüm bulguları temizler.
func (a *App) ClearFindings() error {
	return a.findingService.ClearFindings()
}

// ExportFindingsJSON, bulguları masaüstüne JSON CTI raporu olarak dışa aktarır.
func (a *App) ExportFindingsJSON() (string, error) {
	return a.findingService.ExportFindingsJSON()
}

