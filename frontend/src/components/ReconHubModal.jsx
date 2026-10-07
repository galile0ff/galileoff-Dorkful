"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Network,
  Radio,
  Shield,
  GitBranch,
  Code2,
  Globe,
  History,
  Search,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Flag,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Server,
  Terminal,
  Activity,
  FileCode,
  FolderGit2,
  Lock,
  Eye,
  EyeOff,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize2,
  List,
  Sparkles,
  ArrowRight,
  Cpu,
  Mail,
  Calendar,
  Layers,
  Settings
} from 'lucide-react';
import ModalShell from './ModalShell';
import { BrowserOpenURL, ClipboardSetText } from '../../wailsjs/runtime/runtime';
import { ProbeSubdomainsBatch } from '../../wailsjs/go/main/App';

export default function ReconHubModal({
  isOpen,
  onClose,
  initialTab = 'dnsmap',
  target = '',
  onSelectNewTarget,
  // DNS Map
  dnsMapResult = null,
  isDNSMapLoading = false,
  onRefreshDNSMap,
  // Shodan
  shodanHosts = [],
  isShodanLoading = false,
  onRefreshShodan,
  // Censys
  censysHosts = [],
  isCensysLoading = false,
  onRefreshCensys,
  // GitHub Leaks
  githubLeaks = [],
  isGitHubLoading = false,
  onRefreshGitHub,
  // JS Miner
  jsAnalysisResult = null,
  isJSAnalysisLoading = false,
  onRefreshJS,
  // CRT.sh & Wayback
  subdomains = [],
  waybackUrls = [],
  isReconLoading = false,
  reconType = 'crtsh',
  onRefreshCRT,
  onRefreshWayback,
  // Ortak Aksiyonlar
  onFlagAsFinding,
  onOpenSettings
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Hedef bazlı tarama önbelleği: Refresh butonuna basılana kadar aynı hedefe tekrar tarama atmaz
  const scannedCacheRef = useRef({});

  // Tab değiştiğinde veya modal açıldığında tab'i senkronize et
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Arama metnini sekme değişiminde sıfırla
  useEffect(() => {
    setSearchTerm('');
  }, [activeTab]);

  const handleCopy = (text, key) => {
    if (!text) return;
    if (ClipboardSetText) {
      ClipboardSetText(text);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenURL = (url) => {
    if (!url) return;
    let valid = url;
    if (!valid.startsWith('http://') && !valid.startsWith('https://')) {
      valid = `https://${valid}`;
    }
    if (BrowserOpenURL) {
      BrowserOpenURL(valid);
    } else {
      window.open(valid, '_blank');
    }
  };

  // -------------------------------------------------------------
  // CRT.sh & Wayback Alt State'leri
  // -------------------------------------------------------------
  const [archiveSubTab, setArchiveSubTab] = useState(reconType === 'wayback' ? 'wayback' : 'crtsh');
  const [probeResults, setProbeResults] = useState({});
  const [isProbingSubdomains, setIsProbingSubdomains] = useState(false);
  const [subdomainStatusFilter, setSubdomainStatusFilter] = useState('all');
  const [waybackPeriod, setWaybackPeriod] = useState('all');
  const probingInProgressRef = useRef(false);

  // Subdomain otomatik probing
  useEffect(() => {
    if (isOpen && activeTab === 'archive' && archiveSubTab === 'crtsh' && subdomains.length > 0 && !probingInProgressRef.current) {
      const startProbing = async () => {
        probingInProgressRef.current = true;
        setIsProbingSubdomains(true);
        try {
          const rawSubs = subdomains
            .map(s => (s.subdomain || '').toLowerCase().trim())
            .filter(Boolean);
          const resRecord = await ProbeSubdomainsBatch(rawSubs);
          if (resRecord && typeof resRecord === 'object') {
            if (Array.isArray(resRecord)) {
              const mapped = {};
              resRecord.forEach(item => {
                if (item && item.target) {
                  mapped[item.target.toLowerCase().trim()] = item;
                }
              });
              setProbeResults(prev => ({ ...prev, ...mapped }));
            } else {
              const normalized = {};
              Object.entries(resRecord).forEach(([k, v]) => {
                normalized[k.toLowerCase().trim()] = v;
              });
              setProbeResults(prev => ({ ...prev, ...normalized }));
            }
          }
        } catch (err) {
          console.error("Subdomain probing failed:", err);
        } finally {
          setIsProbingSubdomains(false);
          probingInProgressRef.current = false;
        }
      };
      startProbing();
    }
  }, [isOpen, activeTab, archiveSubTab, subdomains]);

  // -------------------------------------------------------------
  // DNS Map State'leri & İnteraktif Canvas Motoru
  // -------------------------------------------------------------
  const [dnsViewMode, setDnsViewMode] = useState('graph'); // 'graph' | 'table'
  const canvasRef = useRef(null);
  const nodePositionsRef = useRef(new Map());
  const animationFrameRef = useRef(null);
  const draggedNodeIdRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedDNSNode, setSelectedDNSNode] = useState(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Düğüm tiplerine göre tema renkleri
  const getDNSNodeColor = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'target':
        return { fill: '#ffffff', stroke: '#e4e4e7', text: '#ffffff', glow: 'rgba(255, 255, 255, 0.4)' };
      case 'a':
      case 'aaaa':
      case 'ip':
        return { fill: '#06b6d4', stroke: '#22d3ee', text: '#67e8f9', glow: 'rgba(6, 182, 212, 0.35)' };
      case 'ns':
        return { fill: '#8b5cf6', stroke: '#a78bfa', text: '#c4b5fd', glow: 'rgba(139, 92, 246, 0.35)' };
      case 'mx':
        return { fill: '#3b82f6', stroke: '#60a5fa', text: '#93c5fd', glow: 'rgba(59, 130, 246, 0.35)' };
      case 'txt':
        return { fill: '#10b981', stroke: '#34d399', text: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.35)' };
      case 'cohost':
        return { fill: '#f59e0b', stroke: '#fbbf24', text: '#fde68a', glow: 'rgba(245, 158, 11, 0.35)' };
      default:
        return { fill: '#a1a1aa', stroke: '#d4d4d8', text: '#e4e4e7', glow: 'rgba(161, 161, 170, 0.25)' };
    }
  };

  // Topoloji yerleşimi (Dairesel ve fizik tabanlı konumlandırma)
  useEffect(() => {
    if (!isOpen || activeTab !== 'dnsmap' || !dnsMapResult?.nodes || dnsMapResult.nodes.length === 0) return;

    const positions = new Map();
    const centerX = 0;
    const centerY = 0;

    positions.set('node-target', { x: centerX, y: centerY, vx: 0, vy: 0 });

    const safeNodes = dnsMapResult.nodes || [];
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

    const dnsRadius = 150;
    dnsNodes.forEach((node, idx) => {
      const nodeId = node.id || node.ID;
      const angle = (idx / Math.max(dnsNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      positions.set(nodeId, {
        x: centerX + Math.cos(angle) * dnsRadius,
        y: centerY + Math.sin(angle) * dnsRadius
      });
    });

    const ipRadius = 250;
    ipNodes.forEach((node, idx) => {
      const nodeId = node.id || node.ID;
      const angle = (idx / Math.max(ipNodes.length, 1)) * Math.PI * 2 + Math.PI / 4;
      positions.set(nodeId, {
        x: centerX + Math.cos(angle) * ipRadius,
        y: centerY + Math.sin(angle) * ipRadius
      });
    });

    const cohostRadius = 370;
    cohostNodes.forEach((node, idx) => {
      const nodeId = node.id || node.ID;
      const angle = (idx / Math.max(cohostNodes.length, 1)) * Math.PI * 2;
      const jitter = (idx % 2 === 0 ? 1 : -1) * (idx * 3);
      positions.set(nodeId, {
        x: centerX + Math.cos(angle) * (cohostRadius + (idx % 3) * 25),
        y: centerY + Math.sin(angle) * (cohostRadius + (idx % 3) * 25) + jitter
      });
    });

    nodePositionsRef.current = positions;
  }, [isOpen, activeTab, dnsMapResult]);

  // Canvas render döngüsü (Bağlantılar, düğümler, veri partikül animasyonu)
  useEffect(() => {
    if (!isOpen || activeTab !== 'dnsmap' || dnsViewMode !== 'graph') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particleOffset = 0;
    const nodes = dnsMapResult?.nodes || [];
    const edges = dnsMapResult?.edges || [];

    const render = () => {
      particleOffset = (particleOffset + 0.005) % 1;

      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2 + panOffset.x, canvas.height / 2 + panOffset.y);
      ctx.scale(zoomLevel, zoomLevel);

      const positions = nodePositionsRef.current;

      // Izgara arka planı
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      const gridSize = 40;
      for (let x = -1000; x <= 1000; x += gridSize) {
        for (let y = -1000; y <= 1000; y += gridSize) {
          ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
      }

      // Bağlantı çizgileri (Edges)
      edges.forEach((edge) => {
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
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Çizgi üzerinde süzülen partikül
        const px = p1.x + (p2.x - p1.x) * particleOffset;
        const py = p1.y + (p2.y - p1.y) * particleOffset;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = edgeType === 'cohost_link' ? '#f59e0b' : '#38bdf8';
        ctx.fill();
      });

      // Düğümler (Nodes)
      nodes.forEach((node) => {
        const nodeId = node.id || node.ID;
        const nodeType = (node.type || node.Type || '').toLowerCase();
        const pos = positions.get(nodeId);
        if (!pos) return;

        const isTarget = nodeType === 'target';
        const isSelected = selectedDNSNode && ((selectedDNSNode.id || selectedDNSNode.ID) === nodeId);
        const color = getDNSNodeColor(nodeType);
        const radius = isTarget ? 22 : nodeType === 'ip' ? 15 : nodeType === 'cohost' ? 10 : 12;

        // Glow efekti
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + (isTarget ? 8 : 5), 0, Math.PI * 2);
        ctx.fillStyle = color.glow;
        ctx.fill();

        // Düğüm gövdesi
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ffffff' : '#0e0e12';
        ctx.fill();
        ctx.lineWidth = isSelected ? 2.5 : isTarget ? 2 : 1.2;
        ctx.strokeStyle = isSelected ? '#38bdf8' : color.stroke;
        ctx.stroke();

        // Düğüm metni
        const labelText = String(node.label || node.Label || '');
        ctx.font = isTarget ? 'bold 11px monospace' : '10px monospace';
        ctx.fillStyle = isSelected ? '#000000' : isTarget ? '#ffffff' : color.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isTarget) {
          ctx.fillText('TARGET', pos.x, pos.y);
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, pos.x, pos.y + radius + 14);
        } else {
          let displayLabel = labelText;
          if (displayLabel.length > 18) {
            displayLabel = displayLabel.slice(0, 16) + '..';
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
  }, [isOpen, activeTab, dnsViewMode, dnsMapResult, panOffset, zoomLevel, selectedDNSNode]);

  // Canvas fare etkileşimleri (Sürükleme & Seçim)
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - (canvas.width / 2 + panOffset.x)) / zoomLevel;
    const worldY = (mouseY - (canvas.height / 2 + panOffset.y)) / zoomLevel;

    let clicked = null;
    nodePositionsRef.current.forEach((pos, id) => {
      const dx = worldX - pos.x;
      const dy = worldY - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        clicked = (dnsMapResult?.nodes || []).find((n) => (n.id || n.ID) === id);
      }
    });

    if (clicked) {
      draggedNodeIdRef.current = clicked.id || clicked.ID;
      setSelectedDNSNode(clicked);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (draggedNodeIdRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - (canvas.width / 2 + panOffset.x)) / zoomLevel;
      const worldY = (mouseY - (canvas.height / 2 + panOffset.y)) / zoomLevel;
      nodePositionsRef.current.set(draggedNodeIdRef.current, { x: worldX, y: worldY });
    } else if (isDraggingCanvas) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    draggedNodeIdRef.current = null;
    setIsDraggingCanvas(false);
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 3));
  };

  // -------------------------------------------------------------
  // JS Miner State'leri
  // -------------------------------------------------------------
  const [jsMinerTab, setJsMinerTab] = useState('secrets'); // 'secrets' | 'endpoints' | 'scripts'
  const [showMaskedSecrets, setShowMaskedSecrets] = useState({});

  // -------------------------------------------------------------
  // Sekme Rozet Sayıları
  // -------------------------------------------------------------
  const counts = useMemo(() => {
    const dnsCount = (dnsMapResult?.records?.length || 0) + (dnsMapResult?.coHostedDomains?.length || 0);
    const shodanCount = (shodanHosts || []).reduce((acc, h) => acc + (h.ports ? h.ports.length : 0), 0);
    const censysCount = (censysHosts || []).length;
    const githubCount = (githubLeaks || []).length;
    const jsCount = (jsAnalysisResult?.secrets?.length || 0) + (jsAnalysisResult?.endpoints?.length || 0);
    const archiveCount = (subdomains || []).length + (waybackUrls || []).length;

    return {
      dnsmap: dnsCount,
      shodan: shodanCount,
      censys: censysCount,
      github: githubCount,
      jsminer: jsCount,
      archive: archiveCount
    };
  }, [dnsMapResult, shodanHosts, censysHosts, githubLeaks, jsAnalysisResult, subdomains, waybackUrls]);

  const TABS = [
    { id: 'dnsmap', label: 'Ağ & DNS', icon: Network, count: counts.dnsmap, loading: isDNSMapLoading },
    { id: 'shodan', label: 'Shodan', icon: Radio, count: counts.shodan, loading: isShodanLoading },
    { id: 'censys', label: 'Censys', icon: Shield, count: counts.censys, loading: isCensysLoading },
    { id: 'github', label: 'GitHub Leaks', icon: GitBranch, count: counts.github, loading: isGitHubLoading },
    { id: 'jsminer', label: 'JS Miner', icon: Code2, count: counts.jsminer, loading: isJSAnalysisLoading },
    { id: 'archive', label: 'CRT.sh & Arşiv', icon: Globe, count: counts.archive, loading: isReconLoading },
  ];

  // Aktif sekmenin manuel yenileme fonksiyonu (Önbelleği tazeler ve hedefi doğrudan yeniden tarar)
  const handleCurrentRefresh = () => {
    const cleanTarget = (target || '').trim();
    if (!cleanTarget) return;
    const normalizedTarget = cleanTarget.toLowerCase();

    const currentKey = activeTab === 'archive'
      ? (archiveSubTab === 'wayback' ? 'archive_wayback' : 'archive_crtsh')
      : activeTab;

    // Önbellek kaydını tazele
    scannedCacheRef.current[currentKey] = normalizedTarget;

    if (activeTab === 'dnsmap' && onRefreshDNSMap) onRefreshDNSMap(cleanTarget);
    if (activeTab === 'shodan' && onRefreshShodan) onRefreshShodan(cleanTarget);
    if (activeTab === 'censys' && onRefreshCensys) onRefreshCensys(cleanTarget);
    if (activeTab === 'github' && onRefreshGitHub) onRefreshGitHub(cleanTarget);
    if (activeTab === 'jsminer' && onRefreshJS) onRefreshJS(cleanTarget);
    if (activeTab === 'archive') {
      if (archiveSubTab === 'crtsh' && onRefreshCRT) onRefreshCRT(cleanTarget);
      if (archiveSubTab === 'wayback' && onRefreshWayback) onRefreshWayback(cleanTarget);
    }
  };

  // Sekme ilk açıldığında veya hedef değiştiğinde otomatik tarama tetikleyici
  // Önbellek sayesinde yenileme (refresh) butonuna basılana kadar aynı hedefe tekrar istek atmaz
  useEffect(() => {
    if (!isOpen) return;
    const cleanTarget = (target || '').trim();
    if (!cleanTarget) return;

    const normalizedTarget = cleanTarget.toLowerCase();
    const currentKey = activeTab === 'archive'
      ? (archiveSubTab === 'wayback' ? 'archive_wayback' : 'archive_crtsh')
      : activeTab;

    // Eğer bu hedef için bu sekme daha önce taranmışsa tekrar tarama atma
    if (scannedCacheRef.current[currentKey] === normalizedTarget) {
      return;
    }

    // Önbelleğe kaydet (böylece sekme değiştiğinde veya modal kapatılıp açıldığında tekrar çalışmaz)
    scannedCacheRef.current[currentKey] = normalizedTarget;

    // İlgili taramayı tetikle
    if (activeTab === 'dnsmap' && onRefreshDNSMap) {
      onRefreshDNSMap(cleanTarget);
    } else if (activeTab === 'shodan' && onRefreshShodan) {
      onRefreshShodan(cleanTarget);
    } else if (activeTab === 'censys' && onRefreshCensys) {
      onRefreshCensys(cleanTarget);
    } else if (activeTab === 'github' && onRefreshGitHub) {
      onRefreshGitHub(cleanTarget);
    } else if (activeTab === 'jsminer' && onRefreshJS) {
      onRefreshJS(cleanTarget);
    } else if (activeTab === 'archive') {
      if (archiveSubTab === 'crtsh' && onRefreshCRT) {
        onRefreshCRT(cleanTarget);
      } else if (archiveSubTab === 'wayback' && onRefreshWayback) {
        onRefreshWayback(cleanTarget);
      }
    }
  }, [isOpen, activeTab, archiveSubTab, target, onRefreshDNSMap, onRefreshShodan, onRefreshCensys, onRefreshGitHub, onRefreshJS, onRefreshCRT, onRefreshWayback]);

  const isCurrentLoading =
    (activeTab === 'dnsmap' && isDNSMapLoading) ||
    (activeTab === 'shodan' && isShodanLoading) ||
    (activeTab === 'censys' && isCensysLoading) ||
    (activeTab === 'github' && isGitHubLoading) ||
    (activeTab === 'jsminer' && isJSAnalysisLoading) ||
    (activeTab === 'archive' && isReconLoading);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="İstihbarat & Keşif Merkezi"
      subtitle={target ? `Hedef: ${target}` : 'Canlı ağ, port, kod ve arşiv analizi'}
      icon={Activity}
      maxWidth="max-w-6xl"
      badge="Unified Recon Hub"
      headerActions={
        <div className="flex items-center gap-2">
          {target && target.trim() && (
            <button
              onClick={handleCurrentRefresh}
              disabled={isCurrentLoading}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-white/70 hover:text-white border border-white/[0.08] transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 text-xs font-medium"
              title="Aktif Keşfi Yenile (Önbelleği Tazele)"
            >
              <RefreshCw size={13} className={isCurrentLoading ? "animate-spin text-white" : ""} />
              <span className="hidden sm:inline">{isCurrentLoading ? 'Taranıyor...' : 'Yenile'}</span>
            </button>
          )}
        </div>
      }
    >
      {/* Raycast / Linear Tarzı Sekme Gezinti Çubuğu */}
      <div className="px-5 py-2.5 border-b border-white/[0.08] bg-white/[0.015] flex items-center justify-between gap-3 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer select-none border ${
                  isActive
                    ? 'bg-white text-black font-semibold border-white shadow-sm shadow-white/20'
                    : 'bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/[0.06] border-transparent hover:border-white/[0.08]'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-black' : 'text-white/60'} />
                <span>{t.label}</span>
                {t.loading ? (
                  <RefreshCw size={10} className="animate-spin text-amber-400" />
                ) : t.count > 0 ? (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-black/15 text-black font-bold' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {t.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Canlı Filtreleme Arama Çubuğu */}
        <div className="relative min-w-[200px] max-w-xs shrink-0">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Mevcut sekmede ara..."
            className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/15 focus:border-white/30 text-white placeholder-white/30 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none transition-all"
          />
        </div>
      </div>

      {/* Sekme İçerikleri */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar">
        {/* =========================================================
            1. TAB: DNS & REVERSE IP AĞ HARİTASI
           ========================================================= */}
        {activeTab === 'dnsmap' && (
          <div className="flex flex-col gap-5">
            {isDNSMapLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                <RefreshCw size={28} className="animate-spin text-white/40" />
                <p className="text-sm text-white/70 font-medium">Ağ haritası, DNS kayıtları ve komşu sunucular taranıyor...</p>
                <span className="text-xs text-white/40 font-mono">{target}</span>
              </div>
            ) : dnsMapResult?.error ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{dnsMapResult.error}</span>
              </div>
            ) : dnsMapResult ? (
              <div className="flex flex-col gap-6">
                {/* İstatistik Kartları */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-mono text-white/40">Hedef IP</span>
                    <span className="text-sm font-mono font-semibold text-white mt-1 break-all select-all">
                      {dnsMapResult?.resolvedIp ||
                       dnsMapResult?.resolvedIP ||
                       (dnsMapResult?.records || []).find((r) => r?.type === 'A')?.value ||
                       (dnsMapResult?.records || []).find((r) => r?.type === 'AAAA')?.value ||
                       (dnsMapResult?.coHostedDomains || []).find((c) => c?.resolvedIp)?.resolvedIp ||
                       (shodanHosts && shodanHosts.length > 0 && (shodanHosts[0]?.ip_str || shodanHosts[0]?.ip)) ||
                       (censysHosts && censysHosts.length > 0 && (censysHosts[0]?.ip)) ||
                       (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(String(target || '').trim()) ? String(target).trim() : null) ||
                       'Belirlenemedi'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
                    <span className="text-[10px] uppercase font-mono text-white/40">DNS Kayıtları</span>
                    <span className="text-sm font-mono font-semibold text-white mt-1">
                      {(dnsMapResult.records || []).length} Adet
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
                    <span className="text-[10px] uppercase font-mono text-white/40">Komşu Siteler (Reverse IP)</span>
                    <span className="text-sm font-mono font-semibold text-emerald-400 mt-1">
                      {(dnsMapResult.coHostedDomains || []).length} Alan Adı
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
                    <span className="text-[10px] uppercase font-mono text-white/40">Görünüm Modu</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => setDnsViewMode('table')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          dnsViewMode === 'table' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-white/60'
                        }`}
                      >
                        Liste
                      </button>
                      <button
                        onClick={() => setDnsViewMode('graph')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          dnsViewMode === 'graph' ? 'bg-white text-black font-semibold' : 'bg-white/5 text-white/60'
                        }`}
                      >
                        Harita
                      </button>
                    </div>
                  </div>
                </div>

                {/* Görünüm Moduna Göre Harita veya Liste Render Et */}
                {dnsViewMode === 'graph' ? (
                  <div className="relative w-full h-[460px] rounded-2xl bg-black/60 border border-white/[0.08] overflow-hidden flex flex-col">
                    {/* İnteraktif Canvas Topoloji Haritası */}
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onWheel={handleCanvasWheel}
                      className="w-full h-full cursor-grab active:cursor-grabbing block"
                    />

                    {/* Harita Kontrolleri (Zoom & Reset) */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/80 border border-white/10 backdrop-blur-md z-10 shadow-lg">
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(z * 1.2, 3))}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Yakınlaştır"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(z * 0.8, 0.4))}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Uzaklaştır"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <button
                        onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Merkezle / Sıfırla"
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>

                    {/* Seçilen Düğüm Detay Kartı */}
                    {selectedDNSNode && (
                      <div className="absolute top-4 left-4 max-w-xs p-3 rounded-xl bg-neutral-950/90 border border-white/15 backdrop-blur-xl text-xs flex flex-col gap-1.5 z-10 shadow-xl animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="font-mono uppercase font-bold text-cyan-400 text-[10px]">
                            {selectedDNSNode.type || selectedDNSNode.Type} Düğümü
                          </span>
                          <button onClick={() => setSelectedDNSNode(null)} className="text-white/40 hover:text-white p-0.5 cursor-pointer">✕</button>
                        </div>
                        <span className="font-mono text-white/90 break-all text-xs">
                          {selectedDNSNode.label || selectedDNSNode.Label}
                        </span>
                        {onSelectNewTarget && (selectedDNSNode.type || selectedDNSNode.Type) === 'cohost' && (
                          <button
                            onClick={() => onSelectNewTarget(selectedDNSNode.label || selectedDNSNode.Label)}
                            className="mt-1 glass-btn-primary !py-1 text-[11px] w-full"
                          >
                            <span>Bu Alan Adını Hedef Al</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Harita Düğüm Bilgi Rozeti */}
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-xl bg-neutral-950/70 border border-white/10 backdrop-blur-md text-[10px] text-white/50 font-mono pointer-events-none">
                      {(dnsMapResult.nodes || []).length} Düğüm • {(dnsMapResult.edges || []).length} Bağlantı
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Komşu Siteler Listesi */}
                    {(dnsMapResult.coHostedDomains || []).length > 0 && (
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Server size={14} className="text-emerald-400" />
                            <h4 className="text-xs font-semibold text-white tracking-wide">
                              Aynı Sunucudaki Komşu Siteler ({dnsMapResult.coHostedDomains.length})
                            </h4>
                          </div>
                          <span className="text-[10px] text-white/40">Reverse IP Keşfi</span>
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                          {dnsMapResult.coHostedDomains
                            .filter((d) => {
                              if (!d) return false;
                              const dom = typeof d === 'string' ? d : (d.domain || d.Domain || '');
                              const ip = typeof d === 'object' ? (d.resolvedIp || d.ResolvedIP || '') : '';
                              if (!searchTerm) return true;
                              const q = searchTerm.toLowerCase();
                              return dom.toLowerCase().includes(q) || ip.toLowerCase().includes(q);
                            })
                            .map((d, i) => {
                              const dom = typeof d === 'string' ? d : (d.domain || d.Domain || '');
                              const ip = typeof d === 'object' ? (d.resolvedIp || d.ResolvedIP || '') : '';
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs font-mono font-medium text-white/90">{dom}</span>
                                    {ip && <span className="text-[10px] font-mono text-white/40">{ip}</span>}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 ml-1">
                                    <button
                                      onClick={() => handleCopy(dom, `cohost-${i}`)}
                                      className="p-1 text-white/40 hover:text-white"
                                      title="Kopyala"
                                    >
                                      {copiedKey === `cohost-${i}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                    </button>
                                    {onSelectNewTarget && (
                                      <button
                                        onClick={() => onSelectNewTarget(dom)}
                                        className="p-1 text-white/40 hover:text-emerald-400"
                                        title="Bu Hedefi Tara"
                                      >
                                        <ArrowRight size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* DNS Kayıtları Tablosu */}
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white tracking-wide">DNS Kayıtları & Altyapı</h4>
                        <span className="text-[10px] text-white/40">{(dnsMapResult.records || []).length} Kayıt</span>
                      </div>
                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.06] text-white/40 text-[10px] font-mono uppercase">
                              <th className="pb-2.5 font-medium">Tür</th>
                              <th className="pb-2.5 font-medium">Değer / Hedef</th>
                              <th className="pb-2.5 font-medium">TTL</th>
                              <th className="pb-2.5 text-right font-medium">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {(dnsMapResult.records || [])
                              .filter((r) => !searchTerm || (r.value && r.value.toLowerCase().includes(searchTerm.toLowerCase())) || (r.type && r.type.toLowerCase().includes(searchTerm.toLowerCase())))
                              .map((r, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-2.5">
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-white/10 text-white/80 border border-white/10">
                                      {r.type}
                                    </span>
                                  </td>
                                  <td className="py-2.5 font-mono text-white/80 max-w-md truncate">
                                    {r.value}
                                  </td>
                                  <td className="py-2.5 text-white/40 font-mono text-[11px]">
                                    {r.ttl || '-'}
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleCopy(r.value, `rec-${i}`)}
                                        className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
                                        title="Değeri Kopyala"
                                      >
                                        {copiedKey === `rec-${i}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                      </button>
                                      {onFlagAsFinding && (
                                        <button
                                          onClick={() =>
                                            onFlagAsFinding({
                                              query: `${r.type} -> ${r.value}`,
                                              description: `${target} DNS ${r.type} kaydı altyapı tespiti`,
                                              category: "Network & Infrastructure",
                                              evidenceUrl: target
                                            })
                                          }
                                          className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5"
                                          title="Bulguya Kaydet"
                                        >
                                          <Flag size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <Network size={36} className="text-white/30" />
                <p className="text-xs text-white/50">
                  {target ? 'Henüz DNS veya komşu sunucu taraması yapılmadı.' : 'Lütfen üst arama çubuğuna bir hedef alan adı girin.'}
                </p>
                {target && target.trim() && onRefreshDNSMap && (
                  <button
                    onClick={() => onRefreshDNSMap(target)}
                    className="glass-btn-primary !py-1.5 !px-3.5 text-xs mt-1"
                  >
                    <span>DNS Ağ Haritasını Çıkar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            2. TAB: SHODAN AÇIK PORT & ZAFİYETLER
           ========================================================= */}
        {activeTab === 'shodan' && (
          <div className="flex flex-col gap-4">
            {isShodanLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                <RefreshCw size={28} className="animate-spin text-white/40" />
                <p className="text-sm text-white/70 font-medium">Shodan port ve zafiyet verisi sorgulanıyor...</p>
                <span className="text-xs text-white/40 font-mono">{target}</span>
              </div>
            ) : (shodanHosts || []).length > 0 ? (
              <div className="flex flex-col gap-4">
                {(shodanHosts || [])
                  .filter((h) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase();
                    return (
                      (h.ip && h.ip.toLowerCase().includes(q)) ||
                      (h.org && h.org.toLowerCase().includes(q)) ||
                      (h.ports && h.ports.some((p) => p.toString().includes(q))) ||
                      (h.vulns && h.vulns.some((v) => v.toLowerCase().includes(q)))
                    );
                  })
                  .map((host, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-4 transition-all hover:border-white/15"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Server size={16} className="text-white/60" />
                          <span className="text-sm font-mono font-bold text-white">{host.ip}</span>
                          {host.org && (
                            <span className="text-xs text-white/50 font-medium px-2 py-0.5 rounded-lg bg-white/5">
                              {host.org}
                            </span>
                          )}
                          {host.isKeyless && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              InternetDB
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenURL(`https://www.shodan.io/host/${host.ip}`)}
                            className="glass-btn-secondary !py-1 text-[11px]"
                          >
                            <span>Shodan'da Aç</span>
                            <ExternalLink size={11} />
                          </button>
                          {onFlagAsFinding && (
                            <button
                              onClick={() =>
                                onFlagAsFinding({
                                  query: host.ip,
                                  description: `Shodan IP Analizi: ${(host.ports || []).length} açık port, ${(host.vulns || []).length} zafiyet`,
                                  category: "Port & Vulnerability",
                                  evidenceUrl: `https://www.shodan.io/host/${host.ip}`
                                })
                              }
                              className="p-1.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                              title="Bulgu Olarak Kaydet"
                            >
                              <Flag size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Açık Portlar */}
                      <div>
                        <span className="text-[10px] uppercase font-mono text-white/40 block mb-1.5">
                          Açık Portlar ({(host.ports || []).length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(host.ports || []).map((port) => (
                            <span
                              key={port}
                              className="px-2 py-0.5 rounded-lg font-mono text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            >
                              {port}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Zafiyetler (CVE) */}
                      {(host.vulns || []).length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-red-400 block mb-1.5 flex items-center gap-1">
                            <ShieldAlert size={12} />
                            Tespit Edilen CVE Zafiyetleri ({(host.vulns || []).length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(host.vulns || []).map((cve) => (
                              <button
                                key={cve}
                                onClick={() => handleOpenURL(`https://nvd.nist.gov/vuln/detail/${cve}`)}
                                className="px-2 py-0.5 rounded-lg font-mono text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>{cve}</span>
                                <ExternalLink size={9} />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <Radio size={36} className="text-white/30" />
                <p className="text-xs text-white/50">
                  {target ? 'Bu hedef için Shodan kaydı bulunamadı veya henüz taranmadı.' : 'Lütfen üst arama çubuğuna bir hedef alan adı girin.'}
                </p>
                {target && target.trim() && onRefreshShodan && (
                  <button
                    onClick={() => onRefreshShodan(target)}
                    className="glass-btn-primary !py-1.5 !px-3.5 text-xs mt-1"
                  >
                    <span>Shodan Port & Zafiyet Taramasını Başlat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            3. TAB: CENSYS HOST & SERVİSLER
           ========================================================= */}
        {activeTab === 'censys' && (
          <div className="flex flex-col gap-4">
            {isCensysLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                <RefreshCw size={28} className="animate-spin text-white/40" />
                <p className="text-sm text-white/70 font-medium">Censys host ve sertifika verisi çekiliyor...</p>
                <span className="text-xs text-white/40 font-mono">{target}</span>
              </div>
            ) : (censysHosts || []).length > 0 ? (
              <div className="flex flex-col gap-4">
                {(censysHosts || [])
                  .filter((h) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase();
                    return (
                      (h.ip && h.ip.toLowerCase().includes(q)) ||
                      (h.asn && h.asn.toLowerCase().includes(q)) ||
                      (h.asName && h.asName.toLowerCase().includes(q)) ||
                      (h.services && h.services.some((s) => s.toLowerCase().includes(q)))
                    );
                  })
                  .map((host, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-3.5 transition-all hover:border-white/15"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Shield size={16} className="text-cyan-400" />
                          <span className="text-sm font-mono font-bold text-white">{host.ip}</span>
                          {host.asName && (
                            <span className="text-xs text-white/50 font-medium px-2 py-0.5 rounded-lg bg-white/5">
                              {host.asName} ({host.asn})
                            </span>
                          )}
                          {host.country && (
                            <span className="text-[11px] text-white/60 font-mono">
                              📍 {host.country}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenURL(`https://search.censys.io/hosts/${host.ip}`)}
                            className="glass-btn-secondary !py-1 text-[11px]"
                          >
                            <span>Censys'te Aç</span>
                            <ExternalLink size={11} />
                          </button>
                          {onFlagAsFinding && (
                            <button
                              onClick={() =>
                                onFlagAsFinding({
                                  query: host.ip,
                                  description: `Censys Host: ${host.ip} (${host.asName || 'Bilinmiyor'})`,
                                  category: "Network & Infrastructure",
                                  evidenceUrl: `https://search.censys.io/hosts/${host.ip}`
                                })
                              }
                              className="p-1.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                              title="Bulguya Kaydet"
                            >
                              <Flag size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Servisler & Portlar */}
                      {(host.services || []).length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-white/40 block mb-1.5">
                            Aktif Servisler ({(host.services || []).length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(host.services || []).map((srv, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-lg font-mono text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                              >
                                {srv}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <Shield size={36} className="text-white/30" />
                <p className="text-xs text-white/50">
                  {target ? 'Censys kaydı bulunamadı veya henüz taranmadı.' : 'Lütfen üst arama çubuğuna bir hedef alan adı girin.'}
                </p>
                {target && target.trim() && onRefreshCensys && (
                  <button
                    onClick={() => onRefreshCensys(target)}
                    className="glass-btn-primary !py-1.5 !px-3.5 text-xs mt-1"
                  >
                    <span>Censys Host Taramasını Başlat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            4. TAB: GITHUB SIZAN KOD & .ENV
           ========================================================= */}
        {activeTab === 'github' && (
          <div className="flex flex-col gap-4">
            {isGitHubLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                <RefreshCw size={28} className="animate-spin text-white/40" />
                <p className="text-sm text-white/70 font-medium">GitHub canlı kod sızıntıları taranıyor...</p>
                <span className="text-xs text-white/40 font-mono">{target}</span>
              </div>
            ) : (githubLeaks || []).length > 0 ? (
              <div className="flex flex-col gap-3">
                {(githubLeaks || [])
                  .filter((leak) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase();
                    return (
                      (leak.repoName && leak.repoName.toLowerCase().includes(q)) ||
                      (leak.path && leak.path.toLowerCase().includes(q)) ||
                      (leak.description && leak.description.toLowerCase().includes(q))
                    );
                  })
                  .map((leak, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between gap-4 transition-all hover:border-white/15"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileCode size={18} className="text-amber-400 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-white truncate">
                              {leak.repoName}
                            </span>
                            <span className="text-[10px] font-mono text-white/40 truncate">
                              /{leak.path}
                            </span>
                          </div>
                          {leak.description && (
                            <p className="text-[11px] text-white/60 truncate mt-0.5">
                              {leak.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {leak.htmlUrl && (
                          <button
                            onClick={() => handleOpenURL(leak.htmlUrl)}
                            className="glass-btn-secondary !py-1 text-[11px]"
                          >
                            <span>Kaynak</span>
                            <ExternalLink size={11} />
                          </button>
                        )}
                        {onFlagAsFinding && (
                          <button
                            onClick={() =>
                              onFlagAsFinding({
                                query: leak.query || target,
                                description: `GitHub Sızıntısı: ${leak.repoName} (${leak.path})`,
                                category: "Secrets & Config",
                                evidenceUrl: leak.htmlUrl
                              })
                            }
                            className="p-1.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                            title="Bulguya Kaydet"
                          >
                            <Flag size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <GitBranch size={36} className="text-white/30" />
                <p className="text-xs text-white/50">
                  {target ? 'GitHub kod sızıntısı bulunamadı veya henüz taranmadı.' : 'Lütfen üst arama çubuğuna bir hedef alan adı girin.'}
                </p>
                {target && target.trim() && onRefreshGitHub && (
                  <button
                    onClick={() => onRefreshGitHub(target)}
                    className="glass-btn-primary !py-1.5 !px-3.5 text-xs mt-1"
                  >
                    <span>GitHub Canlı Sızıntı Taramasını Başlat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            5. TAB: JAVASCRIPT SECRET & API MINER
           ========================================================= */}
        {activeTab === 'jsminer' && (
          <div className="flex flex-col gap-4">
            {isJSAnalysisLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                <RefreshCw size={28} className="animate-spin text-white/40" />
                <p className="text-sm text-white/70 font-medium">JavaScript scriptleri taranıyor ve API anahtarları ayrıştırılıyor...</p>
                <span className="text-xs text-white/40 font-mono">{target}</span>
              </div>
            ) : jsAnalysisResult ? (
              <div className="flex flex-col gap-4">
                {/* Alt Sekmeler (Secrets / Endpoints / Scripts) */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                  <button
                    onClick={() => setJsMinerTab('secrets')}
                    className={`glass-tab-btn ${jsMinerTab === 'secrets' ? 'glass-tab-btn-active' : 'glass-tab-btn-inactive'}`}
                  >
                    <span>Gizli Anahtarlar ({jsAnalysisResult.secrets?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setJsMinerTab('endpoints')}
                    className={`glass-tab-btn ${jsMinerTab === 'endpoints' ? 'glass-tab-btn-active' : 'glass-tab-btn-inactive'}`}
                  >
                    <span>API Uç Noktaları ({jsAnalysisResult.endpoints?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setJsMinerTab('scripts')}
                    className={`glass-tab-btn ${jsMinerTab === 'scripts' ? 'glass-tab-btn-active' : 'glass-tab-btn-inactive'}`}
                  >
                    <span>Taranan Scriptler ({jsAnalysisResult.scripts?.length || 0})</span>
                  </button>
                </div>

                {/* Secrets Görünümü */}
                {jsMinerTab === 'secrets' && (
                  <div className="flex flex-col gap-3">
                    {(jsAnalysisResult.secrets || [])
                      .filter((s) => !searchTerm || s.type?.toLowerCase().includes(searchTerm.toLowerCase()) || s.value?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((secret, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Lock size={16} className="text-red-400 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-mono uppercase font-bold text-red-300">
                                {secret.type}
                              </span>
                              <span className="text-xs font-mono text-white/90 truncate mt-0.5">
                                {showMaskedSecrets[idx] ? secret.value : `${secret.value?.slice(0, 8)}••••••••`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                setShowMaskedSecrets((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                              className="p-1.5 rounded-lg text-white/40 hover:text-white"
                              title={showMaskedSecrets[idx] ? "Gizle" : "Göster"}
                            >
                              {showMaskedSecrets[idx] ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              onClick={() => handleCopy(secret.value, `sec-${idx}`)}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white"
                              title="Kopyala"
                            >
                              {copiedKey === `sec-${idx}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>
                            {onFlagAsFinding && (
                              <button
                                onClick={() =>
                                  onFlagAsFinding({
                                    query: secret.type,
                                    description: `JS Miner: ${secret.type} tespit edildi (${secret.sourceUrl || target})`,
                                    category: "JS Secret Sızıntısı",
                                    evidenceUrl: secret.sourceUrl || target,
                                    severity: "High"
                                  })
                                }
                                className="p-1.5 rounded-lg text-white/40 hover:text-red-400"
                                title="Bulguya Kaydet"
                              >
                                <Flag size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    {(!jsAnalysisResult.secrets || jsAnalysisResult.secrets.length === 0) && (
                      <p className="text-xs text-white/40 py-8 text-center">Gizli anahtar bulunamadı.</p>
                    )}
                  </div>
                )}

                {/* Endpoints Görünümü */}
                {jsMinerTab === 'endpoints' && (
                  <div className="flex flex-col gap-2">
                    {(jsAnalysisResult.endpoints || [])
                      .filter((ep) => {
                        if (!ep) return false;
                        const epStr = typeof ep === 'string' ? ep : (ep.endpoint || '');
                        if (!searchTerm) return true;
                        return epStr.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((ep, idx) => {
                        const epStr = typeof ep === 'string' ? ep : (ep.endpoint || '');
                        const method = typeof ep === 'object' ? ep.method : '';
                        return (
                          <div
                            key={idx}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono text-white/80"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {method && (
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 shrink-0">
                                  {method}
                                </span>
                              )}
                              <span className="truncate">{epStr}</span>
                            </div>
                            <button
                              onClick={() => handleCopy(epStr, `ep-${idx}`)}
                              className="p-1 text-white/40 hover:text-white shrink-0 ml-2"
                              title="Kopyala"
                            >
                              {copiedKey === `ep-${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        );
                      })}
                    {(!jsAnalysisResult.endpoints || jsAnalysisResult.endpoints.length === 0) && (
                      <p className="text-xs text-white/40 py-8 text-center">API rotası bulunamadı.</p>
                    )}
                  </div>
                )}

                {/* Scripts Görünümü */}
                {jsMinerTab === 'scripts' && (
                  <div className="flex flex-col gap-2">
                    {(jsAnalysisResult.scripts || [])
                      .filter((sc) => {
                        if (!sc) return false;
                        const urlStr = typeof sc === 'string' ? sc : (sc.url || '');
                        if (!searchTerm) return true;
                        return urlStr.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((sc, idx) => {
                        const scriptUrl = typeof sc === 'string' ? sc : (sc.url || '');
                        const statusCode = typeof sc === 'object' ? sc.statusCode : null;
                        return (
                          <div
                            key={idx}
                            className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-white/70"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {statusCode && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  statusCode >= 200 && statusCode < 300
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                    : 'bg-white/5 text-white/50'
                                }`}>
                                  {statusCode}
                                </span>
                              )}
                              <span className="font-mono truncate">{scriptUrl}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => handleCopy(scriptUrl, `sc-${idx}`)}
                                className="p-1 text-white/40 hover:text-white"
                                title="URL Kopyala"
                              >
                                {copiedKey === `sc-${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                              <button
                                onClick={() => handleOpenURL(scriptUrl)}
                                className="p-1 text-white/40 hover:text-white"
                                title="Tarayıcıda Aç"
                              >
                                <ExternalLink size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {(!jsAnalysisResult.scripts || jsAnalysisResult.scripts.length === 0) && (
                      <p className="text-xs text-white/40 py-8 text-center">Analiz edilen script bulunamadı.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                <Code2 size={36} className="text-white/30" />
                <p className="text-xs text-white/50">
                  {target ? 'JS analizi yapılmadı veya henüz başlatılmadı.' : 'Lütfen üst arama çubuğuna bir hedef alan adı girin.'}
                </p>
                {target && target.trim() && onRefreshJS && (
                  <button
                    onClick={() => onRefreshJS(target)}
                    className="glass-btn-primary !py-1.5 !px-3.5 text-xs mt-1"
                  >
                    <span>JavaScript Dosyalarını Analiz Et</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            6. TAB: CRT.SH SUBDOMAIN & WAYBACK MACHINE ARŞİVİ
           ========================================================= */}
        {activeTab === 'archive' && (
          <div className="flex flex-col gap-4">
            {/* Alt Sekme Seçici (CRT.sh / Wayback) */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setArchiveSubTab('crtsh')}
                  className={`glass-tab-btn ${archiveSubTab === 'crtsh' ? 'glass-tab-btn-active' : 'glass-tab-btn-inactive'}`}
                >
                  <Globe size={13} />
                  <span>CRT.sh Alt Alan Adları ({(subdomains || []).length})</span>
                </button>
                <button
                  onClick={() => setArchiveSubTab('wayback')}
                  className={`glass-tab-btn ${archiveSubTab === 'wayback' ? 'glass-tab-btn-active' : 'glass-tab-btn-inactive'}`}
                >
                  <History size={13} />
                  <span>Wayback Arşivi ({(waybackUrls || []).length})</span>
                </button>
              </div>

              {archiveSubTab === 'crtsh' && isProbingSubdomains && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <RefreshCw size={12} className="animate-spin text-emerald-400" />
                  <span>Canlılık testi yapılıyor...</span>
                </div>
              )}
            </div>

            {/* CRT.sh Görünümü */}
            {archiveSubTab === 'crtsh' && (
              isReconLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                  <RefreshCw size={28} className="animate-spin text-white/40" />
                  <p className="text-sm text-white/70 font-medium">CRT.sh sertifika kayıtları taranıyor...</p>
                  <span className="text-xs text-white/40 font-mono">{target}</span>
                </div>
              ) : (subdomains || []).length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-white/40 text-[10px] font-mono uppercase">
                          <th className="pb-2.5 font-medium">Alt Alan Adı</th>
                          <th className="pb-2.5 font-medium">HTTP Durumu</th>
                          <th className="pb-2.5 font-medium">IP Adresi</th>
                          <th className="pb-2.5 text-right font-medium">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {(subdomains || [])
                          .filter((s) => !searchTerm || (s.subdomain && s.subdomain.toLowerCase().includes(searchTerm.toLowerCase())))
                          .slice(0, 100)
                          .map((s, idx) => {
                            const probe = probeResults[(s.subdomain || '').toLowerCase().trim()];
                            return (
                              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 font-mono text-white/90">
                                  {s.subdomain}
                                </td>
                                <td className="py-2.5">
                                  {probe ? (
                                    <span
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium ${
                                        probe.statusCode >= 200 && probe.statusCode < 400
                                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                          : 'bg-white/5 text-white/60'
                                      }`}
                                    >
                                      {probe.statusCode} {probe.server ? `(${probe.server})` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-white/30 text-[11px]">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 text-white/50 font-mono text-[11px]">
                                  {probe?.ip || '-'}
                                </td>
                                <td className="py-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleCopy(s.subdomain, `sub-${idx}`)}
                                      className="p-1 text-white/40 hover:text-white"
                                      title="Kopyala"
                                    >
                                      {copiedKey === `sub-${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    </button>
                                    <button
                                      onClick={() => handleOpenURL(`https://${s.subdomain}`)}
                                      className="p-1 text-white/40 hover:text-white"
                                      title="Tarayıcıda Aç"
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                  <Globe size={36} className="text-white/30" />
                  <p className="text-xs text-white/50">
                    {target ? 'CRT.sh alt alan adı kaydı bulunamadı veya henüz taranmadı.' : 'Lütfen üst arama çubuğuna bir hedef alan adı girin.'}
                  </p>
                  {target && target.trim() && onRefreshCRT && (
                    <button
                      onClick={() => onRefreshCRT(target)}
                      className="glass-btn-primary !py-1.5 !px-3.5 text-xs mt-1"
                    >
                      <span>CRT.sh Taramasını Başlat</span>
                    </button>
                  )}
                </div>
              )
            )}

            {/* Wayback Görünümü */}
            {archiveSubTab === 'wayback' && (
              isReconLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
                  <RefreshCw size={28} className="animate-spin text-white/40" />
                  <p className="text-sm text-white/70 font-medium">Wayback Machine tarihi URL arşivi taranıyor...</p>
                  <span className="text-xs text-white/40 font-mono">{target}</span>
                </div>
              ) : (waybackUrls || []).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {(waybackUrls || [])
                    .filter((w) => !searchTerm || (w.url && w.url.toLowerCase().includes(searchTerm.toLowerCase())))
                    .slice(0, 100)
                    .map((w, idx) => (
                      <div
                        key={idx}
                        className="px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {w.timestamp && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50 shrink-0">
                              {w.timestamp.slice(0, 4)}
                            </span>
                          )}
                          <span className="font-mono text-white/80 truncate">{w.url}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopy(w.url, `wb-${idx}`)}
                            className="p-1 text-white/40 hover:text-white"
                            title="Kopyala"
                          >
                            {copiedKey === `wb-${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                          <button
                            onClick={() => handleOpenURL(w.url)}
                            className="p-1 text-white/40 hover:text-white"
                            title="Aç"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                  <History size={36} className="text-white/30" />
                  <p className="text-xs text-white/50">
                    {target ? 'Wayback Machine arşiv kaydı bulunamadı veya henüz taranmadı.' : 'Lütfen üst arama çubuğuna bir hedef alan adı girin.'}
                  </p>
                  {target && target.trim() && onRefreshWayback && (
                    <button
                      onClick={() => onRefreshWayback(target)}
                      className="glass-btn-primary !py-1.5 !px-3.5 text-xs mt-1"
                    >
                      <span>Wayback Taramasını Başlat</span>
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
