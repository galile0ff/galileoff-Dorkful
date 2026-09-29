package services

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"dorkapp/backend/models"
)

// ReconService, CRT.sh, HackerTarget, AlienVault OTX ve Archive.org gibi harici API key istemeyen açık OSINT servislerini sorgular.
type ReconService struct {
	client *http.Client
}

// NewReconService, zaman aşımı ayarlı yeni bir ReconService oluşturur.
func NewReconService() *ReconService {
	return &ReconService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// CrtShEntry, crt.sh JSON çıktısındaki ham veri yapısıdır.
type CrtShEntry struct {
	IssuerCaID     int    `json:"issuer_ca_id"`
	IssuerName     string `json:"issuer_name"`
	CommonName     string `json:"common_name"`
	NameValue      string `json:"name_value"`
	ID             int64  `json:"id"`
	EntryTimestamp string `json:"entry_timestamp"`
	NotBefore      string `json:"not_before"`
	NotAfter       string `json:"not_after"`
}

// OTXURLItem, AlienVault OTX URL API çıktısıdır.
type OTXURLItem struct {
	URL      string `json:"url"`
	Date     string `json:"date"`
	HTTPCode int    `json:"httpcode"`
}

type OTXResponse struct {
	URLList []OTXURLItem `json:"url_list"`
}

// FetchSubdomains, SubdomainCenter, HackerTarget ve CRT.sh üzerinden alt alan adlarını paralel/yedekli sorgular ve tekilleştirir.
func (s *ReconService) FetchSubdomains(domain string) ([]models.SubdomainResult, error) {
	cleanTarget := CleanTargetDomain(domain)
	if cleanTarget == "" {
		return nil, fmt.Errorf("geçersiz alan adı")
	}

	uniqueMap := make(map[string]models.SubdomainResult)

	// 1. Kaynak: Subdomain.Center (Yüzlerce derin ve güncel alt alan adı getirir)
	_ = s.fetchSubdomainCenter(cleanTarget, uniqueMap)

	// 2. Kaynak: HackerTarget (Çok hızlı, DNS ve IP bilgisi getirir)
	_ = s.fetchHackerTarget(cleanTarget, uniqueMap)

	// 3. Kaynak: CRT.sh (Sertifika şeffaflığı kayıtları)
	_ = s.fetchCrtSh(cleanTarget, uniqueMap)

	if len(uniqueMap) == 0 {
		return nil, fmt.Errorf("hedefe ait alt alan adı kaydı tespit edilemedi")
	}

	results := make([]models.SubdomainResult, 0, len(uniqueMap))
	for _, res := range uniqueMap {
		results = append(results, res)
	}

	// Alfabetik sıralama
	sort.Slice(results, func(i, j int) bool {
		return results[i].Subdomain < results[j].Subdomain
	})

	return results, nil
}

// fetchSubdomainCenter, Subdomain.Center API'sinden yüzlerce alt alan adını toplar.
func (s *ReconService) fetchSubdomainCenter(target string, uniqueMap map[string]models.SubdomainResult) error {
	url := fmt.Sprintf("https://api.subdomain.center/?domain=%s", target)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("SubdomainCenter HTTP %d", resp.StatusCode)
	}

	var subdomains []string
	if err := json.NewDecoder(resp.Body).Decode(&subdomains); err != nil {
		return err
	}

	nowStr := time.Now().Format("2006-01-02")
	for _, sub := range subdomains {
		cleanName := strings.TrimSpace(sub)
		cleanName = strings.TrimPrefix(cleanName, "*.")
		cleanName = strings.ToLower(cleanName)

		if cleanName != "" && strings.Contains(cleanName, target) {
			if _, exists := uniqueMap[cleanName]; !exists {
				uniqueMap[cleanName] = models.SubdomainResult{
					Subdomain: cleanName,
					LoggedAt:  nowStr,
					Issuer:    "Subdomain.Center",
				}
			}
		}
	}

	return nil
}

