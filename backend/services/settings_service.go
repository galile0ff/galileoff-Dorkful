package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"dorkapp/backend/models"
)

// SettingsService, kullanıcı yapılandırmasını, API anahtarlarını ve anahtar doğrulama testlerini yönetir.
type SettingsService struct {
	mu          sync.RWMutex
	settings    models.AppSettings
	storagePath string
	client      *http.Client
}

// NewSettingsService, kayıtlı ayarları yükleyerek SettingsService başlatır.
func NewSettingsService() *SettingsService {
	storagePath := getSettingsStoragePath()
	service := &SettingsService{
		settings:    models.DefaultSettings(),
		storagePath: storagePath,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}

	service.loadSavedSettings()
	return service
}

// GetSettings, geçerli yapılandırma ayarlarını döner.
func (s *SettingsService) GetSettings() models.AppSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.settings
}

// SaveSettings, kullanıcı ayarlarını günceller ve yerel diske kaydeder.
func (s *SettingsService) SaveSettings(newSettings models.AppSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Temizleme işlemleri
	newSettings.ShodanKey = strings.TrimSpace(newSettings.ShodanKey)
	newSettings.GithubToken = strings.TrimSpace(newSettings.GithubToken)
	newSettings.CensysID = strings.TrimSpace(newSettings.CensysID)
	newSettings.CensysSecret = strings.TrimSpace(newSettings.CensysSecret)

	if newSettings.ProbeTimeoutSec <= 0 {
		newSettings.ProbeTimeoutSec = 6
	}

	s.settings = newSettings
	return s.saveToFile()
}

// TestAPIKey, verilen istihbarat motorunun anahtarlarını canlı isteklerle test eder.
func (s *SettingsService) TestAPIKey(engine, key1, key2 string) models.APIKeyTestResult {
	cleanEngine := strings.ToLower(strings.TrimSpace(engine))
	cleanKey1 := strings.TrimSpace(key1)
	cleanKey2 := strings.TrimSpace(key2)

	switch cleanEngine {
	case "shodan":
		return s.testShodanKey(cleanKey1)
	case "github":
		return s.testGithubToken(cleanKey1)
	case "censys":
		return s.testCensysKey(cleanKey1, cleanKey2)
	default:
		return models.APIKeyTestResult{
			Engine:  engine,
			Success: false,
			Message: "Bilinmeyen motor türü.",
		}
	}
}

// testShodanKey, Shodan REST API üzerinden anahtar yetkilerini ve kalan kredi durumunu denetler.
func (s *SettingsService) testShodanKey(apiKey string) models.APIKeyTestResult {
	if apiKey == "" {
		return models.APIKeyTestResult{
			Engine:  "shodan",
			Success: false,
			Message: "Shodan API anahtarı boş bırakılamaz.",
		}
	}

	apiURL := fmt.Sprintf("https://api.shodan.io/api-info?key=%s", url.QueryEscape(apiKey))
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return models.APIKeyTestResult{
			Engine:  "shodan",
			Success: false,
			Message: fmt.Sprintf("İstek oluşturulamadı: %v", err),
		}
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return models.APIKeyTestResult{
			Engine:  "shodan",
			Success: false,
			Message: fmt.Sprintf("Ağ bağlantı hatası: %v", err),
		}
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == http.StatusOK {
		var info struct {
			Plan         string `json:"plan"`
			QueryCredits int    `json:"query_credits"`
			ScanCredits  int    `json:"scan_credits"`
			Unlocked     bool   `json:"unlocked"`
		}
		_ = json.Unmarshal(bodyBytes, &info)

		details := fmt.Sprintf("Plan: %s | Sorgu Kredisi: %d | Tarama Kredisi: %d",
			strings.ToUpper(info.Plan), info.QueryCredits, info.ScanCredits)

		return models.APIKeyTestResult{
			Engine:  "shodan",
			Success: true,
			Message: "Shodan API anahtarı doğrulandı.",
			Details: details,
		}
	}

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return models.APIKeyTestResult{
			Engine:  "shodan",
			Success: false,
			Message: "Geçersiz Shodan API anahtarı (401/403). Lütfen anahtarı kontrol edin.",
		}
	}

	return models.APIKeyTestResult{
		Engine:  "shodan",
		Success: false,
		Message: fmt.Sprintf("Shodan API yanıt vermedi (Durum: %d)", resp.StatusCode),
	}
}

