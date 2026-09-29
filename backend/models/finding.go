package models

import "time"

// FindingSeverity, bulgunun risk önem derecesini tanımlar.
type FindingSeverity string

const (
	SeverityCritical FindingSeverity = "Critical" // 🔴 Kritik
	SeverityHigh     FindingSeverity = "High"     // 🟠 Yüksek
	SeverityMedium   FindingSeverity = "Medium"   // 🟡 Orta
	SeverityLow      FindingSeverity = "Low"      // 🔵 Düşük
)

// Finding, CTI araştırması veya sızma testi sırasında tespit edilen bir güvenlik bulgusunu temsil eder.
type Finding struct {
	ID          string          `json:"id"`
	Target      string          `json:"target"`
	DorkQuery   string          `json:"dorkQuery"`
	Category    string          `json:"category"`
	Severity    FindingSeverity `json:"severity"`
	EvidenceURL string          `json:"evidenceUrl"`
	Notes       string          `json:"notes"`
	CreatedAt   time.Time       `json:"createdAt"`
}
