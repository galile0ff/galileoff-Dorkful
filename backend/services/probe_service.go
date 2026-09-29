package services

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"strings"
	"time"

	"dorkapp/backend/models"
)

// ProbeService, hedefin HTTP/HTTPS canlılık, durum kodu ve sunucu başlıklarını denetleyen servistir.
type ProbeService struct {
	client *http.Client
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
			Target:  targetLabel,
			URL:     urlStr,
			IsAlive: false,
			Error:   err.Error(),
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
			Error:          err.Error(),
		}
	}
	defer resp.Body.Close()

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
	}
}
