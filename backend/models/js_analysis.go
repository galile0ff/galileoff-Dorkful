package models

// JSSourceScript, hedefin web sayfasında tespit edilen ve analize tabi tutulan tek bir JavaScript dosyasını temsil eder.
type JSSourceScript struct {
	URL        string `json:"url"`        // JS dosyasının tam (absolute) URL adresi
	StatusCode int    `json:"statusCode"` // HTTP yanıt kodu (200, 404 vb.)
	ByteSize   int64  `json:"byteSize"`   // İndirilen dosyanın bayt boyutu
	Error      string `json:"error"`      // Varsa indirme veya analiz hatası
}

// JSEndpointItem, JavaScript kodlarının statik analizi sonucu yakalanan gizli veya dahili API rotasını temsil eder.
type JSEndpointItem struct {
	Endpoint  string `json:"endpoint"`  // Bulunan rota (örneğin: /api/v1/auth, /graphql)
	SourceURL string `json:"sourceUrl"` // Hangi JS dosyasında tespit edildiği
	Method    string `json:"method"`    // İlgili rotaya ait istek türü (GET, POST vb. veya boş)
	Snippet   string `json:"snippet"`   // Rotanın geçtiği bağlam / kod parçacığı
}

// JSSecretItem, JavaScript dosyalarında açıkta unutulmuş API anahtarlarını, gizli anahtarları ve token'ları temsil eder.
type JSSecretItem struct {
	Type      string `json:"type"`      // Sızıntı türü (Google API Key, AWS Access Key, Firebase, JWT vb.)
	Value     string `json:"value"`     // Tespit edilen gizli anahtar değeri
	RawMatch  string `json:"rawMatch"`  // Eşleşen tam kod/string parçası
	SourceURL string `json:"sourceUrl"` // Sızıntının bulunduğu JS dosyasının URL'si
	Severity  string `json:"severity"`  // Önem derecesi: critical, high, medium, info
}

// JSAnalysisResult, hedefin web sayfalarında ve script'lerinde gerçekleştirilen tam JavaScript analiz raporudur.
type JSAnalysisResult struct {
	Target         string           `json:"target"`         // Taranan hedef web adresi
	TotalScripts   int              `json:"totalScripts"`   // Tespit edilen toplam script sayısı
	ScannedScripts int              `json:"scannedScripts"` // Başarıyla indirilip taranan script sayısı
	Scripts        []JSSourceScript `json:"scripts"`        // Taranan script dosyalarının dökümü
	Endpoints      []JSEndpointItem `json:"endpoints"`      // Tespit edilen dahili API uç noktaları
	Secrets        []JSSecretItem   `json:"secrets"`        // Tespit edilen gizli anahtarlar ve sızıntılar
	Error          string           `json:"error,omitempty"`// Varsa genel işlem hatası
}