// fetchHackerTarget, HackerTarget HostSearch API'si üzerinden alt alan adlarını toplar.
func (s *ReconService) fetchHackerTarget(target string, uniqueMap map[string]models.SubdomainResult) error {
	url := fmt.Sprintf("https://api.hackertarget.com/hostsearch/?q=%s", target)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HackerTarget HTTP %d", resp.StatusCode)
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "error") || strings.HasPrefix(line, "API count") {
			continue
		}
		parts := strings.Split(line, ",")
		if len(parts) >= 1 {
			sub := strings.ToLower(strings.TrimSpace(parts[0]))
			if sub != "" && strings.Contains(sub, target) {
				if _, exists := uniqueMap[sub]; !exists {
					ip := ""
					if len(parts) >= 2 {
						ip = strings.TrimSpace(parts[1])
					}
					issuerText := "DNS A Kaydı"
					if ip != "" {
						issuerText = fmt.Sprintf("IP: %s", ip)
					}
					uniqueMap[sub] = models.SubdomainResult{
						Subdomain: sub,
						LoggedAt:  time.Now().Format("2006-01-02"),
						Issuer:    issuerText,
					}
				}
			}
		}
	}
	return scanner.Err()
}

// fetchCrtSh, crt.sh API'sini sorgular.
func (s *ReconService) fetchCrtSh(target string, uniqueMap map[string]models.SubdomainResult) error {
	url := fmt.Sprintf("https://crt.sh/?q=%s&output=json", target)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("CRT.sh HTTP %d", resp.StatusCode)
	}

	var entries []CrtShEntry
	if err := json.NewDecoder(resp.Body).Decode(&entries); err != nil {
		return err
	}

	for _, entry := range entries {
		names := strings.Split(entry.NameValue, "\n")
		for _, name := range names {
			cleanName := strings.TrimSpace(name)
			cleanName = strings.TrimPrefix(cleanName, "*.")
			cleanName = strings.ToLower(cleanName)

			if cleanName != "" && strings.Contains(cleanName, target) {
				if _, exists := uniqueMap[cleanName]; !exists {
					uniqueMap[cleanName] = models.SubdomainResult{
						Subdomain: cleanName,
						LoggedAt:  entry.EntryTimestamp,
						Issuer:    entry.IssuerName,
					}
				}
			}
		}
	}
	return nil
}

// FetchWaybackURLs, Archive.org CDX API ve AlienVault OTX üzerinden hedefin tarihi arşivlerini ve gizli URL'lerini çeker.
func (s *ReconService) FetchWaybackURLs(domain string) ([]models.WaybackResult, error) {
	cleanTarget := CleanTargetDomain(domain)
	if cleanTarget == "" {
		return nil, fmt.Errorf("geçersiz alan adı")
	}

	var archiveResults []models.WaybackResult
	var otxResults []models.WaybackResult

	// Archive.org CDX ve AlienVault OTX'i paralel olarak çek
	var wg sync.WaitGroup
	var cdxErr, otxErr error

	wg.Add(2)

	// 1. Birincil Kaynak: Archive.org CDX (En eski yıllardan başlayan gerçek web arşivi snapshot'ları)
	go func() {
		defer wg.Done()
		cdxErr = s.fetchArchiveOrgCDX(cleanTarget, &archiveResults)
	}()

	// 2. İkincil Kaynak: AlienVault OTX (Son keşfedilen parametreli uç noktalar)
	go func() {
		defer wg.Done()
		otxErr = s.fetchAlienVaultURLs(cleanTarget, &otxResults)
	}()

	wg.Wait()

	// Sonuçları birleştir: Önce tarihi Archive.org kayıtları (en eski yıllar üstte), sonra OTX kayıtları
	var combined []models.WaybackResult
	uniqueKeys := make(map[string]bool)

	for _, item := range archiveResults {
		key := fmt.Sprintf("%s|%s", item.URL, item.Year)
		if !uniqueKeys[key] {
			uniqueKeys[key] = true
			combined = append(combined, item)
		}
	}

	for _, item := range otxResults {
		key := fmt.Sprintf("%s|%s", item.URL, item.Year)
		if !uniqueKeys[key] {
			uniqueKeys[key] = true
			combined = append(combined, item)
		}
	}

	// Yıllara göre en eskiden en yeniye sırala (örnek: 2006, 2007 ... 2026)
	sort.SliceStable(combined, func(i, j int) bool {
		if combined[i].Year != combined[j].Year {
			return combined[i].Year < combined[j].Year
		}
		return combined[i].Timestamp < combined[j].Timestamp
	})

	if len(combined) == 0 {
		if cdxErr != nil && otxErr != nil {
			return nil, fmt.Errorf("arşiv servislerine erişilemedi: CDX (%v), OTX (%v)", cdxErr, otxErr)
		}
		return []models.WaybackResult{}, nil
	}

	return combined, nil
}

