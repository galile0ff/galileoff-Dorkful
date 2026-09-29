"use client";

import { Search, Copy, Zap } from 'lucide-react';

// Tekil dork kartı bileşeni
export default function DorkCard({ dork, index, onCopy, onSearch }) {
  return (
    <div
      className="dork-card"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <span className="dork-category">{dork.category}</span>
          <p className="dork-description">{dork.description}</p>
        </div>
        <button
          onClick={() => onCopy(dork.query)}
          className="p-2 text-white/20 hover:text-white transition-colors shrink-0"
          title="Kopyala"
        >
          <Copy size={14} />
        </button>
      </div>

      <div className="dork-query-box">
        <code className="dork-query-code">{dork.query}</code>
      </div>

      <div className="dork-actions">
        <button
          onClick={() => onSearch(dork.query)}
          className="dork-action-btn"
        >
          <Search size={12} /> Tarayıcıda Aç
        </button>
        <Zap size={10} className="text-white/10 group-hover:text-white/30 transition-all" />
      </div>
    </div>
  );
}
