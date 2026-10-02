package services

import (
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"dorkapp/backend/models"
)

// JSAnalyzerService, hedef web uygulamasının JavaScript dosyalarını toplayıp belgelenmemiş API rotaları ve sızdırılmış gizli anahtarlar için analiz eder.
type JSAnalyzerService struct {
	client *http.Client
}

// NewJSAnalyzerService, SSL doğrulamasını esneten ve güvenli zaman aşımına sahip yeni bir analiz servisi oluşturur.
func NewJSAnalyzerService() *JSAnalyzerService {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	return &JSAnalyzerService{
		client: &http.Client{
			Transport: tr,
			Timeout:   15 * time.Second,
		},
	}
}

// SecretRegexRule, sızıntı tespitinde kullanılan regex kalıbını ve güvenlik seviyesini tanımlar.
type SecretRegexRule struct {
	Name     string
	Severity string
	Regex    *regexp.Regexp
}

// jsRegexRules, taranacak bilinen hassas token ve secret desenlerinin listesidir.
var jsRegexRules = []SecretRegexRule{
	{
		Name:     "Google API Key",
		Severity: "high",
		Regex:    regexp.MustCompile(`\bAIza[0-9A-Za-z_-]{35}\b`),
	},
	{
		Name:     "AWS Access Key ID",
		Severity: "high",
		Regex:    regexp.MustCompile(`\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b`),
	},
	{
		Name:     "Firebase Realtime Database",
		Severity: "medium",
		Regex:    regexp.MustCompile(`https?:\/\/[a-z0-9_-]+\.firebaseio\.com`),
	},
	{
		Name:     "Slack Incoming Webhook",
		Severity: "critical",
		Regex:    regexp.MustCompile(`https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+`),
	},
	{
		Name:     "Slack Token",
		Severity: "critical",
		Regex:    regexp.MustCompile(`\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9_-]*\b`),
	},
	{
		Name:     "GitHub Personal Access Token",
		Severity: "critical",
		Regex:    regexp.MustCompile(`\bgh[pousr]_[0-9a-zA-Z]{36}\b`),
	},
	{
		Name:     "Stripe API Key",
		Severity: "high",
		Regex:    regexp.MustCompile(`\b(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}\b`),
	},
	{
		Name:     "JSON Web Token (JWT)",
		Severity: "critical",
		Regex:    regexp.MustCompile(`\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b`),
	},
	{
		Name:     "RSA / Private Key Bloğu",
		Severity: "critical",
		Regex:    regexp.MustCompile(`-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----`),
	},
	{
		Name:     "Mailgun API Key",
		Severity: "high",
		Regex:    regexp.MustCompile(`\bkey-[0-9a-zA-Z]{32}\b`),
	},
	{
		Name:     "Generic API / Secret Key",
		Severity: "high",
		Regex:    regexp.MustCompile(`(?i)(?:api[_-]?key|access[_-]?token|secret[_-]?key|client[_-]?secret|auth[_-]?token)\s*[:=]\s*['"]([a-zA-Z0-9_.-]{16,64})['"]`),
	},
	{
		Name:     "İç / Yerel Ağ Host Referansı",
		Severity: "medium",
		Regex:    regexp.MustCompile(`https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|[\w.-]+\.internal|[\w.-]+\.local)(?::\d+)?(?:[^\s"'>]+)?`),
	},
}

// endpointRegex, JS içinde geçen olası REST, GraphQL ve dahili API rotalarını yakalar.
var endpointRegex = regexp.MustCompile(`(?:["'])(\/(?:api|v[0-9]|rest|graphql|oauth|auth|admin|dashboard|user|account|internal|private|webhooks?|debug|health)[\w\-\.\/]*)(?:["'])`)

// scriptTagRegex, HTML içindeki script src etiketlerini yakalar.
var scriptTagRegex = regexp.MustCompile(`(?i)<script[^>]+src=["']([^"']+)["']`)

// jsChunkRegex, webpack ve modern bundle'larda geçen ek js chunk yollarını yakalar.
var jsChunkRegex = regexp.MustCompile(`["']((?:/[a-zA-Z0-9_\-\.]+)+\.js(?:\?[^"']*)?)["']`)

