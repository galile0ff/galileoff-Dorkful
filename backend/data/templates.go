package data

import "dorkapp/backend/models"

// DefaultTemplates, hedef alan adına göre dork üretmek için kullanılan varsayılan şablon listesidir.
var DefaultTemplates = []models.Template{
	// Files (Belgeler ve Dosyalar)
	{Template: "site:{target} ext:pdf | ext:doc | ext:docx | ext:xls | ext:xlsx", Description: "Herkese açık ofis ve pdf dokümanları", Category: "Files"},
	{Template: "site:{target} ext:env | ext:log | ext:conf | ext:bak", Description: "Sistem yedek, log ve çevre yapılandırma dosyaları", Category: "Files"},
	{Template: "site:{target} ext:sql | ext:db | ext:sqlite", Description: "Veritabanı yedekleri ve SQL dosyaları", Category: "Files"},
	{Template: "site:{target} ext:txt | ext:ini", Description: "Basit metin tabanlı yapılandırma veya not dosyaları", Category: "Files"},
	{Template: "site:{target} ext:pem | ext:crt | ext:key", Description: "Sertifika ve anahtar dosyaları", Category: "Files"},
	{Template: "site:{target} filetype:pdf confidential | secret", Description: "Gizli veya sır içeren belgeler", Category: "Files"},
	{Template: "site:{target} ext:json | ext:xml", Description: "JSON ve XML veri dosyaları", Category: "Files"},
	{Template: "site:{target} ext:zip | ext:tar | ext:tar.gz | ext:rar", Description: "Sıkıştırılmış arşiv dosyaları", Category: "Files"},

	// Admin Panels (Yönetim Panelleri)
	{Template: "site:{target} inurl:admin | inurl:login", Description: "Giriş ve yönetici panelleri", Category: "Admin Panels"},
	{Template: "site:{target} inurl:wp-admin", Description: "WordPress yönetici panelleri", Category: "Admin Panels"},
	{Template: "site:{target} intitle:\"admin login\" | intitle:\"administrator\"", Description: "Yönetici giriş sayfaları", Category: "Admin Panels"},
	{Template: "site:{target} inurl:cpanel | inurl:whm", Description: "cPanel ve WHM panelleri", Category: "Admin Panels"},
	{Template: "site:{target} inurl:dashboard", Description: "Uygulama kontrol panelleri (Dashboard)", Category: "Admin Panels"},
	{Template: "site:{target} intitle:\"Login\" inurl:admin", Description: "Giriş sayfası bulunan admin url'leri", Category: "Admin Panels"},
	{Template: "site:{target} inurl:portal", Description: "Kullanıcı veya şirket portalları", Category: "Admin Panels"},
	{Template: "site:{target} inurl:manager", Description: "Uygulama yönetici panelleri", Category: "Admin Panels"},

	// Sensitive Data (Hassas Veriler)
	{Template: "site:{target} \"password\" | \"pass\" | \"pwd\" ext:txt | ext:log", Description: "Parola kelimesi geçen metin veya log dosyaları", Category: "Sensitive Data"},
	{Template: "site:{target} \"API_KEY\" | \"api_secret\"", Description: "Yayınlanmış API anahtarları", Category: "Sensitive Data"},
	{Template: "site:{target} intext:\"-----BEGIN PRIVATE KEY-----\"", Description: "Yanlışlıkla dizinlere eklenmiş özel anahtarlar", Category: "Sensitive Data"},
	{Template: "site:{target} intext:\"connectionString\" ext:config", Description: "Veritabanı bağlantı dizgisi barındıran yapılandırma dosyaları", Category: "Sensitive Data"},
	{Template: "site:{target} intext:\"AKIA\" ext:txt | ext:env | ext:log", Description: "Sızmış muhtemel AWS API anahtarları", Category: "Sensitive Data"},
	{Template: "site:{target} \"DB_PASSWORD\" | \"DB_USER\"", Description: "Açık veritabanı kimlik bilgileri", Category: "Sensitive Data"},
	{Template: "site:{target} intitle:\"index of\" \"credentials\"", Description: "Açık dizinlerdeki kimlik bilgisi dosyaları", Category: "Sensitive Data"},
	{Template: "site:{target} \"token\" | \"authorization\" ext:log", Description: "Loglarda unutulan yetkilendirme token'ları", Category: "Sensitive Data"},

	// Open Directories (Açık Dizinler)
	{Template: "site:{target} intitle:\"index of /\"", Description: "Web sunucusu açık dizin listelemeleri", Category: "Open Directories"},
	{Template: "site:{target} intitle:\"index of /admin\"", Description: "Yönetici dosyalarını içeren açık dizinler", Category: "Open Directories"},
	{Template: "site:{target} intitle:\"index of /backup\"", Description: "Yedek dosyalarını içeren açık dizinler", Category: "Open Directories"},
	{Template: "site:{target} intitle:\"index of /private\"", Description: "Özel klasör içeriklerini dökümleyen açık dizinler", Category: "Open Directories"},
	{Template: "site:{target} intitle:\"index of\" \"parent directory\"", Description: "Genel Apache/Nginx açık dizinleri", Category: "Open Directories"},
	{Template: "site:{target} intitle:\"index of /logs\"", Description: "Logların herkese açık olduğu dizinler", Category: "Open Directories"},
	{Template: "site:{target} intitle:\"index of /conf\"", Description: "Yapılandırma dizinleri", Category: "Open Directories"},
	{Template: "site:{target} intitle:\"index of /uploads\"", Description: "Kullanıcı yüklemelerinin bulunduğu açık dizinler", Category: "Open Directories"},

	// APIs (Arayüz ve API Uç Noktaları)
	{Template: "site:{target} inurl:api", Description: "Uygulama programlama arayüzü (API) uç noktaları", Category: "APIs"},
	{Template: "site:{target} inurl:swagger | inurl:api-docs", Description: "Swagger ve açık API dökümantasyonları", Category: "APIs"},
	{Template: "site:{target} inurl:graphql", Description: "GraphQL uç noktaları", Category: "APIs"},
	{Template: "site:{target} inurl:v1 | inurl:v2 | inurl:v3", Description: "API sürümlü uç noktaları", Category: "APIs"},
	{Template: "site:{target} intitle:\"Swagger UI\"", Description: "Swagger arayüz sayfaları", Category: "APIs"},
	{Template: "site:{target} ext:json inurl:api", Description: "API tarafından dönen JSON formatlı açık veri dökümleri", Category: "APIs"},
	{Template: "site:{target} inurl:api/users", Description: "Kullanıcı verisi çeken potansiyel API uç noktaları", Category: "APIs"},

	// Cameras / IoT (Cihazlar ve Kameralar)
	{Template: "site:{target} inurl:view/view.shtml", Description: "Açık kamera arayüzleri", Category: "Cameras / IoT"},
	{Template: "site:{target} intitle:\"webcamXP\"", Description: "webcamXP panel arayüzleri", Category: "Cameras / IoT"},
	{Template: "site:{target} intitle:\"Network Camera NetworkCamera\"", Description: "Ağ kameraları sayfaları", Category: "Cameras / IoT"},
	{Template: "site:{target} intext:\"MOBOTIX Camera\"", Description: "MOBOTIX kamera sistemleri", Category: "Cameras / IoT"},
	{Template: "site:{target} inurl:\"/cgi-bin/guestimage.html\"", Description: "Misafir girişli cihaz/kamera ekranları", Category: "Cameras / IoT"},
	{Template: "site:{target} inurl:8080 intitle:\"router\"", Description: "Potansiyel yönlendirici (Router) arayüzleri", Category: "Cameras / IoT"},
}
