package models

// Dork, bir arama sorgusunun veri yapısını temsil eder.
type Dork struct {
	Query       string       `json:"query"`
	Description string       `json:"description"`
	Category    string       `json:"category"`
	Engine      string       `json:"engine,omitempty"`    // "google" | "github" | "shodan" | "censys"
	SearchURL   string       `json:"searchUrl,omitempty"` // Tarayıcıda açılacak hazır URL
	Mitre       *MitreAttack `json:"mitre,omitempty"`
}

// Template, dork üretimi için kullanılan şablon tanımıdır.
type Template struct {
	Template    string       `json:"template"`
	Description string       `json:"description"`
	Category    string       `json:"category"`
	Mitre       *MitreAttack `json:"mitre,omitempty"`
}