// AnalyzeTarget, verilen hedef URL/Domain adresinin HTML'ini ve JavaScript dosyalarını inceler.
func (s *JSAnalyzerService) AnalyzeTarget(target string) models.JSAnalysisResult {
	result := models.JSAnalysisResult{
		Target:    target,
		Scripts:   make([]models.JSSourceScript, 0),
		Endpoints: make([]models.JSEndpointItem, 0),
		Secrets:   make([]models.JSSecretItem, 0),
	}

	rawTarget := strings.TrimSpace(target)
	if rawTarget == "" {
		result.Error = "Hedef URL adresi boş olamaz"
		return result
	}

	// Protokol yoksa https olarak başlat, başarısızsa http dene
	targetURL := rawTarget
	if !strings.HasPrefix(targetURL, "http://") && !strings.HasPrefix(targetURL, "https://") {
		targetURL = "https://" + targetURL
	}

	parsedBase, err := url.Parse(targetURL)
	if err != nil {
		result.Error = fmt.Sprintf("Geçersiz hedef URL: %v", err)
		return result
	}

	// 1. Hedef ana sayfa HTML'ini indir
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		result.Error = fmt.Sprintf("İstek oluşturulamadı: %v", err)
		return result
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

	resp, err := s.client.Do(req)
	if err != nil && strings.HasPrefix(targetURL, "https://") {
		// HTTPS başarısız olduysa HTTP ile bir kez daha dene
		targetURL = "http://" + strings.TrimPrefix(targetURL, "https://")
		parsedBase, _ = url.Parse(targetURL)
		req, _ = http.NewRequest("GET", targetURL, nil)
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
		resp, err = s.client.Do(req)
	}

	if err != nil {
		result.Error = fmt.Sprintf("Hedef sayfaya erişilemedi: %v", err)
		return result
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		result.Error = fmt.Sprintf("Sayfa içeriği okunamadı: %v", err)
		return result
	}
	htmlContent := string(bodyBytes)

	// 2. HTML üzerinden JS URL'lerini tespit et
	scriptURLs := s.extractScriptURLs(htmlContent, parsedBase)
	result.TotalScripts = len(scriptURLs)

	if len(scriptURLs) == 0 {
		return result
	}

	// Maksimum taranacak dosya limiti (aşırı yükü ve kilitlenmeyi önler)
	maxScripts := 30
	if len(scriptURLs) > maxScripts {
		scriptURLs = scriptURLs[:maxScripts]
	}

	// 3. Eşzamanlı JS İndirme ve Analiz Havuzu
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 5) // Maksimum 5 eşzamanlı istek
	var mu sync.Mutex

	endpointsMap := make(map[string]models.JSEndpointItem)
	secretsMap := make(map[string]models.JSSecretItem)

	for _, scriptURL := range scriptURLs {
		wg.Add(1)
		semaphore <- struct{}{}

		go func(jsURL string) {
			defer wg.Done()
			defer func() { <-semaphore }()

			scriptInfo, endpoints, secrets := s.scanSingleJS(jsURL)

			mu.Lock()
			defer mu.Unlock()

			result.Scripts = append(result.Scripts, scriptInfo)
			if scriptInfo.StatusCode == 200 {
				result.ScannedScripts++
			}

			// Endpoint'leri tekilleştirerek ekle
			for _, ep := range endpoints {
				key := ep.Endpoint
				if _, exists := endpointsMap[key]; !exists {
					endpointsMap[key] = ep
				}
			}

			// Secret'ları tekilleştirerek ekle
			for _, sec := range secrets {
				key := sec.Type + ":" + sec.Value
				if _, exists := secretsMap[key]; !exists {
					secretsMap[key] = sec
				}
			}
		}(scriptURL)
	}

	wg.Wait()

	// Map'leri listeye dönüştür
	for _, ep := range endpointsMap {
		result.Endpoints = append(result.Endpoints, ep)
	}
	for _, sec := range secretsMap {
		result.Secrets = append(result.Secrets, sec)
	}

	return result
}

// extractScriptURLs, HTML içeriğinden mutlak JS bağlantılarını ayıklar ve temizler.
func (s *JSAnalyzerService) extractScriptURLs(htmlContent string, baseURL *url.URL) []string {
	foundMap := make(map[string]bool)
	var list []string

	// <script src="..."> eşleşmeleri
	matches := scriptTagRegex.FindAllStringSubmatch(htmlContent, -1)
	for _, m := range matches {
		if len(m) > 1 {
			s.addNormalizedURL(m[1], baseURL, foundMap, &list)
		}
	}

	// Webpack chunk veya manifest script yolları
	chunkMatches := jsChunkRegex.FindAllStringSubmatch(htmlContent, -1)
	for _, cm := range chunkMatches {
		if len(cm) > 1 {
			s.addNormalizedURL(cm[1], baseURL, foundMap, &list)
		}
	}

	return list
}

