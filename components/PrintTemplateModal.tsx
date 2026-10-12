'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, LayoutTemplate, Store, CreditCard, Download, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortCode: string;
  label?: string | null;
  url: string;
}

type TemplateType = 'table-tent' | 'window-sign' | 'card-badge';

export default function PrintTemplateModal({ isOpen, onClose, shortCode, label, url }: Props) {
  const [template, setTemplate] = useState<TemplateType>('table-tent');
  const [headline, setHeadline] = useState(label || 'Scan to Open');
  const [subline, setSubline] = useState('Point your camera at this code');
  const [footerNote, setFooterNote] = useState('No app required • Instant redirect');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

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
              border: 2px solid #11140F;
              border-radius: 20px;
              padding: ${isBadge ? '24px 32px' : isSign ? '36px' : '40px 28px'};
              display: flex;
              flex-direction: ${isBadge ? 'row' : 'column'};
              align-items: center;
              justify-content: space-between;
              text-align: ${isBadge ? 'left' : 'center'};
              background: #ffffff;
              width: ${isBadge ? '420px' : isSign ? '440px' : '360px'};
              height: ${isBadge ? '230px' : isSign ? '440px' : '520px'};
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
            .text-\\[\\#2F6B4F\\] { color: #2F6B4F; }
            .text-\\[\\#11140F\\] { color: #11140F; }
            .text-\\[\\#11140F\\]\\/65 { color: rgba(17, 20, 15, 0.7); }
            .text-\\[\\#11140F\\]\\/50 { color: rgba(17, 20, 15, 0.5); }
            .space-y-1 > * + * { margin-top: 6px; }
            .space-y-1\\.5 > * + * { margin-top: 8px; }
            .rounded-full { border-radius: 9999px; }
            .rounded-xl { border-radius: 14px; }
            .rounded-2xl { border-radius: 20px; }
            .bg-\\[\\#11140F\\] { background-color: #11140F; }
            .text-white { color: #ffffff; }
            .px-3 { padding-left: 14px; padding-right: 14px; }
            .py-1 { padding-top: 6px; padding-bottom: 6px; }
            .p-2 { padding: 10px; }
            .p-3 { padding: 16px; }
            .border-2 { border-width: 2px; }
            .border { border-width: 1px; }
            .border-\\[\\#11140F\\] { border-color: #11140F; }
            .border-\\[\\#11140F\\]\\/10 { border-color: rgba(17, 20, 15, 0.15); }
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

      const width = isBadge ? 900 : isSign ? 900 : 800;
      const height = isBadge ? 520 : isSign ? 900 : 1100;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsExporting(false);
        return;
      }

      // High-res white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Outer border
      ctx.strokeStyle = '#11140F';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      if (isBadge) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#2F6B4F';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('DYNAMICQR', 64, 110);

        ctx.fillStyle = '#11140F';
        ctx.font = 'bold 44px system-ui, sans-serif';
        ctx.fillText(headline, 64, 180, 440);

        ctx.fillStyle = 'rgba(17, 20, 15, 0.65)';
        ctx.font = '26px system-ui, sans-serif';
        ctx.fillText(subline, 64, 240, 440);

        ctx.fillStyle = 'rgba(17, 20, 15, 0.5)';
        ctx.font = '24px monospace';
        ctx.fillText(`/${shortCode}`, 64, 320);

        // QR Image
        ctx.drawImage(img, width - 320, (height - 260) / 2, 260, 260);
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#2F6B4F';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('OFFICIAL SCAN POINT', width / 2, 90);

        ctx.fillStyle = '#11140F';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.fillText(headline, width / 2, 170, width - 120);

        ctx.fillStyle = 'rgba(17, 20, 15, 0.65)';
        ctx.font = '28px system-ui, sans-serif';
        ctx.fillText(subline, width / 2, 230, width - 120);

        // Centered QR Image
        const qrSize = isSign ? 440 : 400;
        const qrY = (height - qrSize) / 2 + 30;
        ctx.drawImage(img, (width - qrSize) / 2, qrY, qrSize, qrSize);

        // Shortcode Pill
        ctx.fillStyle = '#11140F';
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

        // Footer note
        ctx.fillStyle = 'rgba(17, 20, 15, 0.5)';
        ctx.font = '22px system-ui, sans-serif';
        ctx.fillText(footerNote, width / 2, height - 55);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Container Card */}
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#11140F]/15 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Controls & Customization */}
        <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#11140F]/10 space-y-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#11140F]">Physical Print Templates</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Guaranteed 1-Page Output</span>
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

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-[#11140F]/70 uppercase tracking-wider block">
                Choose Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTemplate('table-tent');
                    setHeadline(label || 'Table Menu & Specials');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                    template === 'table-tent'
                      ? 'border-[#11140F] bg-[#11140F] text-white shadow-sm'
                      : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                  }`}
                >
                  <LayoutTemplate className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold">Table Tent</div>
                    <div className={`text-[10px] ${template === 'table-tent' ? 'text-white/70' : 'text-[#11140F]/50'}`}>4" × 6" Menu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplate('window-sign');
                    setHeadline(label || 'SCAN HERE');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                    template === 'window-sign'
                      ? 'border-[#11140F] bg-[#11140F] text-white shadow-sm'
                      : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                  }`}
                >
                  <Store className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold">Window Sign</div>
                    <div className={`text-[10px] ${template === 'window-sign' ? 'text-white/70' : 'text-[#11140F]/50'}`}>8" × 8" Sticker</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplate('card-badge');
                    setHeadline(label || 'Event Badge');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                    template === 'card-badge'
                      ? 'border-[#11140F] bg-[#11140F] text-white shadow-sm'
                      : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold">Badge Card</div>
                    <div className={`text-[10px] ${template === 'card-badge' ? 'text-white/70' : 'text-[#11140F]/50'}`}>3.5" × 2" Pocket</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Customization Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#11140F]/70 block mb-1">Headline Text</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                  placeholder="Scan for Menu"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#11140F]/70 block mb-1">Instruction Subline</label>
                <input
                  type="text"
                  value={subline}
                  onChange={(e) => setSubline(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                  placeholder="Point your phone camera"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#11140F]/70 block mb-1">Footer Note</label>
                <input
                  type="text"
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                  placeholder="Free guest Wi-Fi"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 px-4 rounded-xl bg-[#11140F] text-white text-[13.5px] font-semibold hover:bg-[#2A2E25] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
              className="w-full py-2.5 px-4 rounded-xl text-[#11140F]/60 text-[13px] font-medium hover:text-[#11140F] transition-colors"
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
            className={`bg-white shadow-xl transition-all flex flex-col items-center justify-between border border-[#11140F]/15 text-center ${
              template === 'table-tent'
                ? 'w-[280px] h-[390px] p-6 rounded-2xl'
                : template === 'window-sign'
                ? 'w-[320px] h-[320px] p-6 rounded-2xl'
                : 'w-[340px] h-[210px] p-4 rounded-xl flex-row text-left'
            }`}
          >
            {template === 'card-badge' ? (
              // Horizontal Card Layout
              <div className="flex items-center justify-between w-full gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#2F6B4F] font-bold">
                    DynamicQR
                  </div>
                  <h4 className="font-bold text-[16px] text-[#11140F] leading-tight truncate">
                    {headline}
                  </h4>
                  <p className="text-[11px] text-[#11140F]/65">{subline}</p>
                  <div className="pt-1 font-mono text-[10px] text-[#11140F]/50 truncate">
                    /{shortCode}
                  </div>
                </div>

                <div className="p-2 border border-[#11140F]/10 rounded-xl bg-white shadow-xs shrink-0">
                  <QRCodeSVG value={url} size={96} level="H" />
                </div>
              </div>
            ) : (
              // Vertical / Square Posters
              <>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#2F6B4F] font-bold">
                    Official Scan Point
                  </div>
                  <h4 className="font-bold text-[20px] text-[#11140F] leading-tight tracking-tight">
                    {headline}
                  </h4>
                  <p className="text-[12px] text-[#11140F]/65">{subline}</p>
                </div>

                <div className="p-3 border-2 border-[#11140F] rounded-2xl bg-white shadow-sm my-2">
                  <QRCodeSVG value={url} size={template === 'window-sign' ? 140 : 130} level="H" />
                </div>

                <div className="space-y-1">
                  <div className="inline-block px-3 py-1 rounded-full bg-[#11140F] text-white text-[11px] font-mono">
                    /{shortCode}
                  </div>
                  <p className="text-[10px] text-[#11140F]/50">{footerNote}</p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
