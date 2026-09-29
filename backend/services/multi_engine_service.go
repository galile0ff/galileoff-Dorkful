package services

import (
	"fmt"
	"net/url"
	"strings"

	"dorkapp/backend/models"
)

// MultiEngineService, Google dışındaki GitHub, Shodan, Censys vb. istihbarat motorları için dork üretir.
type MultiEngineService struct{}

// NewMultiEngineService, yeni bir MultiEngineService örneği oluşturur.
func NewMultiEngineService() *MultiEngineService {
	return &MultiEngineService{}
}

// GenerateMultiEngineDorks, seçilen motora ve hedef çalışma alanına göre optimize edilmiş sorgular üretir.
func (s *MultiEngineService) GenerateMultiEngineDorks(engine string, ws models.Workspace) []models.Dork {
	cleanDomain := CleanTargetDomain(ws.Domain)
	cleanCompany := strings.TrimSpace(ws.Company)
	if cleanCompany == "" {
		cleanCompany = cleanDomain
	}
	cleanOrg := strings.TrimSpace(ws.GithubOrg)
	if cleanOrg == "" {
		cleanOrg = strings.Split(cleanDomain, ".")[0]
	}
	cleanASN := strings.TrimSpace(ws.ASN)
	cleanIP := strings.TrimSpace(ws.IPRange)

	switch strings.ToLower(engine) {
	case "github":
		return s.generateGitHubDorks(cleanDomain, cleanOrg)
	case "shodan":
		return s.generateShodanDorks(cleanDomain, cleanCompany, cleanASN, cleanIP)
	case "censys":
		return s.generateCensysDorks(cleanDomain, cleanASN)
	default:
		return []models.Dork{}
	}
}

// generateGitHubDorks, GitHub Code Search üzerinde sızmış secret ve yapılandırma dosyalarını arar.
func (s *MultiEngineService) generateGitHubDorks(domain, org string) []models.Dork {
	templates := []struct {
		query       string
		description string
		category    string
		mitre       *models.MitreAttack
	}{
		{
			query:       fmt.Sprintf("org:%s filename:.env", org),
			description: "Hedef organizasyon depolarındaki açık .env yapılandırma dosyaları",
			category:    "Secrets & Config",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"BEGIN RSA PRIVATE KEY\"", domain),
			description: "Hedef alan adıyla ilişkili açıkta bırakılmış RSA özel anahtarları",
			category:    "Keys & Certs",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"AKIA\" filename:*.json OR filename:*.env", domain),
			description: "AWS Access Key kimlik bilgileri sızıntısı",
			category:    "Cloud Credentials",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"password\" filename:wp-config.php", domain),
			description: "WordPress veritabanı şifreleri barındıran konfigürasyon dosyaları",
			category:    "Credentials",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"jdbc:mysql://\" OR \"jdbc:postgresql://\"", domain),
			description: "Açık veritabanı bağlantı dizgileri ve kimlik bilgileri",
			category:    "Database",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("org:%s \"api_key\" OR \"api_secret\"", org),
			description: "Organizasyon depolarında unutulan API anahtarları",
			category:    "Secrets & Config",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:docker-compose.yml \"POSTGRES_PASSWORD\"", domain),
			description: "Docker compose ortamında sabit kodlanmış veritabanı parolaları",
			category:    "Infrastructure",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:id_rsa OR filename:id_ed25519", domain),
			description: "Hedefle ilişkili depolardaki SSH özel anahtarları",
			category:    "Keys & Certs",
			mitre:       MitreCredentialsInFiles,
		},
	}

	dorks := make([]models.Dork, 0, len(templates))
	for _, t := range templates {
		searchURL := fmt.Sprintf("https://github.com/search?type=code&q=%s", url.QueryEscape(t.query))
		dorks = append(dorks, models.Dork{
			Query:       t.query,
			Description: t.description,
			Category:    t.category,
			Engine:      "github",
			SearchURL:   searchURL,
			Mitre:       t.mitre,
		})
	}
	return dorks
}

