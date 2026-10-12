'use client';

import { useState } from 'react';
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
}

type TemplateType = 'table-tent' | 'window-sign' | 'card-badge' | 'full-poster';
type CenterLogoType = 'none' | 'star' | 'utensils' | 'wifi' | 'coffee' | 'bag';

const COLOR_PALETTES = [
  { name: 'Classic Ink', hex: '#11140F' },
  { name: 'Forest Green', hex: '#2F6B4F' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Crimson Red', hex: '#B91C1C' },
  { name: 'Royal Purple', hex: '#6B21A8' },
  { name: 'Amber Gold', hex: '#B45309' },
];

export default function PrintTemplateModal({
  isOpen,
  onClose,
  shortCode,
  label,
  url,
  userTier = 'free',
  isAdmin = false,
}: Props) {
  const [template, setTemplate] = useState<TemplateType>('table-tent');
  const [headline, setHeadline] = useState(label || 'Scan to Open');
  const [headerTag, setHeaderTag] = useState('OFFICIAL SCAN POINT');
  const [subline, setSubline] = useState('Point your camera at this code');
  const [footerNote, setFooterNote] = useState('No app required • Instant redirect');
  const [accentColor, setAccentColor] = useState('#11140F');
  const [centerLogo, setCenterLogo] = useState<CenterLogoType>('none');

  // Element visibility toggles
  const [showHeaderTag, setShowHeaderTag] = useState(true);
  const [showSubline, setShowSubline] = useState(true);
  const [showShortCode, setShowShortCode] = useState(true);
  const [showFooterNote, setShowFooterNote] = useState(true);
  const [showBorder, setShowBorder] = useState(true);

  const [activeTab, setActiveTab] = useState<'content' | 'toggles' | 'design'>('content');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const tier = userTier.toLowerCase();
  const canCustomizeElements = isAdmin || ['pro', 'plus', 'ultra'].includes(tier);
  const canWhiteLabel = isAdmin || ['plus', 'ultra'].includes(tier);
  const canUseLogos = isAdmin || ['plus', 'ultra'].includes(tier);

  // Single-page isolated print routine: guarantees exactly 1 sheet of paper
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

    const sheetHtml = printSheet.innerHTML;
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
              size: auto;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .print-card {
              border: ${showBorder ? `2px solid ${accentColor}` : 'none'};
              border-radius: 20px;
              padding: ${isBadge ? '24px 32px' : isSign ? '36px' : isFullPoster ? '48px 36px' : '40px 28px'};
              display: flex;
              flex-direction: ${isBadge ? 'row' : 'column'};
              align-items: center;
              justify-content: space-between;
              text-align: ${isBadge ? 'left' : 'center'};
              background: #ffffff;
              width: ${isBadge ? '420px' : isSign ? '440px' : isFullPoster ? '520px' : '360px'};
              height: ${isBadge ? '230px' : isSign ? '440px' : isFullPoster ? '700px' : '520px'};
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
            .text-\\[10px\\] { font-size: 11px; }
            .text-\\[11px\\] { font-size: 12px; }
            .text-\\[12px\\] { font-size: 13px; }
            .text-\\[16px\\] { font-size: 18px; }
            .text-\\[20px\\] { font-size: 24px; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.12em; }
            .tracking-wider { letter-spacing: 0.06em; }
            .space-y-1 > * + * { margin-top: 6px; }
            .space-y-1\\.5 > * + * { margin-top: 8px; }
            .rounded-full { border-radius: 9999px; }
            .rounded-xl { border-radius: 14px; }
            .rounded-2xl { border-radius: 20px; }
            .text-white { color: #ffffff; }
            .px-3 { padding-left: 14px; padding-right: 14px; }
            .py-1 { padding-top: 6px; padding-bottom: 6px; }
            .p-2 { padding: 10px; }
            .p-3 { padding: 16px; }
            .border-2 { border-width: 2px; }
            .border { border-width: 1px; }
            .flex { display: flex; }
            .flex-1 { flex: 1 1 0%; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .gap-4 { gap: 20px; }
            .my-2 { margin-top: 14px; margin-bottom: 14px; }
            .inline-block { display: inline-block; }
            svg { display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="print-card">
            ${sheetHtml}
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

  // High-Resolution PNG Poster Download
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

        // QR Image
        ctx.drawImage(img, width - 320, (height - 260) / 2, 260, 260);
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

        // Centered QR Image
        const qrSize = isSign ? 440 : isFullPoster ? 500 : 380;
        const qrY = (height - qrSize) / 2 + 20;
        ctx.drawImage(img, (width - qrSize) / 2, qrY, qrSize, qrSize);

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
    img.src = svgUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Container Card */}
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-[#11140F]/15 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Left Side: Controls & Customization */}
        <div className="p-5 sm:p-7 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#11140F]/10 space-y-5 overflow-y-auto">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] sm:text-[17px] text-[#11140F]">Physical Print Studio</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guaranteed 1-Page Output</span>
                    {canWhiteLabel && (
                      <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                        100% White-Label
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#11140F]/40 hover:text-[#11140F] p-1 rounded-lg transition-colors md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs: Format, Text Content, Visibility Toggles, Theme */}
            <div className="flex items-center gap-1.5 p-1 bg-[#EEF0EA] rounded-xl text-[12px] font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                  activeTab === 'content'
                    ? 'bg-white text-[#11140F] shadow-xs font-semibold'
                    : 'text-[#11140F]/60 hover:text-[#11140F]'
                }`}
              >
                Layout & Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('toggles')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'toggles'
                    ? 'bg-white text-[#11140F] shadow-xs font-semibold'
                    : 'text-[#11140F]/60 hover:text-[#11140F]'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" />
                Element Toggles
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'design'
                    ? 'bg-white text-[#11140F] shadow-xs font-semibold'
                    : 'text-[#11140F]/60 hover:text-[#11140F]'
                }`}
              >
                <Palette className="w-3 h-3" />
                Colors & Logo
              </button>
            </div>

            {/* TAB 1: Layout & Text */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                {/* Format Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-semibold text-[#11140F]/70 uppercase tracking-wider block">
                    Choose Format
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplate('table-tent');
                        setHeaderTag('TABLE MENU & SPECIALS');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        template === 'table-tent'
                          ? 'border-[#11140F] bg-[#11140F] text-white shadow-xs'
                          : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                      }`}
                    >
                      <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
                      <div className="text-[11.5px] font-semibold">Table Tent</div>
                      <div className={`text-[9.5px] ${template === 'table-tent' ? 'text-white/70' : 'text-[#11140F]/50'}`}>4" × 6"</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTemplate('window-sign');
                        setHeaderTag('OFFICIAL SCAN POINT');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        template === 'window-sign'
                          ? 'border-[#11140F] bg-[#11140F] text-white shadow-xs'
                          : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <div className="text-[11.5px] font-semibold">Window Sign</div>
                      <div className={`text-[9.5px] ${template === 'window-sign' ? 'text-white/70' : 'text-[#11140F]/50'}`}>8" × 8"</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTemplate('card-badge');
                        setHeaderTag('EVENT PASS');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        template === 'card-badge'
                          ? 'border-[#11140F] bg-[#11140F] text-white shadow-xs'
                          : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <div className="text-[11.5px] font-semibold">Badge Card</div>
                      <div className={`text-[9.5px] ${template === 'card-badge' ? 'text-white/70' : 'text-[#11140F]/50'}`}>3.5" × 2"</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!canWhiteLabel) {
                          alert('Full-Page Posters (A4/Letter) are unlocked on Plus & Ultra plans.');
                          return;
                        }
                        setTemplate('full-poster');
                        setHeaderTag('SCAN TO CONNECT');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all relative ${
                        template === 'full-poster'
                          ? 'border-[#11140F] bg-[#11140F] text-white shadow-xs'
                          : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                      }`}
                    >
                      {!canWhiteLabel && (
                        <span className="absolute top-1.5 right-1.5">
                          <Lock className="w-3 h-3 text-amber-600" />
                        </span>
                      )}
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <div className="text-[11.5px] font-semibold">Full Poster</div>
                      <div className={`text-[9.5px] ${template === 'full-poster' ? 'text-white/70' : 'text-[#11140F]/50'}`}>A4 / Letter</div>
                    </button>
                  </div>
                </div>

                {/* Text Customization Inputs */}
                <div className="space-y-2.5">
                  {showHeaderTag && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11.5px] font-medium text-[#11140F]/70">Header Badge Tag</label>
                        {!canWhiteLabel && (
                          <span className="text-[10px] text-purple-700 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Plus to customize
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={!canWhiteLabel}
                        value={headerTag}
                        onChange={(e) => setHeaderTag(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F] disabled:bg-[#EEF0EA]/50 disabled:opacity-75 font-mono"
                        placeholder="OFFICIAL SCAN POINT"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11.5px] font-medium text-[#11140F]/70 block mb-1">Headline Text</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                      placeholder="Scan for Menu"
                    />
                  </div>

                  {showSubline && (
                    <div>
                      <label className="text-[11.5px] font-medium text-[#11140F]/70 block mb-1">Instruction Subline</label>
                      <input
                        type="text"
                        value={subline}
                        onChange={(e) => setSubline(e.target.value)}
                        className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                        placeholder="Point your phone camera"
                      />
                    </div>
                  )}

                  {showFooterNote && (
                    <div>
                      <label className="text-[11.5px] font-medium text-[#11140F]/70 block mb-1">Footer Note</label>
                      <input
                        type="text"
                        value={footerNote}
                        onChange={(e) => setFooterNote(e.target.value)}
                        className="w-full px-3 py-2 text-[12.5px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                        placeholder="Free guest Wi-Fi"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Element Toggles (Removes Extra Stuff) */}
            {activeTab === 'toggles' && (
              <div className="space-y-3.5">
                <div className="p-3 rounded-xl bg-[#F7F8F5] border border-[#11140F]/10 text-[12px] space-y-1">
                  <div className="font-semibold text-[#11140F] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Clean & Minimalist Print Customizer
                  </div>
                  <p className="text-[#11140F]/65 text-[11.5px]">
                    Turn off extra labels to produce an ultra-minimal card containing only your QR code and title.
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Toggle 1: Header Tag ("OFFICIAL SCAN POINT") - White-label */}
                  <div className="p-3 rounded-xl border border-[#11140F]/10 flex items-center justify-between gap-3 bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-[#11140F]">Top Header Badge</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                          Plus / White-Label
                        </span>
                      </div>
                      <p className="text-[11px] text-[#11140F]/55">
                        Display or completely remove "OFFICIAL SCAN POINT"
                      </p>
                    </div>
                    {canWhiteLabel ? (
                      <input
                        type="checkbox"
                        checked={showHeaderTag}
                        onChange={(e) => setShowHeaderTag(e.target.checked)}
                        className="w-4 h-4 accent-[#11140F] cursor-pointer"
                      />
                    ) : (
                      <Link
                        href="/pricing"
                        className="text-[11px] font-semibold text-purple-700 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Lock className="w-3 h-3" />
                        Unlock
                      </Link>
                    )}
                  </div>

                  {/* Toggle 2: Instruction Subline */}
                  <div className="p-3 rounded-xl border border-[#11140F]/10 flex items-center justify-between gap-3 bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-[#11140F]">Instruction Subline</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Pro Feature
                        </span>
                      </div>
                      <p className="text-[11px] text-[#11140F]/55">
                        "Point your camera at this code"
                      </p>
                    </div>
                    {canCustomizeElements ? (
                      <input
                        type="checkbox"
                        checked={showSubline}
                        onChange={(e) => setShowSubline(e.target.checked)}
                        className="w-4 h-4 accent-[#11140F] cursor-pointer"
                      />
                    ) : (
                      <Link
                        href="/pricing"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Lock className="w-3 h-3" />
                        Pro Plan
                      </Link>
                    )}
                  </div>

                  {/* Toggle 3: Shortcode Slug Pill */}
                  <div className="p-3 rounded-xl border border-[#11140F]/10 flex items-center justify-between gap-3 bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-[#11140F]">Short URL Badge</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Pro Feature
                        </span>
                      </div>
                      <p className="text-[11px] text-[#11140F]/55">
                        Bottom pill showing <code>/{shortCode}</code>
                      </p>
                    </div>
                    {canCustomizeElements ? (
                      <input
                        type="checkbox"
                        checked={showShortCode}
                        onChange={(e) => setShowShortCode(e.target.checked)}
                        className="w-4 h-4 accent-[#11140F] cursor-pointer"
                      />
                    ) : (
                      <Link
                        href="/pricing"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Lock className="w-3 h-3" />
                        Pro Plan
                      </Link>
                    )}
                  </div>

                  {/* Toggle 4: Footer Note */}
                  <div className="p-3 rounded-xl border border-[#11140F]/10 flex items-center justify-between gap-3 bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-[#11140F]">Footer Note</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Pro Feature
                        </span>
                      </div>
                      <p className="text-[11px] text-[#11140F]/55">
                        "No app required • Instant redirect"
                      </p>
                    </div>
                    {canCustomizeElements ? (
                      <input
                        type="checkbox"
                        checked={showFooterNote}
                        onChange={(e) => setShowFooterNote(e.target.checked)}
                        className="w-4 h-4 accent-[#11140F] cursor-pointer"
                      />
                    ) : (
                      <Link
                        href="/pricing"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Lock className="w-3 h-3" />
                        Pro Plan
                      </Link>
                    )}
                  </div>

                  {/* Toggle 5: Outer Border */}
                  <div className="p-3 rounded-xl border border-[#11140F]/10 flex items-center justify-between gap-3 bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px] font-semibold text-[#11140F]">Card Outer Border</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Pro Feature
                        </span>
                      </div>
                      <p className="text-[11px] text-[#11140F]/55">
                        Draw outline around card or leave frameless
                      </p>
                    </div>
                    {canCustomizeElements ? (
                      <input
                        type="checkbox"
                        checked={showBorder}
                        onChange={(e) => setShowBorder(e.target.checked)}
                        className="w-4 h-4 accent-[#11140F] cursor-pointer"
                      />
                    ) : (
                      <Link
                        href="/pricing"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Lock className="w-3 h-3" />
                        Pro Plan
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Colors & Logo */}
            {activeTab === 'design' && (
              <div className="space-y-4">
                {/* Brand Colors */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11.5px] font-semibold text-[#11140F]/70 uppercase tracking-wider block">
                      Brand Accent Color
                    </label>
                    {!canCustomizeElements && (
                      <span className="text-[10px] text-emerald-700 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Pro Feature
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PALETTES.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => {
                          if (!canCustomizeElements) {
                            alert('Color palettes are unlocked on Pro, Plus, and Ultra plans.');
                            return;
                          }
                          setAccentColor(color.hex);
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          accentColor === color.hex
                            ? 'border-[#11140F] ring-2 ring-[#11140F]/15 font-semibold bg-white'
                            : 'border-[#11140F]/15 bg-white text-[#11140F]/80 hover:bg-[#EEF0EA]'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[11px] truncate">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Center QR Logo Overlay (Plus & Ultra) */}
                <div className="space-y-2 pt-2 border-t border-[#11140F]/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11.5px] font-semibold text-[#11140F]/70 uppercase tracking-wider block">
                      Center QR Badge
                    </label>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                      Plus & Ultra
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'None', icon: X },
                      { id: 'star', label: 'Star', icon: Star },
                      { id: 'utensils', label: 'Food', icon: Utensils },
                      { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
                      { id: 'coffee', label: 'Cafe', icon: Coffee },
                      { id: 'bag', label: 'Shop', icon: ShoppingBag },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (!canUseLogos) {
                              alert('Center QR Badges are unlocked on Plus & Ultra plans.');
                              return;
                            }
                            setCenterLogo(item.id as CenterLogoType);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                            centerLogo === item.id
                              ? 'border-[#11140F] bg-[#11140F] text-white shadow-xs'
                              : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
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
                className="py-3 px-4 rounded-xl border border-[#11140F]/20 bg-white text-[#11140F] text-[13.5px] font-medium hover:bg-[#EEF0EA] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Download high-resolution PNG poster"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting…' : 'PNG Poster'}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl text-[#11140F]/60 text-[12.5px] font-medium hover:text-[#11140F] transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Right Side: Live Printable Preview */}
        <div className="p-6 md:p-8 md:w-1/2 bg-[#EEF0EA]/70 flex items-center justify-center overflow-auto min-h-[380px]">
          {/* Printable Sheet Wrapper */}
          <div
            id="print-sheet"
            className={`bg-white shadow-xl transition-all flex flex-col items-center justify-between text-center relative ${
              showBorder ? 'border-2' : ''
            } ${
              template === 'table-tent'
                ? 'w-[280px] h-[390px] p-6 rounded-2xl'
                : template === 'window-sign'
                ? 'w-[320px] h-[320px] p-6 rounded-2xl'
                : template === 'full-poster'
                ? 'w-[330px] h-[450px] p-7 rounded-2xl'
                : 'w-[340px] h-[210px] p-4 rounded-xl flex-row text-left'
            }`}
            style={{ borderColor: accentColor }}
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
                  {showSubline && (
                    <p className="text-[11px] text-[#11140F]/65">{subline}</p>
                  )}
                  {showShortCode && (
                    <div className="pt-1 font-mono text-[10px] text-[#11140F]/50 truncate">
                      /{shortCode}
                    </div>
                  )}
                </div>

                <div className="p-2 border rounded-xl bg-white shadow-xs shrink-0 relative" style={{ borderColor: `${accentColor}30` }}>
                  <QRCodeSVG value={url} size={96} level="H" fgColor={accentColor} />
                  {centerLogo !== 'none' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-5 h-5 rounded-full bg-white shadow-xs border border-[#11140F]/20 flex items-center justify-center">
                        {centerLogo === 'star' && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                        {centerLogo === 'utensils' && <Utensils className="w-3 h-3 text-[#11140F]" />}
                        {centerLogo === 'wifi' && <Wifi className="w-3 h-3 text-blue-600" />}
                        {centerLogo === 'coffee' && <Coffee className="w-3 h-3 text-amber-800" />}
                        {centerLogo === 'bag' && <ShoppingBag className="w-3 h-3 text-[#2F6B4F]" />}
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
                      className="text-[10px] uppercase font-mono tracking-widest font-bold"
                      style={{ color: accentColor }}
                    >
                      {headerTag}
                    </div>
                  )}
                  <h4 className="font-bold text-[20px] text-[#11140F] leading-tight tracking-tight">
                    {headline}
                  </h4>
                  {showSubline && (
                    <p className="text-[12px] text-[#11140F]/65">{subline}</p>
                  )}
                </div>

                <div className="p-3 border-2 rounded-2xl bg-white shadow-sm my-2 relative" style={{ borderColor: accentColor }}>
                  <QRCodeSVG
                    value={url}
                    size={template === 'window-sign' ? 140 : template === 'full-poster' ? 150 : 130}
                    level="H"
                    fgColor={accentColor}
                  />
                  {centerLogo !== 'none' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-[#11140F]/20 flex items-center justify-center">
                        {centerLogo === 'star' && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        {centerLogo === 'utensils' && <Utensils className="w-4 h-4 text-[#11140F]" />}
                        {centerLogo === 'wifi' && <Wifi className="w-4 h-4 text-blue-600" />}
                        {centerLogo === 'coffee' && <Coffee className="w-4 h-4 text-amber-800" />}
                        {centerLogo === 'bag' && <ShoppingBag className="w-4 h-4 text-[#2F6B4F]" />}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {showShortCode && (
                    <div
                      className="inline-block px-3 py-1 rounded-full text-white text-[11px] font-mono shadow-2xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      /{shortCode}
                    </div>
                  )}
                  {showFooterNote && (
                    <p className="text-[10px] text-[#11140F]/50">{footerNote}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
