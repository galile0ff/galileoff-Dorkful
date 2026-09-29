"use client";

import { useState, useEffect } from 'react';
import { X, ShieldAlert, Flag, Link as LinkIcon, FileText, CheckCircle2, Shield } from 'lucide-react';

// Risk seviyeleri tanımları
const SEVERITIES = [
  { id: 'Critical', label: 'Kritik', color: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30', dot: 'bg-red-500', desc: 'RCE, .env, DB Dökümü, API Anahtarları' },
  { id: 'High', label: 'Yüksek', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30', dot: 'bg-orange-500', desc: 'Admin Panelleri, Yetkisiz Erişim' },
  { id: 'Medium', label: 'Orta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30', dot: 'bg-amber-500', desc: 'Dizin Listeleme, Konfigürasyon Dosyaları' },
  { id: 'Low', label: 'Düşük', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30', dot: 'bg-blue-500', desc: 'Bilgi İfşası, Sürüm Bilgileri' },
];

export default function FlagFindingModal({
  isOpen,
  onClose,
  dork,
  target,
  onSaveFinding
}) {
  const [severity, setSeverity] = useState('High');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [mitreTechniqueId, setMitreTechniqueId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal açıldığında varsayılan değerleri hazırla
  useEffect(() => {
    if (isOpen && dork) {
      setSeverity('High');
      setNotes('');
      setMitreTechniqueId(dork.mitre ? dork.mitre.techniqueId : 'T1593.002');

      // Dork içindeki inurl: değerini tespit edip olası kanıt linki öner
      let suggestedURL = target || '';
      if (suggestedURL && !suggestedURL.startsWith('http')) {
        suggestedURL = `https://${suggestedURL}`;
      }

      const inurlMatch = dork.query ? dork.query.match(/inurl:([^\s|)]+)/i) : null;
      if (inurlMatch && inurlMatch[1]) {
        let path = inurlMatch[1].replace(/["']/g, '');
        if (!path.startsWith('/')) path = '/' + path;
        suggestedURL = `${suggestedURL}${path}`;
      }

      setEvidenceUrl(suggestedURL);
    }
  }, [isOpen, dork, target]);

  if (!isOpen || !dork) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSaveFinding({
        target: target || 'Bilinmeyen Hedef',
        dorkQuery: dork.query,
        category: dork.category || 'Genel',
        severity,
        evidenceUrl: evidenceUrl.trim(),
        notes: notes.trim(),
        mitreTechniqueId: mitreTechniqueId || (dork.mitre ? dork.mitre.techniqueId : "T1593.002"),
      });
      onClose();
    } catch (err) {
      console.error("Bulgu kaydedilemedi:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-2xl p-6 shadow-2xl text-white shadow-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık Alanı */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
              <Flag size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight silver-glow">
                Bulgu Olarak İşaretle
              </h3>
              <p className="text-xs text-white/50">Tespit edilen güvenlik kanıtını CTI defterine kaydet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* İlgili Dork ve Hedef Bilgisi */}
        <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span className="font-mono">Hedef: <strong className="text-white/80">{target}</strong></span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] font-mono text-white/60">{dork.category}</span>
              {dork.mitre && (
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-mono border border-red-500/20">
                  {dork.mitre.techniqueId}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs font-mono text-white/70 truncate bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
            {dork.query}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* MITRE ATT&CK Çerçeve Eşlemesi */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-red-400" />
                <span>MITRE ATT&CK Tekniği</span>
              </div>
              <span className="text-[10px] font-mono text-white/40">Taktik Sınıflandırma</span>
            </label>
            <select
              value={mitreTechniqueId}
              onChange={(e) => setMitreTechniqueId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 font-mono"
            >
              <option value="T1593.002" className="bg-neutral-900 text-white">T1593.002 - Search Engines (Reconnaissance)</option>
              <option value="T1552.001" className="bg-neutral-900 text-white">T1552.001 - Credentials In Files (Credential Access)</option>
              <option value="T1190" className="bg-neutral-900 text-white">T1190 - Exploit Public-Facing App (Initial Access)</option>
              <option value="T1594" className="bg-neutral-900 text-white">T1594 - Search Victim-Owned Websites (Reconnaissance)</option>
              <option value="T1596" className="bg-neutral-900 text-white">T1596 - Search Open Technical Databases (Reconnaissance)</option>
              <option value="T1592.002" className="bg-neutral-900 text-white">T1592.002 - Host Information: Software (Reconnaissance)</option>
            </select>
          </div>

          {/* Risk Seviyesi Seçimi */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-2">
              Risk Seviyesi (Severity)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITIES.map((s) => {
                const isSelected = severity === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected
                        ? `${s.color} border-current ring-1 ring-white/20`
                        : 'bg-white/[0.02] border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span>{s.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kanıt URL Adresi */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 flex items-center gap-1.5">
              <LinkIcon size={12} className="text-white/40" />
              <span>Tespit Edilen URL / Kanıt Bağlantısı</span>
            </label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://target.com/.env veya admin login linki..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 font-mono"
            />
          </div>

          {/* CTI / Red Team Notları */}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5 flex items-center gap-1.5">
              <FileText size={12} className="text-white/40" />
              <span>Analiz & Kanıt Notu</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Örn: Açık dizin listelemesinde AWS_SECRET_KEY ve veritabanı şifreleri bulundu..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 resize-none"
            />
          </div>

          {/* Alt Butonlar */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-neutral-200 shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 size={14} />
              <span>{isSubmitting ? 'Kaydediliyor...' : 'Bulguyu Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
