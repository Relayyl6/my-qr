'use client';

import { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface Props {
  shortCode: string;
  label?: string | null;
}

export default function QrCodeCard({ shortCode, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? `${origin}/id/${shortCode}` : `https://dynamicqr.co/id/${shortCode}`;

  const handleDownload = () => {
    // High-resolution 300 DPI print-ready poster canvas
    const canvasWidth = 1080;
    const canvasHeight = 1350;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvasWidth;
    offscreen.height = canvasHeight;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // 1. Fill clean background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw subtle border outline
    ctx.strokeStyle = 'rgba(17, 20, 15, 0.08)';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);

    // 3. Render Top Header (Name / Label)
    const displayName = label?.trim() || `/${shortCode}`;
    ctx.fillStyle = '#11140F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title font
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    // Truncate if exceptionally long
    const maxChars = 32;
    const truncatedTitle = displayName.length > maxChars ? `${displayName.slice(0, maxChars)}…` : displayName;
    ctx.fillText(truncatedTitle, canvasWidth / 2, 130);

    // Subtitle path if label is distinct
    if (label?.trim()) {
      ctx.fillStyle = 'rgba(17, 20, 15, 0.55)';
      ctx.font = '500 28px monospace';
      ctx.fillText(`/id/${shortCode}`, canvasWidth / 2, 185);
    }

    // 4. Draw QR Code in Center
    const originalCanvas = containerRef.current?.querySelector('canvas');
    if (originalCanvas) {
      const qrSize = 740;
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = 240;

      // Draw white quiet-zone card under QR
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
      ctx.shadowColor = 'transparent'; // reset shadow

      // Disable smoothing to ensure pixel-perfect, crisp vector-like modules
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(originalCanvas, qrX, qrY, qrSize, qrSize);

      // 5. Render Bottom Section (Clean Link Pill & Instructions)
      const pillWidth = 580;
      const pillHeight = 70;
      const pillX = (canvasWidth - pillWidth) / 2;
      const pillY = 1060;

      // Draw Pill background
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

      // Draw Full URL inside Pill
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px monospace';
      const cleanUrl = url.replace(/^https?:\/\//, '');
      ctx.fillText(cleanUrl, canvasWidth / 2, pillY + pillHeight / 2);

      // Footer call-to-action
      ctx.fillStyle = 'rgba(17, 20, 15, 0.45)';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('SCAN WITH CAMERA TO OPEN', canvasWidth / 2, 1190);

      ctx.fillStyle = 'rgba(17, 20, 15, 0.3)';
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('DynamicQR • Intelligent Physical Redirects', canvasWidth / 2, 1235);

      // Export file
      const link = document.createElement('a');
      link.href = offscreen.toDataURL('image/png');
      const safeName = (label || shortCode).toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `qr-${safeName}.png`;
      link.click();
    } else {
      console.error('Could not find canvas element to export');
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 min-w-0">
      <div
        ref={containerRef}
        className="shrink-0 rounded-lg border border-[#11140F]/10 bg-white p-1.5 sm:p-2 shadow-xs"
        title={`Scan for /id/${shortCode}`}
      >
        <QRCodeCanvas value={url} size={68} level="H" includeMargin={false} />
      </div>
      <span
        className="text-[9px] text-[#11140F]/50 font-mono tracking-tight text-center truncate max-w-[80px]"
        title={`/id/${shortCode}`}
      >
        /{shortCode}
      </span>
      <button
        onClick={handleDownload}
        className="rounded-full border border-[#11140F]/15 px-2 py-0.5 text-[10px] font-medium text-[#11140F]/65 hover:border-[#11140F]/30 hover:text-[#11140F] transition-colors whitespace-nowrap cursor-pointer"
        title="Download 300 DPI print-ready QR image with name & URL"
      >
        Download
      </button>
    </div>
  );
}