// testGithubToken, GitHub API üzerinden token geçerliliğini ve kimlik bilgilerini denetler.
func (s *SettingsService) testGithubToken(token string) models.APIKeyTestResult {
	if token == "" {
		return models.APIKeyTestResult{
			Engine:  "github",
			Success: false,
			Message: "GitHub Personal Access Token boş bırakılamaz.",
		}
	}

	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return models.APIKeyTestResult{
			Engine:  "github",
			Success: false,
			Message: fmt.Sprintf("İstek oluşturulamadı: %v", err),
		}
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "Dorkful-Security-Tool")

	resp, err := s.client.Do(req)
	if err != nil {
		return models.APIKeyTestResult{
			Engine:  "github",
			Success: false,
			Message: fmt.Sprintf("GitHub bağlantı hatası: %v", err),
		}
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == http.StatusOK {
		var user struct {
			Login string `json:"login"`
			Name  string `json:"name"`
		}
		_ = json.Unmarshal(bodyBytes, &user)

		rateLimitRemaining := resp.Header.Get("X-RateLimit-Remaining")
		rateLimitTotal := resp.Header.Get("X-RateLimit-Limit")

		details := fmt.Sprintf("Kullanıcı: @%s | Kalan İstek: %s/%s",
			user.Login, rateLimitRemaining, rateLimitTotal)

		return models.APIKeyTestResult{
			Engine:  "github",
			Success: true,
			Message: "GitHub Personal Access Token doğrulandı.",
			Details: details,
		}
	}

	if resp.StatusCode == http.StatusUnauthorized {
		return models.APIKeyTestResult{
			Engine:  "github",
			Success: false,
			Message: "Geçersiz GitHub Token (401 Unauthorized).",
		}
	}

	return models.APIKeyTestResult{
		Engine:  "github",
		Success: false,
		Message: fmt.Sprintf("GitHub API hatası (Durum: %d)", resp.StatusCode),
	}
}

// testCensysKey, Censys Platform API (v3 PAT) veya Legacy API ID/Secret ikilisini doğrular.
func (s *SettingsService) testCensysKey(apiID, apiSecret string) models.APIKeyTestResult {
	cleanID := strings.TrimSpace(apiID)
	cleanSecret := strings.TrimSpace(apiSecret)

	// 1. Yeni Censys Platform PAT Token Tespiti (censys_...)
	patToken := ""
	if strings.HasPrefix(cleanID, "censys_") {
		patToken = cleanID
	} else if strings.HasPrefix(cleanSecret, "censys_") {
		patToken = cleanSecret
	} else if cleanID != "" && cleanSecret == "" {
		patToken = cleanID
	}

	if patToken != "" {
		testURL := "https://api.platform.censys.io/v3/global/asset/host/8.8.8.8"
		req, err := http.NewRequest("GET", testURL, nil)
		if err != nil {
			return models.APIKeyTestResult{
				Engine:  "censys",
				Success: false,
				Message: fmt.Sprintf("İstek oluşturulamadı: %v", err),
			}
		}

		req.Header.Set("Authorization", "Bearer "+patToken)
		req.Header.Set("Accept", "application/json")
		req.Header.Set("User-Agent", "Dorkful-Security-Tool")

		resp, err := s.client.Do(req)
		if err != nil {
			return models.APIKeyTestResult{
				Engine:  "censys",
				Success: false,
				Message: fmt.Sprintf("Censys Platform bağlantı hatası: %v", err),
			}
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			return models.APIKeyTestResult{
				Engine:  "censys",
				Success: true,
				Message: "Censys Platform API (v3) başarıyla doğrulandı.",
				Details: "Yeni nesil Censys Personal Access Token (PAT) aktif ve çalışıyor.",
			}
		}

		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return models.APIKeyTestResult{
				Engine:  "censys",
				Success: false,
				Message: fmt.Sprintf("Censys kimlik doğrulama başarısız (%d). Token geçersiz veya süresi dolmuş.", resp.StatusCode),
			}
		}

		return models.APIKeyTestResult{
			Engine:  "censys",
			Success: false,
			Message: fmt.Sprintf("Censys Platform API hatası (Durum: %d)", resp.StatusCode),
		}
	}

	// 2. Eski (Legacy) API ID ve Secret Doğrulaması
	if cleanID == "" || cleanSecret == "" {
		return models.APIKeyTestResult{
			Engine:  "censys",
			Success: false,
			Message: "Censys API anahtarı boş olamaz. Tek satırlık PAT anahtarınızı (censys_...) girebilirsiniz.",
		}
	}

	testURL := "https://search.censys.io/api/v2/hosts/search?q=test&per_page=1"
	req, err := http.NewRequest("GET", testURL, nil)
	if err != nil {
		return models.APIKeyTestResult{
			Engine:  "censys",
			Success: false,
			Message: fmt.Sprintf("İstek oluşturulamadı: %v", err),
		}
	}

	req.SetBasicAuth(cleanID, cleanSecret)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "Dorkful-Security-Tool")

	resp, err := s.client.Do(req)
	if err != nil {
		return models.APIKeyTestResult{
			Engine:  "censys",
			Success: false,
			Message: fmt.Sprintf("Censys bağlantı hatası: %v", err),
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return models.APIKeyTestResult{
			Engine:  "censys",
			Success: true,
			Message: "Censys API kimliği başarıyla doğrulandı.",
			Details: "Censys Search API v2 erişimi aktif.",
		}
	}

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return models.APIKeyTestResult{
			Engine:  "censys",
			Success: false,
			Message: "Censys kimlik doğrulama başarısız (401/403). API ID veya Secret hatalı.",
		}
	}

	return models.APIKeyTestResult{
		Engine:  "censys",
		Success: false,
		Message: fmt.Sprintf("Censys API yanıt vermedi (Durum: %d)", resp.StatusCode),
	}
}