// generateShodanDorks, Shodan arama motoru üzerinden hedefin açık port ve sunucularını tarar.
func (s *MultiEngineService) generateShodanDorks(domain, company, asn, ipRange string) []models.Dork {
	templates := []struct {
		query       string
		description string
		category    string
		mitre       *models.MitreAttack
	}{
		{
			query:       fmt.Sprintf("ssl:\"%s\"", domain),
			description: "SSL sertifikasında hedef alan adı geçen tüm aktif IP ve sunucular",
			category:    "SSL/TLS",
			mitre:       MitreTechnicalDatabases,
		},
		{
			query:       fmt.Sprintf("hostname:\"%s\"", domain),
			description: "Hedef alan adına işaret eden sunucular ve açık servisler",
			category:    "Hostnames",
			mitre:       MitreGatherHostSoftware,
		},
		{
			query:       fmt.Sprintf("ssl.cert.subject.CN:\"*.%s\"", domain),
			description: "Hedefin wildcard sertifikasına sahip tüm alt sunucuları",
			category:    "SSL/TLS",
			mitre:       MitreTechnicalDatabases,
		},
	}

	if company != "" {
		templates = append(templates, struct {
			query       string
			description string
			category    string
			mitre       *models.MitreAttack
		}{
			query:       fmt.Sprintf("org:\"%s\"", company),
			description: "Hedef şirkete tahsis edilmiş organizasyon IP'leri ve portları",
			category:    "Organization",
			mitre:       MitreTechnicalDatabases,
		}, struct {
			query       string
			description string
			category    string
			mitre       *models.MitreAttack
		}{
			query:       fmt.Sprintf("org:\"%s\" http.title:\"Admin\"", company),
			description: "Şirkete ait sunuculardaki açık yönetici (Admin) panelleri",
			category:    "Admin Panels",
			mitre:       MitreExploitPublicFacing,
		})
	}

	if asn != "" {
		templates = append(templates, struct {
			query       string
			description string
			category    string
			mitre       *models.MitreAttack
		}{
			query:       fmt.Sprintf("asn:\"%s\"", asn),
			description: "Hedef kuruma ait Otonom Sistem Numarası (ASN) kapsamındaki IP'ler",
			category:    "Network / ASN",
			mitre:       MitreTechnicalDatabases,
		})
	}

	if ipRange != "" {
		templates = append(templates, struct {
			query       string
			description string
			category    string
			mitre       *models.MitreAttack
		}{
			query:       fmt.Sprintf("net:\"%s\"", ipRange),
			description: "Hedef IP bloğundaki (CIDR) tüm açık cihazlar ve servisler",
			category:    "Subnet",
			mitre:       MitreGatherHostSoftware,
		})
	}

	dorks := make([]models.Dork, 0, len(templates))
	for _, t := range templates {
		searchURL := fmt.Sprintf("https://www.shodan.io/search?query=%s", url.QueryEscape(t.query))
		dorks = append(dorks, models.Dork{
			Query:       t.query,
			Description: t.description,
			Category:    t.category,
			Engine:      "shodan",
			SearchURL:   searchURL,
			Mitre:       t.mitre,
		})
	}
	return dorks
}

// generateCensysDorks, Censys Search motoru üzerinden sertifika ve ana bilgisayar sorguları üretir.
func (s *MultiEngineService) generateCensysDorks(domain, asn string) []models.Dork {
	templates := []struct {
		query       string
		description string
		category    string
	}{
		{
			query:       fmt.Sprintf("services.tls.certificates.leaf_data.names: %s", domain),
			description: "Censys üzerinde TLS yaprak sertifikalarında hedef alan adı geçen hostlar",
			category:    "TLS / Certs",
		},
		{
			query:       fmt.Sprintf("dns.names: *.%s", domain),
			description: "Censys tarafından çözümlenen alt alan adları ve IP'leri",
			category:    "DNS Recon",
		},
	}

	if asn != "" {
		asnClean := strings.TrimPrefix(strings.ToUpper(asn), "AS")
		templates = append(templates, struct {
			query       string
			description string
			category    string
		}{
			query:       fmt.Sprintf("autonomous_system.asn: %s", asnClean),
			description: "Censys üzerinde ASN numarasına göre filtrelenmiş aktif hostlar",
			category:    "Network",
		})
	}

	dorks := make([]models.Dork, 0, len(templates))
	for _, t := range templates {
		searchURL := fmt.Sprintf("https://search.censys.io/search?resource=hosts&q=%s", url.QueryEscape(t.query))
		dorks = append(dorks, models.Dork{
			Query:       t.query,
			Description: t.description,
			Category:    t.category,
			Engine:      "censys",
			SearchURL:   searchURL,
			Mitre:       MitreTechnicalDatabases,
		})
	}
	return dorks
}
