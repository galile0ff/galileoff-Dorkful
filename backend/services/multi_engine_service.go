package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"dorkapp/backend/models"
)

// MultiEngineService, Google dışındaki GitHub, Shodan, Censys vb. istihbarat motorları için dork üretir ve canlı arama yapar.
type MultiEngineService struct {
	client *http.Client
}

// NewMultiEngineService, yeni bir MultiEngineService örneği oluşturur.
func NewMultiEngineService() *MultiEngineService {
	return &MultiEngineService{
		client: &http.Client{
			Timeout: 12 * time.Second,
		},
	}
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

// generateGitHubDorks, GitHub Code Search üzerinde sızmış secret, key, veritabanı ve altyapı dosyalarını arar.
func (s *MultiEngineService) generateGitHubDorks(domain, org string) []models.Dork {
	templates := []struct {
		query       string
		description string
		category    string
		mitre       *models.MitreAttack
	}{
		// 1. Ortam ve Gizli Değişkenler
		{
			query:       fmt.Sprintf("org:%s filename:.env OR filename:.env.production OR filename:.env.local", org),
			description: "Hedef organizasyon depolarındaki açık .env yapılandırma dosyaları",
			category:    "Secrets & Config",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:.env \"DB_PASSWORD\" OR \"SECRET_KEY\"", domain),
			description: "Hedef alan adına ait ortam dosyalarında şifre ve anahtar sızıntısı",
			category:    "Secrets & Config",
			mitre:       MitreCredentialsInFiles,
		},
		// 2. Kriptografik Anahtarlar & Sertifikalar
		{
			query:       fmt.Sprintf("\"%s\" \"BEGIN RSA PRIVATE KEY\" OR \"BEGIN OPENSSH PRIVATE KEY\"", domain),
			description: "Hedef alan adıyla ilişkili açıkta bırakılmış RSA veya OpenSSH özel anahtarları",
			category:    "Keys & Certs",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:id_rsa OR filename:id_ed25519", domain),
			description: "Hedefle ilişkili depolardaki SSH kimlik doğrulama anahtarları",
			category:    "Keys & Certs",
			mitre:       MitreCredentialsInFiles,
		},
		// 3. Bulut Sağlayıcı Kimlik Bilgileri (AWS, GCP, Azure)
		{
			query:       fmt.Sprintf("\"%s\" \"AKIA\" OR \"aws_access_key_id\"", domain),
			description: "AWS Access Key ve gizli erişim anahtarı sızıntıları",
			category:    "Cloud Credentials",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"type: service_account\" \"private_key\"", domain),
			description: "Google Cloud Platform (GCP) servis hesabı yetki JSON dosyaları",
			category:    "Cloud Credentials",
			mitre:       MitreCredentialsInFiles,
		},
		// 4. Veritabanı ve Bağlantı Dizgileri
		{
			query:       fmt.Sprintf("\"%s\" \"jdbc:mysql://\" OR \"jdbc:postgresql://\" OR \"mongodb+srv://\"", domain),
			description: "Açık veritabanı bağlantı dizgileri ve doğrudan bağlantı kimlik bilgileri",
			category:    "Database",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"password\" filename:wp-config.php", domain),
			description: "WordPress veritabanı şifreleri barındıran wp-config yapılandırma dosyaları",
			category:    "Database",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:database.yml \"password\"", domain),
			description: "Ruby on Rails ve uygulama veritabanı kimlik yapılandırmaları",
			category:    "Database",
			mitre:       MitreCredentialsInFiles,
		},
		// 5. API Anahtarları ve Ödeme/İletişim Tokenları
		{
			query:       fmt.Sprintf("org:%s \"api_key\" OR \"api_secret\" OR \"client_secret\"", org),
			description: "Organizasyon depolarında unutulan genel API anahtarları ve secretlar",
			category:    "API & Tokens",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"sk_live_\" OR \"pk_live_\"", domain),
			description: "Stripe canlı ödeme altyapısı gizli ve genel API anahtarları",
			category:    "API & Tokens",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"xoxb-\" OR \"xoxp-\" OR \"hooks.slack.com/services\"", domain),
			description: "Slack çalışma alanı bot belirteçleri ve yetkili webhook adresleri",
			category:    "API & Tokens",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"SG.\" \"SENDGRID_API_KEY\"", domain),
			description: "SendGrid e-posta iletim servisi API anahtarları",
			category:    "API & Tokens",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"JWT_SECRET\" OR \"jwt_key\"", domain),
			description: "Oturum imzalama için kullanılan JWT gizli şifreleme anahtarları",
			category:    "API & Tokens",
			mitre:       MitreCredentialsInFiles,
		},
		// 6. Altyapı, Konteyner ve Orkestrasyon
		{
			query:       fmt.Sprintf("\"%s\" filename:docker-compose.yml \"POSTGRES_PASSWORD\" OR \"MYSQL_ROOT_PASSWORD\"", domain),
			description: "Docker compose ortamında sabit kodlanmış veritabanı ve servis parolaları",
			category:    "Infrastructure",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:kubeconfig OR \"client-certificate-data\"", domain),
			description: "Kubernetes küme yönetim ve doğrudan API erişim sertifikaları",
			category:    "Infrastructure",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:terraform.tfvars OR filename:*.tfstate \"password\"", domain),
			description: "Terraform altyapı durum dosyalarında düz metin olarak kalan şifreler",
			category:    "Infrastructure",
			mitre:       MitreCredentialsInFiles,
		},
		// 7. Web Çatıları ve Kimlik Doğrulama Dosyaları
		{
			query:       fmt.Sprintf("\"%s\" \"SECRET_KEY\" filename:settings.py", domain),
			description: "Django web çatısı gizli şifreleme anahtarı (SECRET_KEY)",
			category:    "Web Frameworks",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" \"APP_KEY=base64:\" filename:.env", domain),
			description: "Laravel uygulama şifreleme anahtarı ve oturum güvenlik belirteci",
			category:    "Web Frameworks",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:firebaseConfig OR \"firebaseio.com\"", domain),
			description: "Firebase veritabanı ve kimlik doğrulama istemci anahtarları",
			category:    "Web Frameworks",
			mitre:       MitreCredentialsInFiles,
		},
		// 8. Paket Yöneticileri ve Geliştirici Dosyaları
		{
			query:       fmt.Sprintf("\"%s\" filename:.npmrc \"_authToken\"", domain),
			description: "NPM paket yöneticisi özel paket yayınlama yetki belirteci",
			category:    "Developer Tools",
			mitre:       MitreCredentialsInFiles,
		},
		{
			query:       fmt.Sprintf("\"%s\" filename:.git-credentials OR filename:.gitconfig", domain),
			description: "Git kimlik bilgileri yardımcısı tarafından kaydedilmiş kullanıcı parolaları",
			category:    "Developer Tools",
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

// generateShodanDorks, Shodan arama motoru üzerinden hedefin açık port, sunucu ve panellerini tarar.
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
		{
			query:       fmt.Sprintf("http.title:\"%s\"", domain),
			description: "Web sayfa başlığında doğrudan hedef adı geçen sunucular",
			category:    "Web Services",
			mitre:       MitreSearchVictimWebsites,
		},
		{
			query:       fmt.Sprintf("http.html:\"%s\"", domain),
			description: "HTML kaynak kodunda hedef alan adı barındıran web uygulamaları",
			category:    "Web Services",
			mitre:       MitreSearchVictimWebsites,
		},
	}

	if company != "" {
		templates = append(templates,
			struct {
				query       string
				description string
				category    string
				mitre       *models.MitreAttack
			}{
				query:       fmt.Sprintf("org:\"%s\"", company),
				description: "Hedef şirkete tahsis edilmiş organizasyon IP'leri ve portları",
				category:    "Organization",
				mitre:       MitreTechnicalDatabases,
			},
			struct {
				query       string
				description string
				category    string
				mitre       *models.MitreAttack
			}{
				query:       fmt.Sprintf("org:\"%s\" http.title:\"Admin\"", company),
				description: "Şirkete ait sunuculardaki açık yönetici (Admin) panelleri",
				category:    "Admin & Portals",
				mitre:       MitreExploitPublicFacing,
			},
			struct {
				query       string
				description string
				category    string
				mitre       *models.MitreAttack
			}{
				query:       fmt.Sprintf("org:\"%s\" \"Grafana\" port:3000", company),
				description: "Şirket altyapısındaki açık Grafana metrik ve izleme panelleri",
				category:    "Monitoring",
				mitre:       MitreExploitPublicFacing,
			},
			struct {
				query       string
				description string
				category    string
				mitre       *models.MitreAttack
			}{
				query:       fmt.Sprintf("org:\"%s\" \"Elasticsearch\" port:9200", company),
				description: "Kimlik doğrulaması gerektirmeyen açık Elasticsearch küme servisleri",
				category:    "Databases",
				mitre:       MitreCredentialsInFiles,
			},
			struct {
				query       string
				description string
				category    string
				mitre       *models.MitreAttack
			}{
				query:       fmt.Sprintf("org:\"%s\" port:6379", company),
				description: "İnternete açık Redis bellek içi veritabanı portları",
				category:    "Databases",
				mitre:       MitreCredentialsInFiles,
			},
			struct {
				query       string
				description string
				category    string
				mitre       *models.MitreAttack
			}{
				query:       fmt.Sprintf("org:\"%s\" \"Jenkins\" port:8080", company),
				description: "Açık Jenkins CI/CD sürekli entegrasyon kontrol panelleri",
				category:    "DevOps",
				mitre:       MitreExploitPublicFacing,
			},
			struct {
				query       string
				description string
				category    string
				mitre       *models.MitreAttack
			}{
				query:       fmt.Sprintf("org:\"%s\" port:3389", company),
				description: "Açık RDP (Uzak Masaüstü Bağlantısı) servisleri",
				category:    "Remote Access",
				mitre:       MitreExploitPublicFacing,
			},
		)
	}

	if asn != "" {
		templates = append(templates, struct {
			query       string
			description string
			category    string
			mitre       *models.MitreAttack
		}{
			query:       fmt.Sprintf("asn:\"%s\"", asn),
			description: "Hedef kuruma ait Otonom Sistem Numarası (ASN) kapsamındaki tüm IP'ler",
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

// generateCensysDorks, Censys Search motoru üzerinden sertifika, host ve servis sorguları üretir.
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
		{
			query:       fmt.Sprintf("services.http.response.html_title: \"%s\"", domain),
			description: "HTML başlığında hedef alan adını barındıran aktif web servisleri",
			category:    "Web Services",
		},
		{
			query:       fmt.Sprintf("services.banner: \"%s\"", domain),
			description: "Servis karşılama başlıklarında (banner) hedef adı geçen hostlar",
			category:    "Services",
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

// SearchGitHubLeaks, kullanıcının GitHub token'ını kullanarak hedef için canlı kod ve secret araması yapar.
func (s *MultiEngineService) SearchGitHubLeaks(domain, org, token string) ([]models.GitHubLeakResult, error) {
	cleanToken := strings.TrimSpace(token)
	if cleanToken == "" {
		return make([]models.GitHubLeakResult, 0), errors.New("canlı arama için GitHub Personal Access Token gereklidir (Ayarlar menüsünden ekleyebilirsiniz)")
	}

	cleanDomain := CleanTargetDomain(domain)
	cleanOrg := strings.TrimSpace(org)
	if cleanOrg == "" && cleanDomain != "" {
		cleanOrg = strings.Split(cleanDomain, ".")[0]
	}

	// Taranacak en kritik 6 arama sorgusu
	queries := []struct {
		q           string
		description string
	}{
		{
			q:           fmt.Sprintf("\"%s\" filename:.env", cleanDomain),
			description: "Açık .env ortam yapılandırma dosyası",
		},
		{
			q:           fmt.Sprintf("org:%s filename:.env", cleanOrg),
			description: "Organizasyon deposunda .env dosyası",
		},
		{
			q:           fmt.Sprintf("\"%s\" \"AKIA\"", cleanDomain),
			description: "AWS Erişim Anahtarı (AKIA) sızıntısı",
		},
		{
			q:           fmt.Sprintf("\"%s\" \"BEGIN RSA PRIVATE KEY\"", cleanDomain),
			description: "Açık RSA Özel Şifreleme Anahtarı",
		},
		{
			q:           fmt.Sprintf("\"%s\" filename:wp-config.php", cleanDomain),
			description: "WordPress wp-config veritabanı yapılandırması",
		},
		{
			q:           fmt.Sprintf("\"%s\" \"api_key\" OR \"client_secret\"", cleanDomain),
			description: "Kod satırlarında unutulmuş API Secret",
		},
	}

	allResults := make([]models.GitHubLeakResult, 0)
	seenURLs := make(map[string]bool)
	var mu sync.Mutex
	var wg sync.WaitGroup

	// Sorguları paralel çalıştır (GitHub API hız sınırlarına dikkat ederek)
	for _, item := range queries {
		wg.Add(1)
		go func(q, desc string) {
			defer wg.Done()

			apiURL := fmt.Sprintf("https://api.github.com/search/code?q=%s&per_page=15", url.QueryEscape(q))
			req, err := http.NewRequest("GET", apiURL, nil)
			if err != nil {
				return
			}

			req.Header.Set("Authorization", "Bearer "+cleanToken)
			req.Header.Set("Accept", "application/vnd.github+json")
			req.Header.Set("User-Agent", "Dorkful-Security-Tool")

			resp, err := s.client.Do(req)
			if err != nil {
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				return
			}

			var ghResp struct {
				TotalCount int `json:"total_count"`
				Items      []struct {
					Name       string `json:"name"`
					Path       string `json:"path"`
					SHA        string `json:"sha"`
					HTMLURL    string `json:"html_url"`
					Repository struct {
						FullName string `json:"full_name"`
						HTMLURL  string `json:"html_url"`
					} `json:"repository"`
				} `json:"items"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&ghResp); err != nil {
				return
			}

			mu.Lock()
			defer mu.Unlock()

			for _, file := range ghResp.Items {
				if seenURLs[file.HTMLURL] {
					continue
				}
				seenURLs[file.HTMLURL] = true

				allResults = append(allResults, models.GitHubLeakResult{
					Name:        file.Name,
					Path:        file.Path,
					RepoName:    file.Repository.FullName,
					RepoURL:     file.Repository.HTMLURL,
					HTMLURL:     file.HTMLURL,
					Query:       q,
					Description: desc,
					SHA:         file.SHA,
				})
			}
		}(item.q, item.description)
	}

	wg.Wait()

	return allResults, nil
}

// SearchShodanHost, Shodan API (key varsa) veya InternetDB (keysiz) üzerinden hedef için açık port ve zafiyetleri tarar.
func (s *MultiEngineService) SearchShodanHost(target, apiKey string) ([]models.ShodanHostItem, error) {
	cleanTarget := CleanTargetDomain(target)
	if cleanTarget == "" {
		return nil, errors.New("hedef alan adı veya IP boş olamaz")
	}

	cleanKey := strings.TrimSpace(apiKey)

	// 1. Hedef IP'leri çöz
	var ipsToScan []string
	if net.ParseIP(cleanTarget) != nil {
		ipsToScan = append(ipsToScan, cleanTarget)
	} else {
		ips, err := net.LookupIP(cleanTarget)
		if err == nil {
			for _, ip := range ips {
				if ipv4 := ip.To4(); ipv4 != nil {
					ipsToScan = append(ipsToScan, ipv4.String())
				}
			}
		}
	}

	if len(ipsToScan) == 0 {
		return nil, fmt.Errorf("%s için geçerli bir IP adresi çözümlenemedi", cleanTarget)
	}

	results := make([]models.ShodanHostItem, 0)

	// Eğer kullanıcı Shodan API key'i girmişse ve resmi API çalıştırılacaksa
	if cleanKey != "" {
		for _, ip := range ipsToScan {
			apiURL := fmt.Sprintf("https://api.shodan.io/shodan/host/%s?key=%s", ip, url.QueryEscape(cleanKey))
			req, err := http.NewRequest("GET", apiURL, nil)
			if err != nil {
				continue
			}
			req.Header.Set("User-Agent", "Dorkful-Security-Tool")

			resp, err := s.client.Do(req)
			if err != nil {
				continue
			}
			defer resp.Body.Close()

			if resp.StatusCode == http.StatusOK {
				var hostData struct {
					IP        string   `json:"ip_str"`
					Ports     []int    `json:"ports"`
					Vulns     []string `json:"vulns"`
					Hostnames []string `json:"hostnames"`
					Tags      []string `json:"tags"`
					Org       string   `json:"org"`
					ISP       string   `json:"isp"`
					ASN       string   `json:"asn"`
					OS        string   `json:"os"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&hostData); err == nil {
					results = append(results, models.ShodanHostItem{
						IP:        hostData.IP,
						Ports:     hostData.Ports,
						Vulns:     hostData.Vulns,
						Hostnames: hostData.Hostnames,
						Tags:      hostData.Tags,
						Org:       hostData.Org,
						ISP:       hostData.ISP,
						ASN:       hostData.ASN,
						OS:        hostData.OS,
						IsKeyless: false,
					})
					continue
				}
			}
		}
	}

	// Eğer resmi API sonuç vermediyse veya key yoksa: Shodan InternetDB (tamamen ücretsiz & keysiz) çalıştır
	if len(results) == 0 {
		for _, ip := range ipsToScan {
			apiURL := fmt.Sprintf("https://internetdb.shodan.io/%s", ip)
			req, err := http.NewRequest("GET", apiURL, nil)
			if err != nil {
				continue
			}
			req.Header.Set("User-Agent", "Dorkful-Security-Tool")

			resp, err := s.client.Do(req)
			if err != nil {
				continue
			}
			defer resp.Body.Close()

			if resp.StatusCode == http.StatusOK {
				var dbData struct {
					IP        string   `json:"ip"`
					Ports     []int    `json:"ports"`
					Vulns     []string `json:"vulns"`
					Hostnames []string `json:"hostnames"`
					Tags      []string `json:"tags"`
					CPEs      []string `json:"cpes"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&dbData); err == nil {
					results = append(results, models.ShodanHostItem{
						IP:        dbData.IP,
						Ports:     dbData.Ports,
						Vulns:     dbData.Vulns,
						Hostnames: dbData.Hostnames,
						Tags:      dbData.Tags,
						Org:       "InternetDB Public Data",
						ISP:       cleanTarget,
						IsKeyless: true,
					})
				}
			}
		}
	}

	return results, nil
}

// SearchCensysHosts, Censys Platform API (v3 PAT) veya Search API v2 üzerinden hedefin host IP ve çalışan servislerini tarar.
func (s *MultiEngineService) SearchCensysHosts(target, apiID, apiSecret string) ([]models.CensysHostItem, error) {
	cleanID := strings.TrimSpace(apiID)
	cleanSecret := strings.TrimSpace(apiSecret)
	results := make([]models.CensysHostItem, 0)

	cleanTarget := CleanTargetDomain(target)
	if cleanTarget == "" {
		return results, errors.New("geçersiz veya boş hedef alan adı")
	}

	// 1. Censys Platform API (v3 PAT - censys_...) Modu
	patToken := ""
	if strings.HasPrefix(cleanID, "censys_") {
		patToken = cleanID
	} else if strings.HasPrefix(cleanSecret, "censys_") {
		patToken = cleanSecret
	} else if cleanID != "" && cleanSecret == "" {
		patToken = cleanID
	}

	if patToken != "" {
		// Hedef IP'leri çöz
		var ipsToScan []string
		if net.ParseIP(cleanTarget) != nil {
			ipsToScan = append(ipsToScan, cleanTarget)
		} else {
			ips, err := net.LookupIP(cleanTarget)
			if err == nil {
				for _, ip := range ips {
					if ipv4 := ip.To4(); ipv4 != nil {
						ipsToScan = append(ipsToScan, ipv4.String())
					}
				}
			}
		}

		if len(ipsToScan) == 0 {
			return results, fmt.Errorf("%s için geçerli bir IP adresi çözümlenemedi", cleanTarget)
		}

		for _, ip := range ipsToScan {
			apiURL := fmt.Sprintf("https://api.platform.censys.io/v3/global/asset/host/%s", ip)
			req, err := http.NewRequest("GET", apiURL, nil)
			if err != nil {
				continue
			}

			req.Header.Set("Authorization", "Bearer "+patToken)
			req.Header.Set("Accept", "application/json")
			req.Header.Set("User-Agent", "Dorkful-Security-Tool")

			resp, err := s.client.Do(req)
			if err != nil {
				continue
			}
			defer resp.Body.Close()

			if resp.StatusCode == http.StatusOK {
				var platResp struct {
					Result struct {
						Resource struct {
							IP       string `json:"ip"`
							Services []struct {
								Port              int    `json:"port"`
								Protocol          string `json:"protocol"`
								TransportProtocol string `json:"transport_protocol"`
							} `json:"services"`
							AutonomousSystem struct {
								ASN  int    `json:"asn"`
								Name string `json:"name"`
							} `json:"autonomous_system"`
							Location struct {
								Country     string `json:"country"`
								CountryCode string `json:"country_code"`
								City        string `json:"city"`
							} `json:"location"`
							LastObserved string `json:"last_observed_at"`
						} `json:"resource"`
					} `json:"result"`
				}

				if err := json.NewDecoder(resp.Body).Decode(&platResp); err == nil {
					res := platResp.Result.Resource
					var serviceList []string
					for _, srv := range res.Services {
						proto := srv.Protocol
						if proto == "" {
							proto = srv.TransportProtocol
						}
						serviceList = append(serviceList, fmt.Sprintf("%d/%s", srv.Port, strings.ToUpper(proto)))
					}

					asnStr := ""
					if res.AutonomousSystem.ASN > 0 {
						asnStr = fmt.Sprintf("AS%d", res.AutonomousSystem.ASN)
					}

					locStr := res.Location.Country
					if res.Location.City != "" {
						locStr = fmt.Sprintf("%s, %s", res.Location.City, res.Location.Country)
					}

					results = append(results, models.CensysHostItem{
						IP:          res.IP,
						Name:        cleanTarget,
						Services:    serviceList,
						ASN:         asnStr,
						ASName:      res.AutonomousSystem.Name,
						Country:     locStr,
						CountryCode: res.Location.CountryCode,
						LastUpdated: res.LastObserved,
						URL:         fmt.Sprintf("https://search.censys.io/hosts/%s", res.IP),
					})
				}
			}
		}

		if len(results) > 0 {
			return results, nil
		}
	}

	// 2. Censys Search API (v2 Legacy Basic Auth) Modu
	if cleanID == "" || cleanSecret == "" {
		return results, errors.New("Censys canlı taraması için Ayarlar menüsünden API Token (PAT) veya API ID/Secret girmelisiniz")
	}

	apiURL := fmt.Sprintf("https://search.censys.io/api/v2/hosts/search?q=%s&per_page=25", url.QueryEscape(cleanTarget))
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(cleanID, cleanSecret)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "Dorkful-Security-Tool")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Censys bağlantı hatası: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Censys API hatası: HTTP %d (Kimlik bilgilerinizi kontrol edin)", resp.StatusCode)
	}

	var censysResp struct {
		Result struct {
			Hits []struct {
				IP       string `json:"ip"`
				Name     string `json:"name"`
				Services []struct {
					Port        int    `json:"port"`
					ServiceName string `json:"service_name"`
					Transport   string `json:"transport_protocol"`
				} `json:"services"`
				AutonomousSystem struct {
					ASN  int    `json:"asn"`
					Name string `json:"name"`
				} `json:"autonomous_system"`
				Location struct {
					Country     string `json:"country"`
					CountryCode string `json:"country_code"`
				} `json:"location"`
				LastObserved string `json:"last_observed_at"`
			} `json:"hits"`
		} `json:"result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&censysResp); err != nil {
		return nil, fmt.Errorf("yanıt ayrıştırılamadı: %w", err)
	}

	for _, hit := range censysResp.Result.Hits {
		var serviceList []string
		for _, srv := range hit.Services {
			name := srv.ServiceName
			if name == "" {
				name = srv.Transport
			}
			serviceList = append(serviceList, fmt.Sprintf("%d/%s", srv.Port, strings.ToUpper(name)))
		}

		asnStr := ""
		if hit.AutonomousSystem.ASN > 0 {
			asnStr = fmt.Sprintf("AS%d", hit.AutonomousSystem.ASN)
		}

		results = append(results, models.CensysHostItem{
			IP:          hit.IP,
			Name:        hit.Name,
			Services:    serviceList,
			ASN:         asnStr,
			ASName:      hit.AutonomousSystem.Name,
			Country:     hit.Location.Country,
			CountryCode: hit.Location.CountryCode,
			LastUpdated: hit.LastObserved,
		})
	}

	return results, nil
}
