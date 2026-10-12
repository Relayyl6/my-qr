'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  Download,
  X,
  Printer,
  FileImage,
  FileCode,
  Sliders,
  Check,
  Maximize2,
  Crop,
  Layers,
  Sparkles,
} from 'lucide-react';
import { downloadSvgFile, extractCleanSvgMarkup } from '@/lib/qr/exportVector';

interface ExportCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortCode: string;
  label?: string | null;
  url: string;
  userTier?: string;
  isAdmin?: boolean;
}

export type LayoutMode = 'zero-margin' | 'minimal' | 'compact-card' | 'poster';

export default function ExportCustomizerModal({
  isOpen,
  onClose,
  shortCode,
  label,
  url,
  userTier = 'free',
  isAdmin = false,
}: ExportCustomizerModalProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('compact-card');
  const [showTitle, setShowTitle] = useState(true);
  const [showShortCode, setShowShortCode] = useState(true);
  const [showUrlBadge, setShowUrlBadge] = useState(true);
  const [showCameraText, setShowCameraText] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showBorder, setShowBorder] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const [customTitle, setCustomTitle] = useState(label || 'Scan to Open');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenQrRef = useRef<HTMLDivElement>(null);

  const safeName = (label || shortCode).toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanUrl = url.replace(/^https?:\/\//, '');

  // Render canvas whenever toggles change
  useEffect(() => {
    if (!isOpen) return;
    renderCanvas();
  }, [
    isOpen,
    layoutMode,
    showTitle,
    showShortCode,
    showUrlBadge,
    showCameraText,
    showWatermark,
    showBorder,
    isTransparent,
    customTitle,
  ]);

  const renderCanvas = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const originalCanvas = hiddenQrRef.current?.querySelector('canvas');
    const svg = hiddenQrRef.current?.querySelector('svg');

    const drawWithSource = (source: CanvasImageSource) => {
      // Dimensions based on layout mode
      let width = 1080;
      let height = 1080;
      let qrSize = 900;
      let qrX = 90;
      let qrY = 90;

      if (layoutMode === 'zero-margin') {
        width = 1024;
        height = 1024;
        qrSize = 1024;
        qrX = 0;
        qrY = 0;
      } else if (layoutMode === 'minimal') {
        width = 1024;
        height = 1024;
        qrSize = 920;
        qrX = 52;
        qrY = 52;
      } else if (layoutMode === 'compact-card') {
        width = 960;
        height = 1180;
        qrSize = 740;
        qrX = 110;
        qrY = 180;
      } else if (layoutMode === 'poster') {
        width = 1080;
        height = 1350;
        qrSize = 740;
        qrX = 170;
        qrY = 240;
      }

      canvas.width = width;
      canvas.height = height;

      // Clear or fill background
      ctx.clearRect(0, 0, width, height);
      if (!isTransparent) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw border if enabled and not zero-margin
      if (showBorder && layoutMode !== 'zero-margin') {
        ctx.strokeStyle = 'rgba(17, 20, 15, 0.12)';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, width - 60, height - 60);
      }

      // If Zero Margin, just draw pure QR code and exit!
      if (layoutMode === 'zero-margin') {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(source, 0, 0, width, height);
        return;
      }

      // Minimal mode: pure QR code with clean margin
      if (layoutMode === 'minimal') {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(source, qrX, qrY, qrSize, qrSize);
        return;
      }

      // Compact Card or Poster
      let currentY = 100;

      // 1. Header Title
      if (showTitle) {
        ctx.fillStyle = '#11140F';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
        ctx.fillText(customTitle, width / 2, currentY);
        currentY += 50;
      }

      // 2. Shortcode
      if (showShortCode) {
        ctx.fillStyle = 'rgba(17, 20, 15, 0.55)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '500 26px monospace';
        ctx.fillText(`/id/${shortCode}`, width / 2, currentY);
        currentY += 40;
      }

      // Adjust QR position based on top elements
      qrY = Math.max(qrY, currentY + 20);

      // Draw QR Code
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, qrX, qrY, qrSize, qrSize);

      let bottomY = qrY + qrSize + 40;

      // 3. URL Pill
      if (showUrlBadge) {
        const pillWidth = Math.min(620, width - 120);
        const pillHeight = 64;
        const pillX = (width - pillWidth) / 2;

        ctx.fillStyle = '#11140F';
        const radius = 32;
        ctx.beginPath();
        ctx.moveTo(pillX + radius, bottomY);
        ctx.lineTo(pillX + pillWidth - radius, bottomY);
        ctx.quadraticCurveTo(pillX + pillWidth, bottomY, pillX + pillWidth, bottomY + radius);
        ctx.lineTo(pillX + pillWidth, bottomY + pillHeight - radius);
        ctx.quadraticCurveTo(pillX + pillWidth, bottomY + pillHeight, pillX + pillWidth - radius, bottomY + pillHeight);
        ctx.lineTo(pillX + radius, bottomY + pillHeight);
        ctx.quadraticCurveTo(pillX, bottomY + pillHeight, pillX, bottomY + pillHeight - radius);
        ctx.lineTo(pillX, bottomY + radius);
        ctx.quadraticCurveTo(pillX, bottomY, pillX + radius, bottomY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(cleanUrl, width / 2, bottomY + pillHeight / 2);

        bottomY += pillHeight + 30;
      }

      // 4. "SCAN WITH CAMERA"
      if (showCameraText) {
        ctx.fillStyle = 'rgba(17, 20, 15, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.fillText('SCAN WITH CAMERA TO OPEN', width / 2, bottomY);
        bottomY += 35;
      }

      // 5. Watermark
      if (showWatermark) {
        ctx.fillStyle = 'rgba(17, 20, 15, 0.35)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '500 16px system-ui, -apple-system, sans-serif';
        ctx.fillText('DynamicQR • Intelligent Physical Redirects', width / 2, bottomY);
      }
    };

    if (originalCanvas) {
      drawWithSource(originalCanvas);
      return;
    }

    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => drawWithSource(img);
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    }
  };

  const handleDownloadPng = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qr-${safeName}-${layoutMode}${isTransparent ? '-transparent' : ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadSvg = () => {
    const svg = hiddenQrRef.current?.querySelector('svg');
    if (!svg) return;
    const markup = extractCleanSvgMarkup(svg, label || shortCode, url);
    downloadSvgFile(`qr-${safeName}.svg`, markup);
  };

  // Tight PDF Print: Zero Wasted Margins
  const handlePrintTightPdf = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

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
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${shortCode}</title>
          <style>
            @page {
              size: auto;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100vw;
              height: 100vh;
              background: #FFFFFF;
              overflow: hidden;
            }
            img {
              max-width: 90%;
              max-height: 90%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code" />
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
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#11140F]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="rounded-3xl border border-[#11140F]/15 bg-white p-5 sm:p-7 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Sliders className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#11140F] flex items-center gap-2">
                Customizable Export Studio for <span className="font-mono text-emerald-700">/{shortCode}</span>
              </h3>
              <p className="text-[12px] text-[#11140F]/55">
                Edit out unneeded details, remove extra white space, and export die-cut assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1.5 rounded-xl hover:bg-[#11140F]/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Source QR Canvas & SVG for instant rendering */}
        <div ref={hiddenQrRef} className="hidden" aria-hidden="true">
          <QRCodeCanvas value={url} size={1024} level="H" includeMargin={false} />
          <QRCodeSVG value={url} size={1024} level="H" includeMargin={false} />
        </div>

        {/* Studio Layout: Controls on Left, Live Canvas Preview on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Left Column: Toggles & Layout Options */}
          <div className="md:col-span-6 space-y-4">
            {/* 1. Layout & Padding Presets */}
            <div className="space-y-2">
              <span className="text-[11.5px] uppercase font-bold tracking-wider text-[#11140F]/60 block">
                1. Crop & White Space Control:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('zero-margin');
                    setShowTitle(false);
                    setShowShortCode(false);
                    setShowUrlBadge(false);
                    setShowCameraText(false);
                    setShowWatermark(false);
                    setShowBorder(false);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    layoutMode === 'zero-margin'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-[#11140F]/10 hover:border-[#11140F]/30 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#11140F]">
                    <Crop className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zero Margin</span>
                  </div>
                  <p className="text-[10.5px] text-[#11140F]/55 mt-0.5">
                    100% pure QR code. 0 white space, no extra text.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('minimal')}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    layoutMode === 'minimal'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-[#11140F]/10 hover:border-[#11140F]/30 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#11140F]">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Minimal Quiet Zone</span>
                  </div>
                  <p className="text-[10.5px] text-[#11140F]/55 mt-0.5">
                    Compliant 10% white margin buffer only.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('compact-card')}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    layoutMode === 'compact-card'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-[#11140F]/10 hover:border-[#11140F]/30 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#11140F]">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Compact Card</span>
                  </div>
                  <p className="text-[10.5px] text-[#11140F]/55 mt-0.5">
                    Balanced card format with selectable details.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('poster')}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    layoutMode === 'poster'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-[#11140F]/10 hover:border-[#11140F]/30 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[12.5px] text-[#11140F]">
                    <FileImage className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Poster Standard</span>
                  </div>
                  <p className="text-[10.5px] text-[#11140F]/55 mt-0.5">
                    Classic 1080×1350px print poster layout.
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Detail Toggles */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-[#11140F]/[0.02] border border-[#11140F]/10">
              <span className="text-[11.5px] uppercase font-bold tracking-wider text-[#11140F]/60 block">
                2. Edit Out Unneeded Details:
              </span>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-[12.5px] font-medium text-[#11140F] cursor-pointer">
                  <span>Display Title / Label</span>
                  <input
                    type="checkbox"
                    checked={showTitle}
                    onChange={(e) => setShowTitle(e.target.checked)}
                    disabled={layoutMode === 'zero-margin' || layoutMode === 'minimal'}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                </label>

                {showTitle && layoutMode !== 'zero-margin' && layoutMode !== 'minimal' && (
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter custom title"
                    className="w-full text-[12px] p-2 rounded-lg border border-[#11140F]/15 outline-none focus:border-emerald-600 font-medium"
                  />
                )}

                <label className="flex items-center justify-between text-[12.5px] font-medium text-[#11140F] cursor-pointer">
                  <span>Display Short Code (<code>/{shortCode}</code>)</span>
                  <input
                    type="checkbox"
                    checked={showShortCode}
                    onChange={(e) => setShowShortCode(e.target.checked)}
                    disabled={layoutMode === 'zero-margin' || layoutMode === 'minimal'}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                </label>

                <label className="flex items-center justify-between text-[12.5px] font-medium text-[#11140F] cursor-pointer">
                  <span>Display Destination URL Pill</span>
                  <input
                    type="checkbox"
                    checked={showUrlBadge}
                    onChange={(e) => setShowUrlBadge(e.target.checked)}
                    disabled={layoutMode === 'zero-margin' || layoutMode === 'minimal'}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                </label>

                <label className="flex items-center justify-between text-[12.5px] font-medium text-[#11140F] cursor-pointer">
                  <span>Display "SCAN WITH CAMERA" Helper</span>
                  <input
                    type="checkbox"
                    checked={showCameraText}
                    onChange={(e) => setShowCameraText(e.target.checked)}
                    disabled={layoutMode === 'zero-margin' || layoutMode === 'minimal'}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                </label>

                <label className="flex items-center justify-between text-[12.5px] font-medium text-[#11140F] cursor-pointer">
                  <span>Display "DynamicQR" Watermark Branding</span>
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    disabled={layoutMode === 'zero-margin' || layoutMode === 'minimal'}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                </label>

                <label className="flex items-center justify-between text-[12.5px] font-medium text-[#11140F] cursor-pointer">
                  <span>Display Outer Frame / Card Border</span>
                  <input
                    type="checkbox"
                    checked={showBorder}
                    onChange={(e) => setShowBorder(e.target.checked)}
                    disabled={layoutMode === 'zero-margin' || layoutMode === 'minimal'}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer disabled:opacity-40"
                  />
                </label>
              </div>
            </div>

            {/* 3. Background Transparency */}
            <div className="p-3.5 rounded-2xl bg-[#11140F]/[0.02] border border-[#11140F]/10 flex items-center justify-between">
              <div>
                <span className="text-[12.5px] font-bold text-[#11140F] block">
                  Transparent Background (PNG)
                </span>
                <span className="text-[11px] text-[#11140F]/55">
                  Ideal for Canva, Photoshop, packaging & flyer overlays
                </span>
              </div>
              <input
                type="checkbox"
                checked={isTransparent}
                onChange={(e) => setIsTransparent(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Right Column: Live Real-Time Canvas Preview */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-100 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Live Export Preview ({layoutMode}):
            </span>

            <div
              className={`max-w-full rounded-2xl shadow-lg overflow-hidden border border-slate-300 p-2 ${
                isTransparent ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] bg-slate-50' : 'bg-white'
              }`}
            >
              <canvas
                ref={previewCanvasRef}
                className="max-h-[380px] max-w-full object-contain mx-auto"
              />
            </div>

            <div className="mt-3 text-center text-[11px] text-slate-500 font-mono">
              300 DPI &middot; Level H (30% error correction active)
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#11140F]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[12px] text-[#11140F]/60">
            <span>Tight die-cut asset ready for download.</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrintTightPdf}
              className="px-3.5 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-[12.5px] font-semibold hover:bg-[#EEF0EA] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#2F6B4F]" />
              Save Tight PDF (No Margins)
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-3.5 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-[12.5px] font-semibold hover:bg-[#EEF0EA] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileCode className="w-3.5 h-3.5 text-[#2F6B4F]" />
              Vector SVG
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Download 300 DPI PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
