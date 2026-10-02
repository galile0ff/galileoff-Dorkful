package models

// SubdomainResult, CRT.sh, HackerTarget gibi kaynaklardan çıkarılan alt alan adını temsil eder.
type SubdomainResult struct {
	Subdomain string `json:"subdomain"`
	LoggedAt  string `json:"loggedAt"`
	Issuer    string `json:"issuer"`
}

// WaybackResult, Archive.org CDX API'sinden elde edilen arşivlenmiş bir URL kaydını temsil eder.
type WaybackResult struct {
	URL         string `json:"url"`
	Timestamp   string `json:"timestamp"`
	MimeType    string `json:"mimeType"`
	Status      string `json:"status"`
	SnapshotURL string `json:"snapshotUrl"`
	Year        string `json:"year"`
}

// GitHubLeakResult, GitHub Code Search API üzerinden tespit edilen canlı sızıntı kaydıdır.
type GitHubLeakResult struct {
	Name        string `json:"name"`        // Dosya adı (örn: .env, wp-config.php)
	Path        string `json:"path"`        // Dosya yolu (örn: server/.env)
	RepoName    string `json:"repoName"`    // Repository tam adı (örn: org/repo)
	RepoURL     string `json:"repoUrl"`     // Repository bağlantısı
	HTMLURL     string `json:"htmlUrl"`     // Doğrudan GitHub kod sayfası bağlantısı
	Query       string `json:"query"`       // Arama sorgusu
	Description string `json:"description"` // Sızıntı türü/kategorisi
	SHA         string `json:"sha"`
}

// ShodanHostItem, Shodan API veya InternetDB üzerinden tespit edilen bir host/servis sonucudur.
type ShodanHostItem struct {
	IP        string   `json:"ip"`
	Ports     []int    `json:"ports"`
	Vulns     []string `json:"vulns"`
	Hostnames []string `json:"hostnames"`
	Tags      []string `json:"tags"`
	Org       string   `json:"org"`
	ISP       string   `json:"isp"`
	ASN       string   `json:"asn"`
	OS        string   `json:"os"`
	IsKeyless bool     `json:"isKeyless"` // InternetDB mi yoksa Resmi API mi
}

// CensysHostItem, Censys Search API v2 üzerinden tespit edilen bir host sonucudur.
type CensysHostItem struct {
	IP          string   `json:"ip"`
	Name        string   `json:"name"`
	Services    []string `json:"services"` // örn: ["80/HTTP", "443/HTTPS", "22/SSH"]
	ASN         string   `json:"asn"`
	ASName      string   `json:"asName"`
	Country     string   `json:"country"`
	CountryCode string   `json:"countryCode"`
	LastUpdated string   `json:"lastUpdated"`
	URL         string   `json:"url,omitempty"`
}
