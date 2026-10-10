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
    const drawSize = exportSize - (padding * 2);

    const offscreen = document.createElement('canvas');
    offscreen.width = exportSize;
    offscreen.height = exportSize;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Fill white background to prevent transparent PNG issues
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    // Get the original QR code canvas rendered by qrcode.react by querying inside our wrapper div
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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div ref={containerRef}>
        <QRCodeCanvas
          value={url}
          size={140}
          level="H" // High error correction, excellent if a logo is ever overlaid
          includeMargin={false}
        />
      </div>
      <button 
        onClick={handleDownload}
        className="w-full rounded bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
      >
        Download High-Res PNG
      </button>
    </div>
  );
}