// QueryShodanInternetDB, hedefin alan adını IP adresine çözerek Shodan'ın keysiz açık servisine sorgu atar.
func (s *SettingsService) QueryShodanInternetDB(target string) (*models.ShodanInternetDBResult, error) {
	cleanTarget := CleanTargetDomain(target)
	if cleanTarget == "" {
		return nil, errors.New("geçersiz veya boş hedef alan adı")
	}

	// Hedef doğrudan IP adresi mi yoksa alan adı mı?
	targetIP := cleanTarget
	if net.ParseIP(cleanTarget) == nil {
		ips, err := net.LookupIP(cleanTarget)
		if err != nil || len(ips) == 0 {
			return nil, fmt.Errorf("%s için IP adresi çözümlenemedi", cleanTarget)
		}
		// İlk IPv4 adresini tercih et
		for _, ip := range ips {
			if ipv4 := ip.To4(); ipv4 != nil {
				targetIP = ipv4.String()
				break
			}
		}
	}

	apiURL := fmt.Sprintf("https://internetdb.shodan.io/%s", targetIP)
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Dorkful-Security-Tool")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("InternetDB bağlantı hatası: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return &models.ShodanInternetDBResult{
			IP:        targetIP,
			Ports:     []int{},
			Vulns:     []string{},
			Hostnames: []string{cleanTarget},
			Tags:      []string{},
		}, nil
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("InternetDB API hatası: HTTP %d", resp.StatusCode)
	}

	var result models.ShodanInternetDBResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("yanıt ayrıştırılamadı: %w", err)
	}

	return &result, nil
}

// getSettingsStoragePath, ayarlar dosyasının kaydedileceği yerel dosya yolunu belirler.
func getSettingsStoragePath() string {
	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if !strings.Contains(strings.ToLower(exePath), "temp") {
			return filepath.Join(exeDir, "settings.json")
		}
	}

	_ = os.MkdirAll(filepath.Join("build", "bin"), 0755)
	return filepath.Join("build", "bin", "settings.json")
}

// loadSavedSettings, yerel diskteki ayarları yükler.
func (s *SettingsService) loadSavedSettings() {
	if s.storagePath == "" {
		return
	}

	fileBytes, err := os.ReadFile(s.storagePath)
	if err != nil {
		return
	}

	var data models.AppSettings
	if err := json.Unmarshal(fileBytes, &data); err == nil {
		s.settings = data
	}
}

// saveToFile, mevcut ayarları yerel diske yazar.
func (s *SettingsService) saveToFile() error {
	if s.storagePath == "" {
		return nil
	}

	fileBytes, err := json.MarshalIndent(s.settings, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.storagePath, fileBytes, 0644)
}