// fetchArchiveOrgCDX, Archive.org CDX API'sini sorgulayarak en eski arşiv snapshot'larını çeker.
func (s *ReconService) fetchArchiveOrgCDX(target string, results *[]models.WaybackResult) error {
	// matchType=prefix ve collapse=timestamp:4 ile 2006'dan günümüze her yılın arşiv snapshot'larını ve alt dizinlerini çek
	url := fmt.Sprintf("https://web.archive.org/cdx/search/cdx?url=%s&matchType=prefix&fl=timestamp,original,mimetype,statuscode&collapse=timestamp:4&limit=150&output=json", target)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	// CDX için yeterli zaman tanı
	cdxClient := &http.Client{Timeout: 12 * time.Second}
	resp, err := cdxClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Archive.org HTTP %d", resp.StatusCode)
	}

	var rawData [][]string
	if err := json.NewDecoder(resp.Body).Decode(&rawData); err != nil {
		return err
	}

	if len(rawData) <= 1 {
		return nil
	}

	for i := 1; i < len(rawData); i++ {
		row := rawData[i]
		if len(row) >= 4 {
			rawTimestamp := strings.TrimSpace(row[0])
			rawURL := strings.TrimSpace(row[1])
			mime := strings.TrimSpace(row[2])
			status := strings.TrimSpace(row[3])

			if rawURL == "" {
				continue
			}

			// Yıl bilgisini çıkar (timestamp: YYYYMMDDhhmmss)
			year := ""
			formattedDate := rawTimestamp
			if len(rawTimestamp) >= 4 {
				year = rawTimestamp[:4]
			}
			if len(rawTimestamp) >= 14 {
				formattedDate = fmt.Sprintf("%s-%s-%s %s:%s",
					rawTimestamp[0:4], rawTimestamp[4:6], rawTimestamp[6:8],
					rawTimestamp[8:10], rawTimestamp[10:12])
			} else if len(rawTimestamp) >= 8 {
				formattedDate = fmt.Sprintf("%s-%s-%s",
					rawTimestamp[0:4], rawTimestamp[4:6], rawTimestamp[6:8])
			}

			// Doğrudan o tarihteki web sayfasını açan Wayback Machine Snapshot linki
			snapshotURL := fmt.Sprintf("https://web.archive.org/web/%s/%s", rawTimestamp, rawURL)

			*results = append(*results, models.WaybackResult{
				URL:         rawURL,
				Timestamp:   formattedDate,
				MimeType:    mime,
				Status:      status,
				SnapshotURL: snapshotURL,
				Year:        year,
			})
		}
	}
	return nil
}

// fetchAlienVaultURLs, AlienVault OTX açık istihbaratından URL listesini çeker.
func (s *ReconService) fetchAlienVaultURLs(target string, results *[]models.WaybackResult) error {
	url := fmt.Sprintf("https://otx.alienvault.com/api/v1/indicators/domain/%s/url_list?limit=60&page=1", target)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("AlienVault HTTP %d", resp.StatusCode)
	}

	var otxData OTXResponse
	if err := json.NewDecoder(resp.Body).Decode(&otxData); err != nil {
		return err
	}

	for _, item := range otxData.URLList {
		rawURL := strings.TrimSpace(item.URL)
		if rawURL != "" {
			statusText := "200"
			if item.HTTPCode > 0 {
				statusText = fmt.Sprintf("%d", item.HTTPCode)
			}

			year := ""
			dateStr := strings.TrimSpace(item.Date)
			if len(dateStr) >= 4 {
				year = dateStr[:4]
			}

			// AlienVault kayıtları için genel Wayback arşivi URL'si
			snapshotURL := fmt.Sprintf("https://web.archive.org/web/*/%s", rawURL)

			*results = append(*results, models.WaybackResult{
				URL:         rawURL,
				Timestamp:   dateStr,
				MimeType:    "endpoint/otx",
				Status:      statusText,
				SnapshotURL: snapshotURL,
				Year:        year,
			})
		}
	}
	return nil
}
