package services

import (
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"dorkapp/backend/models"
)

// ProbeService, hedefin HTTP/HTTPS canlılık, durum kodu, sunucu başlıkları ve teknoloji parmak izlerini denetleyen servistir.
type ProbeService struct {
	client             *http.Client
	fingerprintService *FingerprintService
}

// NewProbeService, zaman aşımı ve TLS ayarları yapılandırılmış bir ProbeService örneği oluşturur.
func NewProbeService() *ProbeService {
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // Self-signed veya geçersiz sertifikalarda da bilgi toplayabilmek için
		},
		DisableKeepAlives: true,
	}

	return &ProbeService{
		client: &http.Client{
			Transport: transport,
			Timeout:   6 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 5 {
					return http.ErrUseLastResponse
				}
				return nil
			},
		},
		fingerprintService: NewFingerprintService(),
	}
}

// ProbeTarget, verilen alan adı veya IP'nin canlılığını (HTTPS ve HTTP) kontrol eder.
func (s *ProbeService) ProbeTarget(target string) models.ProbeResult {
	cleanTarget := CleanTargetDomain(target)

	if cleanTarget == "" {
		return models.ProbeResult{
			Target:  target,
			IsAlive: false,
			Error:   "geçersiz veya boş hedef",
		}
	}

	// İlk olarak HTTPS üzerinden test et
	httpsURL := fmt.Sprintf("https://%s", cleanTarget)
	res := s.probeSingleURL(httpsURL, cleanTarget)
	if res.IsAlive {
		return res
	}

	// HTTPS başarısız olduysa HTTP üzerinden tekrar dene
	httpURL := fmt.Sprintf("http://%s", cleanTarget)
	httpRes := s.probeSingleURL(httpURL, cleanTarget)
	if httpRes.IsAlive {
		return httpRes
	}

	// İkisi de başarısız ise HTTPS hatasını dön
	return res
}

// ProbeURL, doğrudan verilen tam bir URL adresini kontrol eder.
func (s *ProbeService) ProbeURL(rawURL string) models.ProbeResult {
	trimmed := strings.TrimSpace(rawURL)
	if !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
		trimmed = "https://" + trimmed
	}
	return s.probeSingleURL(trimmed, trimmed)
}

func (s *ProbeService) probeSingleURL(urlStr string, targetLabel string) models.ProbeResult {
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return models.ProbeResult{
			Target:       targetLabel,
			URL:          urlStr,
			IsAlive:      false,
			Technologies: make([]models.TechnologyItem, 0),
			Error:        err.Error(),
		}
	}

	// Standart bir modern tarayıcı User-Agent başlığı
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	startTime := time.Now()
	resp, err := s.client.Do(req)
	duration := time.Since(startTime).Milliseconds()

	if err != nil {
		return models.ProbeResult{
			Target:         targetLabel,
			URL:            urlStr,
			IsAlive:        false,
			ResponseTimeMs: duration,
			Technologies:   make([]models.TechnologyItem, 0),
			Error:          err.Error(),
		}
	}
	defer resp.Body.Close()

	// Sayfa gövdesinin ilk 512KB'ını parmak izi tespiti için oku
	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 512*1024))
	bodyStr := string(bodyBytes)

	// Başlıklar, çerezler ve HTML üzerinden teknolojileri tespit et
	techs := s.fingerprintService.DetectTechnologies(resp.Header, resp.Cookies(), bodyStr)

	server := resp.Header.Get("Server")
	contentType := resp.Header.Get("Content-Type")

	return models.ProbeResult{
		Target:         targetLabel,
		URL:            urlStr,
		StatusCode:     resp.StatusCode,
		StatusText:     resp.Status,
		ResponseTimeMs: duration,
		Server:         server,
		ContentType:    contentType,
		IsAlive:        true,
		Technologies:   techs,
	}
}

// ProbeSubdomainsBatch, verilen alt alan adlarını paralel goroutine'lerle hızlıca denetler.
func (s *ProbeService) ProbeSubdomainsBatch(subdomains []string, onProgress func(res models.ProbeResult)) map[string]models.ProbeResult {
	resultMap := make(map[string]models.ProbeResult)
	if len(subdomains) == 0 {
		return resultMap
	}

	// 25 eşzamanlı worker semaforu ile yüksek hızlı tarama
	concurrency := 25
	sem := make(chan struct{}, concurrency)
	
	// Thread-safe map ve channel
	type probeItem struct {
		sub string
		res models.ProbeResult
	}
	resultsChan := make(chan probeItem, len(subdomains))

	// Hızlı test client'ı (2500ms timeout)
	fastClient := &http.Client{
		Transport: s.client.Transport,
		Timeout:   2500 * time.Millisecond,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	for _, sub := range subdomains {
		sem <- struct{}{}
		go func(subdomain string) {
			defer func() { <-sem }()

			// Önce HTTPS, başarısızsa HTTP dene
			clean := strings.TrimSpace(subdomain)
			clean = strings.TrimPrefix(clean, "*.")
			if clean == "" {
				resultsChan <- probeItem{sub: subdomain, res: models.ProbeResult{Target: subdomain, IsAlive: false, Error: "boş"}}
				return
			}

			probeURL := fmt.Sprintf("https://%s", clean)
			req, err := http.NewRequest("GET", probeURL, nil)
			if err != nil {
				resultsChan <- probeItem{sub: subdomain, res: models.ProbeResult{Target: subdomain, IsAlive: false, Error: err.Error()}}
				return
			}
			req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

			start := time.Now()
			resp, err := fastClient.Do(req)
			dur := time.Since(start).Milliseconds()

			if err == nil {
				defer resp.Body.Close()
				res := models.ProbeResult{
					Target:         subdomain,
					URL:            probeURL,
					StatusCode:     resp.StatusCode,
					StatusText:     resp.Status,
					ResponseTimeMs: dur,
					Server:         resp.Header.Get("Server"),
					IsAlive:        true,
				}
				if onProgress != nil {
					onProgress(res)
				}
				resultsChan <- probeItem{sub: subdomain, res: res}
				return
			}

			// HTTPS başarısız olduysa HTTP dene
			probeHTTPURL := fmt.Sprintf("http://%s", clean)
			httpReq, httpErr := http.NewRequest("GET", probeHTTPURL, nil)
			if httpErr == nil {
				httpReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")
				httpStart := time.Now()
				httpResp, httpDoErr := fastClient.Do(httpReq)
				httpDur := time.Since(httpStart).Milliseconds()
				if httpDoErr == nil {
					defer httpResp.Body.Close()
					res := models.ProbeResult{
						Target:         subdomain,
						URL:            probeHTTPURL,
						StatusCode:     httpResp.StatusCode,
						StatusText:     httpResp.Status,
						ResponseTimeMs: httpDur,
						Server:         httpResp.Header.Get("Server"),
						IsAlive:        true,
					}
					if onProgress != nil {
						onProgress(res)
					}
					resultsChan <- probeItem{sub: subdomain, res: res}
					return
				}
			}

			// İkisi de kapalı/erişilemedi
			deadRes := models.ProbeResult{
				Target:         subdomain,
				URL:            probeURL,
				IsAlive:        false,
				ResponseTimeMs: dur,
				Error:          err.Error(),
			}
			if onProgress != nil {
				onProgress(deadRes)
			}
			resultsChan <- probeItem{sub: subdomain, res: deadRes}
		}(sub)
	}

	for i := 0; i < len(subdomains); i++ {
		item := <-resultsChan
		resultMap[item.sub] = item.res
	}

	return resultMap
}
