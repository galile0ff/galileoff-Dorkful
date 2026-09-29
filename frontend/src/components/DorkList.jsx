"use client";

import { MousePointer2 } from 'lucide-react';
import DorkCard from './DorkCard';

// Dork sonuç listesi ve boş durum (empty state) bileşeni
export default function DorkList({
  totalDorksCount,
  filteredDorks,
  target,
  findings = [],
  onCopy,
  onSearch,
  onProbeURL,
  onFlag
}) {
  return (
    <div className={`max-w-3xl mx-auto px-6 flex flex-col gap-5 items-center w-full ${totalDorksCount > 0 ? 'pb-24' : 'pb-2'}`}>
      {totalDorksCount === 0 ? (
        <div className="flex flex-col items-center justify-center opacity-30 mt-4 select-none">
          <MousePointer2 size={32} strokeWidth={1} className="mb-2 text-white/60 animate-bounce" />
          <p className="text-[10px] tracking-[0.4em] uppercase font-mono text-white/60">Operasyon Bekliyor</p>
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
    </div>
  );
}
