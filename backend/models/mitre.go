package models

// MitreAttack, MITRE ATT&CK çerçevesindeki taktik ve teknik bilgilerini temsil eder.
type MitreAttack struct {
	TechniqueID string `json:"techniqueId"` // Örn: "T1593.002"
	Technique   string `json:"technique"`   // Örn: "Search Engines"
	TacticID    string `json:"tacticId"`    // Örn: "TA0043"
	Tactic      string `json:"tactic"`      // Örn: "Reconnaissance"
	URL         string `json:"url"`         // Örn: "https://attack.mitre.org/techniques/T1593/002/"
}
