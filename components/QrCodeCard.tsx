'use client';

import { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Download, ChevronDown, FileImage, FileCode, Printer } from 'lucide-react';
import { downloadSvgFile, extractCleanSvgMarkup } from '@/lib/qr/exportVector';
import PrintTemplateModal from '@/components/PrintTemplateModal';

interface Props {
  shortCode: string;
  label?: string | null;
  customDomain?: string | null;
  userTier?: string;
  isAdmin?: boolean;
}

export default function QrCodeCard({
  shortCode,
  label,
  customDomain,
  userTier = 'free',
  isAdmin = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [origin, setOrigin] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const url = customDomain
    ? `https://${customDomain}/id/${shortCode}`
    : (origin ? `${origin}/id/${shortCode}` : `https://dynamicqr.co/id/${shortCode}`);
  const safeName = (label || shortCode).toLowerCase().replace(/[^a-z0-9]/g, '-');

  // 1. High-Resolution 300 DPI Poster PNG Export
  const handleDownloadPng = () => {
    setIsMenuOpen(false);
    const canvasWidth = 1080;
    const canvasHeight = 1350;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvasWidth;
    offscreen.height = canvasHeight;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Fill clean background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Subtle border outline
    ctx.strokeStyle = 'rgba(17, 20, 15, 0.08)';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);

    // Header Label / Title
    const displayName = label?.trim() || `/${shortCode}`;
    ctx.fillStyle = '#11140F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';

    const maxChars = 32;
    const truncatedTitle = displayName.length > maxChars ? `${displayName.slice(0, maxChars)}…` : displayName;
    ctx.fillText(truncatedTitle, canvasWidth / 2, 130);

    if (label?.trim()) {
      ctx.fillStyle = 'rgba(17, 20, 15, 0.55)';
      ctx.font = '500 28px monospace';
      ctx.fillText(`/id/${shortCode}`, canvasWidth / 2, 185);
    }

    // QR Code in Center
    const originalCanvas = containerRef.current?.querySelector('canvas');
    if (originalCanvas) {
      const qrSize = 740;
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = 240;

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
      ctx.shadowColor = 'transparent';

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(originalCanvas, qrX, qrY, qrSize, qrSize);

      // Pill URL Button
      const pillWidth = 580;
      const pillHeight = 70;
      const pillX = (canvasWidth - pillWidth) / 2;
      const pillY = 1060;

      ctx.fillStyle = '#11140F';
      const radius = 35;
      ctx.beginPath();
      ctx.moveTo(pillX + radius, pillY);
      ctx.lineTo(pillX + pillWidth - radius, pillY);
      ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + radius);
      ctx.lineTo(pillX + pillWidth, pillY + pillHeight - radius);
      ctx.quadraticCurveTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - radius, pillY + pillHeight);
      ctx.lineTo(pillX + radius, pillY + pillHeight);
      ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - radius);
      ctx.lineTo(pillX, pillY + radius);
      ctx.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px monospace';
      const cleanUrl = url.replace(/^https?:\/\//, '');
      ctx.fillText(cleanUrl, canvasWidth / 2, pillY + pillHeight / 2);

      ctx.fillStyle = 'rgba(17, 20, 15, 0.45)';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('SCAN WITH CAMERA TO OPEN', canvasWidth / 2, 1190);

      ctx.fillStyle = 'rgba(17, 20, 15, 0.3)';
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('DynamicQR • Intelligent Physical Redirects', canvasWidth / 2, 1235);

      const link = document.createElement('a');
      link.href = offscreen.toDataURL('image/png');
      link.download = `qr-${safeName}.png`;
      link.click();
    }
  };

  // 2. Pure Vector SVG Export
  const handleDownloadSvg = () => {
    setIsMenuOpen(false);
    if (!svgRef.current) return;
    const markup = extractCleanSvgMarkup(svgRef.current, label || shortCode, url);
    downloadSvgFile(`qr-${safeName}.svg`, markup);
  };

  // 3. Print Templates Dialog
  const handleOpenPrintTemplates = () => {
    setIsMenuOpen(false);
    setIsPrintModalOpen(true);
  };

  return (
    <>
      <div className="flex shrink-0 flex-col items-center gap-1.5 min-w-0">
        <div
          ref={containerRef}
          className="shrink-0 rounded-lg border border-[#11140F]/10 bg-white p-1.5 sm:p-2 shadow-xs relative"
          title={`Scan for /id/${shortCode}`}
        >
          <QRCodeCanvas value={url} size={68} level="H" includeMargin={false} />

          {/* Hidden vector SVG for direct extraction */}
          <div className="hidden">
            <QRCodeSVG ref={svgRef} value={url} size={512} level="H" includeMargin={false} />
          </div>
        </div>

        <span
          className="text-[9px] text-[#11140F]/50 font-mono tracking-tight text-center truncate max-w-[80px]"
          title={`/id/${shortCode}`}
        >
          /{shortCode}
        </span>

        <span
          className="text-[8.5px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/50 px-1 py-0.5 rounded font-semibold tracking-tight"
          title="Level H Error Correction: 30% damage tolerance for physical print reliability"
        >
          300 DPI &middot; H
        </span>

        {/* Export Dropdown Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full border border-[#11140F]/15 px-2.5 py-0.5 text-[10px] font-medium text-[#11140F]/75 hover:border-[#11140F]/30 hover:text-[#11140F] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 bg-white"
            title="Download PNG, vector SVG, or print physical templates"
          >
            <span>Export</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 z-30 w-44 rounded-2xl border border-[#11140F]/10 bg-white p-1.5 shadow-xl text-left">
              <button
                onClick={handleDownloadPng}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium text-[#11140F] rounded-xl hover:bg-[#EEF0EA] transition-colors"
              >
                <FileImage className="w-3.5 h-3.5 text-[#2F6B4F]" />
                <div className="leading-tight">
                  <div>Poster PNG</div>
                  <div className="text-[9px] text-[#11140F]/50">300 DPI high-res</div>
                </div>
              </button>

              <button
                onClick={handleDownloadSvg}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium text-[#11140F] rounded-xl hover:bg-[#EEF0EA] transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-[#2F6B4F]" />
                <div className="leading-tight">
                  <div>Vector SVG</div>
                  <div className="text-[9px] text-[#11140F]/50">Infinite scale for print</div>
                </div>
              </button>

              <button
                onClick={handleOpenPrintTemplates}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium text-[#11140F] rounded-xl hover:bg-[#EEF0EA] transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#2F6B4F]" />
                <div className="leading-tight">
                  <div>Print Templates</div>
                  <div className="text-[9px] text-[#11140F]/50">Table tent, sign, PDF</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Physical Print Template Modal */}
      <PrintTemplateModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        shortCode={shortCode}
        label={label}
        url={url}
        userTier={userTier}
        isAdmin={isAdmin}
      />
    </>
  );
}
