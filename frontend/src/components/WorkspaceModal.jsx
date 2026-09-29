"use client";

import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Globe,
  Plus,
  Trash2,
  Edit2,
  Check,
  Shield,
  Layers,
  Network,
  GitBranch
} from 'lucide-react';

export default function WorkspaceModal({
  isOpen,
  onClose,
  workspaces = [],
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    company: '',
    asn: '',
    ipRange: '',
    githubOrg: ''
  });
  const [error, setError] = useState('');

  const resetForm = () => {
    setForm({
      name: '',
      domain: '',
      company: '',
      asn: '',
      ipRange: '',
      githubOrg: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setError('');
  };

  const startEdit = (ws) => {
    setForm({
      name: ws.name || '',
      domain: ws.domain || '',
      company: ws.company || '',
      asn: ws.asn || '',
      ipRange: ws.ipRange || '',
      githubOrg: ws.githubOrg || ''
    });
    setEditingId(ws.id);
    setIsEditing(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.domain.trim() && !form.name.trim()) {
      setError('Lütfen en azından bir hedef adı veya domain girin.');
      return;
    }

    try {
      if (editingId) {
        await onUpdateWorkspace(
          editingId,
          form.name.trim(),
          form.domain.trim(),
          form.company.trim(),
          form.asn.trim(),
          form.ipRange.trim(),
          form.githubOrg.trim()
        );
      } else {
        await onCreateWorkspace(
          form.name.trim(),
          form.domain.trim(),
          form.company.trim(),
          form.asn.trim(),
          form.ipRange.trim(),
          form.githubOrg.trim()
        );
      }
      resetForm();
    } catch (err) {
      setError(String(err));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] bg-[#0b0b0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-2xl text-white shadow-black/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık Alanı */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/80 shadow-inner">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight silver-glow">
                  Hedef Çalışma Alanları (Workspaces)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80 text-[11px] font-mono">
                  {workspaces.length} Hedef
                </span>
              </div>
              <p className="text-xs text-white/50">
                Hedef kurumun ASN, GitHub organizasyonu, IP bloğu ve domain profillerini yönetin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Hedef Ekleme / Düzenleme Formu */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-2">
                {isEditing ? <Edit2 size={13} className="text-white" /> : <Plus size={13} className="text-white" />}
                <span>{isEditing ? 'Hedef Profilini Güncelle' : 'Yeni Hedef Profili Oluştur'}</span>
              </h4>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  İptal Et
                </button>
              )}
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kurum Adı */}
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1 flex items-center gap-1">
                    <Building2 size={11} />
                    <span>Kurum / Hedef Adı</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Örn: Acme Corporation"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 font-sans"
                  />
                </div>

                {/* Ana Domain */}
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1 flex items-center gap-1">
                    <Globe size={11} />
                    <span>Ana Domain (Zorunlu)</span>
                  </label>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    placeholder="Örn: acme.com"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 font-mono"
                    required
                  />
                </div>

                {/* Şirket Arama Terimi (Shodan org:) */}
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1 flex items-center gap-1">
                    <Shield size={11} />
                    <span>Shodan Org / Şirket Terimi</span>
                  </label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Örn: Acme Tech"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 font-sans"
                  />
                </div>

                {/* GitHub Organizasyonu */}
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1 flex items-center gap-1">
                    <GitBranch size={11} />
                    <span>GitHub Organizasyon Adı</span>
                  </label>
                  <input
                    type="text"
                    value={form.githubOrg}
                    onChange={(e) => setForm({ ...form, githubOrg: e.target.value })}
                    placeholder="Örn: acme-corp"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>

                {/* ASN Numarası */}
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1 flex items-center gap-1">
                    <Layers size={11} />
                    <span>ASN Numarası</span>
                  </label>
                  <input
                    type="text"
                    value={form.asn}
                    onChange={(e) => setForm({ ...form, asn: e.target.value })}
                    placeholder="Örn: AS12345"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>

                {/* IP / CIDR Bloğu */}
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1 flex items-center gap-1">
                    <Network size={11} />
                    <span>IP / CIDR Bloğu</span>
                  </label>
                  <input
                    type="text"
                    value={form.ipRange}
                    onChange={(e) => setForm({ ...form, ipRange: e.target.value })}
                    placeholder="Örn: 185.120.0.0/24"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-neutral-200 shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check size={13} />
                  <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Profili Oluştur'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Kayıtlı Hedefler Listesi */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 px-1">
              Kayıtlı Hedef Profilleri ({workspaces.length})
            </h4>

            {workspaces.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-white/40">
                <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Henüz kayıtlı hedef çalışma alanı bulunmuyor.</p>
                <p className="text-[11px] text-white/30 mt-0.5">Yukarıdaki formdan ilk hedef profilinizi oluşturabilirsiniz.</p>
              </div>
            ) : (
              workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <div
                    key={ws.id}
                    className={`p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-white/10 border-white/30 ring-1 ring-white/20'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-[240px]">
                      <div className={`p-2 rounded-lg mt-0.5 ${isActive ? 'bg-white text-black' : 'bg-white/5 text-white/60'}`}>
                        <Building2 size={16} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-semibold text-white">{ws.name || ws.domain}</h5>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white text-black font-bold">
                              Aktif Hedef
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-white/50">
                          <span className="text-white/80">{ws.domain}</span>
                          {ws.asn && <span>• {ws.asn}</span>}
                          {ws.githubOrg && <span>• gh:{ws.githubOrg}</span>}
                          {ws.ipRange && <span>• {ws.ipRange}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSelectWorkspace(ws.id);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer"
                        >
                          Seç ve Çalıştır
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(ws)}
                        className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteWorkspace(ws.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Profili Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
