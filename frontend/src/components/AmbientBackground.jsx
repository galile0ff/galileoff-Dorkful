"use client";

import React from 'react';

// Dinamik hareket eden ambient ışık haleleri ve siber nokta matrisi
// Glassmorphism (buzlu cam) bileşenlerinin arkasındaki ışığı kırarak derinliği belirginleştirir
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Siber İnce Nokta Matrisi (Cam arkasında buzlanma dokusu oluşturan ızgara) */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:28px_28px] opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]" 
      />

      {/* 2. Hale 1: Sol Üst - Neon Zümrüt & Turkuaz Hale (Siber Pentest Yeşili) */}
      <div
        className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full animate-halo-1"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.24) 0%, rgba(6, 182, 212, 0.16) 45%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(95px)',
        }}
      />

      {/* 3. Hale 2: Sağ Alt / Orta - Elektrik İndigo & Derin Mor Hale (Linear / Raycast Teması) */}
      <div
        className="absolute -bottom-40 -right-32 w-[750px] h-[750px] rounded-full animate-halo-2"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.26) 0%, rgba(139, 92, 246, 0.18) 45%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* 4. Hale 3: Sağ Üst - Safir & Derin Gökyüzü Mavisi Hale */}
      <div
        className="absolute -top-20 right-10 w-[550px] h-[550px] rounded-full animate-halo-3"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(14, 165, 233, 0.14) 50%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(85px)',
        }}
      />

      {/* 5. Hale 4: Merkez Arama Çubuğu Arkası Nefes Alan Mor/Mavi Akkor Hale */}
      <div
        className="absolute top-1/3 left-1/2 w-[750px] h-[480px] rounded-full animate-halo-center"
        style={{
          background: 'radial-gradient(ellipse, rgba(147, 51, 234, 0.18) 0%, rgba(59, 130, 246, 0.12) 45%, rgba(0, 0, 0, 0) 75%)',
          filter: 'blur(85px)',
        }}
      />

      {/* 6. Kenar Karartma Vignette (Ekran kenarlarının ve metinlerin tertemiz okunabilir kalması için) */}
      <div
        className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_65%,rgba(0,0,0,0.85)_100%)]"
      />
    </div>
  );
}
