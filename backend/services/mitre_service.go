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

	// 1. Kimlik Bilgileri, Sırlar ve Veritabanı Yedekleri (Credential Access - TA0006)
	if strings.Contains(catLower, "secret") ||
		strings.Contains(catLower, "sensitive") ||
		strings.Contains(catLower, "database") ||
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

	// 2. Yönetim Panelleri ve Yetkili Girişleri (Initial Access - TA0001)
	if strings.Contains(catLower, "admin") ||
		strings.Contains(catLower, "portal") ||
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

	// 3. Açık Dizinler, Git ve Dosya İfşaları (Reconnaissance - Search Victim-Owned Websites - TA0043 / T1594)
	if strings.Contains(catLower, "open director") ||
		strings.Contains(catLower, "git") ||
		strings.Contains(catLower, "files") ||
		strings.Contains(qLower, "index of") ||
		strings.Contains(qLower, "/.git") ||
		strings.Contains(qLower, "parent directory") {
		return MitreSearchVictimWebsites
	}

	// 4. API'lar, Bulut Kovaları ve Hata İfşaları (Reconnaissance - Search Open Technical Databases - T1596)
	if strings.Contains(catLower, "api") ||
		strings.Contains(catLower, "cloud") ||
		strings.Contains(catLower, "bucket") ||
		strings.Contains(catLower, "error") ||
		strings.Contains(catLower, "debug") ||
		strings.Contains(qLower, "swagger") ||
		strings.Contains(qLower, "graphql") ||
		strings.Contains(qLower, "s3.amazonaws.com") ||
		strings.Contains(qLower, "blob.core.windows.net") ||
		strings.Contains(qLower, "traceback") ||
		strings.Contains(qLower, "fatal error") {
		return MitreTechnicalDatabases
	}

	// 5. Cihazlar, Kameralar ve Ağ Servisleri (Gather Victim Host Info: Software - T1592.002)
	if strings.Contains(catLower, "camera") ||
		strings.Contains(catLower, "iot") ||
		strings.Contains(qLower, "webcam") ||
		strings.Contains(qLower, "network camera") ||
		strings.Contains(qLower, "router") ||
		strings.Contains(qLower, "mobotix") {
		return MitreGatherHostSoftware
	}

	// Varsayılan: Arama Motoru Üzerinden Keşif (T1593.002)
	return MitreSearchEngines
}
