package backend

import (
	"strings"
)

// Dork yapısı bir Google Dork'un özelliklerini tutar.
type Dork struct {
	Query       string `json:"query"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

// dorkTemplates, hedef alan adının yerleştirileceği temel dork şablonlarıdır.
var dorkTemplates = []struct {
	Template    string
	Description string
	Category    string
}{
	// Files
	{"site:{target} ext:pdf | ext:doc | ext:docx | ext:xls | ext:xlsx", "Herkese açık ofis ve pdf dokümanları", "Files"},
	{"site:{target} ext:env | ext:log | ext:conf | ext:bak", "Sistem yedek, log ve çevre yapılandırma dosyaları", "Files"},
	{"site:{target} ext:sql | ext:db | ext:sqlite", "Veritabanı yedekleri ve SQL dosyaları", "Files"},
	{"site:{target} ext:txt | ext:ini", "Basit metin tabanlı yapılandırma veya not dosyaları", "Files"},
	{"site:{target} ext:pem | ext:crt | ext:key", "Sertifika ve anahtar dosyaları", "Files"},
	{"site:{target} filetype:pdf confidential | secret", "Gizli veya sır içeren belgeler", "Files"},
	{"site:{target} ext:json | ext:xml", "JSON ve XML veri dosyaları", "Files"},
	{"site:{target} ext:zip | ext:tar | ext:tar.gz | ext:rar", "Sıkıştırılmış arşiv dosyaları", "Files"},

	// Admin Panels
	{"site:{target} inurl:admin | inurl:login", "Giriş ve yönetici panelleri", "Admin Panels"},
	{"site:{target} inurl:wp-admin", "WordPress yönetici panelleri", "Admin Panels"},
	{"site:{target} intitle:\"admin login\" | intitle:\"administrator\"", "Yönetici giriş sayfaları", "Admin Panels"},
	{"site:{target} inurl:cpanel | inurl:whm", "cPanel ve WHM panelleri", "Admin Panels"},
	{"site:{target} inurl:dashboard", "Uygulama kontrol panelleri (Dashboard)", "Admin Panels"},
	{"site:{target} intitle:\"Login\" inurl:admin", "Giriş sayfası bulunan admin url'leri", "Admin Panels"},
	{"site:{target} inurl:portal", "Kullanıcı veya şirket portalları", "Admin Panels"},
	{"site:{target} inurl:manager", "Uygulama yönetici panelleri", "Admin Panels"},

	// Sensitive Data
	{"site:{target} \"password\" | \"pass\" | \"pwd\" ext:txt | ext:log", "Parola kelimesi geçen metin veya log dosyaları", "Sensitive Data"},
	{"site:{target} \"API_KEY\" | \"api_secret\"", "Yayınlanmış API anahtarları", "Sensitive Data"},
	{"site:{target} intext:\"-----BEGIN PRIVATE KEY-----\"", "Yanlışlıkla dizinlere eklenmiş özel anahtarlar", "Sensitive Data"},
	{"site:{target} intext:\"connectionString\" ext:config", "Veritabanı bağlantı dizgisi barındıran yapılandırma dosyaları", "Sensitive Data"},
	{"site:{target} intext:\"AKIA\" ext:txt | ext:env | ext:log", "Sızmış muhtemel AWS API anahtarları", "Sensitive Data"},
	{"site:{target} \"DB_PASSWORD\" | \"DB_USER\"", "Açık veritabanı kimlik bilgileri", "Sensitive Data"},
	{"site:{target} intitle:\"index of\" \"credentials\"", "Açık dizinlerdeki kimlik bilgisi dosyaları", "Sensitive Data"},
	{"site:{target} \"token\" | \"authorization\" ext:log", "Loglarda unutulan yetkilendirme token'ları", "Sensitive Data"},

	// Open Directories
	{"site:{target} intitle:\"index of /\"", "Web sunucusu açık dizin listelemeleri", "Open Directories"},
	{"site:{target} intitle:\"index of /admin\"", "Yönetici dosyalarını içeren açık dizinler", "Open Directories"},
	{"site:{target} intitle:\"index of /backup\"", "Yedek dosyalarını içeren açık dizinler", "Open Directories"},
	{"site:{target} intitle:\"index of /private\"", "Özel klasör içeriklerini dökümleyen açık dizinler", "Open Directories"},
	{"site:{target} intitle:\"index of\" \"parent directory\"", "Genel Apache/Nginx açık dizinleri", "Open Directories"},
	{"site:{target} intitle:\"index of /logs\"", "Logların herkese açık olduğu dizinler", "Open Directories"},
	{"site:{target} intitle:\"index of /conf\"", "Yapılandırma dizinleri", "Open Directories"},
	{"site:{target} intitle:\"index of /uploads\"", "Kullanıcı yüklemelerinin bulunduğu açık dizinler", "Open Directories"},

	// APIs
	{"site:{target} inurl:api", "Uygulama programlama arayüzü (API) uç noktaları", "APIs"},
	{"site:{target} inurl:swagger | inurl:api-docs", "Swagger ve açık API dökümantasyonları", "APIs"},
	{"site:{target} inurl:graphql", "GraphQL uç noktaları", "APIs"},
	{"site:{target} inurl:v1 | inurl:v2 | inurl:v3", "API sürümlü uç noktaları", "APIs"},
	{"site:{target} intitle:\"Swagger UI\"", "Swagger arayüz sayfaları", "APIs"},
	{"site:{target} ext:json inurl:api", "API tarafından dönen JSON formatlı açık veri dökümleri", "APIs"},
	{"site:{target} inurl:api/users", "Kullanıcı verisi çeken potansiyel API uç noktaları", "APIs"},

	// Cameras / IoT
	{"site:{target} inurl:view/view.shtml", "Açık kamera arayüzleri", "Cameras / IoT"},
	{"site:{target} intitle:\"webcamXP\"", "webcamXP panel arayüzleri", "Cameras / IoT"},
	{"site:{target} intitle:\"Network Camera NetworkCamera\"", "Ağ kameraları sayfaları", "Cameras / IoT"},
	{"site:{target} intext:\"MOBOTIX Camera\"", "MOBOTIX kamera sistemleri", "Cameras / IoT"},
	{"site:{target} inurl:\"/cgi-bin/guestimage.html\"", "Misafir girişli cihaz/kamera ekranları", "Cameras / IoT"},
	{"site:{target} inurl:8080 intitle:\"router\"", "Potansiyel yönlendirici (Router) arayüzleri", "Cameras / IoT"},
}

// GenerateDorks, verilen target (alan adı, ip) için dork listesi üretir.
func GenerateDorks(target string) []Dork {
	var dorks []Dork
	for _, t := range dorkTemplates {
		query := strings.ReplaceAll(t.Template, "{target}", target)
		dorks = append(dorks, Dork{
			Query:       query,
			Description: t.Description,
			Category:    t.Category,
		})
	}
	return dorks
}
