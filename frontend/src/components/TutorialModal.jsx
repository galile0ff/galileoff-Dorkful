"use client";

import React, { useState } from 'react';
import ModalShell from './ModalShell';
import {
  BookOpen,
  Search,
  Globe,
  GitBranch,
  Radio,
  Shield,
  Activity,
  Flag,
  SlidersHorizontal,
  FileText,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Key,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
  Lightbulb,
  Lock,
  Layers,
  Compass,
  Zap,
  HelpCircle
} from 'lucide-react';

/**
 * Dorkful İnteraktif Görsel Kullanım Kılavuzu & Onboarding Modalı
 * Sıfırdan başlayan siber güvenlik araştırmacıları ve pentesterlar için hazırlanmış
 * grafik ve canlı UI simülasyonlarıyla desteklenmiş rehber bileşeni.
 */
export default function TutorialModal({
  isOpen,
  onClose,
  onOpenReconHub,
  onOpenSettings,
  onOpenManageModal
}) {
  const [activeTab, setActiveTab] = useState('tour'); // 'tour' | 'topics'
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState('what-is-dorking');

  // Adım Adım Tur Verileri (Görsel ve Eğitici Bilgiler)
  const TOUR_STEPS = [
    {
      id: 'step-target-engine',
      badge: 'Adım 1 / 5 • Başlangıç',
      title: 'Hedef Belirleme & Çoklu Arama Motoru Seçimi',
      subtitle: 'Pasif keşif sürecinin ilk adımı: Hedef domaini tanımlayın ve arama motorunu seçin.',
      description:
        'Dorkful, doğrudan hedef sunucuya saldırı paketleri göndermez; arama motorlarının önceden indekslediği devasa açık veriyi sorgular (Tamamen Pasif Keşif / OSINT).',
      bullets: [
        {
          icon: Globe,
          label: 'Google (Web Dorkları):',
          text: 'Unutulmuş `.env` dosyaları, veritabanı yedekleri (`.sql`), açık yönetim panelleri ve hassas belgeler.'
        },
        {
          icon: GitBranch,
          label: 'GitHub (Kod Sızıntısı):',
          text: 'Geliştiricilerin açık repolara kazara yüklediği AWS tokenları, API secretları ve bağlantı dizgileri.'
        },
        {
          icon: Radio,
          label: 'Shodan (İnternet Taraması):',
          text: 'İnternete doğrudan açık portlar (RDP, SSH, Redis, Elasticsearch) ve bilinen CVE zafiyetleri.'
        },
        {
          icon: Shield,
          label: 'Censys (Sertifika & Hostlar):',
          text: 'SSL/TLS sertifikaları üzerinden gizlenmiş orijinal IP adresleri ve sanal hostlar.'
        }
      ],
      tip: 'Hedef alan adını girerken "https://" veya "www." yazmanıza gerek yoktur, yalnızca "hedef.com" şeklinde yazmanız yeterlidir.',
      mockupType: 'engine-selector'
    },
    {
      id: 'step-dork-execution',
      badge: 'Adım 2 / 5 • Dork Operasyonları',
      title: 'Dork Kartları & Tarayıcıda Doğrudan Arama',
      subtitle: 'Üretilen özel dorkları tek tıkla çalıştırın, kopyalayın ve MITRE taktiklerini inceleyin.',
      description:
        'Hedefinizi girdikten sonra Dorkful, onlarca farklı kategoride hazır zafiyet sorguları üretir. Her kart, hedefinize özel olarak anında dinamik biçimde formatlanır.',
      bullets: [
        {
          icon: ExternalLink,
          label: 'Tek Tıkla Arama (Google Butonu):',
          text: 'Sorguyu anında yeni sekmede Google üzerinde çalıştırır ve gerçek zamanlı indeks sonuçlarını getirir.'
        },
        {
          icon: Copy,
          label: 'Panoya Kopyalama:',
          text: 'Dork metnini panoya kopyalar; isterseniz terminalde veya farklı bir tarayıcı profilinde kullanabilirsiniz.'
        },
        {
          icon: AlertTriangle,
          label: 'Risk & Ciddiyet Seviyesi:',
          text: 'Dorklar Kritik, Yüksek, Orta ve Düşük risk etiketlerine sahiptir. Önceliğinizi Kritik dorklara verin.'
        },
        {
          icon: Layers,
          label: 'MITRE ATT&CK Eşleşmesi:',
          text: 'Her dork, global siber güvenlik standardı olan MITRE ATT&CK tekniğiyle (örn: T1552) etiketlenmiştir.'
        }
      ],
      tip: 'Üstteki kategori filtrelerini (Kimlik Bilgileri, Belgeler, Yönetim vb.) kullanarak yalnızca ilgilendiğiniz zafiyet türüne odaklanabilirsiniz.',
      mockupType: 'dork-card'
    },
    {
      id: 'step-recon-hub',
      badge: 'Adım 3 / 5 • İleri Keşif',
      title: 'İstihbarat & Keşif Merkezi (Recon Hub)',
      subtitle: 'Yalnızca Google ile yetinmeyin; DNS haritası, JS Secret Miner ve sertifika geçmişini tarayın.',
      description:
        'Keşif Merkezi, hedefinizin dijital saldırı yüzeyini genişletmek için 6 güçlü istihbarat motorunu tek çatıda birleştirir.',
      bullets: [
        {
          icon: Activity,
          label: 'DNS & Reverse IP Haritası:',
          text: 'Hedefin tüm DNS kayıtlarını (A, MX, NS, TXT) ve aynı sunucuda barınan komşu siteleri listeler.'
        },
        {
          icon: Terminal,
          label: 'JS Secret Miner:',
          text: 'Hedef web uygulamasının JavaScript dosyalarını canlı çekerek içindeki gizli API anahtarlarını ve gizli endpointleri ayıklar.'
        },
        {
          icon: Compass,
          label: 'CRT.sh (Sertifika Şeffaflığı):',
          text: 'Yıllar boyu alınmış tüm SSL sertifikalarını tarayarak unutulmuş test ve geliştirme alt alan adlarını (subdomains) bulur.'
        },
        {
          icon: Globe,
          label: 'Wayback Machine Arşivi:',
          text: 'Hedefin geçmişte var olan ancak şu an yayından kaldırılmış eski URL ve parametrelerini gün yüzüne çıkarır.'
        }
      ],
      tip: 'Recon Hub içerisindeki herhangi bir alt alan adına çift tıklayarak o alt alanı doğrudan yeni hedefiniz yapabilirsiniz!',
      mockupType: 'recon-hub'
    },
    {
      id: 'step-findings-locker',
      badge: 'Adım 4 / 5 • Delil Toplama',
      title: 'Bulgu Defteri & Kanıt Kasası (Findings Locker)',
      subtitle: 'Açık bulduğunuz kritik sonuçları kaybetmeyin; delil URL’si ve notlarınızla bayraklayın.',
      description:
        'Yaptığınız aramalarda şüpheli bir dosya, açık panel veya sızdırılmış kimlik bilgisi gördüğünüzde dork kartındaki Bayrak (Flag) ikonuna tıklayın.',
      bullets: [
        {
          icon: Flag,
          label: 'Tek Tıkla Bulgu Kaydı:',
          text: 'Zafiyetin türünü, ciddiyet derecesini, delil URL adresini ve kendi analiz notlarınızı kaydedin.'
        },
        {
          icon: Lock,
          label: 'Yerel ve Güvenli Depolama:',
          text: 'Tüm bulgularınız bilgisayarınızın yerelinde güvenle şifreli/izole saklanır, hiçbir harici sunucuya iletilmez.'
        },
        {
          icon: FileText,
          label: 'Filtreleme & Dışa Aktarma:',
          text: 'Bulgularınızı risk derecelerine göre filtreleyebilir, denetim sonunda JSON olarak dışa aktarabilirsiniz.'
        }
      ],
      tip: 'Bulgu Defteri’ndeki sayaç, üst çubukta sürekli canlı olarak güncellenir. Kaç kritik bulgunuz olduğunu anında takip edebilirsiniz.',
      mockupType: 'findings-card'
    },
    {
      id: 'step-executive-report',
      badge: 'Adım 5 / 5 • Sonuç & Sunum',
      title: 'CTI & Pentest Yönetici Raporu (Executive Report)',
      subtitle: 'Topladığınız tüm keşif verilerini ve bulguları tek tıkla profesyonel bir siber rapora dönüştürün.',
      description:
        'Müşterinize, kurum yöneticinize veya güvenlik ekibinize sunabileceğiniz uluslararası standartlarda PDF & HTML siber istihbarat raporu hazırlayın.',
      bullets: [
        {
          icon: FileText,
          label: 'Otomatik Risk Skoru & Notu:',
          text: 'Bulguların ciddiyet ağırlıklarına göre otomatik Güvenlik Puanı (örn: B+ 78/100) ve risk grafiği hesaplar.'
        },
        {
          icon: Zap,
          label: 'Yönetici Özeti & Aksiyon Planı:',
          text: 'Teknik detayların yanında karar vericiler için anlaşılır bir durum değerlendirmesi sunar.'
        },
        {
          icon: CheckCircle2,
          label: 'Tek Tıkla Yazdır & PDF Kaydet:',
          text: 'Wails ve modern tarayıcı baskı motoruyla A4 formatına tam uyumlu profesyonel PDF çıktısı üretir.'
        }
      ],
      tip: 'Raporu oluşturmadan önce "Bulgu Defteri"ne birkaç bulgu eklemiş olmanız, raporunuzun zenginliğini ve puan doğruluğunu artıracaktır.',
      mockupType: 'report-preview'
    }
  ];

  // Konu Kılavuzu & Bilgi Bankası Başlıkları
  const TOPICS = [
    {
      id: 'what-is-dorking',
      icon: Search,
      title: 'Google Dorking Nedir?',
      tag: 'Temel Mantık',
      content: {
        intro:
          'Google Dorking (veya Google Hacking), arama motorlarının gelişmiş arama operatörlerini kullanarak internette herkese açık bırakılmış ancak normal aramalarda görünmeyen hassas dosyaları bulma sanatıdır.',
        sections: [
          {
            heading: 'Temel Dork Operatörleri',
            items: [
              { code: 'site:hedef.com', desc: 'Aramayı yalnızca bu alan adı ve alt alan adlarıyla sınırlandırır.' },
              { code: 'filetype:env OR ext:sql', desc: 'Belirtilen dosya uzantısına sahip belgeleri filtreler.' },
              { code: 'inurl:admin OR inurl:login', desc: 'URL yolunda bu kelimeler geçen sayfaları bulur.' },
              { code: 'intitle:"Index of /"', desc: 'Web sunucusunun dizin listeleme açığını (Directory Listing) hedefler.' }
            ]
          },
          {
            heading: 'Neden Bu Kadar Etkilidir?',
            text:
              'Sistem yöneticileri veya geliştiriciler bazen `.env`, `.git` veya veritabanı yedeklerini sunucu ana dizininde unuturlar. Arama motorları bu dosyaları otomatik tarar ve indeksler. Dorkful, bu indekslenmiş zafiyetleri ortaya çıkarır.'
          }
        ]
      }
    },
    {
      id: 'legal-and-ethics',
      icon: Shield,
      title: 'Yasal ve Etik Sınırlar',
      tag: 'Önemli Uyarı',
      content: {
        intro:
          'Dorkful, güvenlik uzmanları, sızma testi (pentest) uzmanları ve sistem sahiplerinin kendi varlıklarını denetlemeleri amacıyla tasarlanmış bir güvenlik aracıdır.',
        sections: [
          {
            heading: 'Yasal Durum & Bilinmesi Gerekenler',
            bullets: [
              'Arama motorlarında dork çalıştırmak halka açık bilgileri sorgulamaktır; doğrudan bir siber saldırı veya sunucuya izinsiz erişim değildir.',
              'ANCAK, arama sonucunda bulduğunuz bir veritabanı yedeğini indirmek veya bir yönetim paneline izinsiz giriş yapmayı denemek (Brute Force, SQLi) yasa dışıdır.',
              'Tespit ettiğiniz zafiyetleri yalnızca sistem sahibine sorumlu bildirim (Responsible Disclosure) kapsamında iletiniz.'
            ]
          }
        ]
      }
    },
    {
      id: 'avoid-captcha',
      icon: AlertTriangle,
      title: 'Google CAPTCHA Engeli Aşma',
      tag: 'Optimizasyon',
      content: {
        intro:
          'Peş peşe çok sayıda Google Dork araması açtığınızda Google, trafiği otomatik bir bot olarak algılayıp "Sıra dışı trafik" veya "Ben robot değilim" doğrulaması isteyebilir.',
        sections: [
          {
            heading: 'CAPTCHA’ya Takılmamak İçin Tavsiyeler',
            bullets: [
              'Aramalar arasında 3-5 saniye bekleyin, aynı anda onlarca dork sekmesi birden açmayın.',
              'Giriş yapılmış bir Google hesabınızın olduğu standart tarayıcı profilini kullanın; oturum açık profiller çok daha az doğrulamaya düşer.',
              'Eğer Google sizi geçici engellerse, Hero alanındaki motor seçiciden Shodan, GitHub veya Censys motorlarına geçiş yaparak keşfe devam edin.',
              'Farklı bir IP/VPN tüneli kullanmak CAPTCHA havuzunu anında sıfırlar.'
            ]
          }
        ]
      }
    },
    {
      id: 'api-vault',
      icon: Key,
      title: 'API Kasası: Shodan & Censys',
      tag: 'Ayarlar',
      content: {
        intro:
          'Dorkful’un Shodan ve Censys canlı istihbarat yeteneklerini kullanabilmek için ücretsiz API anahtarlarınızı Ayarlar bölümüne bir defaya mahsus eklemeniz yeterlidir.',
        sections: [
          {
            heading: 'Ücretsiz API Anahtarları Nasıl Alınır?',
            steps: [
              '1. shodan.io adresinde ücretsiz bir hesap açın ve "Account" sekmesinden API Key’inizi kopyalayın.',
              '2. search.censys.io adresine üye olup "API Settings" bölümünden API ID ve Secret anahtarlarınızı alın.',
              '3. Dorkful arayüzünde sağ üstteki Ayarlar (Çark) ikonuna tıklayın ve API Kasası sekmesine anahtarları yapıştırıp "Kaydet"e basın.',
              '4. "Bağlantıyı Test Et" butonuyla anahtarlarınızın doğruluğunu anında teyit edin.'
            ]
          }
        ]
      }
    },
    {
      id: 'custom-dorks',
      icon: SlidersHorizontal,
      title: 'Özel Dork Şablonları (Dork Studio)',
      tag: 'Özelleştirme',
      content: {
        intro:
          'Kendi geliştirdiğiniz veya kurumunuza özel dork sorgularını Dorkful’a ekleyebilir, mevcut şablonları düzenleyebilir ve kategorileri yönetebilirsiniz.',
        sections: [
          {
            heading: '{target} Değişkeni Mantığı',
            text:
              'Dork şablonu oluştururken hedef alan adının geleceği yere `{target}` etiketini koyun. Örneğin: `site:{target} inurl:admin` şeklinde yazdığınızda, hedef "ornek.com" olduğunda sorgu otomatik olarak `site:ornek.com inurl:admin` haline dönüşecektir.'
          },
          {
            heading: 'Yedekleme & Sıfırlama',
            text:
              'Eklediğiniz tüm özel dorklar yerel veritabanında saklanır. Dilediğiniz zaman varsayılan dork listesine tek tıkla geri dönebilir veya Dork Studio içinden dorklarınızı dışa aktarabilirsiniz.'
          }
        ]
      }
    },
    {
      id: 'shortcuts',
      icon: Terminal,
      title: 'Klavye Kısayolları & İpuçları',
      tag: 'Hız & Verimlilik',
      content: {
        intro: 'Dorkful, klavyeden elinizi kaldırmadan hızlıca operasyon yapabilmeniz için kısayollarla donatılmıştır.',
        sections: [
          {
            heading: 'Temel Tuş Kombinasyonları',
            items: [
              { code: 'Enter', desc: 'Arama kutusunda hedefi yazdıktan sonra basıldığında dorkları otomatik üretir.' },
              { code: 'Esc', desc: 'Açık olan herhangi bir modal pencereyi (Kılavuz, Ayarlar, Bulgular vb.) anında kapatır.' },
              { code: 'Shift + Scroll', desc: 'Kategori filtre çubuğunu yatayda hızlıca kaydırmanızı sağlar.' },
              { code: 'Çift Tıklama', desc: 'Recon Hub DNS listesindeki bir alt alana çift tıklamak hedefi doğrudan günceller.' }
            ]
          }
        ]
      }
    }
  ];

  const currentStepData = TOUR_STEPS[currentStep];
  const selectedTopicData = TOPICS.find((t) => t.id === selectedTopicId) || TOPICS[0];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Dorkful Kullanım Kılavuzu"
      subtitle="Sıfırdan Başlayanlar İçin Görsel & İnteraktif İstihbarat Rehberi"
      icon={BookOpen}
      badge="Rehber v2.5"
      maxWidth="max-w-5xl"
      headerActions={
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('tour')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tour'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Compass size={13} />
            <span>Hızlı Başlangıç Turu</span>
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'topics'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            <span>Konu Kılavuzu & SSS</span>
          </button>
        </div>
      }
      footer={
        activeTab === 'tour' ? (
          <div className="flex items-center justify-between w-full">
            {/* Sol: Geri Butonu */}
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                currentStep === 0
                  ? 'border-white/5 text-white/20 cursor-not-allowed'
                  : 'border-white/10 text-white/70 hover:text-white hover:border-white/25 hover:bg-white/[0.05]'
              }`}
            >
              <ChevronLeft size={14} />
              <span>Önceki Adım</span>
            </button>

            {/* Orta: Adım Gösterge Noktaları */}
            <div className="flex items-center gap-2">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-6 bg-white shadow-sm shadow-white/50'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`${idx + 1}. Adıma Git`}
                />
              ))}
            </div>

            {/* Sağ: İleri veya Bitir Butonu */}
            {currentStep < TOUR_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Sonraki Adım</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <span>Anladım, Aramaya Başla!</span>
                <Sparkles size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-xs text-white/50">
            <span>Dorkful Siber İstihbarat Platformu • Yerel & Gizlilik Odaklı</span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all cursor-pointer"
            >
              Kılavuzu Kapat
            </button>
          </div>
        )
      }
    >
      {/* ============================================================== */}
      {/* SEKME 1: ADIM ADIM HIZLI BAŞLANGIÇ TURU                        */}
      {/* ============================================================== */}
      {activeTab === 'tour' && (
        <div className="p-5 sm:p-6 flex flex-col gap-6">
          {/* Üst Adım Navigasyon Çubuğu */}
          <div className="grid grid-cols-5 gap-2 border-b border-white/[0.08] pb-4">
            {TOUR_STEPS.map((step, idx) => {
              const isActive = currentStep === idx;
              const isPast = currentStep > idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex flex-col items-center sm:items-start text-left p-2 rounded-xl transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-white/[0.08] border-white/25 text-white'
                      : isPast
                      ? 'bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.05]'
                      : 'bg-transparent border-transparent text-white/35 hover:text-white/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white text-black'
                          : isPast
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </span>
                    <span className="hidden md:inline text-[11px] font-medium truncate">
                      {idx === 0 && 'Hedef & Motor'}
                      {idx === 1 && 'Dork Kartları'}
                      {idx === 2 && 'Keşif Merkezi'}
                      {idx === 3 && 'Bulgu Defteri'}
                      {idx === 4 && 'Yönetici Raporu'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Adım İçerik Bloğu (2 Sütunlu Izgara: Sol Bilgiler, Sağ Görsel Mockup) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol Sütun: Açıklayıcı Metinler ve Maddeler (7 Sütun) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 inline-block mb-2">
                  {currentStepData.badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {currentStepData.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/70 mt-1 leading-relaxed">
                  {currentStepData.subtitle}
                </p>
              </div>

              <div className="text-xs text-white/80 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.06]">
                {currentStepData.description}
              </div>

              {/* Maddeler */}
              <div className="flex flex-col gap-2.5">
                {currentStepData.bullets.map((b, idx) => {
                  const BulletIcon = b.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/15 transition-all"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-white/80 mt-0.5">
                        <BulletIcon size={13} />
                      </div>
                      <div className="text-xs leading-snug">
                        <span className="font-semibold text-white mr-1.5">{b.label}</span>
                        <span className="text-white/60">{b.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* İpucu Kutusu */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs leading-relaxed">
                <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">İpucu: </span>
                  {currentStepData.tip}
                </div>
              </div>
            </div>

            {/* Sağ Sütun: Canlı Görsel Simülasyon / UI Mockup (5 Sütun) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full bg-[#08080a] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden group">
                {/* Arka plan ışık efekti */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                {/* Mockup Başlık Çubuğu */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3 text-[11px] text-white/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 font-mono text-white/50">Dorkful Canlı Görsel Önizleme</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Örnek Arayüz
                  </span>
                </div>

                {/* ADIM 1 MOCKUP: MOTOR SEÇİCİ & ARAMA ÇUBUĞU */}
                {currentStepData.mockupType === 'engine-selector' && (
                  <div className="flex flex-col gap-3 py-2">
                    <div className="p-2 rounded-2xl bg-white/[0.03] border border-white/15 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs shrink-0 shadow-sm">
                        <Globe size={13} />
                        <span>Google</span>
                      </div>
                      <div className="flex-1 font-mono text-xs text-white/90 truncate">
                        tesla.com
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-1 shrink-0">
                        <Search size={12} />
                        <span>Keşfet</span>
                      </div>
                    </div>

                    {/* Motor Karşılaştırma Kartları */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                          <Globe size={12} className="text-blue-400" />
                          <span>Google Dork</span>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 leading-tight">
                          İndekslenmiş `.env`, `.sql`, yedekler ve admin panelleri.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                          <GitBranch size={12} className="text-purple-400" />
                          <span>GitHub Sızıntı</span>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 leading-tight">
                          Açık kod depolarına sızmış API tokenları ve şifreler.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                          <Radio size={12} className="text-red-400" />
                          <span>Shodan Canlı</span>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 leading-tight">
                          Açık portlar, RDP, SSH, DB servisleri ve CVE açıkları.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                          <Shield size={12} className="text-emerald-400" />
                          <span>Censys Host</span>
                        </div>
                        <p className="text-[10px] text-white/50 mt-1 leading-tight">
                          SSL sertifikalarıyla gizlenmiş orijinal IP haritası.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADIM 2 MOCKUP: DORK KARTI & AKSİYONLAR */}
                {currentStepData.mockupType === 'dork-card' && (
                  <div className="flex flex-col gap-2.5 py-1">
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-red-500/30 flex flex-col gap-2 shadow-lg relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                            CRITICAL
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            Ortam Dosyaları (.env & Veritabanı Şifreleri)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-white/40">
                          T1552.001
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-400 break-all select-all">
                        site:tesla.com ext:env "DB_PASSWORD" | "SECRET_KEY"
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <div className="px-2.5 py-1 rounded-lg bg-white/10 text-white/90 text-[11px] font-medium flex items-center gap-1">
                            <Copy size={11} />
                            <span>Kopyala</span>
                          </div>
                          <div className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 text-[11px] font-medium flex items-center gap-1 border border-red-500/30">
                            <Flag size={11} />
                            <span>Bayrakla</span>
                          </div>
                        </div>

                        <div className="px-3 py-1 rounded-lg bg-white text-black font-semibold text-[11px] flex items-center gap-1 shadow-sm">
                          <ExternalLink size={11} />
                          <span>Google'da Ara</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-white/45 text-center font-mono">
                      * Hedef sunucuya tek bir istek gitmez, tüm arama Google sunucularında gerçekleşir.
                    </div>
                  </div>
                )}

                {/* ADIM 3 MOCKUP: KEŞİF MERKEZİ & AĞ HARİTASI */}
                {currentStepData.mockupType === 'recon-hub' && (
                  <div className="flex flex-col gap-3 py-1">
                    <div className="flex items-center justify-between px-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" />
                        <span className="font-semibold text-white">Canlı Ağ Topolojisi</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">14 Canlı Host</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-2 font-mono text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-white font-medium">api.tesla.com</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          200 OK
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-white font-medium">vpn.tesla.com</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          403 FORBIDDEN
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span className="text-white font-medium">dev-stage.tesla.com</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                          JS MINER (3 Secret)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADIM 4 MOCKUP: BULGU DEFTERİ */}
                {currentStepData.mockupType === 'findings-card' && (
                  <div className="flex flex-col gap-2.5 py-1">
                    <div className="flex items-center justify-between px-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Flag size={14} className="text-red-400" />
                        <span className="font-semibold text-white">Kayıtlı Kanıt Kartı</span>
                      </div>
                      <span className="text-[10px] font-mono text-red-400">Bulgu #01</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Açık Veritabanı Yedeği (.sql)</span>
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono font-bold">
                          YÜKSEK RİSK
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-white/70 truncate">
                        Kanıt: https://tesla.com/backup_2024_prod.sql
                      </div>
                      <p className="text-[11px] text-white/50 italic">
                        Not: "Kullanıcı şifre hashleri ve yetkilendirme tabloları tespit edildi."
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 text-[11px]">
                      <span className="text-white/40 font-mono">Tarih: 31.10.2026</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white font-medium">JSON Dışa Aktar</span>
                    </div>
                  </div>
                )}

                {/* ADIM 5 MOCKUP: YÖNETİCİ RAPORU ÖNİZLEMESİ */}
                {currentStepData.mockupType === 'report-preview' && (
                  <div className="flex flex-col gap-3 py-1">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/15 flex flex-col gap-3 shadow-xl">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                        <div>
                          <div className="text-[10px] uppercase font-mono text-white/40">Siber Güvenlik Değerlendirmesi</div>
                          <div className="text-sm font-bold text-white">YÖNETİCİ CTI RAPORU</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex flex-col items-center justify-center text-amber-300 font-mono font-bold">
                          <span className="text-xs">B+</span>
                          <span className="text-[8px] opacity-70">78/100</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                          <div className="text-base font-bold text-red-400 font-mono">1</div>
                          <div className="text-[9px] text-red-300 font-medium">Kritik</div>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <div className="text-base font-bold text-amber-400 font-mono">3</div>
                          <div className="text-[9px] text-amber-300 font-medium">Yüksek</div>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="text-base font-bold text-emerald-400 font-mono">14</div>
                          <div className="text-[9px] text-emerald-300 font-medium">Temiz Dork</div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md">
                        <FileText size={12} />
                        <span>A4 Formatında PDF Yazdır</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SEKME 2: KONU KILAVUZU & BİLGİ BANKASI (SSS)                   */}
      {/* ============================================================== */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          {/* Sol Sütun: Konu Başlıkları Listesi (4 Sütun) */}
          <div className="md:col-span-4 border-r border-white/[0.08] p-3 sm:p-4 flex flex-col gap-1.5 bg-white/[0.01]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-3 py-1 mb-1">
              Rehber Konuları
            </div>

            {TOPICS.map((topic) => {
              const TopicIcon = topic.icon;
              const isSelected = selectedTopicId === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white text-black font-semibold border-white shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.04] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TopicIcon size={14} className={isSelected ? 'text-black' : 'text-white/50'} />
                    <span className="truncate">{topic.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                      isSelected ? 'bg-black/10 text-black font-bold' : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {topic.tag}
                  </span>
                </button>
              );
            })}

            {/* Hızlı Kısayol Aksiyonları */}
            <div className="mt-auto pt-4 border-t border-white/[0.08] flex flex-col gap-1.5">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenSettings) onOpenSettings();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-white/60 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Key size={13} className="text-amber-400" />
                  <span>API Kasasını Aç</span>
                </div>
                <ArrowRight size={12} className="text-white/40" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenReconHub) onOpenReconHub();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-white/60 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-emerald-400" />
                  <span>Keşif Merkezini Aç</span>
                </div>
                <ArrowRight size={12} className="text-white/40" />
              </button>
            </div>
          </div>

          {/* Sağ Sütun: Seçili Konunun Detaylı İçeriği (8 Sütun) */}
          <div className="md:col-span-8 p-5 sm:p-6 flex flex-col gap-5 overflow-y-auto max-h-[580px]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                  {selectedTopicData.tag}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1.5">
                {selectedTopicData.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 mt-1 leading-relaxed">
                {selectedTopicData.content.intro}
              </p>
            </div>

            {selectedTopicData.content.sections.map((sec, idx) => (
              <div key={idx} className="flex flex-col gap-2.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/90 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  <span>{sec.heading}</span>
                </h4>

                {sec.text && (
                  <p className="text-xs text-white/70 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.05]">
                    {sec.text}
                  </p>
                )}

                {/* Maddeli Açıklamalar */}
                {sec.bullets && (
                  <div className="flex flex-col gap-2">
                    {sec.bullets.map((b, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-white/80 leading-relaxed"
                      >
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adım Adım Açıklamalar */}
                {sec.steps && (
                  <div className="flex flex-col gap-2">
                    {sec.steps.map((st, stIdx) => (
                      <div
                        key={stIdx}
                        className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-white/80 font-mono leading-relaxed"
                      >
                        {st}
                      </div>
                    ))}
                  </div>
                )}

                {/* Kod / Dork Operatör Tablosu */}
                {sec.items && (
                  <div className="flex flex-col gap-2">
                    {sec.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                      >
                        <code className="font-mono text-xs text-emerald-400 bg-black/50 px-2 py-1 rounded border border-white/5 shrink-0">
                          {item.code}
                        </code>
                        <span className="text-xs text-white/70 sm:text-right">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

