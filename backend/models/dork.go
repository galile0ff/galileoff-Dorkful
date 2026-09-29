package models

// Dork, bir Google Dork arama sorgusunun veri yapısını temsil eder.
type Dork struct {
	Query       string       `json:"query"`
	Description string       `json:"description"`
	Category    string       `json:"category"`
	Mitre       *MitreAttack `json:"mitre,omitempty"`
}

// Template, dork üretimi için kullanılan şablon tanımıdır.
type Template struct {
	Template    string       `json:"template"`
	Description string       `json:"description"`
	Category    string       `json:"category"`
	Mitre       *MitreAttack `json:"mitre,omitempty"`
}
