package services

import (
	"testing"
)

func TestReconService(t *testing.T) {
	recon := NewReconService()

	// 1. Alt alan adı testi (Subdomain.Center + HackerTarget + CRT.sh)
	subs, err := recon.FetchSubdomains("trendyol.com")
	if err != nil {
		t.Fatalf("FetchSubdomains hatası: %v", err)
	}
	if len(subs) == 0 {
		t.Fatalf("Alt alan adı bulunamadı")
	}
	t.Logf("Başarılı! %d alt alan adı bulundu. İlk 3 örnek: %s, %s, %s", len(subs), subs[0].Subdomain, subs[1].Subdomain, subs[2].Subdomain)

	// 2. Canlılık testi (ProbeSubdomainsBatch)
	prober := NewProbeService()
	testBatch := []string{subs[0].Subdomain, subs[1].Subdomain, "invalid-domain-xyz-123.com"}
	probeResults := prober.ProbeSubdomainsBatch(testBatch, nil)
	t.Logf("Batch Canlılık Testi Sonuçları: %d adet test edildi.", len(probeResults))

	// 3. Wayback URL testi (AlienVault + Archive.org)
	urls, err := recon.FetchWaybackURLs("trendyol.com")
	if err != nil {
		t.Fatalf("FetchWaybackURLs hatası: %v", err)
	}
	t.Logf("Başarılı! %d Wayback/OTX URL bulundu.", len(urls))
}

type ProbeResultWrapper = interface{}
