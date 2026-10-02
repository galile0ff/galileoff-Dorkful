package services

import (
	"net/http"
	"regexp"
	"strings"

	"dorkapp/backend/models"
)

// TechRule, bir web teknolojisini tespit etmek için kullanılan kural yapısıdır.
type TechRule struct {
	Name       string         // Teknoloji adı (örneğin: WordPress)
	Category   string         // CMS, Framework, Web Server, Language, CDN/WAF
	HeaderName string         // Kontrol edilecek HTTP başlığı (boşsa sadece body veya cookie taranır)
	HeaderRx   *regexp.Regexp // Başlık değeri için regex
	CookieName string         // Kontrol edilecek çerez (cookie) adı
	BodyRx     *regexp.Regexp // HTML gövdesinde aranacak regex
	Confidence string         // High, Medium
}

// techRules, taranacak bilinen web teknolojilerinin kural havuzudur.
var techRules = []TechRule{
	// --- CMS SİSTEMLERİ ---
	{
		Name:       "WordPress",
		Category:   "CMS",
		BodyRx:     regexp.MustCompile(`(?i)<meta\s+name=["']generator["']\s+content=["']WordPress\s*([0-9\.]+)?["']|/wp-content/|/wp-includes/|wp-json`),
		CookieName: "wp-settings",
		Confidence: "High",
	},
	{
		Name:       "Drupal",
		Category:   "CMS",
		HeaderName: "X-Generator",
		HeaderRx:   regexp.MustCompile(`(?i)Drupal\s*([0-9\.]+)?`),
		BodyRx:     regexp.MustCompile(`(?i)<meta\s+name=["']generator["']\s+content=["']Drupal\s*([0-9\.]+)?["']|Drupal\.settings`),
		Confidence: "High",
	},
	{
		Name:       "Joomla",
		Category:   "CMS",
		BodyRx:     regexp.MustCompile(`(?i)<meta\s+name=["']generator["']\s+content=["']Joomla!\s*([0-9\.]+)?["']|/media/jui/`),
		Confidence: "High",
	},
	{
		Name:       "Shopify",
		Category:   "CMS",
		HeaderName: "X-ShopId",
		BodyRx:     regexp.MustCompile(`(?i)cdn\.shopify\.com|Shopify\.theme`),
		Confidence: "High",
	},
	{
		Name:       "Ghost",
		Category:   "CMS",
		BodyRx:     regexp.MustCompile(`(?i)<meta\s+name=["']generator["']\s+content=["']Ghost\s*([0-9\.]+)?["']`),
		Confidence: "High",
	},
	{
		Name:       "Magento",
		Category:   "CMS",
		BodyRx:     regexp.MustCompile(`(?i)Mage\.Cookies|/skin/frontend/|/static/frontend/`),
		Confidence: "High",
	},

	// --- FRAMEWORK & RUNTIME ---
	{
		Name:       "Laravel",
		Category:   "Framework",
		CookieName: "laravel_session",
		Confidence: "High",
	},
	{
		Name:       "Next.js",
		Category:   "Framework",
		HeaderName: "X-Powered-By",
		HeaderRx:   regexp.MustCompile(`(?i)Next\.js`),
		BodyRx:     regexp.MustCompile(`(?i)id=["']__next["']|/_next/static/|<script\s+id=["']__NEXT_DATA__`),
		Confidence: "High",
	},
	{
		Name:       "React",
		Category:   "Framework",
		BodyRx:     regexp.MustCompile(`(?i)id=["']root["']|data-reactroot|react-dom`),
		Confidence: "Medium",
	},
	{
		Name:       "Vue.js",
		Category:   "Framework",
		BodyRx:     regexp.MustCompile(`(?i)data-v-[a-z0-9]+|id=["']__nuxt["']|/_nuxt/`),
		Confidence: "High",
	},
	{
		Name:       "Angular",
		Category:   "Framework",
		BodyRx:     regexp.MustCompile(`(?i)ng-version=["']([0-9\.]+)["']|<app-root`),
		Confidence: "High",
	},
	{
		Name:       "Django",
		Category:   "Framework",
		CookieName: "csrftoken",
		Confidence: "High",
	},
	{
		Name:       "Express",
		Category:   "Framework",
		HeaderName: "X-Powered-By",
		HeaderRx:   regexp.MustCompile(`(?i)Express`),
		CookieName: "connect.sid",
		Confidence: "High",
	},
	{
		Name:       "Ruby on Rails",
		Category:   "Framework",
		HeaderName: "X-Powered-By",
		HeaderRx:   regexp.MustCompile(`(?i)Phusion Passenger`),
		BodyRx:     regexp.MustCompile(`(?i)csrf-param=["']authenticity_token["']`),
		Confidence: "High",
	},
	{
		Name:       "ASP.NET",
		Category:   "Framework",
		HeaderName: "X-Powered-By",
		HeaderRx:   regexp.MustCompile(`(?i)ASP\.NET`),
		CookieName: "ASP.NET_SessionId",
		Confidence: "High",
	},
	{
		Name:       "Spring Boot",
		Category:   "Framework",
		HeaderName: "X-Application-Context",
		CookieName: "JSESSIONID",
		Confidence: "Medium",
	},

	// --- PROGRAMLAMA DİLLERİ ---
	{
		Name:       "PHP",
		Category:   "Language",
		HeaderName: "X-Powered-By",
		HeaderRx:   regexp.MustCompile(`(?i)PHP(?:/([0-9\.]+))?`),
		CookieName: "PHPSESSID",
		Confidence: "High",
	},

	// --- WEB SUNUCULARI ---
	{
		Name:       "Nginx",
		Category:   "Web Server",
		HeaderName: "Server",
		HeaderRx:   regexp.MustCompile(`(?i)nginx(?:/([0-9\.]+))?`),
		Confidence: "High",
	},
	{
		Name:       "Apache",
		Category:   "Web Server",
		HeaderName: "Server",
		HeaderRx:   regexp.MustCompile(`(?i)Apache(?:/([0-9\.]+))?`),
		Confidence: "High",
	},
	{
		Name:       "Microsoft-IIS",
		Category:   "Web Server",
		HeaderName: "Server",
		HeaderRx:   regexp.MustCompile(`(?i)Microsoft-IIS(?:/([0-9\.]+))?`),
		Confidence: "High",
	},
	{
		Name:       "LiteSpeed",
		Category:   "Web Server",
		HeaderName: "Server",
		HeaderRx:   regexp.MustCompile(`(?i)LiteSpeed`),
		Confidence: "High",
	},
	{
		Name:       "Caddy",
		Category:   "Web Server",
		HeaderName: "Server",
		HeaderRx:   regexp.MustCompile(`(?i)Caddy`),
		Confidence: "High",
	},
	{
		Name:       "OpenResty",
		Category:   "Web Server",
		HeaderName: "Server",
		HeaderRx:   regexp.MustCompile(`(?i)openresty(?:/([0-9\.]+))?`),
		Confidence: "High",
	},

	// --- CDN & WAF ---
	{
		Name:       "Cloudflare",
		Category:   "CDN/WAF",
		HeaderName: "Server",
		HeaderRx:   regexp.MustCompile(`(?i)cloudflare`),
		Confidence: "High",
	},
	{
		Name:       "Cloudflare",
		Category:   "CDN/WAF",
		HeaderName: "CF-Ray",
		Confidence: "High",
	},
	{
		Name:       "AWS CloudFront",
		Category:   "CDN/WAF",
		HeaderName: "X-Amz-Cf-Id",
		Confidence: "High",
	},
	{
		Name:       "Varnish",
		Category:   "CDN/WAF",
		HeaderName: "X-Varnish",
		Confidence: "High",
	},
}

