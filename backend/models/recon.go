package models

// SubdomainResult, CRT.sh, HackerTarget gibi kaynaklardan çıkarılan alt alan adını temsil eder.
type SubdomainResult struct {
	Subdomain string `json:"subdomain"`
	LoggedAt  string `json:"loggedAt"`
	Issuer    string `json:"issuer"`
}

// WaybackResult, Archive.org CDX API'sinden elde edilen arşivlenmiş bir URL kaydını temsil eder.
type WaybackResult struct {
	URL         string `json:"url"`
	Timestamp   string `json:"timestamp"`
	MimeType    string `json:"mimeType"`
	Status      string `json:"status"`
	SnapshotURL string `json:"snapshotUrl"`
	Year        string `json:"year"`
}
