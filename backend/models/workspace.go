package models

import "time"

// Workspace, sızma testi veya CTI araştırmasında hedefe ait genişletilmiş profili temsil eder.
type Workspace struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`      // Kurum / Hedef Adı (örn: "Acme Corp")
	Domain    string    `json:"domain"`    // Ana Domain (örn: "acme.com")
	Company   string    `json:"company"`   // Şirket Arama Terimi (örn: "Acme")
	ASN       string    `json:"asn"`       // ASN Numarası (örn: "AS12345")
	IPRange   string    `json:"ipRange"`   // IP / CIDR Bloğu (örn: "185.120.0.0/24")
	GithubOrg string    `json:"githubOrg"` // GitHub Organizasyon Adı (örn: "acmecorp")
	CreatedAt time.Time `json:"createdAt"`
}
