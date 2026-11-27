'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  X,
  LayoutTemplate,
  Store,
  CreditCard,
  Download,
  CheckCircle2,
  Lock,
  Sparkles,
  Palette,
  Eye,
  SlidersHorizontal,
  FileText,
  Shield,
  Coffee,
  Utensils,
  Wifi,
  ShoppingBag,
  Star,
  Heart,
  Camera,
  Music,
  Phone,
  Mail,
  Globe,
  MapPin,
  Award,
  Zap,
  Key,
  Bell,
  Gift,
  Compass,
  Bookmark,
  DollarSign,
  Tag,
  Flame,
  Smile,
  Search,
  RotateCcw,
  Move,
  Loader2,
  Pipette,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortCode: string;
  label?: string | null;
  url: string;
  userTier?: string;
  isAdmin?: boolean;
  defaultHeadline?: string;
  defaultHeaderTag?: string;
  defaultSubline?: string;
  defaultFooterNote?: string;
  defaultTemplate?: TemplateType;
  featureBannerText?: string;
}

type TemplateType = 'table-tent' | 'window-sign' | 'card-badge' | 'full-poster';

export interface IconItem {
  id: string;
  label: string;
  tags: string[];
  path: string;
  fill?: boolean;
  color?: string;
}

export const BUILTIN_ICONS: IconItem[] = [
  {
    id: 'none',
    label: 'None',
    tags: ['clear', 'remove', 'empty'],
    path: '',
  },
  {
    id: 'star',
    label: 'Star',
    tags: ['rating', 'favorite', 'vip', 'top'],
    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    fill: true,
    color: '#F59E0B',
  },
  {
    id: 'utensils',
    label: 'Food',
    tags: ['restaurant', 'dining', 'menu', 'eat'],
    path: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
    color: '#11140F',
  },
  {
    id: 'wifi',
    label: 'Wi-Fi',
    tags: ['internet', 'network', 'wireless', 'connect'],
    path: 'M12 20h.01 M2 8.82a15 15 0 0 1 20 0 M5 12.86a10 10 0 0 1 14 0 M8.5 16.43a5 5 0 0 1 7 0',
    color: '#2563EB',
  },
  {
    id: 'coffee',
    label: 'Cafe',
    tags: ['drink', 'tea', 'espresso', 'barista'],
    path: 'M10 2v2 M14 2v2 M17 8h1a4 4 0 1 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 2v2',
    color: '#92400E',
  },
  {
    id: 'bag',
    label: 'Shop',
    tags: ['store', 'retail', 'cart', 'buy', 'ecommerce'],
    path: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0',
    color: '#2F6B4F',
  },
  {
    id: 'heart',
    label: 'Heart',
    tags: ['love', 'like', 'health', 'charity', 'beauty'],
    path: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
    fill: true,
    color: '#EF4444',
  },
  {
    id: 'sparkles',
    label: 'Sparkles',
    tags: ['magic', 'new', 'ai', 'clean', 'promo'],
    path: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z',
    fill: true,
    color: '#8B5CF6',
  },
  {
    id: 'zap',
    label: 'Fast',
    tags: ['speed', 'flash', 'energy', 'electric', 'power'],
    path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    fill: true,
    color: '#EAB308',
  },
  {
    id: 'shield',
    label: 'Security',
    tags: ['protect', 'verified', 'safe', 'trust'],
    path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    color: '#10B981',
  },
  {
    id: 'camera',
    label: 'Camera',
    tags: ['photo', 'instagram', 'gallery', 'shoot'],
    path: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    color: '#0284C7',
  },
  {
    id: 'music',
    label: 'Music',
    tags: ['sound', 'dj', 'audio', 'spotify', 'song'],
    path: 'M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    color: '#EC4899',
  },
  {
    id: 'phone',
    label: 'Call',
    tags: ['telephone', 'contact', 'support', 'mobile'],
    path: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    color: '#16A34A',
  },
  {
    id: 'mail',
    label: 'Email',
    tags: ['newsletter', 'inbox', 'message', 'letter'],
    path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
    color: '#EA580C',
  },
  {
    id: 'globe',
    label: 'Website',
    tags: ['web', 'portfolio', 'internet', 'link', 'url'],
    path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-9.9-10h19.8M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    color: '#4F46E5',
  },
  {
    id: 'flame',
    label: 'Hot / Deal',
    tags: ['fire', 'trend', 'sale', 'spicy', 'popular'],
    path: 'M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.88-1.5-2.5-2-4-.5 1.5-2 2.12-2 4z M12 2c-4 5-8 7.5-8 12a8 8 0 0 0 16 0c0-4.5-4-7-8-12z',
    fill: true,
    color: '#DC2626',
  },
  {
    id: 'gift',
    label: 'Promo',
    tags: ['present', 'discount', 'free', 'giveaway'],
    path: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    color: '#9333EA',
  },
  {
    id: 'trophy',
    label: 'Winner',
    tags: ['award', 'first', 'champion', 'contest'],
    path: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34 M18 2H6v7a6 6 0 0 0 12 0V2z',
    color: '#CA8A04',
  },
];

