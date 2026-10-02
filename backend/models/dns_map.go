package models

// DNSRecordItem, hedefe ait tek bir DNS kaydını (A, AAAA, NS, MX, TXT, CNAME) temsil eder.
type DNSRecordItem struct {
	Type     string `json:"type"`     // A, AAAA, NS, MX, TXT, CNAME
	Value    string `json:"value"`    // Kaydın değeri (IP, host adı veya metin)
	Priority int    `json:"priority"` // MX gibi öncelikli kayıtlarda öncelik değeri
}

// CoHostedDomainItem, hedefle aynı IP adresini ve sunucuyu paylaşan komşu web sitelerini temsil eder.
type CoHostedDomainItem struct {
	Domain     string `json:"domain"`     // Komşu alan adı
	ResolvedIP string `json:"resolvedIp"` // Barındığı paylaşımlı IP adresi
	Source     string `json:"source"`     // Bilginin alındığı istihbarat kaynağı (HackerTarget, OTX, PTR)
}

// NetworkNode, görselleştirme haritasında gösterilen tek bir düğümü (Node) temsil eder.
type NetworkNode struct {
	ID       string `json:"id"`       // Benzersiz düğüm kimliği
	Label    string `json:"label"`    // Görüntülenen ana metin
	Type     string `json:"type"`     // target, ip, ns, mx, txt, cname, cohost
	Category string `json:"category"` // Kategori başlığı
	Details  string `json:"details"`  // Varsa ek teknik detay veya IP bilgisi
}

// NetworkEdge, haritadaki iki düğüm arasındaki bağlantıyı (Çizgiyi) temsil eder.
type NetworkEdge struct {
	Source string `json:"source"` // Kaynak düğüm ID'si
	Target string `json:"target"` // Hedef düğüm ID'si
	Type   string `json:"type"`   // dns, hosted_on, cohost_link
	Label  string `json:"label"`  // Bağlantı türü etiketi
}

// DNSMapResult, hedefin DNS kayıtlarını, komşu sitelerini ve görsel topoloji verilerini içeren tam rapordur.
type DNSMapResult struct {
	Target          string               `json:"target"`          // Taranan hedef alan adı
	Records         []DNSRecordItem      `json:"records"`         // Tüm çözümlenen DNS kayıtları
	CoHostedDomains []CoHostedDomainItem `json:"coHostedDomains"` // Aynı sunucudaki komşu siteler
	Nodes           []NetworkNode        `json:"nodes"`           // Topoloji haritası düğüm listesi
	Edges           []NetworkEdge        `json:"edges"`           // Topoloji haritası bağlantı listesi
	Error           string               `json:"error,omitempty"` // Varsa işlem hatası
}
