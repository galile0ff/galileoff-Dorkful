"use client";

import { useState, useMemo, useRef } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  Server,
  Globe,
  Radio,
  GitBranch,
  Code2,
  Network,
  Calendar,
  User,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sliders,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

export default function ExecutiveReportModal({
  isOpen,
  onClose,
  target = '',
  activeWorkspace = null,
  probeResult = null,
  findings = [],
  shodanHosts = [],
  censysHosts = [],
  githubLeaks = [],
  jsAnalysisResult = null,
  dnsMapResult = null
}) {
  // Rapor Yapılandırma Durumları
  const [analystName, setAnalystName] = useState('Dorkful Güvenlik Analisti');
  const [clientName, setClientName] = useState('');
  const [reportTitle, setReportTitle] = useState('Siber Tehdit İstihbaratı ve Saldırı Yüzeyi Denetim Raporu');
  const [classification, setClassification] = useState('TLP:AMBER'); // TLP:CLEAR, TLP:GREEN, TLP:AMBER, TLP:RED
  const [maskSecrets, setMaskSecrets] = useState(true); // Hassas anahtarları kısmen maskele
  const [zoomScale, setZoomScale] = useState(100); // 75, 90, 100, 115
  const [includeSections, setIncludeSections] = useState({
    executiveSummary: true,
    targetProbe: true,
    findings: true,
    networkPorts: true,
    githubLeaks: true,
    jsSecrets: true,
    dnsMap: true
  });
  const [copied, setCopied] = useState(false);
  const reportPrintRef = useRef(null);

  // Benzersiz Rapor Referans Numarası
  const reportRefId = useMemo(() => {
    const rawTarget = (target || 'AUDIT').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `DOC-DF-${rawTarget || 'SYS'}-${timestamp}`;
  }, [target]);

  // Tarih bilgisi
  const reportDate = useMemo(() => {
    return new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Risk Dağılımı ve Skor Hesaplama
  const stats = useMemo(() => {
    const criticalFindings = findings.filter((f) => (f.severity || '').toLowerCase() === 'critical').length;
    const highFindings = findings.filter((f) => (f.severity || '').toLowerCase() === 'high').length;
    const mediumFindings = findings.filter((f) => (f.severity || '').toLowerCase() === 'medium').length;
    const lowFindings = findings.filter((f) => (f.severity || '').toLowerCase() === 'low').length;

    const totalLeaks = (githubLeaks || []).length;
    const totalSecrets = (jsAnalysisResult?.secrets || []).length;
    const totalEndpoints = (jsAnalysisResult?.endpoints || []).length;
    const totalPorts = (shodanHosts || []).reduce((acc, h) => acc + (h.ports ? h.ports.length : 0), 0);
    const totalVulns = (shodanHosts || []).reduce((acc, h) => acc + (h.vulns ? h.vulns.length : 0), 0);
    const totalCoHosts = (dnsMapResult?.coHostedDomains || []).length;

    // Ağırlıklı Risk Skoru (10 üzerinden)
    let rawScore =
      criticalFindings * 3.0 +
      highFindings * 2.0 +
      mediumFindings * 1.0 +
      lowFindings * 0.3 +
      totalVulns * 1.5 +
      totalSecrets * 1.8 +
      totalLeaks * 1.5 +
      (totalPorts > 5 ? 1.0 : totalPorts * 0.2);

    let riskScore = Math.min(Math.max(parseFloat(rawScore.toFixed(1)), 1.0), 10.0);
    if (findings.length === 0 && totalVulns === 0 && totalSecrets === 0 && totalLeaks === 0) {
      riskScore = 1.8;
    }

    let riskLevel = 'Düşük';
    let riskColor = '#10b981';
    let riskTextColor = 'text-emerald-500';
    let riskBgColor = 'bg-emerald-500/10 border-emerald-500/30';

    if (riskScore >= 7.5) {
      riskLevel = 'Kritik';
      riskColor = '#dc2626';
      riskTextColor = 'text-red-600 dark:text-red-500';
      riskBgColor = 'bg-red-500/10 border-red-500/30';
    } else if (riskScore >= 5.0) {
      riskLevel = 'Yüksek';
      riskColor = '#ea580c';
      riskTextColor = 'text-orange-600 dark:text-orange-500';
      riskBgColor = 'bg-orange-500/10 border-orange-500/30';
    } else if (riskScore >= 3.0) {
      riskLevel = 'Orta';
      riskColor = '#d97706';
      riskTextColor = 'text-amber-600 dark:text-amber-500';
      riskBgColor = 'bg-amber-500/10 border-amber-500/30';
    }

    return {
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      totalLeaks,
      totalSecrets,
      totalEndpoints,
      totalPorts,
      totalVulns,
      totalCoHosts,
      riskScore,
      riskLevel,
      riskColor,
      riskTextColor,
      riskBgColor
    };
  }, [findings, githubLeaks, jsAnalysisResult, shodanHosts, dnsMapResult]);

  // Bölüm Açma / Kapama
  const toggleSection = (key) => {
    setIncludeSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Maskeleme Fonksiyonu (Secret'lar için)
  const maskValue = (str) => {
    if (!str) return '';
    if (!maskSecrets) return str;
    if (str.length <= 8) return '********';
    return str.slice(0, 4) + '••••••••' + str.slice(-4);
  };

  // İZOLASYONLU VE DOĞRUDAN A4 YAZDIRMA (Tüm pencere yerine SADECE A4 Rapor basılır)
  const handlePrint = () => {
    const reportElem = reportPrintRef.current;
    if (!reportElem) return;

    // Wails WebView2 ve modern tarayıcılarda izole yazdırma:
    // 1) Sayfadaki tüm stil etiketlerini topla (Tailwind CSS ve fontlar dahil)
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    // 2) İzole bir gizli iframe oluştur
    const iframe = document.createElement('iframe');
    iframe.id = 'dorkful-isolated-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle} - ${target || 'Hedef'}</title>
        ${styleTags}
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 12mm 12mm 12mm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #ffffff !important;
            color: #111827 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .a4-print-canvas {
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #111827 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin-top: 8px !important;
            font-size: 8.5pt !important;
          }
          th {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
            font-weight: 700 !important;
            border-bottom: 2px solid #d1d5db !important;
            padding: 6px 8px !important;
            text-align: left !important;
          }
          td {
            padding: 6px 8px !important;
            border-bottom: 1px solid #e5e7eb !important;
            vertical-align: top !important;
            word-break: break-word !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          .section-block {
            page-break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
          .footer-note {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 8pt;
            color: #6b7280;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="a4-print-canvas">
          ${reportElem.innerHTML}
          <div class="footer-note">
            Dorkful Executive Pentest & CTI Engine • Resmi Denetim Raporudur.
          </div>
        </div>
      </body>
      </html>
    `);
    doc.close();

    // İframe'in stilleri yüklemesini bekle ve yazdır
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        // İframe yazdırma kısıtlandıysa doğrudan pencere yazdırmasını tetikle
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  };

  // Tek Dosya Bağımsız Siber HTML Raporu Olarak İndir
  const handleDownloadHTML = () => {
    const reportElem = reportPrintRef.current;
    if (!reportElem) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle} - ${target || 'Hedef'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #09090d;
      color: #f4f4f5;
      line-height: 1.6;
      padding: 40px 20px;
    }
    .report-container {
      max-width: 960px;
      margin: 0 auto;
      background: #0f0f15;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 48px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .border-b, .border-t, .border { border-color: #27272a; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; table-layout: fixed; }
    th { text-align: left; padding: 10px 14px; background: rgba(255, 255, 255, 0.04); color: #a1a1aa; font-weight: 600; text-transform: uppercase; font-size: 11px; }
    td { padding: 12px 14px; border-bottom: 1px solid #1f1f23; word-break: break-word; }
    code { font-family: 'JetBrains Mono', monospace; background: rgba(255, 255, 255, 0.06); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #27272a; text-align: center; font-size: 11px; color: #71717a; font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <div class="report-container">
    ${reportElem.innerHTML}
    <div class="footer">
      Bu rapor Dorkful Executive Pentest & CTI Engine tarafından üretilmiştir.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Dorkful_Executive_Report_${target || 'Target'}_${Date.now()}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Kurumsal ve Resmi Denetim Formatında Markdown (GFM) Kopyalama
  const handleCopyMarkdown = () => {
    let md = `# ${reportTitle.toUpperCase()}\n\n`;
    md += `> Dorkful Cyber Threat Intelligence Platform\n`;
    md += `> Bilgi Güvenliği Denetimi ve Dış Saldırı Yüzeyi Değerlendirme Raporu\n`;
    md += `> Metodoloji ve Standartlar: OWASP ASVS v4.0.3 / NIST SP 800-115 / OSINT Framework\n\n`;

    // 1. Denetim Meta Bilgileri Tablosu
    md += `| Denetim Parametresi | Bilgi |\n`;
    md += `| :--- | :--- |\n`;
    md += `| Rapor Referans Kodu | \`${reportRefId}\` |\n`;
    md += `| Denetlenen Hedef | \`${target || 'Belirtilmedi'}\` |\n`;
    md += `| Müşteri / Kurum Adı | ${clientName || activeWorkspace?.name || 'Belirtilmedi'} |\n`;
    md += `| Denetim Sorumlusu | ${analystName} |\n`;
    md += `| Rapor Düzenleme Tarihi | ${reportDate} |\n`;
    md += `| Bilgi Sınıflandırması | ${classification} |\n`;
    md += `| Genel Risk Seviyesi | ${stats.riskLevel.toUpperCase()} (${stats.riskScore} / 10.0) |\n\n`;

    md += `---\n\n`;

    // 2. Yönetici Özeti ve Risk Matrisi
    if (includeSections.executiveSummary) {
      md += `## 1. YÖNETİCİ ÖZETİ VE RİSK DEĞERLENDİRMESİ\n\n`;
      md += `Bu denetim raporu, **${target}** hedefi üzerinde pasif ve aktif tehdit istihbaratı metotları kullanılarak gerçekleştirilen dış saldırı yüzeyi analizini belgeler. Analiz neticesinde ağırlıklı genel risk skoru **${stats.riskScore} / 10.0** (${stats.riskLevel.toUpperCase()}) olarak hesaplanmıştır.\n\n`;

      md += `### 1.1. Risk ve Tehdit Dağılım Matrisi\n\n`;
      md += `| Risk Kategorisi | Tespit Sayısı | Önem Derecesi | Tavsiye Edilen Müdahale Süresi |\n`;
      md += `| :--- | :---: | :---: | :--- |\n`;
      md += `| Kritik Seviye Bulgu | ${stats.criticalFindings} | CRITICAL | 24 - 48 Saat (Derhal) |\n`;
      md += `| Yüksek Seviye Bulgu | ${stats.highFindings} | HIGH | 1 Hafta |\n`;
      md += `| Orta Seviye Bulgu | ${stats.mediumFindings} | MEDIUM | 30 Gün |\n`;
      md += `| Düşük / Bilgi Amaçlı | ${stats.lowFindings} | LOW | İzleme / İsteğe Bağlı |\n`;
      md += `| Dışa Açık Servis Portu | ${stats.totalPorts} | INFO | Ağ Erişilebilirlik Taraması |\n`;
      md += `| Tespit Edilen CVE Açığı | ${stats.totalVulns} | VARIES | Zafiyet Yönetim Döngüsü |\n`;
      md += `| İstemci / Kod Sızıntısı (Secrets) | ${stats.totalSecrets + stats.totalLeaks} | HIGH/CRIT | İptal / Anahtar Yenileme |\n`;
      md += `| Aynı IP'deki Komşu Varlıklar | ${stats.totalCoHosts} | INFO | Paylaşımlı Altyapı Risk Analizi |\n\n`;

      if (stats.riskScore >= 5.0) {
        md += `> **YÖNETİCİ DEĞERLENDİRME NOTU:** Hedef sistem üzerinde kritik veya yüksek risk kategorisinde değerlendirilen güvenlik zafiyetleri / açıkta kalan anahtar bilgileri saptanmıştır. Saldırganların hedef altyapıya erişimini engellemek adına zafiyet giderme ve erişim denetimi aksiyonlarının ivedilikle hayata geçirilmesi gerekmektedir.\n\n`;
      } else {
        md += `> **YÖNETİCİ DEĞERLENDİRME NOTU:** Hedef altyapı genel güvenlik temel standartlarına uyum göstermekle birlikte, tespit edilen servislerin ve düşük dereceli bulguların düzenli aralıklarla izlenmesi önerilir.\n\n`;
      }
    }

    // 3. Canlı HTTP Denetimi ve Teknoloji Parmak İzleri
    if (includeSections.targetProbe && probeResult) {
      md += `## 2. CANLI HTTP DENETİMİ VE ALTYAPI PARMAK İZLERİ\n\n`;
      md += `| Parametre | Değer |\n`;
      md += `| :--- | :--- |\n`;
      md += `| HTTP Durum Kodu | \`${probeResult.statusCode} ${probeResult.statusText}\` |\n`;
      md += `| Sunucu Yanıt Süresi | \`${probeResult.responseTimeMs || 0} ms\` |\n`;
      md += `| Sunucu Başlığı (Server Header) | \`${probeResult.server || 'Belirtilmedi / Gizli'}\` |\n`;
      md += `| Aktarım Güvenliği (TLS/SSL) | ${probeResult.isHttps ? 'Aktif (HTTPS/TLS)' : 'Güvensiz (Düz HTTP Metni)'} |\n\n`;

      if (probeResult.technologies && probeResult.technologies.length > 0) {
        md += `### 2.1. Tespit Edilen Teknolojiler ve Çatılar\n\n`;
        md += `| Kategori | Çatı / Kütüphane Adı | Sürüm |\n`;
        md += `| :--- | :--- | :--- |\n`;
        probeResult.technologies.forEach((tech) => {
          md += `| ${tech.category || 'Altyapı'} | ${tech.name} | \`${tech.version ? `v${tech.version}` : 'Belirtilmedi'}\` |\n`;
        });
        md += `\n`;
      }
    }

    // 4. Doğrulanmış Güvenlik Bulguları
    if (includeSections.findings) {
      md += `## 3. DOĞRULANMIŞ GÜVENLİK BULGULARI\n\n`;
      if (findings.length === 0) {
        md += `Kayıt altına alınmış herhangi bir aktif güvenlik bulgusu mevcut değildir.\n\n`;
      } else {
        md += `| Sıra | Seviye | Bulgu Tanımı | Kategori | Kanıt / Referans URL |\n`;
        md += `| :---: | :---: | :--- | :--- | :--- |\n`;
        findings.forEach((f, idx) => {
          const sev = (f.severity || 'Medium').toUpperCase();
          const cleanDesc = (f.description || f.query || '').replace(/\|/g, '\\|');
          const evUrl = f.evidenceUrl || f.evidenceURL ? `[\`${f.evidenceUrl || f.evidenceURL}\`](${f.evidenceUrl || f.evidenceURL})` : '-';
          md += `| ${idx + 1} | [${sev}] | ${cleanDesc} | ${f.category || 'Genel Keşif'} | ${evUrl} |\n`;
        });
        md += `\n`;

        const findingsWithNotes = findings.filter((f) => f.notes);
        if (findingsWithNotes.length > 0) {
          md += `### 3.1. Bulgu Analiz Notları ve Açıklamalar\n\n`;
          findingsWithNotes.forEach((f, i) => {
            md += `#### 3.1.${i + 1}. ${f.description || f.query}\n`;
            md += `- **Önem Seviyesi:** [${(f.severity || 'Medium').toUpperCase()}]\n`;
            md += `- **Kategori:** ${f.category || 'Genel'}\n`;
            md += `- **Denetçi Açıklaması:** ${f.notes}\n\n`;
          });
        }
      }
    }

    // 5. Açık Portlar ve Ağ Tehdit İstihbaratı
    if (includeSections.networkPorts) {
      md += `## 4. AÇIK AĞ PORTLARI VE HOST İSTİHBARATI (SHODAN / CENSYS)\n\n`;
      if ((shodanHosts || []).length === 0 && (censysHosts || []).length === 0) {
        md += `Taranan ağ aralığında aktif açık port veya zafiyet kaydı tespit edilmemiştir.\n\n`;
      } else {
        md += `| IP Adresi | Bilgi Kaynağı | Açık Servis Portları | İlişkili CVE Zafiyetleri |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        (shodanHosts || []).forEach((h) => {
          const ports = (h.ports || []).map((p) => `\`${p}\``).join(', ') || '-';
          const vulns = (h.vulns || []).map((v) => `\`${v}\``).join(', ') || '-';
          md += `| \`${h.ip}\` | Shodan / InternetDB | ${ports} | ${vulns} |\n`;
        });
        md += `\n`;
      }
    }

    // 6. GitHub Kod ve Veri Sızıntıları
    if (includeSections.githubLeaks && (githubLeaks || []).length > 0) {
      md += `## 5. AÇIK KAYNAK KOD SIZINTILARI (GITHUB LEAKS)\n\n`;
      md += `| Sıra | Depo (Repository) | Dosya Yolu | Eşleşen Veri |\n`;
      md += `| :---: | :--- | :--- | :--- |\n`;
      githubLeaks.forEach((leak, li) => {
        md += `| ${li + 1} | \`${leak.repository || 'Genel'}\` | \`${leak.path || leak.filename || '-'}\` | \`${maskValue(leak.match || leak.text || '-')}\` |\n`;
      });
      md += `\n`;
    }

    // 7. İstemci Tarafı JavaScript Analizi ve Secret'lar
    if (includeSections.jsSecrets && jsAnalysisResult) {
      md += `## 6. İSTEMCİ TARAFI JAVASCRIPT ANALİZİ VE HASSAS BİLGİLER (SECRETS)\n\n`;
      md += `Statik analiz kapsamında **${jsAnalysisResult.scannedScripts || 0} adet** harici/dahili script taranmış, **${(jsAnalysisResult.secrets || []).length} adet** potansiyel gizli anahtar ve **${(jsAnalysisResult.endpoints || []).length} adet** dahili API rotası tespit edilmiştir.\n\n`;

      if ((jsAnalysisResult.secrets || []).length > 0) {
        md += `### 6.1. Tespit Edilen Gizli Anahtarlar (API Keys / Tokens)\n\n`;
        md += `| Anahtar Türü | Değer (Maskelenmiş/Açık) | Kaynak Dosya |\n`;
        md += `| :--- | :--- | :--- |\n`;
        jsAnalysisResult.secrets.forEach((sec) => {
          md += `| ${sec.type} | \`${maskValue(sec.match)}\` | \`${sec.fileUrl || '-'}\` |\n`;
        });
        md += `\n`;
      }

      if ((jsAnalysisResult.endpoints || []).length > 0) {
        md += `### 6.2. Keşfedilen Önemli Dahili API Rotaları (İlk 10 Kayıt)\n\n`;
        md += jsAnalysisResult.endpoints.slice(0, 10).map((ep) => `- \`${ep}\``).join('\n');
        md += `\n\n`;
      }
    }

    // 8. DNS ve Paylaşılan Sunucu Komşuları (Reverse IP)
    if (includeSections.dnsMap && dnsMapResult) {
      md += `## 7. DNS TOPOLOJİSİ VE PAYLAŞILAN SUNUCU ANALİZİ (REVERSE IP)\n\n`;
      md += `- Çözümlenen DNS Kayıt Sayısı: **${(dnsMapResult.records || []).length}**\n`;
      md += `- Aynı Sunucu IP'sinde Barınan Komşu Alan Adı Sayısı: **${(dnsMapResult.coHostedDomains || []).length}**\n\n`;

      if ((dnsMapResult.coHostedDomains || []).length > 0) {
        md += `### 7.1. Paylaşılan Sunucu Komşuları (İlk 15 Kayıt)\n\n`;
        md += `| Sıra | Komşu Alan Adı | Sunucu IP Adresi | Bilgi Kaynağı |\n`;
        md += `| :---: | :--- | :--- | :--- |\n`;
        dnsMapResult.coHostedDomains.slice(0, 15).forEach((co, ci) => {
          md += `| ${ci + 1} | \`${co.domain}\` | \`${co.resolvedIp}\` | ${co.source || 'Reverse IP'} |\n`;
        });
        md += `\n`;
      }
    }

    // 9. Resmi Onay ve Yasal Beyan
    md += `---\n\n`;
    md += `## 8. DENETİM ONAY VE DEĞERLENDİRME BEYANI\n\n`;
    md += `| Rol | Sorumlu | Durum / İmza Bilgisi |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| Baş Güvenlik Denetçisi | ${analystName} | ONAYLANDI / ${reportDate.split(' ')[0]} |\n`;
    md += `| Denetim Otoritesi / CISO | ${clientName || 'Bilgi Güvenliği Yönetimi'} | DOĞRULANDI [REF-${reportRefId.slice(-6)}] |\n\n`;

    md += `### Gizlilik ve Yasal Sorumluluk Beyanı\n\n`;
    md += `Bu rapor **${classification}** güvenlik sınıflandırmasına tabidir. Rapor içeriğindeki tüm teknik veriler, açık yüzey tespitleri ve güvenlik açıkları münhasıran ilgili kurumun savunma ve siber dayanıklılık kabiliyetlerini güçlendirmek maksadıyla hazırlanmıştır. Belgenin yetkisiz şahıslarla paylaşılması, ifşa edilmesi veya kötüye kullanımı ilgili mevzuat ve bilgi güvenliği politikaları gereğince yasaktır.\n\n`;
    md += `*Dorkful CTI & Pentest Platform • Resmi Denetim Raporudur.*`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-white">
      <div
        className="report-modal-container relative w-full max-w-[97vw] xl:max-w-7xl h-[94vh] bg-[#09090d] border border-white/10 rounded-2xl flex flex-col shadow-2xl shadow-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Modal Başlık ve Kontrol Çubuğu (Yazdırmada Otomatik Gizlenir) */}
        <div className="no-print px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  CTI & Pentest Yönetici Raporu
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Executive Suite
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 border border-white/10 font-mono">
                  {reportRefId}
                </span>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">
                Hedef: <strong className="font-mono text-white/90">{target || 'Seçilmedi'}</strong> • Resmi A4 Denetim Raporu
              </p>
            </div>
          </div>

          {/* Dışa Aktarma ve Yakınlaştırma Butonları */}
          <div className="flex items-center gap-2">
            {/* Yakınlaştırma Kontrolleri */}
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-mono text-white/70">
              <button
                onClick={() => setZoomScale((prev) => Math.max(prev - 10, 70))}
                className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                title="Uzaklaştır"
              >
                <ZoomOut size={13} />
              </button>
              <span className="w-10 text-center select-none text-[11px]">%{zoomScale}</span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(prev + 10, 130))}
                className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                title="Yakınlaştır"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => setZoomScale(100)}
                className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer text-[10px] ml-0.5"
                title="Sıfırla"
              >
                <Maximize2 size={12} />
              </button>
            </div>

            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-white/80"
              title="Markdown olarak panoya kopyala"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Kopyalandı' : 'Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadHTML}
              className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-500/10"
              title="Tek dosya siber HTML raporu indir"
            >
              <Download size={13} />
              <span>HTML İndir</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-white/20 active:scale-95"
              title="Yalnızca A4 Raporunu PDF olarak kaydet veya yazdır"
            >
              <Printer size={13} />
              <span>PDF Al / Yazdır</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Ana Gövde: Sol Parametreler Paneli + Sağ Canlı Rapor Önizleme */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sol Kolon: Rapor Parametreleri ve Dahil Edilecekler (Yazdırmada Otomatik Gizlenir) */}
          <div className="no-print w-72 border-r border-white/10 bg-[#0c0c10] p-4 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2 font-mono">
                  Rapor Yapılandırması
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">Rapor Başlığı</label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">Denetçi / Pentester</label>
                    <input
                      type="text"
                      value={analystName}
                      onChange={(e) => setAnalystName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">Kurum / Müşteri</label>
                    <input
                      type="text"
                      placeholder="Örn: Acme Holding A.Ş."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/60 block mb-1">Gizlilik / Sınıflandırma</label>
                    <select
                      value={classification}
                      onChange={(e) => setClassification(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500/50 font-mono"
                    >
                      <option value="TLP:CLEAR">TLP:CLEAR (Halka Açık)</option>
                      <option value="TLP:GREEN">TLP:GREEN (Topluluk)</option>
                      <option value="TLP:AMBER">TLP:AMBER (Kısıtlı Paylaşım)</option>
                      <option value="TLP:RED">TLP:RED (Çok Gizli / Sıkı)</option>
                      <option value="CONFIDENTIAL">CONFIDENTIAL (Gizli Belge)</option>
                    </select>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80 hover:text-white select-none">
                      <input
                        type="checkbox"
                        checked={maskSecrets}
                        onChange={(e) => setMaskSecrets(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                      />
                      <span>Secret Değerlerini Maskele</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Rapor Bölümleri Filtresi */}
              <div>
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2 font-mono">
                  Dahil Edilecek Bölümler
                </span>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={includeSections.executiveSummary}
                      onChange={() => toggleSection('executiveSummary')}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                    />
                    <span>1. Yönetici Özeti & Risk Skoru</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={includeSections.targetProbe}
                      onChange={() => toggleSection('targetProbe')}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                    />
                    <span>2. HTTP & Teknoloji Parmak İzi</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={includeSections.findings}
                      onChange={() => toggleSection('findings')}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                    />
                    <span>3. Güvenlik Bulguları ({findings.length})</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={includeSections.networkPorts}
                      onChange={() => toggleSection('networkPorts')}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                    />
                    <span>4. Portlar & CVE (Shodan/Censys)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={includeSections.githubLeaks}
                      onChange={() => toggleSection('githubLeaks')}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                    />
                    <span>5. GitHub Kod Sızıntıları ({(githubLeaks || []).length})</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={includeSections.jsSecrets}
                      onChange={() => toggleSection('jsSecrets')}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                    />
                    <span>6. JS Secret & Dahili API'ler</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={includeSections.dnsMap}
                      onChange={() => toggleSection('dnsMap')}
                      className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0"
                    />
                    <span>7. DNS & Komşu Siteler (Reverse IP)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sol Panel Alt Bilgisi */}
            <div className="pt-3 border-t border-white/10 text-[10px] text-white/40 font-mono">
              <div>Dorkful Executive Suite v2.4</div>
              <div className="text-[9px] text-white/30 mt-0.5">OWASP ASVS & CTI Standardı</div>
            </div>
          </div>

          {/* Sağ Kolon: Canlı A4 Kağıt Simülatörü ve Önizleme Masası */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-8 flex justify-center items-start bg-[#18181b]">
            {/* A4 Kağıt Konteyneri (Ölçekleme Destekli) */}
            <div
              style={{
                transform: `scale(${zoomScale / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full flex justify-center"
            >
              <div
                ref={reportPrintRef}
                id="executive-report-paper"
                className="report-paper-printable w-full max-w-[210mm] min-h-[297mm] transition-all duration-200 select-text bg-white text-neutral-900 border border-neutral-300 shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-[16mm] md:p-[20mm] font-sans"
              >
                {/* ---------------------------------------------------- */}
                {/* RAPOR ÜST ANTET & KURUMSAL HEADER                     */}
                {/* ---------------------------------------------------- */}
                <div className="pb-5 mb-6 border-b border-neutral-300 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black tracking-tight text-black">
                          Dorkful.
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider border bg-neutral-100 text-neutral-800 border-neutral-300">
                          CTI & Audit Suite
                        </span>
                      </div>
                    </div>
                    <h1 className="text-lg md:text-xl font-extrabold mt-2 tracking-tight text-neutral-900">
                      {reportTitle}
                    </h1>
                    <p className="text-[11px] opacity-60 mt-0.5 font-mono">
                      Denetim Standardı: OWASP ASVS v4.0.3 & NIST CSF Cyber Reconnaissance
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 font-mono">
                    <span
                      className={`px-3 py-1 rounded font-bold text-xs uppercase tracking-wider border ${
                        classification.includes('RED')
                          ? 'bg-red-500/15 text-red-600 border-red-500/40'
                          : classification.includes('AMBER')
                          ? 'bg-amber-500/15 text-amber-600 border-amber-500/40'
                          : classification.includes('GREEN')
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40'
                          : 'bg-cyan-500/15 text-cyan-600 border-cyan-500/40'
                      }`}
                    >
                      {classification}
                    </span>
                    <span className="text-[11px] opacity-70 flex items-center gap-1">
                      <Calendar size={11} />
                      {reportDate}
                    </span>
                    <span className="text-[10px] opacity-50 font-mono">Ref: {reportRefId}</span>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* DENETİM PARAMETRELERİ & HEDEF IZGARASI               */}
                {/* ---------------------------------------------------- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl mb-6 border border-neutral-200 bg-neutral-50 text-neutral-800 text-xs font-mono">
                  <div className="overflow-hidden">
                    <span className="opacity-50 block text-[9px] uppercase tracking-wider">Hedef Varlık</span>
                    <strong className="text-xs font-bold truncate block mt-0.5 text-cyan-700">
                      {target || 'Tanımsız Hedef'}
                    </strong>
                  </div>
                  <div className="overflow-hidden">
                    <span className="opacity-50 block text-[9px] uppercase tracking-wider">Kurum / Müşteri</span>
                    <strong className="text-xs font-semibold truncate block mt-0.5">
                      {clientName || activeWorkspace?.name || 'Genel Müşteri'}
                    </strong>
                  </div>
                  <div className="overflow-hidden">
                    <span className="opacity-50 block text-[9px] uppercase tracking-wider">Baş Denetçi</span>
                    <strong className="text-xs font-semibold truncate block mt-0.5">{analystName}</strong>
                  </div>
                  <div className="overflow-hidden">
                    <span className="opacity-50 block text-[9px] uppercase tracking-wider">Genel Risk Düzeyi</span>
                    <strong className={`text-xs font-bold block mt-0.5 ${stats.riskTextColor}`}>
                      {stats.riskLevel} ({stats.riskScore} / 10)
                    </strong>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 1. BÖLÜM: YÖNETİCİ ÖZETİ & RİSK DEĞERLENDİRMESİ      */}
                {/* ---------------------------------------------------- */}
                {includeSections.executiveSummary && (
                  <div className="section-block mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider pb-1.5 mb-3 border-b border-neutral-300 text-neutral-900 flex items-center gap-2">
                      <Shield size={14} />
                      <span>1. Yönetici Özeti & Risk Matrisi</span>
                    </h2>

                    <div className="flex flex-col md:flex-row items-center gap-5 p-4 rounded-xl border border-neutral-200 bg-neutral-50 mb-3">
                      {/* Risk Puanı Dairesi */}
                      <div
                        className="w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shrink-0 font-mono shadow-sm bg-white"
                        style={{ borderColor: stats.riskColor, color: stats.riskColor }}
                      >
                        <span className="text-2xl font-black leading-none">{stats.riskScore}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5 opacity-70">/ 10</span>
                      </div>

                      {/* 4'lü Temel Metrik Kutuları */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full font-mono text-center">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/25">
                          <div className="text-base font-bold text-red-600">
                            {stats.criticalFindings}
                          </div>
                          <div className="text-[9px] opacity-70 uppercase font-medium">Kritik Bulgu</div>
                        </div>
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/25">
                          <div className="text-base font-bold text-orange-600">
                            {stats.highFindings}
                          </div>
                          <div className="text-[9px] opacity-70 uppercase font-medium">Yüksek Risk</div>
                        </div>
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                          <div className="text-base font-bold text-cyan-700">
                            {stats.totalPorts}
                          </div>
                          <div className="text-[9px] opacity-70 uppercase font-medium">Açık Port</div>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/25">
                          <div className="text-base font-bold text-purple-700">
                            {stats.totalSecrets + stats.totalLeaks}
                          </div>
                          <div className="text-[9px] opacity-70 uppercase font-medium">Sızan Anahtar</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11.5px] leading-relaxed opacity-85 text-justify text-neutral-800">
                      Bu güvenlik denetim raporu, <strong>{target}</strong> hedefi üzerinde pasif OSINT, gelişmiş dorking,
                      ağ yüzey haritalaması ve istemci tarafı kod analizi yöntemleriyle elde edilen istihbaratı içerir. Yapılan
                      denetim sonucunda <strong>{findings.length} adet</strong> güvenlik bulgusu doğrulanmış;{' '}
                      <strong>{stats.totalPorts} açık servis portu</strong>, <strong>{stats.totalVulns} bilinen CVE zafiyeti</strong> ve{' '}
                      <strong>{stats.totalSecrets + stats.totalLeaks} adet sızmış API/Token secret'ı</strong> tespit edilmiştir. Hedef varlığın
                      genel güvenlik duruşu <strong className={stats.riskTextColor}>{stats.riskLevel}</strong> risk seviyesinde raporlanmıştır.
                    </p>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 2. BÖLÜM: CANLI HTTP DENETİMİ & TEKNOLOJİ PARMAK İZİ */}
                {/* ---------------------------------------------------- */}
                {includeSections.targetProbe && probeResult && (
                  <div className="section-block mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider pb-1.5 mb-3 border-b border-neutral-300 text-neutral-900 flex items-center gap-2">
                      <Globe size={14} />
                      <span>2. Canlı HTTP Denetimi & Teknoloji Parmak İzleri</span>
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono mb-3">
                      <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
                        <span className="opacity-50 block text-[9px]">HTTP Kodu</span>
                        <strong className="text-xs font-bold text-emerald-700">
                          {probeResult.statusCode} {probeResult.statusText}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
                        <span className="opacity-50 block text-[9px]">Yanıt Süresi</span>
                        <strong className="text-xs font-semibold">{probeResult.responseTimeMs || 0} ms</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
                        <span className="opacity-50 block text-[9px]">Sunucu Başlığı</span>
                        <strong className="text-xs font-semibold truncate block">
                          {probeResult.server || 'Gizli / Belirtilmemiş'}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50">
                        <span className="opacity-50 block text-[9px]">TLS / SSL</span>
                        <strong className="text-xs font-semibold">
                          {probeResult.isHttps ? 'Aktif (HTTPS/TLS)' : 'Güvensiz (HTTP)'}
                        </strong>
                      </div>
                    </div>

                    {probeResult.technologies && probeResult.technologies.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] font-semibold block mb-1.5 opacity-70 uppercase tracking-wider font-mono">
                          Tespit Edilen Çatılar ve Kütüphaneler:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {probeResult.technologies.map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-mono border bg-neutral-100 border-neutral-300 text-neutral-800"
                            >
                              <strong>{tech.name}</strong> {tech.version ? `v${tech.version}` : ''}{' '}
                              <span className="opacity-50 text-[9px]">({tech.category})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 3. BÖLÜM: DOĞRULANMIŞ GÜVENLİK BULGULARI TABLOSU     */}
                {/* ---------------------------------------------------- */}
                {includeSections.findings && (
                  <div className="section-block mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider pb-1.5 mb-3 border-b border-neutral-300 text-neutral-900 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      <span>3. Doğrulanmış Güvenlik Bulguları ({findings.length})</span>
                    </h2>

                    {findings.length === 0 ? (
                      <p className="text-xs opacity-50 italic font-mono py-2">Kayıtlı güvenlik bulgusu bulunmuyor.</p>
                    ) : (
                      <div className="border border-neutral-300 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs table-fixed border-collapse">
                          <colgroup>
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '42%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '24%' }} />
                          </colgroup>
                          <thead className="bg-neutral-100 text-neutral-800 border-b-2 border-neutral-300">
                            <tr>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Önem</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Zafiyet / Bulgu Açıklaması</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Kategori</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Kanıt & Referans</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {findings.map((finding, idx) => {
                              const sev = (finding.severity || 'Medium').toUpperCase();
                              return (
                                <tr
                                  key={idx}
                                  className={idx % 2 === 1 ? 'bg-neutral-50/70' : 'bg-white'}
                                >
                                  <td className="py-2.5 px-2.5 font-mono align-top">
                                    <span
                                      className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono uppercase ${
                                        sev === 'CRITICAL'
                                          ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                                          : sev === 'HIGH'
                                          ? 'bg-orange-500/15 text-orange-600 border border-orange-500/30'
                                          : sev === 'MEDIUM'
                                          ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                                          : 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                                      }`}
                                    >
                                      {sev}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2.5 align-top">
                                    <strong className="block font-semibold text-[11.5px] break-words text-neutral-900">
                                      {finding.description || finding.query}
                                    </strong>
                                    {finding.notes && (
                                      <span className="text-[10.5px] opacity-75 block mt-0.5 break-words font-mono text-neutral-700">
                                        Not: {finding.notes}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2.5 font-mono text-[11px] opacity-80 align-top break-words text-neutral-700">
                                    {finding.category || 'Genel Keşif'}
                                  </td>
                                  <td className="py-2.5 px-2.5 font-mono text-[10px] break-all align-top">
                                    {finding.evidenceUrl || finding.evidenceURL ? (
                                      <span className="text-blue-700 underline font-medium">
                                        {finding.evidenceUrl || finding.evidenceURL}
                                      </span>
                                    ) : (
                                      <span className="opacity-40">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 4. BÖLÜM: AÇIK PORTLAR & CVE ZAFİYETLERİ             */}
                {/* ---------------------------------------------------- */}
                {includeSections.networkPorts && (
                  <div className="section-block mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider pb-1.5 mb-3 border-b border-neutral-300 text-neutral-900 flex items-center gap-2">
                      <Radio size={14} />
                      <span>4. Açık Portlar & Tehdit İstihbaratı (Shodan & Censys)</span>
                    </h2>

                    {(shodanHosts || []).length === 0 && (censysHosts || []).length === 0 ? (
                      <p className="text-xs opacity-50 italic font-mono py-2">Taranmış aktif port verisi bulunmuyor.</p>
                    ) : (
                      <div className="border border-neutral-300 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs table-fixed border-collapse">
                          <colgroup>
                            <col style={{ width: '24%' }} />
                            <col style={{ width: '38%' }} />
                            <col style={{ width: '38%' }} />
                          </colgroup>
                          <thead className="bg-neutral-100 text-neutral-800 border-b-2 border-neutral-300">
                            <tr>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Host IP / Servis</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Açık Portlar</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Tespit Edilen CVE Zafiyetleri</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {(shodanHosts || []).map((host, idx) => (
                              <tr
                                key={idx}
                                className={idx % 2 === 1 ? 'bg-neutral-50/70' : 'bg-white'}
                              >
                                <td className="py-2.5 px-2.5 font-mono align-top">
                                  <span className="font-bold block text-neutral-900">
                                    {host.ip}
                                  </span>
                                  <span className="block text-[9.5px] opacity-50 font-normal">Shodan / InternetDB</span>
                                </td>
                                <td className="py-2.5 px-2.5 font-mono align-top">
                                  <div className="flex flex-wrap gap-1">
                                    {(host.ports || []).map((p, pi) => (
                                      <span
                                        key={pi}
                                        className="px-1.5 py-0.5 rounded text-[9.5px] font-mono border bg-neutral-100 border-neutral-300 text-neutral-800"
                                      >
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2.5 px-2.5 font-mono align-top">
                                  {host.vulns && host.vulns.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {host.vulns.map((v, vi) => (
                                        <span
                                          key={vi}
                                          className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] font-bold"
                                        >
                                          {v}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="opacity-40 text-[11px] font-mono">Zafiyet tespit edilmedi</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 5. BÖLÜM: JAVASCRIPT SECRET & DAHİLİ API ROTALARI     */}
                {/* ---------------------------------------------------- */}
                {includeSections.jsSecrets && jsAnalysisResult && (
                  <div className="section-block mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider pb-1.5 mb-3 border-b border-neutral-300 text-neutral-900 flex items-center gap-2">
                      <Code2 size={14} />
                      <span>5. İstemci Tarafı JavaScript Analizi & Gizli API Anahtarları</span>
                    </h2>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3 text-center">
                      <div className="p-2 rounded-lg border border-neutral-200 bg-neutral-50">
                        <span className="opacity-50 block text-[9px]">Taranan Script</span>
                        <strong className="text-sm">{jsAnalysisResult.scannedScripts || 0}</strong>
                      </div>
                      <div className="p-2 rounded-lg border border-neutral-200 bg-neutral-50">
                        <span className="opacity-50 block text-[9px]">Sızan Secret</span>
                        <strong className="text-sm text-red-600">
                          {(jsAnalysisResult.secrets || []).length}
                        </strong>
                      </div>
                      <div className="p-2 rounded-lg border border-neutral-200 bg-neutral-50">
                        <span className="opacity-50 block text-[9px]">Dahili API Rotası</span>
                        <strong className="text-sm text-cyan-700">
                          {(jsAnalysisResult.endpoints || []).length}
                        </strong>
                      </div>
                    </div>

                    {(jsAnalysisResult.secrets || []).length > 0 && (
                      <div className="border border-neutral-300 rounded-lg overflow-hidden mb-3">
                        <table className="w-full text-left text-xs font-mono table-fixed border-collapse">
                          <colgroup>
                            <col style={{ width: '22%' }} />
                            <col style={{ width: '48%' }} />
                            <col style={{ width: '30%' }} />
                          </colgroup>
                          <thead className="bg-neutral-100 text-neutral-800 border-b-2 border-neutral-300">
                            <tr>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Secret Türü</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Değer / Eşleşme</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Kaynak Dosya</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {jsAnalysisResult.secrets.map((sec, si) => (
                              <tr
                                key={si}
                                className={si % 2 === 1 ? 'bg-neutral-50/70' : 'bg-white'}
                              >
                                <td className="py-2 px-2.5 text-red-600 font-bold align-top text-[11px]">
                                  {sec.type}
                                </td>
                                <td className="py-2 px-2.5 break-all select-all font-semibold align-top text-[10.5px] text-neutral-900">
                                  {maskValue(sec.match)}
                                </td>
                                <td className="py-2 px-2.5 opacity-60 break-all align-top text-[9.5px]">
                                  {sec.fileUrl}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 6. BÖLÜM: DNS ALTYAPISI & REVERSE IP KOMŞULARI       */}
                {/* ---------------------------------------------------- */}
                {includeSections.dnsMap && dnsMapResult && (
                  <div className="section-block mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider pb-1.5 mb-3 border-b border-neutral-300 text-neutral-900 flex items-center gap-2">
                      <Network size={14} />
                      <span>6. DNS Altyapısı & Paylaşılan Sunucu Komşuları (Reverse IP)</span>
                    </h2>

                    <div className="text-[11px] mb-2 font-mono opacity-80">
                      Çözümlenen DNS Kaydı: <strong>{(dnsMapResult.records || []).length}</strong> | Aynı IP'deki Komşu Siteler: <strong>{(dnsMapResult.coHostedDomains || []).length}</strong>
                    </div>

                    {(dnsMapResult.coHostedDomains || []).length > 0 && (
                      <div className="border border-neutral-300 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs font-mono table-fixed border-collapse">
                          <colgroup>
                            <col style={{ width: '44%' }} />
                            <col style={{ width: '30%' }} />
                            <col style={{ width: '26%' }} />
                          </colgroup>
                          <thead className="bg-neutral-100 text-neutral-800 border-b-2 border-neutral-300">
                            <tr>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Komşu Alan Adı</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">Paylaşılan IP</th>
                              <th className="py-2 px-2.5 font-bold uppercase text-[10px] tracking-wider">İstihbarat Kaynağı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {dnsMapResult.coHostedDomains.slice(0, 15).map((co, ci) => (
                              <tr
                                key={ci}
                                className={ci % 2 === 1 ? 'bg-neutral-50/70' : 'bg-white'}
                              >
                                <td className="py-2 px-2.5 font-semibold break-all align-top text-[11px] text-neutral-900">
                                  {co.domain}
                                </td>
                                <td className="py-2 px-2.5 opacity-70 align-top text-[10.5px]">{co.resolvedIp}</td>
                                <td className="py-2 px-2.5 opacity-50 align-top text-[10px]">{co.source || 'Reverse IP'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* 7. İMZA, ONAY & RESMİ FERAGATNAME ALANI              */}
                {/* ---------------------------------------------------- */}
                <div className="mt-10 pt-5 border-t border-neutral-300">
                  <div className="grid grid-cols-2 gap-8 mb-6 font-mono text-xs">
                    <div>
                      <span className="opacity-50 block text-[9px] uppercase tracking-wider mb-2">Hazırlayan Analist / Pentester</span>
                      <div className="font-semibold text-xs text-neutral-900">{analystName}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">Siber Tehdit İstihbarat Uzmanı</div>
                      <div className="mt-4 border-b border-dashed border-neutral-400 w-44"></div>
                      <div className="text-[8.5px] opacity-50 mt-1">İmza & Tarih: {reportDate.split(' ')[0]}</div>
                    </div>
                    <div>
                      <span className="opacity-50 block text-[9px] uppercase tracking-wider mb-2">Denetim Onayı / CISO Ofisi</span>
                      <div className="font-semibold text-xs text-neutral-900">{clientName || 'Güvenlik Operasyon Merkezi'}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">Bilgi Güvenliği Yönetimi</div>
                      <div className="mt-4 border-b border-dashed border-neutral-400 w-44"></div>
                      <div className="text-[8.5px] opacity-50 mt-1">Mühür & Onay Kodu: [VERIFIED-{reportRefId.slice(-6)}]</div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] opacity-60 font-mono space-y-1 text-neutral-600">
                    <p>
                      Dorkful Cyber Threat Intelligence Platform • Otomatik Yönetici Denetim Raporu
                    </p>
                    <p className="text-[9px]">
                      <strong>Gizlilik Uyarısı:</strong> Bu rapor <strong>{classification}</strong> sınıflandırmasına tabi olup yalnızca belirtilen yetkili kurum ve analistlerin kullanımına tahsis edilmiştir. Yetkisiz paylaşımı veya çoğaltılması yasaktır.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
