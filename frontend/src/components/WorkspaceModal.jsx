"use client";

import { useState } from 'react';
import {
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
import ModalShell from './ModalShell';

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
      if (isEditing) {
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Hedef Çalışma Alanları"
      subtitle="Kurum ASN, GitHub organizasyonu, IP bloğu ve domain hedeflerini yönetin"
      icon={Building2}
      maxWidth="max-w-3xl"
      badge={`${workspaces.length} Hedef`}
    >
      <div className="p-5 sm:p-6 space-y-5">
        {/* Hedef Ekleme / Düzenleme Formu */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white tracking-wide flex items-center gap-2">
              {isEditing ? <Edit2 size={13} className="text-white/70" /> : <Plus size={13} className="text-white/70" />}
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
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kurum Adı */}
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  Kurum / Hedef Adı
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Örn: Acme Corporation"
                  className="glass-input w-full font-sans text-xs"
                />
              </div>

              {/* Ana Domain */}
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  Ana Domain (Zorunlu)
                </label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="Örn: acme.com"
                  className="glass-input w-full font-mono text-xs"
                  required
                />
              </div>

              {/* Şirket Arama Terimi */}
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  Shodan Org / Şirket Terimi
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Örn: Acme Tech"
                  className="glass-input w-full text-xs"
                />
              </div>

              {/* GitHub Organizasyonu */}
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  GitHub Organizasyonu
                </label>
                <input
                  type="text"
                  value={form.githubOrg}
                  onChange={(e) => setForm({ ...form, githubOrg: e.target.value })}
                  placeholder="Örn: acme-corp"
                  className="glass-input w-full font-mono text-xs"
                />
              </div>

              {/* ASN Numarası */}
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  ASN Numarası
                </label>
                <input
                  type="text"
                  value={form.asn}
                  onChange={(e) => setForm({ ...form, asn: e.target.value })}
                  placeholder="Örn: AS12345"
                  className="glass-input w-full font-mono text-xs"
                />
              </div>

              {/* IP / CIDR Bloğu */}
              <div>
                <label className="block text-[11px] font-mono text-white/50 mb-1">
                  IP / CIDR Bloğu
                </label>
                <input
                  type="text"
                  value={form.ipRange}
                  onChange={(e) => setForm({ ...form, ipRange: e.target.value })}
                  placeholder="Örn: 185.120.0.0/24"
                  className="glass-input w-full font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="glass-btn-primary"
              >
                <Check size={13} />
                <span>{isEditing ? 'Değişiklikleri Kaydet' : 'Profili Oluştur'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Kayıtlı Hedefler Listesi */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-white/50 uppercase font-mono tracking-wider px-1">
            Kayıtlı Hedef Profilleri ({workspaces.length})
          </h4>

          {workspaces.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40">
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
                  className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-white/[0.08] border-white/30 shadow-sm'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-[240px]">
                    <div className={`p-2 rounded-xl mt-0.5 ${isActive ? 'bg-white text-black' : 'bg-white/5 text-white/60'}`}>
                      <Building2 size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold text-white">{ws.name || ws.domain}</h5>
                        {isActive && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-white text-black font-bold">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-white/50">
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
                        className="glass-btn-secondary !py-1 text-xs"
                      >
                        Seç
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(ws)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteWorkspace(ws.id)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Profili Sil"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ModalShell>
  );
}
