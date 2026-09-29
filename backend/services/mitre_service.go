package services

import (
	"strings"

	"dorkapp/backend/models"
)

// Standart MITRE ATT&CK Taktik ve Teknik Tanımları
var (
	MitreSearchEngines = &models.MitreAttack{
		TechniqueID: "T1593.002",
		Technique:   "Search Open Websites/Domains: Search Engines",
		TacticID:    "TA0043",
		Tactic:      "Reconnaissance",
		URL:         "https://attack.mitre.org/techniques/T1593/002/",
	}

	MitreCredentialsInFiles = &models.MitreAttack{
		TechniqueID: "T1552.001",
		Technique:   "Unsecured Credentials: Credentials In Files",
		TacticID:    "TA0006",
		Tactic:      "Credential Access",
		URL:         "https://attack.mitre.org/techniques/T1552/001/",
	}

	MitreExploitPublicFacing = &models.MitreAttack{
		TechniqueID: "T1190",
		Technique:   "Exploit Public-Facing Application",
		TacticID:    "TA0001",
		Tactic:      "Initial Access",
		URL:         "https://attack.mitre.org/techniques/T1190/",
	}

	MitreSearchVictimWebsites = &models.MitreAttack{
		TechniqueID: "T1594",
		Technique:   "Search Victim-Owned Websites",
		TacticID:    "TA0043",
		Tactic:      "Reconnaissance",
		URL:         "https://attack.mitre.org/techniques/T1594/",
	}

	MitreTechnicalDatabases = &models.MitreAttack{
		TechniqueID: "T1596",
		Technique:   "Search Open Technical Databases",
		TacticID:    "TA0043",
		Tactic:      "Reconnaissance",
		URL:         "https://attack.mitre.org/techniques/T1596/",
	}

	MitreGatherHostSoftware = &models.MitreAttack{
		TechniqueID: "T1592.002",
		Technique:   "Gather Victim Host Information: Software",
		TacticID:    "TA0043",
		Tactic:      "Reconnaissance",
		URL:         "https://attack.mitre.org/techniques/T1592/002/",
	}
)

// ResolveMitreAttack, verilen kategori veya dork sorgusuna göre en uygun MITRE ATT&CK tekniğini akıllıca belirler.
func ResolveMitreAttack(category string, templateOrQuery string) *models.MitreAttack {
	catLower := strings.ToLower(category)
	qLower := strings.ToLower(templateOrQuery)

	// 1. Kimlik Bilgileri ve Parolalar (Credential Access)
	if catLower == "sensitive data" ||
		strings.Contains(qLower, "password") ||
		strings.Contains(qLower, "pwd") ||
		strings.Contains(qLower, "api_key") ||
		strings.Contains(qLower, "private key") ||
		strings.Contains(qLower, "connectionstring") ||
		strings.Contains(qLower, "db_password") ||
		strings.Contains(qLower, "ext:env") ||
		strings.Contains(qLower, "ext:sql") ||
		strings.Contains(qLower, "ext:pem") ||
		strings.Contains(qLower, "ext:key") ||
		strings.Contains(qLower, "credentials") {
		return MitreCredentialsInFiles
	}

	// 2. Yönetim Panelleri ve Giriş Noktaları (Initial Access)
	if catLower == "admin panels" ||
		strings.Contains(qLower, "inurl:admin") ||
		strings.Contains(qLower, "inurl:login") ||
		strings.Contains(qLower, "wp-admin") ||
		strings.Contains(qLower, "cpanel") ||
		strings.Contains(qLower, "whm") ||
		strings.Contains(qLower, "portal") ||
		strings.Contains(qLower, "dashboard") ||
		strings.Contains(qLower, "administrator") {
		return MitreExploitPublicFacing
	}

	// 3. Açık Dizin Listelemeleri (Search Victim-Owned Websites)
	if catLower == "open directories" ||
		strings.Contains(qLower, "index of") ||
		strings.Contains(qLower, "parent directory") {
		return MitreSearchVictimWebsites
	}

	// 4. API'lar ve Teknik Dökümanlar (Search Technical Databases)
	if catLower == "apis" ||
		strings.Contains(qLower, "swagger") ||
		strings.Contains(qLower, "graphql") ||
		strings.Contains(qLower, "api-docs") ||
		strings.Contains(qLower, "inurl:api") {
		return MitreTechnicalDatabases
	}

	// 5. Cihazlar ve Kameralar (Gather Victim Host Info: Software)
	if catLower == "cameras / iot" ||
		strings.Contains(qLower, "webcam") ||
		strings.Contains(qLower, "network camera") ||
		strings.Contains(qLower, "router") ||
		strings.Contains(qLower, "mobotix") {
		return MitreGatherHostSoftware
	}

	// Varsayılan: Arama Motoru Üzerinden Keşif
	return MitreSearchEngines
}
