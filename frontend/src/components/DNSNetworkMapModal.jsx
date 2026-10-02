"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Network,
  Share2,
  Server,
  Globe,
  Mail,
  Shield,
  FileText,
  Copy,
  Check,
  Flag,
  RefreshCw,
  Search,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  List,
  Sparkles,
  ArrowRight,
  Terminal,
  Cpu
} from 'lucide-react';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

export default function DNSNetworkMapModal({
  isOpen,
  onClose,
  target = '',
  result = null,
  isLoading = false,
  onRefresh,
  onSelectNewTarget,
  onFlagAsFinding
}) {
  const [activeView, setActiveView] = useState('graph'); // 'graph' | 'table'
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const nodePositionsRef = useRef(new Map());
  const draggedNodeIdRef = useRef(null);

  const nodes = result?.nodes || [];
  const edges = result?.edges || [];
  const records = result?.records || [];
  const coHostedDomains = result?.coHostedDomains || [];
  const error = result?.error || null;

  // Arama filtreleme (Tablo modu için)
  const filteredRecords = useMemo(() => {
    const list = records || [];
    if (!searchTerm || !searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter((r) => {
      if (!r) return false;
      const typeStr = String(r.type || r.Type || '').toLowerCase();
      const valStr = String(r.value || r.Value || '').toLowerCase();
      return typeStr.includes(term) || valStr.includes(term);
    });
  }, [records, searchTerm]);

  const filteredCoHosts = useMemo(() => {
    const list = coHostedDomains || [];
    if (!searchTerm || !searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter((c) => {
      if (!c) return false;
      const domStr = String(c.domain || c.Domain || '').toLowerCase();
      const ipStr = String(c.resolvedIp || c.ResolvedIP || '').toLowerCase();
      return domStr.includes(term) || ipStr.includes(term);
    });
  }, [coHostedDomains, searchTerm]);

  // Düğüm tiplerine göre tema renkleri (Monochrome Dark & Silver odaklı)
  const getNodeColor = (type) => {
    switch (type) {
      case 'target':
        return { fill: '#ffffff', stroke: '#e4e4e7', text: '#ffffff', glow: 'rgba(255, 255, 255, 0.4)' };
      case 'a':
      case 'aaaa':
      case 'ip':
        return { fill: '#06b6d4', stroke: '#22d3ee', text: '#67e8f9', glow: 'rgba(6, 182, 212, 0.35)' }; // Cyan / Sunucu IP
      case 'ns':
        return { fill: '#8b5cf6', stroke: '#a78bfa', text: '#c4b5fd', glow: 'rgba(139, 92, 246, 0.35)' }; // Mor / NS
      case 'mx':
        return { fill: '#3b82f6', stroke: '#60a5fa', text: '#93c5fd', glow: 'rgba(59, 130, 246, 0.35)' }; // Mavi / Mail
      case 'txt':
        return { fill: '#10b981', stroke: '#34d399', text: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.35)' }; // Zümrüt / TXT
      case 'cohost':
        return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fde68a', glow: 'rgba(245, 158, 11, 0.35)' }; // Amber / Komşu Site
      default:
        return { fill: '#a1a1aa', stroke: '#d4d4d8', text: '#e4e4e7', glow: 'rgba(161, 161, 170, 0.25)' };
    }
  };

  // Topoloji yerleşimini hesaplama (Fizik tabanlı ilk konumlandırma)
  useEffect(() => {
    if (!isOpen || (nodes || []).length === 0) return;

    const positions = new Map();
    const centerX = 0;
    const centerY = 0;

    // Merkez hedef düğümü
    positions.set('node-target', { x: centerX, y: centerY, vx: 0, vy: 0 });

    // Düğümleri türlerine göre halkalara ayır
    const safeNodes = nodes || [];
    const ipNodes = safeNodes.filter((n) => {
      const t = (n.type || n.Type || '').toLowerCase();
      return t === 'a' || t === 'aaaa' || t === 'ip';
    });
    const dnsNodes = safeNodes.filter((n) => {
      const t = (n.type || n.Type || '').toLowerCase();
      return t === 'ns' || t === 'mx' || t === 'txt' || t === 'cname';
    });
    const cohostNodes = safeNodes.filter((n) => {
      const t = (n.type || n.Type || '').toLowerCase();
      return t === 'cohost';
    });

    // 1. Halka: DNS Düğümleri (NS, MX, TXT)
    const dnsRadius = 180;
    dnsNodes.forEach((node, idx) => {
      const nodeId = node.id || node.ID;
      const angle = (idx / Math.max(dnsNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positions.set(nodeId, {
        x: centerX + Math.cos(angle) * dnsRadius,
        y: centerY + Math.sin(angle) * dnsRadius,
        vx: 0,
        vy: 0
      });
    });

    // 2. Halka: IP / Sunucu Düğümleri
    const ipRadius = 280;
    ipNodes.forEach((node, idx) => {
      const nodeId = node.id || node.ID;
      const angle = (idx / Math.max(ipNodes.length, 1)) * Math.PI * 2 + Math.PI / 4;
      positions.set(nodeId, {
        x: centerX + Math.cos(angle) * ipRadius,
        y: centerY + Math.sin(angle) * ipRadius,
        vx: 0,
        vy: 0
      });
    });

    // 3. Halka: Komşu Siteler (Co-hosted domains)
    const cohostRadius = 400;
    cohostNodes.forEach((node, idx) => {
      const nodeId = node.id || node.ID;
      const angle = (idx / Math.max(cohostNodes.length, 1)) * Math.PI * 2;
      // İlgili IP'nin etrafında hafif bir dağılım
      const jitter = (idx % 2 === 0 ? 1 : -1) * (idx * 5);
      positions.set(nodeId, {
        x: centerX + Math.cos(angle) * (cohostRadius + (idx % 3) * 35),
        y: centerY + Math.sin(angle) * (cohostRadius + (idx % 3) * 35) + jitter,
        vx: 0,
        vy: 0
      });
    });

    nodePositionsRef.current = positions;
  }, [isOpen, nodes]);

  // Canvas Çizim Döngüsü (Pürüzsüz animasyon & partiküller)
  useEffect(() => {
    if (!isOpen || activeView !== 'graph') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particleOffset = 0;

    const render = () => {
      particleOffset = (particleOffset + 0.005) % 1;

      // Çözünürlük ayarlama
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Pan & Zoom merkezleme
      ctx.translate(canvas.width / 2 + panOffset.x, canvas.height / 2 + panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      const positions = nodePositionsRef.current;

      // 1. Siber Izgara Arka Planı (Kibar noktalar)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const gridSize = 40;
      const startX = -1200;
      const endX = 1200;
      const startY = -1200;
      const endY = 1200;
      for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
          ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
      }

      // 2. Bağlantı Çizgileri (Edges)
      (edges || []).forEach((edge) => {
        const sourceId = edge.source || edge.Source;
        const targetId = edge.target || edge.Target;
        const p1 = positions.get(sourceId);
        const p2 = positions.get(targetId);
        if (!p1 || !p2) return;

        const edgeType = edge.type || edge.Type || '';

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (edgeType === 'cohost_link') {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)'; // Amber komşu çizgisi
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Çizgi üzerinde süzülen hafif veri partikülü
        const px = p1.x + (p2.x - p1.x) * particleOffset;
        const py = p1.y + (p2.y - p1.y) * particleOffset;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = edgeType === 'cohost_link' ? '#f59e0b' : '#38bdf8';
        ctx.fill();
      });

      // 3. Düğümler (Nodes)
      (nodes || []).forEach((node) => {
        const nodeId = node.id || node.ID;
        const nodeType = (node.type || node.Type || '').toLowerCase();
        const pos = positions.get(nodeId);
        if (!pos) return;

        const isTarget = nodeType === 'target';
        const isSelected = selectedNode && ((selectedNode.id || selectedNode.ID) === nodeId);
        const color = getNodeColor(nodeType);
        const radius = isTarget ? 24 : nodeType === 'ip' ? 16 : nodeType === 'cohost' ? 11 : 12;

        // Düğüm Hale / Glow Efekti
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + (isTarget ? 10 : 6), 0, Math.PI * 2);
        ctx.fillStyle = color.glow;
        ctx.fill();

        // Düğüm Çemberi
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ffffff' : '#0e0e12';
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : isTarget ? 2.5 : 1.5;
        ctx.strokeStyle = isSelected ? '#38bdf8' : color.stroke;
        ctx.stroke();

        // Düğüm Metni (Label)
        const labelText = String(node.label || node.Label || '');
        ctx.font = isTarget ? 'bold 12px monospace' : '10px monospace';
        ctx.fillStyle = isSelected ? '#000000' : isTarget ? '#ffffff' : color.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isTarget) {
          ctx.fillText('TARGET', pos.x, pos.y);
          // Altına alan adını yaz
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, pos.x, pos.y + radius + 14);
        } else {
          // Kısaltılmış metin
          let displayLabel = labelText;
          if (displayLabel.length > 20) {
            displayLabel = displayLabel.slice(0, 18) + '...';
          }
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#d4d4d8';
          ctx.fillText(displayLabel, pos.x, pos.y + radius + 12);
        }
      });

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, activeView, nodes, edges, panOffset, zoomLevel, selectedNode]);

  // Fare Etkileşimleri (Drag & Pan & Select)
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Canvas koordinat sistemine dönüştür
    const worldX = (mouseX - (canvas.width / 2 + panOffset.x)) / zoomLevel;
    const worldY = (mouseY - (canvas.height / 2 + panOffset.y)) / zoomLevel;

    // Bir düğüme tıklandı mı kontrol et
    let clickedNode = null;
    nodePositionsRef.current.forEach((pos, id) => {
      const dx = worldX - pos.x;
      const dy = worldY - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 25) {
        clickedNode = (nodes || []).find((n) => (n.id || n.ID) === id);
      }
    });

    if (clickedNode) {
      draggedNodeIdRef.current = clickedNode.id || clickedNode.ID;
      setSelectedNode(clickedNode);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (draggedNodeIdRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - (canvas.width / 2 + panOffset.x)) / zoomLevel;
      const worldY = (mouseY - (canvas.height / 2 + panOffset.y)) / zoomLevel;

      const pos = nodePositionsRef.current.get(draggedNodeIdRef.current);
      if (pos) {
        pos.x = worldX;
        pos.y = worldY;
      }
    } else if (isDraggingCanvas) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    draggedNodeIdRef.current = null;
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenURL = (url) => {
    if (!url) return;
    const fullURL = url.startsWith('http') ? url : `https://${url}`;
    if (BrowserOpenURL) {
      BrowserOpenURL(fullURL);
    } else {
      window.open(fullURL, '_blank');
    }
  };

  // Erken dönüş (React Hook kuralları gereği tüm hooklardan sonra)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div
        className="relative w-full max-w-6xl h-[90vh] bg-[#0b0b0e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col shadow-2xl text-white shadow-black/95 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık Alanı */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
              <Network size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  DNS & Reverse IP Komşu Siteler Haritası
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 font-mono">
                  Network Constellation
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Hedef <span className="font-mono text-white/80 font-semibold">{target}</span> için DNS kayıtları ve aynı IP sunucusundaki komşu siteler inceleniyor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Görünüm Geçiş Düğmeleri (Graf / Tablo) */}
            <div className="flex items-center p-1 bg-white/[0.04] border border-white/10 rounded-xl mr-2">
              <button
                onClick={() => setActiveView('graph')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'graph' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white'
                }`}
                title="İnteraktif Topoloji Haritası"
              >
                <Share2 size={13} />
                <span>Ağ Haritası</span>
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'table' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40 hover:text-white'
                }`}
                title="Detaylı Liste / Tablo"
              >
                <List size={13} />
                <span>Matris Tablo</span>
              </button>
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40"
                title="Haritayı Yeniden Çözümle"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* İstatistik & Bilgi Çubuğu */}
        <div className="px-6 py-2.5 border-b border-white/10 bg-white/[0.01] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-4 text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                IP Adresleri: {(records || []).filter((r) => {
                  const t = String(r?.type || r?.Type || '').toUpperCase();
                  return t === 'A' || t === 'AAAA';
                }).length}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>
                NS: {(records || []).filter((r) => String(r?.type || r?.Type || '').toUpperCase() === 'NS').length}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>
                MX: {(records || []).filter((r) => String(r?.type || r?.Type || '').toUpperCase() === 'MX').length}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Aynı IP'deki Komşular: {(coHostedDomains || []).length}</span>
            </span>
          </div>

          {activeView === 'table' && (
            <div className="relative min-w-[200px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Domain, IP veya kayıt ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}
        </div>

        {/* Ana İçerik Bölgesi */}
        <div className="flex-1 relative overflow-hidden flex">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                  <Network size={28} className="text-cyan-400" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm font-medium text-white/80">DNS Kayıtları Çözümleniyor & Reverse IP Taranıyor...</p>
              <p className="text-xs text-white/40 mt-1 max-w-sm font-mono">
                {target} adresinin sunucu IP'leri ve paylaşımlı komşu siteleri topolojiye işleniyor.
              </p>
            </div>
          ) : error ? (
            <div className="p-6 w-full flex items-center justify-center">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {error}
              </div>
            </div>
          ) : activeView === 'graph' ? (
            /* 1. GRAFİK AĞ HARİTASI */
            <div className="relative w-full h-full flex overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                className="w-full h-full cursor-grab active:cursor-grabbing block"
              />

              {/* Sol Alt: Zoom & Pan Kontrolleri */}
              <div className="absolute left-6 bottom-6 flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-20">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z * 1.2, 2.5))}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Yakınlaştır"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z * 0.8, 0.4))}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Uzaklaştır"
                >
                  <ZoomOut size={14} />
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <button
                  onClick={resetView}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Merkeze Sıfırla"
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              {/* Sağ Taraf: Varlık Detay Çekmecesi (Node Inspector) */}
              {selectedNode && (() => {
                const nodeCat = selectedNode.category || selectedNode.Category || 'Düğüm';
                const nodeLbl = String(selectedNode.label || selectedNode.Label || '');
                const nodeDet = selectedNode.details || selectedNode.Details || '';
                const nodeTyp = (selectedNode.type || selectedNode.Type || '').toLowerCase();

                return (
                  <div className="absolute right-6 top-6 bottom-6 w-80 bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 flex flex-col shadow-2xl z-30 animate-fadeIn text-xs font-mono">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                        Düğüm Detayı
                      </span>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/10"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="py-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                      <div>
                        <span className="text-[10px] text-white/40 uppercase">Tür:</span>
                        <div className="text-white font-semibold flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>{nodeCat}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-white/40 uppercase">Değer / Adres:</span>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono break-all mt-1 select-all">
                          {nodeLbl}
                        </div>
                      </div>

                      {nodeDet && (
                        <div>
                          <span className="text-[10px] text-white/40 uppercase">Açıklama:</span>
                          <p className="text-white/70 text-[11px] mt-0.5">{nodeDet}</p>
                        </div>
                      )}
                    </div>

                    {/* Alt Aksiyon Butonları */}
                    <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                      <button
                        onClick={() => handleCopy(nodeLbl)}
                        className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedText === nodeLbl ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span>Kopyalandı</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Değeri Kopyala</span>
                          </>
                        )}
                      </button>

                      {nodeTyp === 'cohost' && onSelectNewTarget && (
                        <button
                          onClick={() => {
                            onSelectNewTarget(nodeLbl);
                            onClose();
                          }}
                          className="w-full py-1.5 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-amber-400/20"
                        >
                          <ArrowRight size={12} />
                          <span>Bu Hedefe Geç</span>
                        </button>
                      )}

                      {(nodeTyp === 'cohost' || nodeTyp === 'target') && (
                        <button
                          onClick={() => handleOpenURL(nodeLbl)}
                          className="w-full py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          <span>Tarayıcıda Aç</span>
                        </button>
                      )}

                      {onFlagAsFinding && (
                        <button
                          onClick={() => {
                            onFlagAsFinding({
                              category: 'Altyapı & DNS İstihbaratı',
                              description: `${nodeCat}: ${nodeLbl}`,
                              query: nodeLbl,
                              evidenceUrl: `https://${target}`,
                              severity: nodeTyp === 'cohost' ? 'Medium' : 'Low',
                              notes: `Topoloji Düğümü: ${nodeCat}\nDeğer: ${nodeLbl}\nDetay: ${nodeDet}`
                            });
                          }}
                          className="w-full py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Flag size={12} className="text-red-400" />
                          <span>Bulgu Olarak Kaydet</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* 2. MATRİS TABLO GÖRÜNÜMÜ */
            <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar space-y-6">
              {/* DNS Kayıtları Tablosu */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-white/50 px-1">
                  <span className="flex items-center gap-1.5 text-white/80 font-semibold">
                    <Globe size={13} className="text-cyan-400" />
                    Çözümlenen DNS Kayıtları ({filteredRecords.length})
                  </span>
                </div>

                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-white/[0.03] border-b border-white/10 text-white/50">
                      <tr>
                        <th className="px-4 py-2.5 w-24">Tür</th>
                        <th className="px-4 py-2.5">Kayıt Değeri / Adres</th>
                        <th className="px-4 py-2.5 w-28 text-right">Eylem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(filteredRecords || []).map((rec, idx) => {
                        const recType = rec?.type || rec?.Type || '';
                        const recVal = rec?.value || rec?.Value || '';
                        return (
                          <tr key={`rec-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5 font-bold text-cyan-400">{recType}</td>
                            <td className="px-4 py-2.5 text-white/80 break-all select-all">{recVal}</td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                onClick={() => handleCopy(recVal)}
                                className="p-1 text-white/40 hover:text-white rounded hover:bg-white/10"
                                title="Kopyala"
                              >
                                <Copy size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Komşu Siteler Tablosu (Reverse IP) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-white/50 px-1">
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <Server size={13} />
                    Aynı Sunucuyu Paylaşan Komşu Siteler ({(filteredCoHosts || []).length})
                  </span>
                </div>

                <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-white/[0.03] border-b border-white/10 text-white/50">
                      <tr>
                        <th className="px-4 py-2.5">Komşu Alan Adı</th>
                        <th className="px-4 py-2.5 w-44">Paylaşılan IP</th>
                        <th className="px-4 py-2.5 w-40 text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(filteredCoHosts || []).map((cohost, idx) => {
                        const dom = cohost?.domain || cohost?.Domain || '';
                        const ip = cohost?.resolvedIp || cohost?.ResolvedIP || '';
                        return (
                          <tr key={`cohost-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5 text-white font-medium break-all select-all">
                              {dom}
                            </td>
                            <td className="px-4 py-2.5 text-white/50">{ip}</td>
                            <td className="px-4 py-2.5 text-right space-x-1">
                              <button
                                onClick={() => handleCopy(dom)}
                                className="p-1 text-white/40 hover:text-white rounded hover:bg-white/10"
                                title="Kopyala"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                onClick={() => handleOpenURL(dom)}
                                className="p-1 text-white/40 hover:text-white rounded hover:bg-white/10"
                                title="Tarayıcıda Aç"
                              >
                                <ExternalLink size={12} />
                              </button>
                              {onSelectNewTarget && (
                                <button
                                  onClick={() => {
                                    onSelectNewTarget(dom);
                                    onClose();
                                  }}
                                  className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-[10px] transition-colors"
                                  title="Bu Komşu Siteyi Yeni Hedef Yap"
                                >
                                  Hedef Yap
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alt Bilgi Çubuğu */}
        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02] text-xs text-white/40 font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Terminal size={13} className="text-cyan-400/60" />
              <span>Dorkful Cyber Constellation v2.0</span>
            </div>
            <span>•</span>
            <span>{(nodes || []).length} düğüm, {(edges || []).length} bağlantı haritalandı</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
