package services

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"dorkapp/backend/models"
)

// DNSMapService, hedefin DNS kayıtlarını çözümler ve paylaşılan IP adresindeki komşu siteleri araştırarak ağ topolojisi oluşturur.
type DNSMapService struct {
	client *http.Client
}

// NewDNSMapService, zaman aşımı ayarlanmış yeni bir DNS ve Reverse IP servisi oluşturur.
func NewDNSMapService() *DNSMapService {
	return &DNSMapService{
		client: &http.Client{
			Timeout: 12 * time.Second,
		},
	}
}

// FetchDNSAndReverseIP, verilen alan adı için tüm DNS kayıtlarını ve paylaşımlı sunucudaki komşu siteleri tespit eder.
func (s *DNSMapService) FetchDNSAndReverseIP(domain string) models.DNSMapResult {
	cleanTarget := CleanTargetDomain(domain)
	result := models.DNSMapResult{
		Target:          cleanTarget,
		Records:         make([]models.DNSRecordItem, 0),
		CoHostedDomains: make([]models.CoHostedDomainItem, 0),
		Nodes:           make([]models.NetworkNode, 0),
		Edges:           make([]models.NetworkEdge, 0),
	}

	if cleanTarget == "" {
		result.Error = "Hedef alan adı boş olamaz"
		return result
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	// 1. A ve AAAA Kayıtları (IP Çözümleme)
	var resolvedIPv4s []string
	wg.Add(1)
	go func() {
		defer wg.Done()
		ips, err := net.LookupIP(cleanTarget)
		if err == nil {
			mu.Lock()
			defer mu.Unlock()
			for _, ip := range ips {
				recType := "A"
				if ip.To4() == nil {
					recType = "AAAA"
				} else {
					resolvedIPv4s = append(resolvedIPv4s, ip.String())
				}
				result.Records = append(result.Records, models.DNSRecordItem{
					Type:  recType,
					Value: ip.String(),
				})
			}
		}
	}()

	// 2. NS (Name Server) Kayıtları
	wg.Add(1)
	go func() {
		defer wg.Done()
		nss, err := net.LookupNS(cleanTarget)
		if err == nil {
			mu.Lock()
			defer mu.Unlock()
			for _, ns := range nss {
				hostVal := strings.TrimSuffix(ns.Host, ".")
				result.Records = append(result.Records, models.DNSRecordItem{
					Type:  "NS",
					Value: hostVal,
				})
			}
		}
	}()

	// 3. MX (Mail Server) Kayıtları
	wg.Add(1)
	go func() {
		defer wg.Done()
		mxs, err := net.LookupMX(cleanTarget)
		if err == nil {
			mu.Lock()
			defer mu.Unlock()
			for _, mx := range mxs {
				hostVal := strings.TrimSuffix(mx.Host, ".")
				result.Records = append(result.Records, models.DNSRecordItem{
					Type:     "MX",
					Value:    hostVal,
					Priority: int(mx.Pref),
				})
			}
		}
	}()

	// 4. TXT Kayıtları (SPF, DMARC, Doğrulama Tokenları)
	wg.Add(1)
	go func() {
		defer wg.Done()
		txts, err := net.LookupTXT(cleanTarget)
		if err == nil {
			mu.Lock()
			defer mu.Unlock()
			count := 0
			for _, txt := range txts {
				if count >= 8 {
					break
				}
				result.Records = append(result.Records, models.DNSRecordItem{
					Type:  "TXT",
					Value: txt,
				})
				count++
			}
		}
	}()

	// 5. CNAME Kaydı
	wg.Add(1)
	go func() {
		defer wg.Done()
		cname, err := net.LookupCNAME(cleanTarget)
		if err == nil {
			cleanCname := strings.TrimSuffix(cname, ".")
			if cleanCname != "" && cleanCname != cleanTarget {
				mu.Lock()
				defer mu.Unlock()
				result.Records = append(result.Records, models.DNSRecordItem{
					Type:  "CNAME",
					Value: cleanCname,
				})
			}
		}
	}()

	wg.Wait()

	// 6. Reverse IP Lookup (Çözümlenen IPv4 adresleri üzerinden komşu siteleri tara)
	coHostMap := make(map[string]models.CoHostedDomainItem)
	var reverseWg sync.WaitGroup
	reverseSem := make(chan struct{}, 3)

	for _, ip := range resolvedIPv4s {
		reverseWg.Add(1)
		reverseSem <- struct{}{}

		go func(targetIP string) {
			defer reverseWg.Done()
			defer func() { <-reverseSem }()

			var neighbors []string

			// 1. RapidDNS Same-IP Sorgusu (Kotasız, son derece hızlı, 8+ milyar DNS verisi)
			rapidNeighbors := s.fetchRapidDNSReverseIP(targetIP)
			neighbors = append(neighbors, rapidNeighbors...)

			// 2. Shodan InternetDB Hostnames sorgusu (Ücretsiz, hızlı)
			shodanNeighbors := s.fetchInternetDBHostnames(targetIP)
			neighbors = append(neighbors, shodanNeighbors...)

			// 3. Ters DNS (PTR) sorgusu
			ptrHosts, err := net.LookupAddr(targetIP)
			if err == nil {
				for _, ptr := range ptrHosts {
					cleanPtr := strings.TrimSuffix(ptr, ".")
					if cleanPtr != "" {
						neighbors = append(neighbors, cleanPtr)
					}
				}
			}

			// 4. AlienVault OTX Passive DNS sorgusu (Eğer liste henüz yeterli değilse ekle)
			if len(neighbors) < 15 {
				otxNeighbors := s.fetchOTXReverseIP(targetIP)
				neighbors = append(neighbors, otxNeighbors...)
			}

			// 5. HackerTarget Reverse IP API sorgusu (Eğer liste henüz yeterli değilse ekle)
			if len(neighbors) < 10 {
				htNeighbors := s.fetchHackerTargetReverseIP(targetIP)
				neighbors = append(neighbors, htNeighbors...)
			}

			mu.Lock()
			defer mu.Unlock()
			for _, n := range neighbors {
				cleanN := strings.ToLower(strings.TrimSpace(n))
				// Hedefin kendisi ve geçersiz satırları ele
				if cleanN == "" || cleanN == cleanTarget || strings.HasSuffix(cleanN, "."+cleanTarget) {
					continue
				}
				if _, exists := coHostMap[cleanN]; !exists {
					coHostMap[cleanN] = models.CoHostedDomainItem{
						Domain:     cleanN,
						ResolvedIP: targetIP,
						Source:     "Reverse IP",
					}
				}
			}
		}(ip)
	}

	reverseWg.Wait()

	// Komşu siteleri sonuca ekle
	for _, item := range coHostMap {
		result.CoHostedDomains = append(result.CoHostedDomains, item)
	}

	// 7. Ağ Topolojisi Düğümleri ve Bağlantılarını İnşa Et
	s.buildNetworkGraph(&result, cleanTarget)

	return result
}

var rapidDNSRegex = regexp.MustCompile(`(?i)<td>\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*</td>`)

// fetchRapidDNSReverseIP, RapidDNS veritabanından IP'yi paylaşan komşu siteleri çeker.
func (s *DNSMapService) fetchRapidDNSReverseIP(ip string) []string {
	var list []string
	reqURL := fmt.Sprintf("https://rapiddns.io/sameip/%s?full=1", ip)

	ctx, cancel := context.WithTimeout(context.Background(), 7*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return list
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := s.client.Do(req)
	if err != nil {
		return list
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return list
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return list
	}

	matches := rapidDNSRegex.FindAllStringSubmatch(string(bodyBytes), -1)
	seen := make(map[string]bool)

	for _, m := range matches {
		if len(m) > 1 {
			dom := strings.ToLower(strings.TrimSpace(m[1]))
			if dom != "" && !seen[dom] && !strings.Contains(dom, "/") {
				seen[dom] = true
				list = append(list, dom)
				if len(list) >= 40 {
					break
				}
			}
		}
	}

	return list
}

// fetchOTXReverseIP, AlienVault OTX Passive DNS üzerinden IP'deki alan adlarını çeker (Ücretsiz ve kota limitsiz).
func (s *DNSMapService) fetchOTXReverseIP(ip string) []string {
	var list []string
	reqURL := fmt.Sprintf("https://otx.alienvault.com/api/v1/indicators/IPv4/%s/passive_dns", ip)

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return list
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return list
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return list
	}

	var otxData struct {
		PassiveDNS []struct {
			Hostname string `json:"hostname"`
		} `json:"passive_dns"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&otxData); err != nil {
		return list
	}

	seen := make(map[string]bool)
	for _, item := range otxData.PassiveDNS {
		cleanHost := strings.ToLower(strings.TrimSpace(item.Hostname))
		if cleanHost == "" || seen[cleanHost] {
			continue
		}
		seen[cleanHost] = true
		list = append(list, cleanHost)
		if len(list) >= 40 {
			break
		}
	}

	return list
}

// fetchInternetDBHostnames, Shodan InternetDB üzerinden IP'deki host adlarını çeker (Ücretsiz, keyless).
func (s *DNSMapService) fetchInternetDBHostnames(ip string) []string {
	var list []string
	reqURL := fmt.Sprintf("https://internetdb.shodan.io/%s", ip)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return list
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return list
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return list
	}

	var idbData struct {
		Hostnames []string `json:"hostnames"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&idbData); err != nil {
		return list
	}

	for _, h := range idbData.Hostnames {
		cleanHost := strings.ToLower(strings.TrimSpace(h))
		if cleanHost != "" {
			list = append(list, cleanHost)
		}
	}

	return list
}

// fetchHackerTargetReverseIP, HackerTarget API üzerinden verilen IP'deki paylaşımlı siteleri çeker.
func (s *DNSMapService) fetchHackerTargetReverseIP(ip string) []string {
	var list []string
	reqURL := fmt.Sprintf("https://api.hackertarget.com/reverseiplookup/?q=%s", ip)

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return list
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dorkful-CTI/2.0")

	resp, err := s.client.Do(req)
	if err != nil {
		return list
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return list
	}

	scanner := bufio.NewScanner(resp.Body)
	count := 0
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "error") || strings.HasPrefix(line, "API count") {
			continue
		}
		list = append(list, line)
		count++
		if count >= 35 { // Fazla kalabalıklaşmayı önlemek için sınır
			break
		}
	}

	return list
}

