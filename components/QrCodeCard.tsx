'use client';

import { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface Props {
  shortCode: string;
  label?: string | null;
}

export default function QrCodeCard({ shortCode, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState(`https://example.com/id/${shortCode}`);

  useEffect(() => {
    setUrl(`${window.location.origin}/id/${shortCode}`);
  }, [shortCode]);

  const handleDownload = () => {
    // A 2-inch printed QR code at 300 DPI requires 600x600 pixels.
    // We render at 1024x1024 for a high-res, print-ready asset.
    const exportSize = 1024;
    const padding = exportSize * 0.1; // 10% quiet zone (required by scanners)
    const drawSize = exportSize - padding * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = exportSize;
    offscreen.height = exportSize;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Fill white background to prevent transparent PNG issues
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    // Get the original QR code canvas rendered by qrcode.react
    const originalCanvas = containerRef.current?.querySelector('canvas');
    if (originalCanvas) {
      // Disable smoothing to keep the QR code pixel-perfect and sharp
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(originalCanvas, padding, padding, drawSize, drawSize);

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
      <div ref={containerRef} className="shrink-0 rounded-lg border border-[#11140F]/10 bg-white p-1.5 sm:p-2">
        <QRCodeCanvas value={url} size={68} level="H" includeMargin={false} />
      </div>
      <button
        onClick={handleDownload}
        className="rounded-full border border-[#11140F]/15 px-2 py-0.5 text-[10px] font-medium text-[#11140F]/65 hover:border-[#11140F]/30 hover:text-[#11140F] transition-colors whitespace-nowrap"
      >
        Download
      </button>
    </div>
  );
}
