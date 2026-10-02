package models

// TechnologyItem, hedefin web sunucusu, framework, CMS veya programlama diline ait tespit edilen teknolojiyi temsil eder.
type TechnologyItem struct {
	Name       string `json:"name"`       // Teknoloji adı (örneğin: WordPress, Laravel, Next.js, Nginx, PHP, Cloudflare)
	Category   string `json:"category"`   // Kategori: CMS, Framework, Web Server, Language, CDN/WAF
	Version    string `json:"version"`    // Varsa tespit edilen sürüm bilgisi (örneğin: 6.5, 8.2)
	Confidence string `json:"confidence"` // Güvenilirlik derecesi: High, Medium
}

// ProbeResult, bir hedef web varlığının HTTP canlılık, sunucu başlıkları ve teknoloji parmak izi denetimi sonucunu temsil eder.
type ProbeResult struct {
	Target         string           `json:"target"`
	URL            string           `json:"url"`
	StatusCode     int              `json:"statusCode"`
	StatusText     string           `json:"statusText"`
	ResponseTimeMs int64            `json:"responseTimeMs"`
	Server         string           `json:"server"`
	ContentType    string           `json:"contentType"`
	IsAlive        bool             `json:"isAlive"`
	Technologies   []TechnologyItem `json:"technologies"` // Tespit edilen tüm teknolojiler (Tech Stack)
	Error          string           `json:"error,omitempty"`
}