// buildNetworkGraph, DNS kayıtları ve komşu sitelerden interaktif topoloji grafı oluşturur.
func (s *DNSMapService) buildNetworkGraph(result *models.DNSMapResult, cleanTarget string) {
	nodeMap := make(map[string]bool)

	// 1. Merkez Düğüm: Hedef Alan Adı
	targetNodeID := "node-target"
	result.Nodes = append(result.Nodes, models.NetworkNode{
		ID:       targetNodeID,
		Label:    cleanTarget,
		Type:     "target",
		Category: "Hedef Alan Adı",
		Details:  "Merkezi İstihbarat Hedefi",
	})
	nodeMap[targetNodeID] = true

	// 2. DNS Kayıt Düğümleri ve Bağlantıları
	for idx, rec := range result.Records {
		nodeID := fmt.Sprintf("dns-%s-%d", strings.ToLower(rec.Type), idx)
		if nodeMap[nodeID] {
			continue
		}
		nodeMap[nodeID] = true

		categoryLabel := rec.Type + " Kaydı"
		edgeLabel := rec.Type

		result.Nodes = append(result.Nodes, models.NetworkNode{
			ID:       nodeID,
			Label:    rec.Value,
			Type:     strings.ToLower(rec.Type),
			Category: categoryLabel,
			Details:  fmt.Sprintf("DNS %s Kaydı", rec.Type),
		})

		result.Edges = append(result.Edges, models.NetworkEdge{
			Source: targetNodeID,
			Target: nodeID,
			Type:   "dns",
			Label:  edgeLabel,
		})
	}

	// 3. Komşu Siteler Düğümleri (Aynı IP'deki Siteler)
	// Her komşu siteyi ilgili IP düğümüne bağla
	for idx, cohost := range result.CoHostedDomains {
		if idx >= 30 {
			break // Harita okunabilirliği için ilk 30 komşu site
		}

		cohostNodeID := fmt.Sprintf("cohost-%d", idx)
		if nodeMap[cohostNodeID] {
			continue
		}
		nodeMap[cohostNodeID] = true

		result.Nodes = append(result.Nodes, models.NetworkNode{
			ID:       cohostNodeID,
			Label:    cohost.Domain,
			Type:     "cohost",
			Category: "Aynı IP'deki Komşu Site",
			Details:  fmt.Sprintf("Paylaşılan Sunucu IP'si: %s", cohost.ResolvedIP),
		})

		// İlgili IP düğümünü bul, yoksa merkez hedefe bağla
		parentID := targetNodeID
		for _, rec := range result.Records {
			if rec.Value == cohost.ResolvedIP {
				for _, n := range result.Nodes {
					if n.Label == cohost.ResolvedIP {
						parentID = n.ID
						break
					}
				}
				break
			}
		}

		result.Edges = append(result.Edges, models.NetworkEdge{
			Source: parentID,
			Target: cohostNodeID,
			Type:   "cohost_link",
			Label:  "Komşu Sunucu",
		})
	}
}
