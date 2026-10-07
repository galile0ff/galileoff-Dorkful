"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Raycast / Linear / Vercel esintili ortak Cam (Glassmorphism) Modal Kabuğu
 * Tüm modallarda tam görsel ve etkileşim tutarlılığı sağlar.
 */
export default function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  headerActions,
  footer,
  maxWidth = "max-w-4xl",
  className = "",
  children
}) {
  // ESC tuşuyla kapatma desteği
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-2xl sm:rounded-3xl overflow-hidden transition-all text-white ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Üst Başlık Çubuğu */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/80 shrink-0 shadow-inner">
                <Icon size={16} />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold tracking-tight text-white truncate">
                  {title}
                </h3>
                {badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-white/[0.08] text-white/80 border border-white/10 shrink-0">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] text-white/45 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer border border-transparent hover:border-white/10"
              title="Kapat (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal İçerik Gövdesi */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col min-h-0">
          {children}
        </div>

        {/* Modal İsteğe Bağlı Alt Çubuk (Footer) */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
