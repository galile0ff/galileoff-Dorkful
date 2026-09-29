package data

import "dorkapp/backend/models"

// DefaultTemplates, hedef alan adına göre dork üretmek için kullanılan varsayılan yüksek etkili şablon listesidir.
var DefaultTemplates = []models.Template{
	// ==================== 1. Belgeler ve Dosyalar (Files & Documents) ====================
	{Template: "site:{target} ext:pdf | ext:doc | ext:docx | ext:xls | ext:xlsx | ext:csv", Description: "İndekslenmiş kurumsal ofis dokümanları ve tablolar", Category: "Files & Documents"},
	{Template: "site:{target} filetype:pdf \"confidential\" | \"gizli\" | \"strictly private\" | \"internal use only\"", Description: "Gizlilik dereceli dahili şirket raporları ve yazışmalar", Category: "Files & Documents"},
	{Template: "site:{target} ext:xlsx | ext:xls | ext:csv \"tc kimlik\" | \"salary\" | \"maas\" | \"iban\" | \"bakiye\"", Description: "Personel, maaş, IBAN ve TC kimlik içeren finansal veri tabloları", Category: "Files & Documents"},
	{Template: "site:{target} ext:pdf intext:\"audit report\" | intext:\"denetim raporu\" | intext:\"penetration test\" | intext:\"guvenlik testi\"", Description: "Sızmış denetim ve sızma testi güvenlik raporları", Category: "Files & Documents"},
	{Template: "site:{target} ext:doc | ext:docx \"nda\" | \"sozlesme\" | \"contract\" | \"gizlilik taahhutnamesi\"", Description: "Ticari sözleşmeler, NDA anlaşmaları ve gizlilik taahhütleri", Category: "Files & Documents"},
	{Template: "site:{target} ext:txt | ext:rtf \"username\" | \"kullanici\" intext:\"password\" | intext:\"sifre\"", Description: "Düz metin formatında unutulmuş kullanıcı ve parola notları", Category: "Files & Documents"},

	// ==================== 2. Yapılandırma & Gizli Anahtarlar (Config & Secrets) ====================
	{Template: "site:{target} ext:env | inurl:\".env\" | inurl:\".env.example\" | inurl:\".env.local\" | inurl:\".env.production\"", Description: "Açıkta bırakılmış ortam değişkenleri ve .env konfigürasyonları", Category: "Config & Secrets"},
	{Template: "site:{target} intext:\"-----BEGIN RSA PRIVATE KEY-----\" | intext:\"-----BEGIN OPENSSH PRIVATE KEY-----\"", Description: "Açığa çıkmış sunucu SSH ve RSA özel anahtarları", Category: "Config & Secrets"},
	{Template: "site:{target} intext:\"AKIA\" | intext:\"aws_secret_access_key\"", Description: "Sızmış Amazon Web Services (AWS) erişim anahtarları", Category: "Config & Secrets"},
	{Template: "site:{target} intext:\"AIzaSy\" ext:txt | ext:json | ext:js", Description: "Google Cloud Platform ve Firebase Web API anahtarları", Category: "Config & Secrets"},
	{Template: "site:{target} \"DB_PASSWORD\" | \"DB_USER\" | \"database_password\" | \"MYSQL_ROOT_PASSWORD\"", Description: "Canlı veritabanı kullanıcı adı ve kök parolaları", Category: "Config & Secrets"},
	{Template: "site:{target} ext:conf | ext:cnf | ext:cfg | ext:ini \"password\" | \"secret\" | \"api_key\"", Description: "Şifre ve gizli anahtar barındıran sunucu ayar dosyaları", Category: "Config & Secrets"},
	{Template: "site:{target} intext:\"client_secret\" | intext:\"client_id\" ext:json | ext:yaml | ext:yml", Description: "OAuth, SSO ve 3. parti entegrasyon API sırları", Category: "Config & Secrets"},
	{Template: "site:{target} ext:pem | ext:crt | ext:key | ext:pfx | ext:p12", Description: "SSL/TLS sertifika ve özel anahtar paketleri", Category: "Config & Secrets"},
	{Template: "site:{target} intext:\"Bearer eyJ\" ext:log | ext:txt", Description: "Sistem loglarında ifşa olmuş aktif JWT kimlik doğrulama token'ları", Category: "Config & Secrets"},

	// ==================== 3. Yönetim & Portallar (Admin & Portals) ====================
	{Template: "site:{target} inurl:admin | inurl:administrator | inurl:admin_login | inurl:cpanel | inurl:panel", Description: "Web tabanlı yönetici ve kontrol panelleri", Category: "Admin & Portals"},
	{Template: "site:{target} intitle:\"admin login\" | intitle:\"control panel\" | intitle:\"yonetici girisi\" inurl:admin", Description: "Doğrudan giriş arayüzü sunan kurumsal admin sayfaları", Category: "Admin & Portals"},
	{Template: "site:{target} inurl:wp-login.php | inurl:wp-admin", Description: "WordPress CMS yönetim ve oturum açma portalları", Category: "Admin & Portals"},
	{Template: "site:{target} inurl:phpmyadmin | inurl:pma | inurl:adminer.php | inurl:webadmin", Description: "Açıkta unutulmuş phpMyAdmin ve Adminer veritabanı panelleri", Category: "Admin & Portals"},
	{Template: "site:{target} inurl:dashboard | inurl:app/dashboard | inurl:manage", Description: "Uygulama kontrol ve operasyon yönetim dashboardları", Category: "Admin & Portals"},
	{Template: "site:{target} inurl:portal | inurl:sso | inurl:login/sso | inurl:adfs", Description: "Kurumsal çalışan, tedarikçi ve SSO kimlik doğrulama portalları", Category: "Admin & Portals"},
	{Template: "site:{target} inurl:kibana | inurl:grafana | inurl:prometheus", Description: "Erişime açık izleme, metrik ve log dashboardları (Kibana/Grafana)", Category: "Admin & Portals"},
	{Template: "site:{target} inurl:cpanel | inurl:whm | inurl:plesk | inurl:webmin", Description: "Web hosting ve sunucu yönetim konsolları (cPanel/WHM/Plesk)", Category: "Admin & Portals"},

	// ==================== 4. Veritabanı & Yedekler (Database & Backups) ====================
	{Template: "site:{target} ext:sql | ext:db | ext:sqlite | ext:sqlite3 | ext:dump", Description: "Ham SQL veritabanı dökümleri ve tablo kayıtları", Category: "Database & Backups"},
	{Template: "site:{target} ext:bak | ext:old | ext:backup | ext:orig | ext:copy", Description: "Sunucu dizininde unutulmuş kaynak kod ve yedek kopyaları", Category: "Database & Backups"},
	{Template: "site:{target} ext:tar | ext:tar.gz | ext:zip | ext:7z | ext:rar inurl:backup | inurl:dump", Description: "Sıkıştırılmış tam site ve veritabanı arşiv yedekleri", Category: "Database & Backups"},
	{Template: "site:{target} inurl:\"dump.sql\" | inurl:\"backup.sql\" | inurl:\"database.sql\" | inurl:\"users.sql\"", Description: "İndekslenmiş kritik SQL veritabanı dosyaları", Category: "Database & Backups"},
	{Template: "site:{target} intext:\"connectionString\" ext:config | ext:xml | ext:json", Description: "Veritabanı bağlantı dizgisi (connection string) içeren konfigürasyonlar", Category: "Database & Backups"},
	{Template: "site:{target} intext:\"mongodb://\" | intext:\"postgres://\" | intext:\"mysql://\"", Description: "Açığa çıkmış URI veritabanı bağlantı şemaları ve şifreleri", Category: "Database & Backups"},
	{Template: "site:{target} inurl:dump.rdb | inurl:redis.conf", Description: "Redis bellek veritabanı dökümleri ve konfigürasyonları", Category: "Database & Backups"},

	// ==================== 5. Açık Dizinler & Kaynak Kod (Open Directories & Git) ====================
	{Template: "site:{target} intitle:\"index of /\" | intitle:\"index of /admin\"", Description: "Apache ve Nginx sunucu açık dizin listelemeleri", Category: "Open Directories & Git"},
	{Template: "site:{target} inurl:/.git | inurl:/.git/HEAD | inurl:/.git/config", Description: "Açıkta unutulmuş Git kaynak kod repoları", Category: "Open Directories & Git"},
	{Template: "site:{target} inurl:/.svn | inurl:/.hg | inurl:/.bzr", Description: "SVN ve Mercurial sürüm kontrol sistemi kalıntıları", Category: "Open Directories & Git"},
	{Template: "site:{target} inurl:/docker-compose.yml | inurl:/Dockerfile", Description: "Altyapı ve konteyner kurulum tanımları", Category: "Open Directories & Git"},
	{Template: "site:{target} intitle:\"index of /backup\" | intitle:\"index of /backups\"", Description: "Yedek dosyalarının doğrudan listelendiği açık dizinler", Category: "Open Directories & Git"},
	{Template: "site:{target} intitle:\"index of /logs\" | intitle:\"index of /log\"", Description: "Sunucu ve erişim loglarının açık dizinleri", Category: "Open Directories & Git"},
	{Template: "site:{target} intitle:\"index of /uploads\" | intitle:\"index of /attachments\"", Description: "Kullanıcıların yüklediği ek ve belgelerin bulunduğu açık dizinler", Category: "Open Directories & Git"},
	{Template: "site:{target} inurl:phpinfo.php | intext:\"PHP Version\" intitle:\"phpinfo()\"", Description: "Sunucu sürüm ve modüllerini ifşa eden phpinfo sayfaları", Category: "Open Directories & Git"},

	// ==================== 6. API'lar & Dökümantasyon (APIs & Endpoints) ====================
	{Template: "site:{target} inurl:swagger-ui.html | inurl:swagger/index.html | inurl:api-docs", Description: "Swagger OpenAPI interaktif dökümantasyon ve test sayfaları", Category: "APIs & Endpoints"},
	{Template: "site:{target} inurl:graphql | inurl:graphiql | inurl:altair", Description: "GraphQL sorgu uç noktaları ve şema keşif arayüzleri", Category: "APIs & Endpoints"},
	{Template: "site:{target} inurl:api/v1 | inurl:api/v2 | inurl:api/v3", Description: "Sürümlendirilmiş aktif REST API uç noktaları", Category: "APIs & Endpoints"},
	{Template: "site:{target} inurl:actuator | inurl:actuator/health | inurl:actuator/env", Description: "Spring Boot Actuator sistem ve ortam bilgi uç noktaları", Category: "APIs & Endpoints"},
	{Template: "site:{target} inurl:postman_collection.json | inurl:openapi.json | inurl:openapi.yaml", Description: "Açığa çıkmış Postman koleksiyonları ve OpenAPI tanımları", Category: "APIs & Endpoints"},
	{Template: "site:{target} ext:json inurl:api \"users\" | \"accounts\" | \"orders\"", Description: "Doğrudan JSON veri dönen açık API yanıtları", Category: "APIs & Endpoints"},
	{Template: "site:{target} inurl:api intitle:\"WSDL\" | ext:wsdl", Description: "Kurumsal SOAP web servis tanımları (WSDL)", Category: "APIs & Endpoints"},

	// ==================== 7. Bulut Depolama & Kovalar (Cloud & Buckets) ====================
	{Template: "site:s3.amazonaws.com \"{target}\"", Description: "Amazon S3 üzerinde hedefe ait açık depolama kovaları", Category: "Cloud & Buckets"},
	{Template: "site:blob.core.windows.net \"{target}\"", Description: "Azure Blob Storage üzerinde hedefe ait açık veri kapsayıcıları", Category: "Cloud & Buckets"},
	{Template: "site:storage.googleapis.com \"{target}\"", Description: "Google Cloud Storage kovalarındaki açık dosyalar", Category: "Cloud & Buckets"},
	{Template: "site:firebaseio.com \"{target}\"", Description: "Açık Firebase gerçek zamanlı veritabanı uç noktaları", Category: "Cloud & Buckets"},
	{Template: "site:{target} intext:\"s3.amazonaws.com\" | intext:\"digitaloceanspaces.com\"", Description: "Web sayfalarında doğrudan referans verilen harici depolama URL'leri", Category: "Cloud & Buckets"},

	// ==================== 8. Hata İfşaları & Debug (Errors & Debug) ====================
	{Template: "site:{target} intext:\"fatal error\" | intext:\"syntax error\" | intext:\"warning\" ext:php", Description: "PHP çekirdek hata ve tam dosya yolu ifşaları (Full Path Disclosure)", Category: "Errors & Debug"},
	{Template: "site:{target} intext:\"Traceback (most recent call last)\"", Description: "Python, Django ve Flask stack trace hata dökümleri", Category: "Errors & Debug"},
	{Template: "site:{target} intext:\"Exception in thread\" | intext:\"java.lang.NullPointerException\"", Description: "Java ve Spring Boot istisna hata dökümleri", Category: "Errors & Debug"},
	{Template: "site:{target} intext:\"Whoops! There was an error\" | intext:\"Ignition - Laravel\"", Description: "Laravel Ignition canlı hata ve ortam değişkenleri ifşası", Category: "Errors & Debug"},
	{Template: "site:{target} intitle:\"Django Debug\" | intext:\"DisallowedHost at\"", Description: "Django debug modunda açık unutulmuş sistem sayfaları", Category: "Errors & Debug"},

	// ==================== 9. Cihazlar & IoT (Cameras & IoT) ====================
	{Template: "site:{target} inurl:view/view.shtml | inurl:view/index.shtml", Description: "Canlı IP kamera akış sayfaları", Category: "Cameras & IoT"},
	{Template: "site:{target} intitle:\"webcamXP\" | inurl:8080 intitle:\"cam\"", Description: "webcamXP ve açık web kamerası arayüzleri", Category: "Cameras & IoT"},
	{Template: "site:{target} intitle:\"RouterOS router configuration page\"", Description: "MikroTik RouterOS ağ yönetim panelleri", Category: "Cameras & IoT"},
	{Template: "site:{target} inurl:\"/cgi-bin/guestimage.html\"", Description: "Kimlik doğrulamasız kamera misafir görüntüleme ekranları", Category: "Cameras & IoT"},
	{Template: "site:{target} inurl:8443 | inurl:8080 | inurl:9090 intitle:\"login\"", Description: "Alternatif yönetim portlarındaki açık servisler", Category: "Cameras & IoT"},
}
