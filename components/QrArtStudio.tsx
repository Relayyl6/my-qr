'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateQrArtSpecAction, saveQrArtworkAction } from '@/lib/ai/features/qr-artist';
import { QrStyleSpec } from '@/lib/ai/prompts/qr-artist.v1';
import { ScannabilityResult } from '@/lib/qr/scannability';
import {
  Sparkles,
  Download,
  Loader2,
  ShieldCheck,
  Palette,
  X,
  Check,
  FileCode,
} from 'lucide-react';
import { downloadSvgFile, extractCleanSvgMarkup } from '@/lib/qr/exportVector';

interface QrArtStudioProps {
  linkId: string;
  shortCode: string;
  destinationUrl: string;
  label?: string | null;
  onClose?: () => void;
}

const PRESETS = [
  'Emerald Botanical Luxury with Deep Forest Accents',
  'Warm Gold foil & Textured Sandstone on Ivory',
  'Cyberpunk Neon Indigo with Obsidian Shadow',
  'Swiss Minimalist Black & Warm Concrete with Vermilion Dot',
];

export default function QrArtStudio({
  linkId,
  shortCode,
  destinationUrl,
  label,
  onClose,
}: QrArtStudioProps) {
  const [promptText, setPromptText] = useState(PRESETS[0]);
  const [styleSpec, setStyleSpec] = useState<QrStyleSpec | null>({
    fgColor: '#064E3B',
    bgColor: '#FFFFFF',
    accentColor: '#059669',
    cornerDotColor: '#047857',
    gradientType: 'linear',
    gradientColors: ['#ECFDF5', '#D1FAE5'],
    artisticStyle: 'Emerald Botanical',
    errorCorrectionLevel: 'H',
  });
  const [scannability, setScannability] = useState<ScannabilityResult | null>({
    score: 96,
    contrastRatio: 12.4,
    isAcceptable: true,
    recommendations: [],
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/id/${shortCode}` : `https://dynamicqr.co/id/${shortCode}`;

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setSaved(false);
    try {
      const res = await generateQrArtSpecAction(promptText);
      setStyleSpec(res.styleSpec);
      setScannability(res.scannability);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPng = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // High-resolution 300 DPI poster export (1080x1350px)
    const canvasWidth = 1080;
    const canvasHeight = 1350;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    img.onload = () => {
      if (!ctx) return;

      // Fill canvas background
      ctx.fillStyle = styleSpec?.bgColor || '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw subtle background gradient panel
      if (styleSpec && styleSpec.gradientColors && styleSpec.gradientColors.length >= 2) {
        const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        grad.addColorStop(0, styleSpec.gradientColors[0]);
        grad.addColorStop(1, styleSpec.gradientColors[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Draw poster outline
      ctx.strokeStyle = `${styleSpec?.fgColor || '#11140F'}20`;
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);

      // Draw Top Name / Label
      const displayName = label?.trim() || `/${shortCode}`;
      ctx.fillStyle = styleSpec?.fgColor || '#11140F';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';

      const maxChars = 32;
      const truncatedTitle = displayName.length > maxChars ? `${displayName.slice(0, maxChars)}…` : displayName;
      ctx.fillText(truncatedTitle, canvasWidth / 2, 130);

      if (label?.trim()) {
        ctx.fillStyle = `${styleSpec?.fgColor || '#11140F'}99`;
        ctx.font = '500 28px monospace';
        ctx.fillText(`/id/${shortCode}`, canvasWidth / 2, 185);
      }

      // Draw QR Code centered on a clean white card
      const qrCardSize = 780;
      const qrCardX = (canvasWidth - qrCardSize) / 2;
      const qrCardY = 240;

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillRect(qrCardX, qrCardY, qrCardSize, qrCardSize);
      ctx.shadowColor = 'transparent';

      const qrDrawSize = 720;
      const qrDrawOffset = (qrCardSize - qrDrawSize) / 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, qrCardX + qrDrawOffset, qrCardY + qrDrawOffset, qrDrawSize, qrDrawSize);

      // Draw Bottom URL Pill
      const pillWidth = 580;
      const pillHeight = 70;
      const pillX = (canvasWidth - pillWidth) / 2;
      const pillY = 1060;

      ctx.fillStyle = styleSpec?.fgColor || '#11140F';
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

      // Draw clean link text inside pill
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px monospace';
      const cleanUrl = qrUrl.replace(/^https?:\/\//, '');
      ctx.fillText(cleanUrl, canvasWidth / 2, pillY + pillHeight / 2);

      // Draw bottom caption
      ctx.fillStyle = `${styleSpec?.fgColor || '#11140F'}99`;
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('SCAN WITH CAMERA TO OPEN', canvasWidth / 2, 1190);

      ctx.fillStyle = `${styleSpec?.fgColor || '#11140F'}66`;
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(`DynamicQR • ${styleSpec?.artisticStyle || 'Branded Artwork'}`, canvasWidth / 2, 1235);

      const a = document.createElement('a');
      const safeName = (label || shortCode).toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `artistic-qr-${safeName}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const handleDownloadSvg = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const markup = extractCleanSvgMarkup(svg, label || shortCode, qrUrl);
    const safeName = (label || shortCode).toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadSvgFile(`artistic-qr-${safeName}.svg`, markup);
  };

  const handleSaveArtwork = async () => {
    if (!styleSpec || !scannability) return;
    try {
      await saveQrArtworkAction(linkId, promptText, styleSpec, scannability.score);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/15 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-w-xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Palette className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#11140F]">
              AI QR Art Studio for <span className="font-mono text-emerald-700">/id/{shortCode}</span>
            </h3>
            <p className="text-[12px] text-[#11140F]/50">
              Generate scannable, branded art with Error Correction Level H
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1.5 rounded-lg hover:bg-[#11140F]/5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preset pills */}
      <div className="space-y-1.5">
        <span className="text-[11.5px] font-medium text-[#11140F]/60">Style Inspirations</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPromptText(p)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-[#11140F]/10 hover:border-[#11140F]/30 bg-white hover:bg-[#11140F]/[0.02] text-[#11140F]/80 transition-colors"
            >
              {p.split(' ')[0]} {p.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt input */}
      <div className="space-y-1.5">
        <textarea
          rows={2}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe the desired aesthetic, color harmony, and mood..."
          className="w-full rounded-xl border border-[#11140F]/15 bg-[#11140F]/[0.02] p-3 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors resize-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !promptText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Synthesizing Art…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Generate QR Art
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas / Render Preview */}
      {styleSpec && (
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#11140F]/[0.02] border border-[#11140F]/10">
          <div
            ref={qrRef}
            className="p-4 rounded-2xl shadow-lg border shrink-0 transition-transform hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${styleSpec.gradientColors[0]}, ${styleSpec.gradientColors[1] || styleSpec.gradientColors[0]})`,
              borderColor: `${styleSpec.accentColor}30`,
            }}
          >
            <div className="bg-white p-3 rounded-xl shadow-inner">
              <QRCodeSVG
                value={qrUrl}
                size={180}
                level="H"
                fgColor={styleSpec.fgColor}
                bgColor="#FFFFFF"
                includeMargin={false}
              />
            </div>
          </div>

          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#11140F]/50 font-bold">
                Style Profile
              </span>
              <p className="text-[15px] font-semibold text-[#11140F]">{styleSpec.artisticStyle}</p>
            </div>

            {/* Scannability Rating */}
            {scannability && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1 font-medium text-[#11140F]/80">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Scannability Score
                  </span>
                  <span className="font-bold text-emerald-700">{scannability.score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#11140F]/10 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${scannability.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#11140F]/50">
                  Contrast Ratio: {scannability.contrastRatio}:1 (Level H Error Correction active)
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="px-3.5 py-2 rounded-xl bg-[#11140F] text-white text-[12px] font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Print PNG (300 DPI)
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="px-3.5 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-[12px] font-medium hover:bg-[#EEF0EA] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download scalable SVG for Figma, Illustrator, or print presses"
              >
                <FileCode className="w-3.5 h-3.5 text-[#2F6B4F]" />
                Vector SVG
              </button>
              <button
                type="button"
                onClick={handleSaveArtwork}
                className="px-3 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-[12px] font-medium hover:bg-[#11140F]/5 transition-colors flex items-center gap-1"
              >
                {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                {saved ? 'Saved to Vault' : 'Save Style'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