export const COLOR_PALETTES = [
  { name: 'Classic Ink', hex: '#11140F' },
  { name: 'Forest Green', hex: '#2F6B4F' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Crimson Red', hex: '#B91C1C' },
  { name: 'Royal Purple', hex: '#6B21A8' },
  { name: 'Amber Gold', hex: '#B45309' },
];

export const EXTENDED_SWATCHES = [
  { name: 'Emerald Neon', hex: '#10B981' },
  { name: 'Electric Blue', hex: '#2563EB' },
  { name: 'Sunset Coral', hex: '#F97316' },
  { name: 'Fuchsia Rose', hex: '#EC4899' },
  { name: 'Midnight Indigo', hex: '#4338CA' },
  { name: 'Deep Slate', hex: '#334155' },
];

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function drawCenterQrBadge(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  qrSize: number,
  activeIcon: IconItem | null,
  customPath?: string | null
) {
  if (!activeIcon && !customPath) return;
  const pathData = customPath || activeIcon?.path;
  if (!pathData) return;

  const badgeRadius = qrSize * 0.088;

  ctx.save();
  // 1. Crisp white circular badge backing with subtle border
  ctx.beginPath();
  ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = Math.max(2, Math.round(badgeRadius * 0.08));
  ctx.strokeStyle = 'rgba(17, 20, 15, 0.2)';
  ctx.stroke();

  // 2. Icon drawing scaled inside 24x24 viewBox
  const iconSize = badgeRadius * 1.25;
  ctx.translate(centerX, centerY);
  const scale = iconSize / 24;
  ctx.scale(scale, scale);
  ctx.translate(-12, -12);

  try {
    const p = new Path2D(pathData);
    if (activeIcon?.fill) {
      ctx.fillStyle = activeIcon.color || '#F59E0B';
      ctx.fill(p);
    } else {
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = activeIcon?.color || '#11140F';
      ctx.stroke(p);
    }
  } catch (err) {
    console.error('Failed to draw custom Path2D onto canvas:', err);
  }

  ctx.restore();
}

export default function PrintTemplateModal({
  isOpen,
  onClose,
  shortCode,
  label,
  url,
  userTier = 'free',
  isAdmin = false,
  defaultHeadline,
  defaultHeaderTag,
  defaultSubline,
  defaultFooterNote,
  defaultTemplate,
  featureBannerText,
}: Props) {
  const [template, setTemplate] = useState<TemplateType>(defaultTemplate || 'table-tent');
  const [headline, setHeadline] = useState(defaultHeadline || label || 'Scan to Open');
  const [headerTag, setHeaderTag] = useState(defaultHeaderTag || 'OFFICIAL SCAN POINT');
  const [subline, setSubline] = useState(defaultSubline || 'Point your camera at this code');
  const [footerNote, setFooterNote] = useState(defaultFooterNote || 'Powered by Dynamic QR');
  const [accentColor, setAccentColor] = useState('#11140F');
  const [hueValue, setHueValue] = useState(0);

  // Icon query & AI draw state
  const [selectedIconId, setSelectedIconId] = useState<string>('none');
  const [iconQuery, setIconQuery] = useState('');
  const [customAiIcon, setCustomAiIcon] = useState<{ name: string; path: string } | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Drag and Drop QR Placement State (inside card)
  const [qrOffset, setQrOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Paper Sheet Placement State (position of card on physical sheet of paper)
  const [paperX, setPaperX] = useState<number>(50); // percentage 12% - 88%
  const [paperY, setPaperY] = useState<number>(50); // percentage 12% - 88%
  const [qrSize, setQrSize] = useState<number>(85);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const paperSheetRef = useRef<HTMLDivElement>(null);
  const isDraggingPaperRef = useRef(false);

  // Element visibility toggles
  const [showHeaderTag, setShowHeaderTag] = useState(true);
  const [showSubline, setShowSubline] = useState(true);
  const [showShortCode, setShowShortCode] = useState(true);
  const [showFooterNote, setShowFooterNote] = useState(true);
  const [showBorder, setShowBorder] = useState(true);

  const [activeTab, setActiveTab] = useState<'content' | 'toggles' | 'design'>('content');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [lockedFeatureNotice, setLockedFeatureNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultTemplate) setTemplate(defaultTemplate);
      setHeadline(defaultHeadline || label || 'Scan to Open');
      if (defaultHeaderTag) setHeaderTag(defaultHeaderTag);
      if (defaultSubline) setSubline(defaultSubline);
      setFooterNote(defaultFooterNote || 'Powered by Dynamic QR');
      setQrOffset({ x: 0, y: 0 });
      setPaperX(50);
      setPaperY(50);
    }
  }, [isOpen, url, defaultHeadline, defaultHeaderTag, defaultSubline, defaultFooterNote, defaultTemplate, label]);

  // Adjust default QR size when template changes
  useEffect(() => {
    if (template === 'card-badge') setQrSize(85);
    else if (template === 'window-sign') setQrSize(120);
    else if (template === 'full-poster') setQrSize(135);
    else setQrSize(105);
  }, [template]);

  // Pointer drag events for QR positioning (inside card)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: qrOffset.x,
      initialY: qrOffset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setQrOffset({
      x: dragStartRef.current.initialX + dx,
      y: dragStartRef.current.initialY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Pointer events for placing / dragging card anywhere across the physical paper sheet
  const updatePaperCoords = (clientX: number, clientY: number) => {
    if (!paperSheetRef.current) return;
    const rect = paperSheetRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    const pctX = Math.round(Math.max(12, Math.min(88, (relX / rect.width) * 100)));
    const pctY = Math.round(Math.max(12, Math.min(88, (relY / rect.height) * 100)));
    setPaperX(pctX);
    setPaperY(pctY);
  };

  const handlePaperPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-qr-drag]')) return;
    e.preventDefault();
    (paperSheetRef.current as HTMLElement)?.setPointerCapture(e.pointerId);
    isDraggingPaperRef.current = true;
    setIsDraggingCard(true);
    updatePaperCoords(e.clientX, e.clientY);
  };

  const handlePaperPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPaperRef.current) return;
    updatePaperCoords(e.clientX, e.clientY);
  };

  const handlePaperPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingPaperRef.current) {
      isDraggingPaperRef.current = false;
      setIsDraggingCard(false);
      try {
        (paperSheetRef.current as HTMLElement)?.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // AI Icon generation handler
  const handleGenerateAiIcon = async (promptOverride?: string) => {
    const promptToUse = (promptOverride || aiPrompt || iconQuery).trim();
    if (!promptToUse) return;

    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai-draw-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse }),
      });
      const data = await res.json();
      if (data.success && data.svgPath) {
        setCustomAiIcon({ name: data.name || promptToUse, path: data.svgPath });
        setSelectedIconId('custom-ai');
      } else {
        setAiError(data.error || 'Could not generate icon.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Generation failed.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (!isOpen) return null;

  const tier = userTier.toLowerCase();
  const canCustomizeElements = true; // Drag & drop and colors allowed for all users as requested
  const canWhiteLabel = isAdmin || ['plus', 'ultra'].includes(tier);

  // Find active icon definition
  const activeIconDef: IconItem | null =
    selectedIconId === 'custom-ai' && customAiIcon
      ? {
          id: 'custom-ai',
          label: customAiIcon.name,
          tags: ['custom', 'ai'],
          path: customAiIcon.path,
          color: accentColor,
        }
      : BUILTIN_ICONS.find((i) => i.id === selectedIconId) || null;

  // Filtered icons for search
  const filteredIcons = BUILTIN_ICONS.filter((item) => {
    if (!iconQuery.trim()) return true;
    const q = iconQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Single-page isolated print routine: guarantees exactly 1 sheet of paper with placed QR
  const handlePrint = () => {
    const printSheet = document.getElementById('print-sheet');
    if (!printSheet) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const cloned = printSheet.cloneNode(true) as HTMLElement;
    cloned.querySelectorAll('[data-no-print], .no-print, [data-no-print="true"], [data-qr-drag-hint]').forEach((el) => el.remove());
    cloned.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('title');
      const txt = el.textContent?.trim().toLowerCase();
      if (txt === 'drag card on paper' || txt === 'drag qr' || txt === 'drag me' || txt === 'click and drag') {
        el.remove();
      }
    });
    const sheetHtml = cloned.innerHTML;
    const isBadge = template === 'card-badge';
    const isSign = template === 'window-sign';
    const isFullPoster = template === 'full-poster';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Template - ${shortCode}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            [data-no-print], .no-print, [data-no-print="true"], [data-qr-drag-hint] {
              display: none !important;
              visibility: hidden !important;
            }
            html, body {
              width: 100vw;
              height: 100vh;
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              position: relative;
              overflow: hidden;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .paper-page {
              width: 100vw;
              height: 100vh;
              position: relative;
              overflow: hidden;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-card {
              position: absolute;
              left: ${paperX}%;
              top: ${paperY}%;
              transform: translate(-50%, -50%);
              border: ${showBorder ? `3.5px solid ${accentColor} !important` : 'none !important'};
              border-radius: 20px !important;
              padding: ${isBadge ? '24px 30px' : isSign ? '36px' : isFullPoster ? '48px 36px' : '40px 28px'} !important;
              display: flex !important;
              flex-direction: ${isBadge ? 'row' : 'column'} !important;
              align-items: center !important;
              justify-content: space-between !important;
              text-align: ${isBadge ? 'left' : 'center'} !important;
              background-color: #ffffff !important;
              width: ${isBadge ? '500px' : isSign ? '540px' : isFullPoster ? '580px' : '460px'} !important;
              height: ${isBadge ? '280px' : isSign ? '540px' : isFullPoster ? '780px' : '640px'} !important;
              page-break-inside: avoid;
              break-inside: avoid;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-card h4 {
              font-size: ${isFullPoster ? '36px' : isSign ? '32px' : isBadge ? '24px' : '28px'} !important;
              font-weight: 700 !important;
              color: #11140F !important;
              line-height: 1.2 !important;
              margin: 6px 0 !important;
            }
            .print-card p {
              font-size: ${isFullPoster ? '18px' : isSign ? '16px' : isBadge ? '14px' : '15px'} !important;
              color: rgba(17, 20, 15, 0.7) !important;
              line-height: 1.4 !important;
              margin: 4px 0 !important;
            }
            .print-card [data-qr-drag="true"] {
              margin: 16px auto !important;
              padding: 16px !important;
              border: 2px solid ${accentColor}30 !important;
              border-radius: 20px !important;
              background: #ffffff !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .font-bold { font-weight: 700 !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
            .text-\\[10px\\] { font-size: 13px !important; }
            .text-\\[11px\\] { font-size: 14px !important; }
            .text-\\[12px\\] { font-size: 15px !important; }
            .text-\\[16px\\] { font-size: 22px !important; }
            .text-\\[20px\\] { font-size: 28px !important; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.12em; }
            .tracking-wider { letter-spacing: 0.06em; }
            .rounded-full { border-radius: 9999px !important; }
            .rounded-xl { border-radius: 16px !important; }
            .rounded-2xl { border-radius: 22px !important; }
            .text-white { color: #ffffff !important; }
            .px-3 { padding-left: 18px !important; padding-right: 18px !important; }
            .py-1 { padding-top: 8px !important; padding-bottom: 8px !important; }
            .p-2 { padding: 12px !important; }
            .p-3 { padding: 18px !important; }
            .border-2 { border-width: 2px !important; }
            .border { border-width: 1px !important; }
            .flex { display: flex !important; }
            .flex-1 { flex: 1 1 0% !important; }
            .items-center { align-items: center !important; }
            .justify-between { justify-content: space-between !important; }
            .gap-4 { gap: 24px !important; }
            .relative { position: relative !important; }
            .absolute { position: absolute !important; }
            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            .pointer-events-none { pointer-events: none !important; }
            .justify-center { justify-content: center !important; }
            .w-7 { width: 34px !important; }
            .h-7 { height: 34px !important; }
            .w-5 { width: 26px !important; }
            .h-5 { height: 26px !important; }
            .w-4 { width: 20px !important; }
            .h-4 { height: 20px !important; }
            .bg-white { background-color: #ffffff !important; }
            .shadow-sm, .shadow-md, .shadow-xs, .shadow-2xs { box-shadow: none !important; }
            svg {
              display: block !important;
              margin: 0 auto !important;
              width: ${isFullPoster ? '280px' : isSign ? '260px' : isBadge ? '160px' : '220px'} !important;
              height: ${isFullPoster ? '280px' : isSign ? '260px' : isBadge ? '160px' : '220px'} !important;
              max-width: 100% !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="paper-page">
            <div class="print-card">
              ${sheetHtml}
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 2000);
    }, 200);
  };

  // High-Resolution PNG Poster Download factoring in dragged coordinates
  const handleDownloadPoster = () => {
    const printSheet = document.getElementById('print-sheet');
    if (!printSheet) return;

    const svg = printSheet.querySelector('svg');
    if (!svg) return;

    setIsExporting(true);
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const isBadge = template === 'card-badge';
      const isSign = template === 'window-sign';
      const isFullPoster = template === 'full-poster';

      const width = isBadge ? 900 : isSign ? 900 : isFullPoster ? 1000 : 800;
      const height = isBadge ? 520 : isSign ? 900 : isFullPoster ? 1350 : 1100;

      // Scale dragged offset proportionally to canvas dimensions
      const sheetWidth = printSheet.clientWidth || 320;
      const scaleFactor = width / sheetWidth;
      const scaledOffsetX = qrOffset.x * scaleFactor;
      const scaledOffsetY = qrOffset.y * scaleFactor;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsExporting(false);
        return;
      }

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Border (if enabled)
      if (showBorder) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, width - 40, height - 40);
      }

      if (isBadge) {
        ctx.textAlign = 'left';
        if (showHeaderTag) {
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 24px monospace';
          ctx.fillText(headerTag, 64, 110);
        }

        ctx.fillStyle = '#11140F';
        ctx.font = 'bold 44px system-ui, sans-serif';
        ctx.fillText(headline, 64, showHeaderTag ? 180 : 140, 440);

        if (showSubline) {
          ctx.fillStyle = 'rgba(17, 20, 15, 0.65)';
          ctx.font = '26px system-ui, sans-serif';
          ctx.fillText(subline, 64, showHeaderTag ? 240 : 200, 440);
        }

        if (showShortCode) {
          ctx.fillStyle = 'rgba(17, 20, 15, 0.5)';
          ctx.font = '24px monospace';
          ctx.fillText(`/${shortCode}`, 64, 320);
        }

        // QR Image with dragged placement
        const qrSize = 260;
        const qrX = width - 320 + scaledOffsetX;
        const qrY = (height - qrSize) / 2 + scaledOffsetY;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        drawCenterQrBadge(ctx, qrX + qrSize / 2, qrY + qrSize / 2, qrSize, activeIconDef);
      } else {
        ctx.textAlign = 'center';
        let currentY = 80;

        if (showHeaderTag) {
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 26px monospace';
          ctx.fillText(headerTag, width / 2, currentY);
          currentY += 70;
        } else {
          currentY += 30;
        }

        ctx.fillStyle = '#11140F';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.fillText(headline, width / 2, currentY, width - 120);
        currentY += 60;

        if (showSubline) {
          ctx.fillStyle = 'rgba(17, 20, 15, 0.65)';
          ctx.font = '28px system-ui, sans-serif';
          ctx.fillText(subline, width / 2, currentY, width - 120);
          currentY += 50;
        }

        // Drag-and-drop QR placement
        const qrSize = isSign ? 440 : isFullPoster ? 500 : 380;
        const qrX = (width - qrSize) / 2 + scaledOffsetX;
        const qrY = (height - qrSize) / 2 + 20 + scaledOffsetY;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        drawCenterQrBadge(ctx, qrX + qrSize / 2, qrY + qrSize / 2, qrSize, activeIconDef);

        if (showShortCode) {
          ctx.fillStyle = accentColor;
          const badgeW = 280;
          const badgeH = 56;
          const badgeX = (width - badgeW) / 2;
          const badgeY = height - 160;
          ctx.beginPath();
          if ((ctx as any).roundRect) {
            (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 28);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 26px monospace';
          ctx.fillText(`/${shortCode}`, width / 2, badgeY + 38);
        }

        if (showFooterNote) {
          ctx.fillStyle = 'rgba(17, 20, 15, 0.5)';
          ctx.font = '22px system-ui, sans-serif';
          ctx.fillText(footerNote, width / 2, height - 55);
        }
      }

      const downloadLink = document.createElement('a');
      downloadLink.download = `${shortCode}-${template}-poster.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
      URL.revokeObjectURL(svgUrl);
      setIsExporting(false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      setIsExporting(false);
    };
    img.src = svgUrl;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      {/* Container Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0E1017] rounded-3xl max-w-6xl xl:max-w-7xl w-full border border-[#11140F]/15 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col h-[96vh] sm:h-[92vh] max-h-[960px] text-[#11140F] dark:text-white"
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#11140F]/10 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-[#0E1017] z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2F6B4F]/10 dark:bg-[#34D399]/15 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] sm:text-[17px] text-[#11140F] dark:text-white truncate">
                Physical Print Studio
              </h3>
              <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-emerald-700 dark:text-[#34D399] font-medium truncate">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Drag &amp; Drop Printable Sheet</span>
                <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[9.5px] font-mono font-bold shrink-0">
                  Open Studio
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile / Tablet Segmented Tab Toggle */}
            <div className="md:hidden flex items-center p-0.5 bg-[#EEF0EA] dark:bg-white/[0.08] rounded-xl text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setMobileTab('editor')}
                className={`py-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  mobileTab === 'editor'
                    ? 'bg-white dark:bg-[#1E2330] text-[#11140F] dark:text-white shadow-xs font-semibold'
                    : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Customize</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className={`py-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  mobileTab === 'preview'
                    ? 'bg-white dark:bg-[#1E2330] text-[#11140F] dark:text-white shadow-xs font-semibold'
                    : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>🖐️ Drag QR Sheet</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-[#11140F]/40 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white p-1.5 rounded-xl hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Print Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split 50/50 on tablets and desktop (>= 768px) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Side: Controls & Customization */}
          <div
            className={`p-4 sm:p-6 md:p-7 md:w-1/2 flex-col justify-between border-b md:border-b-0 md:border-r border-[#11140F]/10 dark:border-white/10 space-y-4 overflow-y-auto ${
              mobileTab === 'editor' ? 'flex' : 'hidden md:flex'
            }`}
          >
            <div className="space-y-4">
              {/* Feature Guidance Banner */}
              {featureBannerText && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11.5px] text-[#2F6B4F] dark:text-[#34D399] leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{featureBannerText}</span>
                </div>
              )}

              {/* Locked Feature Notice */}
              {lockedFeatureNotice && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-3 text-[12px] text-purple-700 dark:text-purple-300 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>{lockedFeatureNotice}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/pricing"
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] transition-colors"
                    >
                      Upgrade
                    </Link>
                    <button
                      type="button"
                      onClick={() => setLockedFeatureNotice(null)}
                      className="p-1 text-purple-700/60 dark:text-purple-300/60 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#EEF0EA] dark:bg-white/[0.05] rounded-xl text-[12px] font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'content'
                      ? 'bg-white dark:bg-white/15 text-[#11140F] dark:text-white shadow-xs font-semibold'
                      : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                  }`}
                >
                  Layout &amp; Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('toggles')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'toggles'
                      ? 'bg-white dark:bg-white/15 text-[#11140F] dark:text-white shadow-xs font-semibold'
                      : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  Element Toggles
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeTab === 'design'
                      ? 'bg-white dark:bg-white/15 text-[#11140F] dark:text-white shadow-xs font-semibold'
                      : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                  }`}
                >
                  <Palette className="w-3 h-3" />
                  Colors &amp; Logo
                </button>
              </div>

              {/* TAB 1: Layout & Text */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  {/* Format Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11.5px] font-semibold text-[#11140F]/70 dark:text-white/70 uppercase tracking-wider block">
                      Choose Format
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTemplate('table-tent');
                          setHeaderTag('TABLE MENU & SPECIALS');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          template === 'table-tent'
                            ? 'border-[#34D399] bg-[#34D399] text-[#09110D] shadow-xs'
                            : 'border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                        }`}
                      >
                        <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
                        <div className="text-[11.5px] font-semibold">Table Tent</div>
                        <div
                          className={`text-[9.5px] ${
                            template === 'table-tent' ? 'text-[#09110D]/70' : 'text-[#11140F]/50 dark:text-white/50'
                          }`}
                        >
                          4" × 6"
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTemplate('window-sign');
                          setHeaderTag('OFFICIAL SCAN POINT');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          template === 'window-sign'
                            ? 'border-[#34D399] bg-[#34D399] text-[#09110D] shadow-xs'
                            : 'border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5 shrink-0" />
                        <div className="text-[11.5px] font-semibold">Window Sign</div>
                        <div
                          className={`text-[9.5px] ${
                            template === 'window-sign' ? 'text-[#09110D]/70' : 'text-[#11140F]/50 dark:text-white/50'
                          }`}
                        >
                          8" × 8"
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTemplate('card-badge');
                          setHeaderTag('EVENT PASS');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          template === 'card-badge'
                            ? 'border-[#34D399] bg-[#34D399] text-[#09110D] shadow-xs'
                            : 'border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <div className="text-[11.5px] font-semibold">Badge Card</div>
                        <div
                          className={`text-[9.5px] ${
                            template === 'card-badge' ? 'text-[#09110D]/70' : 'text-[#11140F]/50 dark:text-white/50'
                          }`}
                        >
                          3.5" × 2"
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTemplate('full-poster');
                          setHeaderTag('SCAN TO CONNECT');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all relative cursor-pointer ${
                          template === 'full-poster'
                            ? 'border-[#34D399] bg-[#34D399] text-[#09110D] shadow-xs'
                            : 'border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <div className="text-[11.5px] font-semibold">Full Poster</div>
                        <div
                          className={`text-[9.5px] ${
                            template === 'full-poster' ? 'text-[#09110D]/70' : 'text-[#11140F]/50 dark:text-white/50'
                          }`}
                        >
                          A4 / Letter
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Text Customization Inputs */}
                  <div className="space-y-2.5">
                    {showHeaderTag && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11.5px] font-medium text-[#11140F]/70 dark:text-white/75">
                            Header Badge Tag
                          </label>
                        </div>
                        <input
                          type="text"
                          value={headerTag}
                          onChange={(e) => setHeaderTag(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-black/40 text-[#11140F] dark:text-white rounded-xl outline-none focus:border-[#34D399] font-mono"
                          placeholder="OFFICIAL SCAN POINT"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11.5px] font-medium text-[#11140F]/70 dark:text-white/75 block mb-1">
                        Headline Text
                      </label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-black/40 text-[#11140F] dark:text-white rounded-xl outline-none focus:border-[#34D399]"
                        placeholder="Scan for Menu"
                      />
                    </div>

                    {showSubline && (
                      <div>
                        <label className="text-[11.5px] font-medium text-[#11140F]/70 dark:text-white/75 block mb-1">
                          Instruction Subline
                        </label>
                        <input
                          type="text"
                          value={subline}
                          onChange={(e) => setSubline(e.target.value)}
                          className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-black/40 text-[#11140F] dark:text-white rounded-xl outline-none focus:border-[#34D399]"
                          placeholder="Point your phone camera"
                        />
                      </div>
                    )}

                    {showFooterNote && (
                      <div>
                        <label className="text-[11.5px] font-medium text-[#11140F]/70 dark:text-white/75 block mb-1">
                          Footer Note
                        </label>
                        <input
                          type="text"
                          value={footerNote}
                          onChange={(e) => setFooterNote(e.target.value)}
                          className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-black/40 text-[#11140F] dark:text-white rounded-xl outline-none focus:border-[#34D399]"
                          placeholder="Powered by Dynamic QR"
                        />
                      </div>
                    )}

                    {/* Paper Placement Section */}
                    <div className="space-y-3 pt-3 border-t border-[#11140F]/10 dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="text-[11.5px] font-semibold text-[#11140F]/70 dark:text-white/75 uppercase tracking-wider block">
                          Paper Print Placement
                        </label>
                        <span className="text-[10.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          X: {paperX}% · Y: {paperY}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#11140F]/60 dark:text-white/60">
                        Drag anywhere on the paper preview, or use the 9-point grid and sliders below to place the card at any exact point on the sheet.
                      </p>

                      {/* 9-Point Alignment Grid Matrix */}
                      <div className="grid grid-cols-3 gap-1 bg-[#EEF0EA] dark:bg-white/[0.04] p-1.5 rounded-xl border border-[#11140F]/10 dark:border-white/10">
                        {[
                          { x: 25, y: 22, label: '↖ Top-Left' },
                          { x: 50, y: 22, label: '⬆ Top / Fold' },
                          { x: 75, y: 22, label: '↗ Top-Right' },
                          { x: 25, y: 50, label: '⬅ Mid-Left' },
                          { x: 50, y: 50, label: '🎯 Center' },
                          { x: 75, y: 50, label: '➡ Mid-Right' },
                          { x: 25, y: 78, label: '↙ Btm-Left' },
                          { x: 50, y: 78, label: '⬇ Bottom' },
                          { x: 75, y: 78, label: '↘ Btm-Right' },
                        ].map(({ x, y, label }) => {
                          const isMatch = Math.abs(paperX - x) <= 5 && Math.abs(paperY - y) <= 5;
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => {
                                setPaperX(x);
                                setPaperY(y);
                              }}
                              className={`py-1.5 px-2 rounded-lg text-[10.5px] font-medium transition-all text-center cursor-pointer ${
                                isMatch
                                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                                  : 'text-[#11140F]/70 dark:text-white/70 hover:bg-white dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Fine-Tuning Coordinate Sliders */}
                      <div className="space-y-2 pt-1">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#11140F]/70 dark:text-white/70">
                            <span>Horizontal (X Coordinate)</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{paperX}%</span>
                          </div>
                          <input
                            type="range"
                            min="12"
                            max="88"
                            value={paperX}
                            onChange={(e) => setPaperX(Number(e.target.value))}
                            className="w-full h-1.5 rounded-lg accent-emerald-600 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#11140F]/70 dark:text-white/70">
                            <span>Vertical (Y Coordinate)</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{paperY}%</span>
                          </div>
                          <input
                            type="range"
                            min="12"
                            max="88"
                            value={paperY}
                            onChange={(e) => setPaperY(Number(e.target.value))}
                            className="w-full h-1.5 rounded-lg accent-emerald-600 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-[#11140F]/70 dark:text-white/70">
                            <span>QR Code Size on Sheet</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{qrSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="80"
                            max="220"
                            value={qrSize}
                            onChange={(e) => setQrSize(Number(e.target.value))}
                            className="w-full h-1.5 rounded-lg accent-emerald-600 cursor-pointer"
                          />
                        </div>
                      </div>

                      {(paperX !== 50 || paperY !== 50) && (
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-[#11140F]/60 dark:text-white/60">
                            Custom Position: X: {paperX}%, Y: {paperY}%
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPaperX(50);
                              setPaperY(50);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                          >
                            Reset to Center
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Element Toggles */}
              {activeTab === 'toggles' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-[#F7F8F5] dark:bg-white/[0.04] border border-[#11140F]/10 dark:border-white/10 text-[12px] space-y-1">
                    <div className="font-semibold text-[#11140F] dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
                      Clean &amp; Minimalist Print Customizer
                    </div>
                    <p className="text-[#11140F]/65 dark:text-white/60 text-[11.5px]">
                      Turn off extra labels to produce an ultra-minimal card containing only your QR code and title.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Toggle 1: Header Tag */}
                    <div className="p-3 rounded-xl border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-white/[0.03]">
                      <div>
                        <span className="text-[12.5px] font-semibold text-[#11140F] dark:text-white block">
                          Top Header Badge
                        </span>
                        <p className="text-[11px] text-[#11140F]/55 dark:text-white/55">
                          Display or remove "OFFICIAL SCAN POINT"
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showHeaderTag}
                        onChange={(e) => setShowHeaderTag(e.target.checked)}
                        className="w-4 h-4 accent-[#34D399] cursor-pointer"
                      />
                    </div>

                    {/* Toggle 2: Instruction Subline */}
                    <div className="p-3 rounded-xl border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-white/[0.03]">
                      <div>
                        <span className="text-[12.5px] font-semibold text-[#11140F] dark:text-white block">
                          Instruction Subline
                        </span>
                        <p className="text-[11px] text-[#11140F]/55 dark:text-white/55">
                          "Point your camera at this code"
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showSubline}
                        onChange={(e) => setShowSubline(e.target.checked)}
                        className="w-4 h-4 accent-[#34D399] cursor-pointer"
                      />
                    </div>

                    {/* Toggle 3: Shortcode Slug Pill */}
                    <div className="p-3 rounded-xl border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-white/[0.03]">
                      <div>
                        <span className="text-[12.5px] font-semibold text-[#11140F] dark:text-white block">
                          Short URL Badge
                        </span>
                        <p className="text-[11px] text-[#11140F]/55 dark:text-white/55">
                          Bottom pill showing <code>/{shortCode}</code>
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showShortCode}
                        onChange={(e) => setShowShortCode(e.target.checked)}
                        className="w-4 h-4 accent-[#34D399] cursor-pointer"
                      />
                    </div>

                    {/* Toggle 4: Footer Note */}
                    <div className="p-3 rounded-xl border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-white/[0.03]">
                      <div>
                        <span className="text-[12.5px] font-semibold text-[#11140F] dark:text-white block">
                          Footer Note
                        </span>
                        <p className="text-[11px] text-[#11140F]/55 dark:text-white/55">
                          "Powered by Dynamic QR"
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showFooterNote}
                        onChange={(e) => setShowFooterNote(e.target.checked)}
                        className="w-4 h-4 accent-[#34D399] cursor-pointer"
                      />
                    </div>

                    {/* Toggle 5: Outer Border */}
                    <div className="p-3 rounded-xl border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 bg-white dark:bg-white/[0.03]">
                      <div>
                        <span className="text-[12.5px] font-semibold text-[#11140F] dark:text-white block">
                          Card Outer Border
                        </span>
                        <p className="text-[11px] text-[#11140F]/55 dark:text-white/55">
                          Draw outline around card or leave frameless
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showBorder}
                        onChange={(e) => setShowBorder(e.target.checked)}
                        className="w-4 h-4 accent-[#34D399] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Colors & Logo */}
              {activeTab === 'design' && (
                <div className="space-y-4">
                  {/* Brand Color & Continuous Spectrum Band */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11.5px] font-semibold text-[#11140F]/70 dark:text-white/75 uppercase tracking-wider block">
                        Select from Band of Colors
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span className="text-[11px] font-mono font-bold text-[#11140F] dark:text-white">
                          {accentColor}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Rainbow / Hue Color Band Slider */}
                    <div className="p-3 rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/[0.03] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#11140F]/60 dark:text-white/60">
                        <span>Continuous Hue Spectrum</span>
                        <span>Drag slider across spectrum</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={hueValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHueValue(val);
                          const hex = hslToHex(val, 85, 45);
                          setAccentColor(hex);
                        }}
                        className="w-full h-4 rounded-xl cursor-pointer appearance-none outline-none shadow-xs"
                        style={{
                          background:
                            'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                        }}
                      />

                      {/* Native Color Pipette & Manual Hex Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="relative flex items-center">
                          <input
                            type="color"
                            value={accentColor.startsWith('#') ? accentColor : '#11140F'}
                            onChange={(e) => setAccentColor(e.target.value.toUpperCase())}
                            className="w-8 h-8 rounded-xl border border-[#11140F]/15 dark:border-white/15 cursor-pointer p-0.5 bg-white dark:bg-[#1E2330]"
                            title="Pick exact custom color"
                          />
                        </div>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-[#11140F]/40 dark:text-white/40">
                            #
                          </span>
                          <input
                            type="text"
                            maxLength={7}
                            value={accentColor.replace('#', '')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                              if (val.length <= 6) {
                                setAccentColor(`#${val}`.toUpperCase());
                              }
                            }}
                            className="w-full pl-6 pr-3 py-1.5 text-[12px] font-mono border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#1E2330] rounded-xl outline-none text-[#11140F] dark:text-white focus:border-[#34D399]"
                            placeholder="11140F"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Swatches Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
                      {[...COLOR_PALETTES, ...EXTENDED_SWATCHES].map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setAccentColor(color.hex)}
                          className={`p-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                            accentColor.toUpperCase() === color.hex.toUpperCase()
                              ? 'border-[#34D399] ring-2 ring-[#34D399]/20 font-semibold bg-white dark:bg-white/10 text-[#11140F] dark:text-white'
                              : 'border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F]/80 dark:text-white/80 hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[10px] truncate">{color.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Center QR Badge & Searchable Icons + AI Draw */}
                  <div className="space-y-2.5 pt-3 border-t border-[#11140F]/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-[11.5px] font-semibold text-[#11140F]/70 dark:text-white/75 uppercase tracking-wider block">
                        Center QR Badge &amp; Icon Query
                      </label>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-[#2F6B4F] dark:text-[#34D399] font-bold">
                        Search or AI Draw
                      </span>
                    </div>

                    {/* Search Bar for Icons */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#11140F]/40 dark:text-white/40" />
                      <input
                        type="text"
                        value={iconQuery}
                        onChange={(e) => setIconQuery(e.target.value)}
                        placeholder="Search icon (e.g. food, wifi, camera, star, car, flame)..."
                        className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-black/40 text-[#11140F] dark:text-white rounded-xl outline-none focus:border-[#34D399]"
                      />
                    </div>

                    {/* Filtered Icon Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {/* AI Generated Badge (if exists) */}
                      {customAiIcon && (
                        <button
                          type="button"
                          onClick={() => setSelectedIconId('custom-ai')}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 text-left transition-all cursor-pointer ${
                            selectedIconId === 'custom-ai'
                              ? 'border-[#34D399] bg-[#34D399] text-[#09110D] font-bold shadow-xs'
                              : 'border-purple-300 dark:border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-medium truncate">AI: {customAiIcon.name}</span>
                        </button>
                      )}

                      {filteredIcons.map((item) => {
                        const isSelected = selectedIconId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedIconId(item.id)}
                            className={`p-2 rounded-xl border flex items-center gap-1.5 text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#34D399] bg-[#34D399] text-[#09110D] font-bold shadow-xs'
                                : 'border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                            }`}
                          >
                            {item.id === 'none' ? (
                              <X className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                className="w-3.5 h-3.5 shrink-0"
                                fill={item.fill ? item.color || '#11140F' : 'none'}
                                stroke={item.fill ? 'none' : item.color || '#11140F'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d={item.path} />
                              </svg>
                            )}
                            <span className="text-[11px] font-medium truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* AI Icon Draw Option if not found or user wants custom */}
                    <div className="p-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Can't find what you fancy? Draw with AI
                        </span>
                        <span className="text-[9.5px] font-mono text-purple-600 dark:text-purple-400">Instant SVG</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleGenerateAiIcon();
                          }}
                          placeholder={iconQuery ? `Draw "${iconQuery}" with AI...` : 'e.g. dragon, guitar, pizza, crown...'}
                          className="flex-1 px-3 py-1.5 text-[12px] border border-purple-300 dark:border-purple-500/40 bg-white dark:bg-black/50 text-[#11140F] dark:text-white rounded-xl outline-none focus:border-purple-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleGenerateAiIcon()}
                          disabled={isGeneratingAi || (!aiPrompt.trim() && !iconQuery.trim())}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11.5px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isGeneratingAi ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Drawing…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Draw</span>
                            </>
                          )}
                        </button>
                      </div>
                      {aiError && <p className="text-[10.5px] text-red-600">{aiError}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons in Left Panel */}
            <div className="pt-4 space-y-2 shrink-0 border-t border-[#11140F]/10 dark:border-white/10">
              <div className="md:hidden space-y-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className="w-full py-3 px-4 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  <Move className="w-4 h-4" />
                  <span>🖐️ Open Sheet &amp; Drag QR Code &rarr;</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#11140F]/20 dark:border-white/15 bg-white dark:bg-white/[0.05] text-[#11140F] dark:text-white text-[12.5px] font-medium hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print (1 Sheet)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPoster}
                    disabled={isExporting}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-[#11140F]/20 dark:border-white/15 bg-white dark:bg-white/[0.05] text-[#11140F] dark:text-white text-[12.5px] font-medium hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Exporting…' : 'PNG'}</span>
                  </button>
                </div>
              </div>

              {/* On Desktop & Tablet: Full Print & Download Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  <Printer className="w-4 h-4" />
                  Print (1 Sheet) / Save PDF
                </button>
                <button
                  onClick={handleDownloadPoster}
                  disabled={isExporting}
                  className="py-3 px-4 rounded-xl border border-[#11140F]/20 dark:border-white/15 bg-white dark:bg-white/[0.05] text-[#11140F] dark:text-white text-[13.5px] font-medium hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  title="Download high-resolution PNG poster"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting…' : 'PNG Poster'}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-1.5 px-4 rounded-xl text-[#11140F]/60 dark:text-white/55 text-[12px] font-medium hover:text-[#11140F] dark:hover:text-white transition-colors cursor-pointer"
              >
                Close Print Studio
              </button>
            </div>
          </div>

          {/* Right Side: Live Printable Preview with Drag & Drop */}
          <div
            className={`p-4 sm:p-6 md:p-8 md:w-1/2 bg-[#F4F5F1] dark:bg-black/40 flex-col items-center justify-between overflow-y-auto min-h-0 select-none ${
              mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Top Toolbar: Reset position & guidance */}
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#11140F]/10 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#11140F]/70 dark:text-white/70">
                <Move className="w-3.5 h-3.5 text-emerald-600" />
                <span>Drag card on paper or choose position below</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(paperX !== 50 || paperY !== 50 || qrOffset.x !== 0 || qrOffset.y !== 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaperX(50);
                      setPaperY(50);
                      setQrOffset({ x: 0, y: 0 });
                    }}
                    className="px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 text-[11px] font-semibold text-[#11140F] dark:text-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Center</span>
                  </button>
                )}
              </div>
            </div>

            {/* Centered Preview Canvas / Scaled Paper Sheet Container */}
            <div className="w-full flex-1 flex items-center justify-center py-2 sm:py-3 overflow-hidden min-h-[340px]">
              <div className="transform scale-[0.88] sm:scale-[0.94] md:scale-100 lg:scale-[1.05] origin-center transition-transform">
                {/* Physical Paper Sheet (A4 / Letter proportions) with pointer handlers */}
                <div
                  ref={paperSheetRef}
                  onPointerDown={handlePaperPointerDown}
                  onPointerMove={handlePaperPointerMove}
                  onPointerUp={handlePaperPointerUp}
                  className="w-[380px] sm:w-[440px] md:w-[480px] h-[538px] sm:h-[622px] md:h-[678px] bg-white rounded-xl shadow-2xl border-2 border-[#11140F]/20 relative overflow-hidden transition-all select-none cursor-crosshair"
                >
                  {/* Subtle Sheet Watermark */}
                  <div
                    data-no-print="true"
                    className="no-print absolute top-2 right-3 text-[9px] font-mono text-black/35 uppercase tracking-wider pointer-events-none select-none"
                  >
                    Sheet: A4 (210 × 297 mm)
                  </div>

                  {/* Subtle Grid / Center Alignment Crosshairs */}
                  <div data-no-print="true" className="no-print absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute left-1/2 top-0 bottom-0 border-r border-dashed border-black/40" />
                    <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-black/40" />
                  </div>

                  {/* Table Tent Center Fold Line */}
                  {template === 'table-tent' && (
                    <div
                      data-no-print="true"
                      className="no-print absolute top-1/2 left-0 right-0 border-b border-dashed border-black/30 pointer-events-none z-10 flex items-center justify-center"
                    >
                      <span className="px-2 py-0.5 rounded bg-black/5 text-[8.5px] font-mono text-black/40 -translate-y-1/2 select-none">
                        Fold Line (for standing tent)
                      </span>
                    </div>
                  )}

                  {/* Live Placement Tag pinned to sheet corner */}
                  <div
                    data-no-print="true"
                    className="no-print absolute bottom-2 left-3 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono pointer-events-none z-10 select-none"
                  >
                    Position: X: {paperX}% · Y: {paperY}%
                  </div>

                  {/* The Draggable Printable Card (#print-sheet) */}
                  <div
                    id="print-sheet"
                    className={`bg-white shadow-md transition-shadow flex flex-col items-center justify-between text-center relative overflow-hidden group/card ${
                      isDraggingCard ? 'cursor-grabbing ring-2 ring-emerald-500 shadow-xl' : 'cursor-grab hover:shadow-lg'
                    } ${
                      showBorder ? 'border-2' : ''
                    } ${
                      template === 'table-tent'
                        ? 'w-[230px] sm:w-[260px] md:w-[280px] h-[310px] sm:h-[350px] md:h-[390px] p-4 sm:p-5 rounded-2xl'
                        : template === 'window-sign'
                        ? 'w-[250px] sm:w-[280px] md:w-[310px] h-[250px] sm:h-[280px] md:h-[310px] p-4 sm:p-5 rounded-2xl'
                        : template === 'full-poster'
                        ? 'w-[260px] sm:w-[290px] md:w-[330px] h-[370px] sm:h-[420px] md:h-[470px] p-5 sm:p-6 rounded-2xl'
                        : 'w-[270px] sm:w-[310px] md:w-[340px] h-[160px] sm:h-[185px] md:h-[200px] p-4 sm:p-5 rounded-xl flex-row text-left'
                    }`}
                    style={{
                      position: 'absolute',
                      left: `${paperX}%`,
                      top: `${paperY}%`,
                      transform: 'translate(-50%, -50%)',
                      borderColor: accentColor,
                      touchAction: 'none',
                    }}
                    title="Click and drag to position this card anywhere on the sheet of paper"
                  >
                    {template === 'card-badge' ? (
                      // Horizontal Card Layout
                      <div className="flex items-center justify-between w-full gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          {showHeaderTag && (
                            <div
                              className="text-[10px] uppercase font-mono tracking-wider font-bold"
                              style={{ color: accentColor }}
                            >
                              {headerTag}
                            </div>
                          )}
                          <h4 className="font-bold text-[16px] text-[#11140F] leading-tight truncate">
                            {headline}
                          </h4>
                          {showSubline && <p className="text-[11px] text-[#11140F]/65">{subline}</p>}
                          {showShortCode && (
                            <div className="pt-1 font-mono text-[10px] text-[#11140F]/50 truncate">
                              /{shortCode}
                            </div>
                          )}
                        </div>

                        {/* Draggable QR in badge */}
                        <div
                          data-qr-drag="true"
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className={`p-2 border rounded-xl bg-white shadow-xs shrink-0 relative transition-shadow ${
                            isDragging ? 'ring-2 ring-emerald-500 shadow-md cursor-grabbing' : 'cursor-grab hover:shadow-md'
                          }`}
                          style={{
                            borderColor: `${accentColor}30`,
                            transform: `translate(${qrOffset.x}px, ${qrOffset.y}px)`,
                            touchAction: 'none',
                          }}
                          title="Click and drag to place QR inside card"
                        >
                          <QRCodeSVG value={url} size={qrSize} level="H" fgColor={accentColor} />
                          {activeIconDef && activeIconDef.path && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-5 h-5 rounded-full bg-white shadow-xs border border-[#11140F]/20 flex items-center justify-center">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-3 h-3"
                                  fill={activeIconDef.fill ? activeIconDef.color || '#F59E0B' : 'none'}
                                  stroke={activeIconDef.fill ? 'none' : activeIconDef.color || '#11140F'}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d={activeIconDef.path} />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Vertical / Square Posters
                      <>
                        <div className="space-y-1">
                          {showHeaderTag && (
                            <div
                              className="text-[10px] sm:text-[11px] uppercase font-mono tracking-widest font-bold"
                              style={{ color: accentColor }}
                            >
                              {headerTag}
                            </div>
                          )}
                          <h4 className="font-bold text-[18px] sm:text-[21px] md:text-[23px] text-[#11140F] leading-tight tracking-tight">
                            {headline}
                          </h4>
                          {showSubline && <p className="text-[11.5px] sm:text-[12.5px] text-[#11140F]/65">{subline}</p>}
                        </div>

                        {/* Interactive Drag-and-Drop QR Container */}
                        <div
                          data-qr-drag="true"
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className={`p-3 border-2 rounded-2xl bg-white shadow-sm my-2 relative transition-shadow group ${
                            isDragging ? 'ring-2 ring-emerald-500 shadow-lg cursor-grabbing' : 'cursor-grab hover:shadow-md'
                          }`}
                          style={{
                            borderColor: accentColor,
                            transform: `translate(${qrOffset.x}px, ${qrOffset.y}px)`,
                            touchAction: 'none',
                          }}
                          title="Click and drag to reposition QR inside card"
                        >
                          <QRCodeSVG
                            value={url}
                            size={qrSize}
                            level="H"
                            fgColor={accentColor}
                          />
                          {activeIconDef && activeIconDef.path && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-[#11140F]/20 flex items-center justify-center">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-4 h-4"
                                  fill={activeIconDef.fill ? activeIconDef.color || '#F59E0B' : 'none'}
                                  stroke={activeIconDef.fill ? 'none' : activeIconDef.color || '#11140F'}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d={activeIconDef.path} />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          {showShortCode && (
                            <div
                              className="inline-block px-3 py-1 rounded-full text-white text-[11px] sm:text-[12px] font-mono shadow-2xs"
                              style={{ backgroundColor: accentColor }}
                            >
                              /{shortCode}
                            </div>
                          )}
                          {showFooterNote && <p className="text-[10px] sm:text-[11px] text-[#11140F]/50 font-medium">{footerNote}</p>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons in Right Panel */}
            <div className="w-full max-w-sm pt-4 space-y-2 shrink-0">
              <button
                onClick={handlePrint}
                className="w-full py-3 px-4 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                <Printer className="w-4 h-4" />
                Print (1 Sheet) / Save PDF
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPoster}
                  disabled={isExporting}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-[#11140F]/20 dark:border-white/15 bg-white dark:bg-white/[0.05] text-[#11140F] dark:text-white text-[12.5px] font-medium hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting…' : 'PNG Poster'}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('editor')}
                  className="lg:hidden py-2.5 px-3 rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.05] text-[#11140F] dark:text-white text-[12.5px] font-medium hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
