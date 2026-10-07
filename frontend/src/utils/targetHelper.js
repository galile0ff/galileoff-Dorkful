/**
 * Hedef alan adını temizleyen ve otomatik '.com' uzantısı ekleyen yardımcı fonksiyon.
 * Örneğin:
 * - 'google' -> 'google.com'
 * - 'https://target.org/path' -> 'target.org'
 * - 'sub.domain.co.uk' -> 'sub.domain.co.uk'
 */
export function formatTargetDomain(input) {
  if (!input) return "";

  let cleaned = String(input).trim();

  // Protokolleri kaldır (http://, https://)
  cleaned = cleaned.replace(/^https?:\/\//i, '');

  // URL'deki yol (path), sorgu parametreleri ve etiketleri temizle
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('#')[0];

  // Port numarası varsa ayıkla (örn: domain.com:8080 -> domain.com)
  cleaned = cleaned.replace(/:\d+$/, '');

  // Baştaki ve sondaki gereksiz karakterleri temizle
  cleaned = cleaned.trim();

  if (!cleaned) return "";

  // Eğer nokta içermiyorsa ve 'localhost' değilse, otomatik olarak '.com' ekle
  if (!cleaned.includes('.') && cleaned.toLowerCase() !== 'localhost') {
    cleaned = `${cleaned}.com`;
  }

  return cleaned.toLowerCase();
}
