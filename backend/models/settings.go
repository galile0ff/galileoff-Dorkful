package models

// AppSettings, uygulamanın genel ayarlarını ve API anahtarlarını barındırır.
type AppSettings struct {
	// API Anahtarları
	ShodanKey    string `json:"shodanKey"`
	GithubToken  string `json:"githubToken"`
	CensysID     string `json:"censysId"`
	CensysSecret string `json:"censysSecret"`

	// Ağ ve Canlılık Ayarları
	AutoProbeTarget     bool   `json:"autoProbeTarget"`     // Hedef değiştiğinde otomatik HTTP canlılık denetimi
	ProbeTimeoutSec     int    `json:"probeTimeoutSec"`     // HTTP zaman aşımı (saniye)
	CustomUserAgent     string `json:"customUserAgent"`     // Özel HTTP User-Agent
	DefaultSearchEngine string `json:"defaultSearchEngine"` // Başlangıç varsayılan motoru (google, shodan, github, etc.)
}

// DefaultSettings, varsayılan yapılandırma değerlerini döner.
func DefaultSettings() AppSettings {
	return AppSettings{
		ShodanKey:           "",
		GithubToken:         "",
		CensysID:            "",
		CensysSecret:        "",
		AutoProbeTarget:     true,
		ProbeTimeoutSec:     6,
		CustomUserAgent:     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-Security-Tool/1.0",
		DefaultSearchEngine: "google",
	}
}

// APIKeyTestResult, API anahtarı doğrulama testi sonucunu taşır.
type APIKeyTestResult struct {
	Engine  string `json:"engine"`
	Success bool   `json:"success"`
	Message string `json:"message"`
	Details string `json:"details"`
}

// ShodanInternetDBResult, Shodan'ın tamamen ücretsiz ve anahtarsız servisinin yanıt modeli
type ShodanInternetDBResult struct {
	IP        string   `json:"ip"`
	Ports     []int    `json:"ports"`
	Vulns     []string `json:"vulns"`
	Hostnames []string `json:"hostnames"`
	Tags      []string `json:"tags"`
	CPEs      []string `json:"cpes"`
}