// addNormalizedURL, göreceli bağlantıları hedefin kök URL'sine göre mutlak adrese çevirir ve filtreler.
func (s *JSAnalyzerService) addNormalizedURL(rawPath string, baseURL *url.URL, foundMap map[string]bool, list *[]string) {
	trimmed := strings.TrimSpace(rawPath)
	if trimmed == "" {
		return
	}

	// Gürültülü harici kütüphaneleri filtrele (Analytics, Tag Manager vb.)
	noiseDomains := []string{
		"google-analytics.com",
		"googletagmanager.com",
		"connect.facebook.net",
		"clarity.ms",
		"hotjar.com",
		"recaptcha",
		"hcaptcha.com",
	}
	for _, noise := range noiseDomains {
		if strings.Contains(strings.ToLower(trimmed), noise) {
			return
		}
	}

	relURL, err := url.Parse(trimmed)
	if err != nil {
		return
	}

	absURL := baseURL.ResolveReference(relURL).String()

	// Yalnızca .js uzantılı veya js içeren yolları kabul et
	if !strings.Contains(absURL, ".js") {
		return
	}

	if !foundMap[absURL] {
		foundMap[absURL] = true
		*list = append(*list, absURL)
	}
}

// scanSingleJS, tek bir JavaScript dosyasını indirir ve regex analizlerini tamamlar.
func (s *JSAnalyzerService) scanSingleJS(jsURL string) (models.JSSourceScript, []models.JSEndpointItem, []models.JSSecretItem) {
	scriptInfo := models.JSSourceScript{
		URL: jsURL,
	}
	var endpoints []models.JSEndpointItem
	var secrets []models.JSSecretItem

	req, err := http.NewRequest("GET", jsURL, nil)
	if err != nil {
		scriptInfo.Error = err.Error()
		return scriptInfo, endpoints, secrets
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

	resp, err := s.client.Do(req)
	if err != nil {
		scriptInfo.Error = err.Error()
		return scriptInfo, endpoints, secrets
	}
	defer resp.Body.Close()

	scriptInfo.StatusCode = resp.StatusCode
	if resp.StatusCode != http.StatusOK {
		scriptInfo.Error = fmt.Sprintf("HTTP Durumu: %d", resp.StatusCode)
		return scriptInfo, endpoints, secrets
	}

	// Maksimum 5MB limit
	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		scriptInfo.Error = fmt.Sprintf("Okuma hatası: %v", err)
		return scriptInfo, endpoints, secrets
	}

	scriptInfo.ByteSize = int64(len(bodyBytes))
	content := string(bodyBytes)

	// 1. Secret / Hassas Anahtar Taraması
	for _, rule := range jsRegexRules {
		indices := rule.Regex.FindAllStringIndex(content, 10)
		for _, idx := range indices {
			start, end := idx[0], idx[1]
			matchedVal := content[start:end]

			// Eğer generic kural ise ve yakalama grubu varsa onu ayıkla
			if rule.Name == "Generic API / Secret Key" {
				subMatches := rule.Regex.FindStringSubmatch(content[start:end])
				if len(subMatches) > 1 {
					matchedVal = subMatches[1]
				}
			}

			// Çok bariz sahte veya kütüphane isimlerini ele
			if len(matchedVal) < 8 || strings.Contains(matchedVal, "undefined") || strings.Contains(matchedVal, "example") {
				continue
			}

			// Çevreleyen kod parçacığını (snippet) al
			snippetStart := start - 40
			if snippetStart < 0 {
				snippetStart = 0
			}
			snippetEnd := end + 40
			if snippetEnd > len(content) {
				snippetEnd = len(content)
			}
			snippet := strings.TrimSpace(content[snippetStart:snippetEnd])
			snippet = strings.ReplaceAll(snippet, "\n", " ")

			secrets = append(secrets, models.JSSecretItem{
				Type:      rule.Name,
				Value:     matchedVal,
				RawMatch:  content[start:end],
				SourceURL: jsURL,
				Severity:  rule.Severity,
			})
		}
	}

	// 2. Dahili API Uç Noktaları Taraması
	epMatches := endpointRegex.FindAllStringSubmatchIndex(content, 50)
	for _, idx := range epMatches {
		if len(idx) >= 4 {
			// Grup 1: yakalanan yol
			epStart, epEnd := idx[2], idx[3]
			pathVal := content[epStart:epEnd]

			// Statik uzantıları ele (.js, .css, .png vb.)
			lower := strings.ToLower(pathVal)
			if strings.HasSuffix(lower, ".js") || strings.HasSuffix(lower, ".css") || strings.HasSuffix(lower, ".png") ||
				strings.HasSuffix(lower, ".jpg") || strings.HasSuffix(lower, ".svg") || strings.HasSuffix(lower, ".woff") {
				continue
			}

			snippetStart := epStart - 30
			if snippetStart < 0 {
				snippetStart = 0
			}
			snippetEnd := epEnd + 30
			if snippetEnd > len(content) {
				snippetEnd = len(content)
			}
			snippet := strings.TrimSpace(content[snippetStart:snippetEnd])
			snippet = strings.ReplaceAll(snippet, "\n", " ")

			endpoints = append(endpoints, models.JSEndpointItem{
				Endpoint:  pathVal,
				SourceURL: jsURL,
				Snippet:   snippet,
			})
		}
	}

	return scriptInfo, endpoints, secrets
}
