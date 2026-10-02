package main

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"dorkapp/backend/models"
	"dorkapp/backend/services"
)

// App, Wails ile Go backend iş mantığı arasındaki köprü (controller) yapısıdır.
type App struct {
	ctx                context.Context
	dorkService        *services.DorkService
	exportService      *services.ExportService
	probeService       *services.ProbeService
	findingService     *services.FindingService
	workspaceService   *services.WorkspaceService
	reconService       *services.ReconService
	multiEngineService *services.MultiEngineService
	settingsService    *services.SettingsService
	jsAnalyzerService  *services.JSAnalyzerService
	dnsMapService      *services.DNSMapService
}

// NewApp, servis bağımlılıklarıyla birlikte yeni bir App örneği oluşturur.
func NewApp() *App {
	return &App{
		dorkService:        services.NewDorkService(),
		exportService:      services.NewExportService(),
		probeService:       services.NewProbeService(),
		findingService:     services.NewFindingService(),
		workspaceService:   services.NewWorkspaceService(),
		reconService:       services.NewReconService(),
		multiEngineService: services.NewMultiEngineService(),
		settingsService:    services.NewSettingsService(),
		jsAnalyzerService:  services.NewJSAnalyzerService(),
		dnsMapService:      services.NewDNSMapService(),
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

// GetWorkspaces, kayıtlı hedef çalışma alanlarını döner.
func (a *App) GetWorkspaces() []models.Workspace {
	return a.workspaceService.GetWorkspaces()
}

// CreateWorkspace, yeni bir hedef çalışma alanı oluşturur.
func (a *App) CreateWorkspace(name, domain, company, asn, ipRange, githubOrg string) (models.Workspace, error) {
	return a.workspaceService.CreateWorkspace(name, domain, company, asn, ipRange, githubOrg)
}

// UpdateWorkspace, mevcut bir çalışma alanını günceller.
func (a *App) UpdateWorkspace(id, name, domain, company, asn, ipRange, githubOrg string) error {
	return a.workspaceService.UpdateWorkspace(id, name, domain, company, asn, ipRange, githubOrg)
}

// DeleteWorkspace, belirtilen çalışma alanını siler.
func (a *App) DeleteWorkspace(id string) error {
	return a.workspaceService.DeleteWorkspace(id)
}

// GetActiveWorkspaceID, aktif çalışma alanı kimliğini döner.
func (a *App) GetActiveWorkspaceID() string {
	return a.workspaceService.GetActiveWorkspaceID()
}

// SetActiveWorkspaceID, aktif çalışma alanını belirler.
func (a *App) SetActiveWorkspaceID(id string) error {
	return a.workspaceService.SetActiveWorkspaceID(id)
}

// FetchSubdomains, CRT.sh üzerinden sertifika şeffaflığı kayıtlarından alt alan adlarını çıkarır.
func (a *App) FetchSubdomains(domain string) ([]models.SubdomainResult, error) {
	return a.reconService.FetchSubdomains(domain)
}

// FetchWaybackURLs, Archive.org üzerinden hedefin arşivlenmiş URL'lerini çeker.
func (a *App) FetchWaybackURLs(domain string) ([]models.WaybackResult, error) {
	return a.reconService.FetchWaybackURLs(domain)
}

// GenerateMultiEngineDorks, GitHub, Shodan, Censys vb. istihbarat motorları için dork üretir.
func (a *App) GenerateMultiEngineDorks(engine string, workspace models.Workspace) []models.Dork {
	return a.multiEngineService.GenerateMultiEngineDorks(engine, workspace)
}

// ProbeSubdomainsBatch, alt alan adlarının HTTP canlılık durumlarını eşzamanlı olarak tarar.
// Ayrıca runtime.EventsEmit ile her bir alt alan adı test edildiğinde arayüze anında bildirim yollar.
func (a *App) ProbeSubdomainsBatch(subdomains []string) map[string]models.ProbeResult {
	return a.probeService.ProbeSubdomainsBatch(subdomains, func(res models.ProbeResult) {
		runtime.EventsEmit(a.ctx, "subdomain-probe-update", res)
	})
}

// GetSettings, uygulamanın genel yapılandırmasını ve kayıtlı API anahtarlarını döner.
func (a *App) GetSettings() models.AppSettings {
	return a.settingsService.GetSettings()
}

// SaveSettings, uygulamanın ayarlarını ve API anahtarlarını günceller.
func (a *App) SaveSettings(settings models.AppSettings) error {
	return a.settingsService.SaveSettings(settings)
}

// TestAPIKey, seçilen istihbarat motoru için girilen anahtarın canlı doğrulama testini yapar.
func (a *App) TestAPIKey(engine, key1, key2 string) models.APIKeyTestResult {
	return a.settingsService.TestAPIKey(engine, key1, key2)
}

// QueryShodanInternetDB, hedefin IP ve açık portlarını Shodan'ın tamamen ücretsiz ve keysiz servisinden sorgular.
func (a *App) QueryShodanInternetDB(target string) (*models.ShodanInternetDBResult, error) {
	return a.settingsService.QueryShodanInternetDB(target)
}

// SearchGitHubLeaks, kullanıcının kayıtlı GitHub token'ı ile hedef alan adı ve organizasyon için canlı sızıntı taraması yapar.
func (a *App) SearchGitHubLeaks(domain, org string) ([]models.GitHubLeakResult, error) {
	settings := a.settingsService.GetSettings()
	return a.multiEngineService.SearchGitHubLeaks(domain, org, settings.GithubToken)
}

// SearchShodanHost, hedef için Shodan API (key varsa) veya InternetDB (keysiz) üzerinden canlı port ve zafiyet taraması yapar.
func (a *App) SearchShodanHost(target string) ([]models.ShodanHostItem, error) {
	settings := a.settingsService.GetSettings()
	return a.multiEngineService.SearchShodanHost(target, settings.ShodanKey)
}

// SearchCensysHosts, hedef için Censys Search API v2 üzerinden canlı host ve servis taraması yapar.
func (a *App) SearchCensysHosts(target string) ([]models.CensysHostItem, error) {
	settings := a.settingsService.GetSettings()
	return a.multiEngineService.SearchCensysHosts(target, settings.CensysID, settings.CensysSecret)
}

// AnalyzeTargetJavaScript, hedefin web sayfalarında yer alan JavaScript dosyalarını indirip gizli API uç noktaları ve sızdırılmış anahtarları tespit eder.
func (a *App) AnalyzeTargetJavaScript(target string) models.JSAnalysisResult {
	return a.jsAnalyzerService.AnalyzeTarget(target)
}

// FetchDNSAndReverseIP, hedefin tüm DNS kayıtlarını çözümler ve aynı sunucudaki paylaşımlı komşu siteleri tespit eder.
func (a *App) FetchDNSAndReverseIP(target string) models.DNSMapResult {
	return a.dnsMapService.FetchDNSAndReverseIP(target)
}

