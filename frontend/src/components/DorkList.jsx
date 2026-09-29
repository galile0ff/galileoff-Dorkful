"use client";

import { MousePointer2, Download } from 'lucide-react';
import DorkCard from './DorkCard';

// Dork sonuç listesi ve boş durum (empty state) bileşeni
export default function DorkList({
  totalDorksCount,
  filteredDorks,
  target,
  findings = [],
  onCopy,
  onSearch,
  onExport,
  onProbeURL,
  onFlag
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 pb-32 flex flex-col gap-5 items-center">
      {totalDorksCount === 0 ? (
        <div className="empty-state">
          <MousePointer2 size={56} strokeWidth={1} className="mb-4 animate-bounce" />
          <p className="empty-state-text">Operasyon Bekliyor</p>
        </div>
      ) : filteredDorks.length === 0 ? (
        <p className="text-xs text-white/30 font-mono italic mt-16">
          Bu filtrede eşleşme yok.
        </p>
      ) : (
        filteredDorks.map((dork, i) => {
          const isFlagged = findings.some((f) => f.dorkQuery === dork.query);
          return (
            <DorkCard
              key={`${dork.query}-${i}`}
              dork={dork}
              index={i}
              target={target}
              isFlagged={isFlagged}
              onCopy={onCopy}
              onSearch={onSearch}
              onProbeURL={onProbeURL}
              onFlag={onFlag}
            />
          );
        })
      )}

      {totalDorksCount > 0 && (
        <button onClick={onExport} className="btn-export">
          <Download size={14} /> Dışa Aktar
        </button>
      )}
    </div>
  );
}