// FingerprintService, HTTP yanıt başlıkları ve HTML içeriğinden web teknolojilerini tespit eden servistir.
type FingerprintService struct{}

// NewFingerprintService, yeni bir parmak izi analiz servisi örneği oluşturur.
func NewFingerprintService() *FingerprintService {
	return &FingerprintService{}
}

// DetectTechnologies, verilen HTTP başlıkları, çerezler ve sayfa gövdesini analiz ederek bulunan teknolojileri döner.
func (f *FingerprintService) DetectTechnologies(headers http.Header, cookies []*http.Cookie, body string) []models.TechnologyItem {
	foundMap := make(map[string]models.TechnologyItem)

	// Çerez isimlerini hızlı arama için map'e al
	cookieMap := make(map[string]bool)
	for _, c := range cookies {
		cookieMap[strings.ToLower(c.Name)] = true
	}
	// Ayrıca raw Set-Cookie başlıkları varsa onları da incele
	rawSetCookies := headers["Set-Cookie"]
	for _, sc := range rawSetCookies {
		parts := strings.Split(sc, ";")
		if len(parts) > 0 {
			nameVal := strings.Split(parts[0], "=")
			if len(nameVal) > 0 {
				cookieMap[strings.ToLower(strings.TrimSpace(nameVal[0]))] = true
			}
		}
	}

	for _, rule := range techRules {
		matched := false
		version := ""

		// 1. Header Kontrolü
		if rule.HeaderName != "" {
			hVal := headers.Get(rule.HeaderName)
			if hVal != "" {
				if rule.HeaderRx != nil {
					sub := rule.HeaderRx.FindStringSubmatch(hVal)
					if len(sub) > 0 {
						matched = true
						if len(sub) > 1 && sub[1] != "" {
							version = sub[1]
						}
					}
				} else {
					matched = true
				}
			}
		}

		// 2. Cookie Kontrolü
		if !matched && rule.CookieName != "" {
			if cookieMap[strings.ToLower(rule.CookieName)] {
				matched = true
			}
		}

		// 3. Body / HTML Kontrolü
		if !matched && rule.BodyRx != nil && body != "" {
			sub := rule.BodyRx.FindStringSubmatch(body)
			if len(sub) > 0 {
				matched = true
				if len(sub) > 1 && sub[1] != "" {
					version = sub[1]
				}
			}
		}

		if matched {
			existing, exists := foundMap[rule.Name]
			if !exists || (existing.Version == "" && version != "") {
				foundMap[rule.Name] = models.TechnologyItem{
					Name:       rule.Name,
					Category:   rule.Category,
					Version:    version,
					Confidence: rule.Confidence,
				}
			}
		}
	}

	// Özel mantık: WordPress tespit edilmişse ve PHP henüz yoksa otomatik ekle
	if _, hasWP := foundMap["WordPress"]; hasWP {
		if _, hasPHP := foundMap["PHP"]; !hasPHP {
			foundMap["PHP"] = models.TechnologyItem{
				Name:       "PHP",
				Category:   "Language",
				Confidence: "High",
			}
		}
	}

	// Laravel tespit edilmişse ve PHP henüz yoksa otomatik ekle
	if _, hasLaravel := foundMap["Laravel"]; hasLaravel {
		if _, hasPHP := foundMap["PHP"]; !hasPHP {
			foundMap["PHP"] = models.TechnologyItem{
				Name:       "PHP",
				Category:   "Language",
				Confidence: "High",
			}
		}
	}

	// Next.js tespit edilmişse ve React henüz yoksa otomatik ekle
	if _, hasNext := foundMap["Next.js"]; hasNext {
		if _, hasReact := foundMap["React"]; !hasReact {
			foundMap["React"] = models.TechnologyItem{
				Name:       "React",
				Category:   "Framework",
				Confidence: "High",
			}
		}
	}

	// Haritayı listeye dönüştür
	results := make([]models.TechnologyItem, 0, len(foundMap))
	for _, item := range foundMap {
		results = append(results, item)
	}

	return results
}
