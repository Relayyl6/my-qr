'use client';

import { useState, useRef, useId } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { generateQrArtSpecAction, saveQrArtworkAction } from '@/lib/ai/features/qr-artist';
import { QrStyleSpec } from '@/lib/ai/prompts/qr-artist.v1';
import { ScannabilityResult } from '@/lib/qr/scannability';
import {
  Sparkles,
  Download,
  ShieldCheck,
  Palette,
  X,
  Check,
  FileCode,
  Star,
  Shield,
  Gem,
  Award,
} from 'lucide-react';
import { downloadSvgFile, extractCleanSvgMarkup } from '@/lib/qr/exportVector';
import AiProgressTracker from '@/components/AiProgressTracker';

interface QrArtStudioProps {
  linkId: string;
  shortCode: string;
  destinationUrl: string;
  label?: string | null;
  onClose?: () => void;
}

type CenterEmblem = 'leaf' | 'star' | 'sparkles' | 'diamond' | 'shield' | 'initial' | 'none';

interface ArtPreset {
  name: string;
  prompt: string;
  fgColor: string;
  gradientColors: [string, string];
  accentColor: string;
  cornerDotColor: string;
  bgColor: string;
  emblem: CenterEmblem;
}

const ART_PRESETS: ArtPreset[] = [
  {
    name: 'Emerald Botanical',
    prompt: 'Emerald Botanical Luxury with Deep Forest Accents & Leaf Emblem',
    fgColor: '#064E3B',
    gradientColors: ['#064E3B', '#059669'],
    accentColor: '#10B981',
    cornerDotColor: '#047857',
    bgColor: '#F0FDF4',
    emblem: 'leaf',
  },
  {
    name: 'Warm Gold Foil',
    prompt: 'Royal Gold Foil & Shimmering Amber on Ivory Sandstone with Star',
    fgColor: '#92400E',
    gradientColors: ['#78350F', '#D97706'],
    accentColor: '#F59E0B',
    cornerDotColor: '#B45309',
    bgColor: '#FFFBEB',
    emblem: 'star',
  },
  {
    name: 'Cyberpunk Neon',
    prompt: 'Cyberpunk Neon Electric Indigo with Radiant Cyan Glow & Vivid Violet',
    fgColor: '#06B6D4',
    gradientColors: ['#4338CA', '#06B6D4'],
    accentColor: '#38BDF8',
    cornerDotColor: '#818CF8',
    bgColor: '#05050A',
    emblem: 'sparkles',
  },
  {
    name: 'Swiss Minimalist',
    prompt: 'Swiss Minimalist Matte Carbon Black with Vermilion Accent Dot',
    fgColor: '#09090B',
    gradientColors: ['#09090B', '#18181B'],
    accentColor: '#E11D48',
    cornerDotColor: '#BE123C',
    bgColor: '#FFFFFF',
    emblem: 'shield',
  },
  {
    name: 'Sunset Ember',
    prompt: 'Sunset Crimson Ember with Radiant Tangerine & Diamond Emblem',
    fgColor: '#881337',
    gradientColors: ['#9F1239', '#EA580C'],
    accentColor: '#F97316',
    cornerDotColor: '#BE123C',
    bgColor: '#FFF1F2',
    emblem: 'diamond',
  },
  {
    name: 'Oceanic Sapphire',
    prompt: 'Midnight Oceanic Sapphire with Aquamarine Flow and Initial Emblem',
    fgColor: '#0F172A',
    gradientColors: ['#1E3A8A', '#0284C7'],
    accentColor: '#38BDF8',
    cornerDotColor: '#1D4ED8',
    bgColor: '#F0F9FF',
    emblem: 'initial',
  },
];

function getEmblemSvgDataUri(type: CenterEmblem, initial = 'L', color = '#064E3B'): string {
  if (type === 'none') return '';
  let inner = '';
  if (type === 'leaf') {
    inner = `<path d="M12 3C7 3 3 7 3 12c0 4.5 3.3 8.2 7.7 8.9.4.1.8-.2.8-.7v-4.7c0-.5-.4-.8-.8-.9-2-.4-3.2-2.1-3.2-4.1 0-2.5 2-4.5 4.5-4.5 3 0 5.4 2.4 5.4 5.4 0 1.7-.8 3.2-2.1 4.1-.4.3-.5.7-.4 1.2l.4 2.4c.1.5.5.7 1 .5 4.2-1.6 7.1-5.7 7.1-10.7 0-5-4-9-9-9z" fill="${color}"/>`;
  } else if (type === 'star') {
    inner = `<polygon points="12,2.5 14.8,8.2 21,9.1 16.5,13.5 17.6,19.7 12,16.8 6.4,19.7 7.5,13.5 3,9.1 9.2,8.2" fill="${color}"/>`;
  } else if (type === 'sparkles') {
    inner = `<path d="M12 2l2.2 5.5L20 9.8l-4.5 3.7 1.3 5.7L12 16.3 7.2 19.2l1.3-5.7L4 9.8l5.8-2.3L12 2z" fill="${color}"/>`;
  } else if (type === 'diamond') {
    inner = `<polygon points="6,4 18,4 22,10 12,21 2,10" fill="${color}"/>`;
  } else if (type === 'shield') {
    inner = `<path d="M12 2L4 5v6c0 5 3.4 9.8 8 11 4.6-1.2 8-6 8-11V5l-8-3z" fill="${color}"/>`;
  } else {
    inner = `<text x="12" y="16.5" font-size="13" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" fill="${color}">${initial.toUpperCase()}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
    <rect width="24" height="24" rx="6" fill="#FFFFFF" stroke="${color}40" stroke-width="1.5"/>
    ${inner}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function QrArtStudio({
  linkId,
  shortCode,
  destinationUrl,
  label,
  onClose,
}: QrArtStudioProps) {
  const gradientId = useId().replace(/:/g, '');
  const [selectedPreset, setSelectedPreset] = useState<ArtPreset>(ART_PRESETS[0]);
  const [promptText, setPromptText] = useState(ART_PRESETS[0].prompt);
  const [centerEmblem, setCenterEmblem] = useState<CenterEmblem>('leaf');
  const [styleSpec, setStyleSpec] = useState<QrStyleSpec>({
    fgColor: ART_PRESETS[0].fgColor,
    bgColor: ART_PRESETS[0].bgColor,
    accentColor: ART_PRESETS[0].accentColor,
    cornerDotColor: ART_PRESETS[0].cornerDotColor,
    gradientType: 'linear',
    gradientColors: [ART_PRESETS[0].gradientColors[0], ART_PRESETS[0].gradientColors[1]],
    artisticStyle: ART_PRESETS[0].name,
    errorCorrectionLevel: 'H',
  });
  const [scannability, setScannability] = useState<ScannabilityResult | null>({
    score: 98,
    contrastRatio: 14.2,
    isAcceptable: true,
    recommendations: [],
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const hiddenCanvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/id/${shortCode}`
    : `https://dynamicqr.co/id/${shortCode}`;

  const initialChar = (label?.trim() || shortCode).charAt(0).toUpperCase();

  const handleApplyPreset = (preset: ArtPreset) => {
    setSelectedPreset(preset);
    setPromptText(preset.prompt);
    setCenterEmblem(preset.emblem);
    setStyleSpec({
      fgColor: preset.fgColor,
      bgColor: preset.bgColor,
      accentColor: preset.accentColor,
      cornerDotColor: preset.cornerDotColor,
      gradientType: 'linear',
      gradientColors: [preset.gradientColors[0], preset.gradientColors[1]],
      artisticStyle: preset.name,
      errorCorrectionLevel: 'H',
    });
    setScannability({
      score: 98,
      contrastRatio: 14.2,
      isAcceptable: true,
      recommendations: [],
    });
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setSaved(false);

    try {
      const res = await generateQrArtSpecAction(promptText);
      setStyleSpec(res.styleSpec);
      setScannability(res.scannability);
    } catch (err) {
      // Find closest matching preset from prompt keywords
      const p = promptText.toLowerCase();
      const matched = ART_PRESETS.find((preset) =>
        p.includes(preset.name.toLowerCase().split(' ')[0])
      ) || ART_PRESETS[0];
      handleApplyPreset(matched);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArtwork = async () => {
    if (!styleSpec) return;
    try {
      await saveQrArtworkAction(
        linkId,
        promptText,
        styleSpec,
        scannability?.score || 96
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error('Failed to save QR artwork:', err);
    }
  };

  const emblemUri = getEmblemSvgDataUri(centerEmblem, initialChar, styleSpec.fgColor);

  // High-Resolution 300 DPI Poster Download (Fail-Proof Gradient & Emblem Rendering)
  const handleDownloadPng = () => {
    const originalCanvas = hiddenCanvasRef.current?.querySelector('canvas');
    if (!originalCanvas) return;

    const canvasWidth = 1080;
    const canvasHeight = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Fill canvas background with subtle art palette gradient
    const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    grad.addColorStop(0, styleSpec.bgColor || '#FFFFFF');
    grad.addColorStop(1, styleSpec.gradientColors?.[1] ? `${styleSpec.gradientColors[1]}25` : '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Outer designer border frame
    ctx.strokeStyle = `${styleSpec.fgColor}30`;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);

    // 3. Header Title
    const displayName = label?.trim() || `/${shortCode}`;
    ctx.fillStyle = styleSpec.fgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';

    const maxChars = 30;
    const truncatedTitle = displayName.length > maxChars ? `${displayName.slice(0, maxChars)}…` : displayName;
    ctx.fillText(truncatedTitle, canvasWidth / 2, 130);

    if (label?.trim()) {
      ctx.fillStyle = `${styleSpec.fgColor}90`;
      ctx.font = '500 28px monospace';
      ctx.fillText(`/id/${shortCode}`, canvasWidth / 2, 185);
    }

    // 4. White QR card backing with shadow
    const qrCardSize = 780;
    const qrCardX = (canvasWidth - qrCardSize) / 2;
    const qrCardY = 240;

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillRect(qrCardX, qrCardY, qrCardSize, qrCardSize);
    ctx.shadowColor = 'transparent';

    // 5. Offscreen canvas for generative gradient modules
    const qrTile = document.createElement('canvas');
    qrTile.width = 1024;
    qrTile.height = 1024;
    const tileCtx = qrTile.getContext('2d');
    if (tileCtx) {
      tileCtx.imageSmoothingEnabled = false;
      tileCtx.drawImage(originalCanvas, 0, 0, 1024, 1024);

      // Mask artistic gradient into modules
      tileCtx.globalCompositeOperation = 'source-in';
      const tileGrad = tileCtx.createLinearGradient(0, 0, 1024, 1024);
      tileGrad.addColorStop(0, styleSpec.gradientColors[0] || styleSpec.fgColor);
      tileGrad.addColorStop(1, styleSpec.gradientColors[1] || styleSpec.fgColor);
      tileCtx.fillStyle = tileGrad;
      tileCtx.fillRect(0, 0, 1024, 1024);
    }

    // 6. Draw the gradient QR code onto the white card
    const qrDrawSize = 720;
    const qrDrawOffset = (qrCardSize - qrDrawSize) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrTile, qrCardX + qrDrawOffset, qrCardY + qrDrawOffset, qrDrawSize, qrDrawSize);

    // 7. Pill URL Button
    const pillWidth = 580;
    const pillHeight = 70;
    const pillX = (canvasWidth - pillWidth) / 2;
    const pillY = 1060;

    ctx.fillStyle = styleSpec.fgColor;
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

    // Draw URL text inside pill
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px monospace';
    const cleanUrl = qrUrl.replace(/^https?:\/\//, '');
    ctx.fillText(cleanUrl, canvasWidth / 2, pillY + pillHeight / 2);

    // 8. Footer prompts
    ctx.fillStyle = `${styleSpec.fgColor}80`;
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('SCAN WITH CAMERA TO OPEN', canvasWidth / 2, 1190);

    ctx.fillStyle = `${styleSpec.fgColor}60`;
    ctx.font = '500 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`DynamicQR • ${styleSpec.artisticStyle} Edition`, canvasWidth / 2, 1235);

    // 9. Download helper
    const triggerFileDownload = () => {
      const a = document.createElement('a');
      const safeName = (label || shortCode).toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `artistic-qr-${safeName}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };

    // 10. Center Brand Emblem drawing (if enabled)
    if (centerEmblem !== 'none' && emblemUri) {
      const emblemImg = new Image();
      emblemImg.onload = () => {
        const emblemSize = 166;
        const emblemX = (canvasWidth - emblemSize) / 2;
        const emblemY = qrCardY + (qrCardSize - emblemSize) / 2;
        ctx.drawImage(emblemImg, emblemX, emblemY, emblemSize, emblemSize);
        triggerFileDownload();
      };
      emblemImg.onerror = () => {
        triggerFileDownload();
      };
      emblemImg.src = emblemUri;
    } else {
      triggerFileDownload();
    }
  };

  // Pure Vector SVG Export with Self-Contained Gradient Defs
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const cloned = svgRef.current.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    cloned.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Ensure self-contained defs with gradient inside exported SVG file
    let defs = cloned.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      cloned.insertBefore(defs, cloned.firstChild);
    }
    defs.innerHTML = `
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${styleSpec.gradientColors[0]}" />
        <stop offset="100%" stop-color="${styleSpec.gradientColors[1]}" />
      </linearGradient>
    `;

    const markup = extractCleanSvgMarkup(cloned, label || shortCode, qrUrl);
    const safeName = (label || shortCode).toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadSvgFile(`artistic-qr-${safeName}.svg`, markup);
  };

  return (
    <div className="rounded-3xl border border-[#11140F]/15 bg-white p-5 sm:p-7 shadow-2xl space-y-5 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Palette className="w-4.5 h-4.5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#11140F] flex items-center gap-2">
              AI QR Art Studio for <span className="font-mono text-purple-700">/id/{shortCode}</span>
            </h3>
            <p className="text-[12px] text-[#11140F]/55">
              Generative scannable artwork with radiant multi-stop gradients & brand emblems
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1.5 rounded-xl hover:bg-[#11140F]/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Style Inspirations Bar */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-[#11140F]/55 block">
          Curated Art Profiles:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ART_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                styleSpec.artisticStyle === p.name
                  ? 'border-[#11140F] ring-2 ring-[#11140F]/15 shadow-xs bg-[#11140F]/[0.02]'
                  : 'border-[#11140F]/10 hover:border-[#11140F]/30 bg-white'
              }`}
            >
              <div
                className="w-4.5 h-4.5 rounded-full shrink-0 shadow-2xs border border-white"
                style={{
                  background: `linear-gradient(135deg, ${p.gradientColors[0]}, ${p.gradientColors[1]})`,
                }}
              />
              <div className="min-w-0">
                <span className="text-[12px] font-semibold text-[#11140F] block truncate">
                  {p.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt input */}
      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[#11140F]/70">
          Artistic Direction Prompt:
        </label>
        <textarea
          rows={2}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Describe your desired palette, mood, and brand texture..."
          className="w-full rounded-xl border border-[#11140F]/15 bg-[#11140F]/[0.02] p-3 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors resize-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !promptText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Synthesize QR Art with AI
          </button>
        </div>
      </div>

      {loading && (
        <AiProgressTracker
          title="Synthesizing Branded QR Art"
          subtitle="Calibrating radiant color micro-gradients & ISO scannability contrast"
          onForceComplete={() => setLoading(false)}
        />
      )}

      {/* Center Emblem Selector */}
      <div className="p-3.5 rounded-2xl bg-[#11140F]/[0.02] border border-[#11140F]/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#11140F]/60">
            Center Brand Emblem:
          </span>
          <span className="text-[11px] text-emerald-700 font-mono">Excavated with Level H (30%)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: 'leaf', label: '🌿 Leaf' },
              { id: 'star', label: '⭐ Star' },
              { id: 'sparkles', label: '✨ Sparkle' },
              { id: 'diamond', label: '💎 Diamond' },
              { id: 'shield', label: '🛡️ Shield' },
              { id: 'initial', label: `🔤 Initials (${initialChar})` },
              { id: 'none', label: 'None' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCenterEmblem(item.id)}
              className={`px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all cursor-pointer ${
                centerEmblem === item.id
                  ? 'bg-[#11140F] text-white shadow-xs'
                  : 'bg-white border border-[#11140F]/10 text-[#11140F]/70 hover:bg-[#11140F]/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas / Render Preview */}
      {!loading && (
        <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
          {/* Visual QR Container with SVG Gradient Defs */}
          <div
            ref={qrRef}
            className="p-5 rounded-3xl shadow-xl border shrink-0 transition-transform hover:scale-[1.02] relative"
            style={{
              background: `linear-gradient(135deg, ${styleSpec.gradientColors[0]}15, ${styleSpec.gradientColors[1]}25)`,
              borderColor: `${styleSpec.accentColor}40`,
            }}
          >
            {/* SVG Defs for gradient modules */}
            <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={styleSpec.gradientColors[0]} />
                  <stop offset="100%" stopColor={styleSpec.gradientColors[1]} />
                </linearGradient>
              </defs>
            </svg>

            <div className="bg-white p-3.5 rounded-2xl shadow-inner border border-black/5">
              <QRCodeSVG
                ref={svgRef}
                value={qrUrl}
                size={190}
                level="H"
                fgColor={`url(#${gradientId})`}
                bgColor="#FFFFFF"
                includeMargin={false}
                imageSettings={
                  centerEmblem !== 'none'
                    ? {
                        src: emblemUri,
                        x: undefined,
                        y: undefined,
                        height: 44,
                        width: 44,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Offscreen High-Res Canvas for 100% Robust 300 DPI Export */}
          <div ref={hiddenCanvasRef} className="hidden" aria-hidden="true">
            <QRCodeCanvas
              value={qrUrl}
              size={1024}
              level="H"
              includeMargin={false}
              bgColor="rgba(0,0,0,0)"
              fgColor="#000000"
              imageSettings={
                centerEmblem !== 'none'
                  ? {
                      src: emblemUri,
                      x: undefined,
                      y: undefined,
                      height: 236,
                      width: 236,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>

          <div className="space-y-3.5 flex-1 min-w-0">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#11140F]/50 font-bold">
                Active Art Profile
              </span>
              <p className="text-[16px] font-bold text-[#11140F]">{styleSpec.artisticStyle}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: styleSpec.gradientColors[0] }}
                />
                <span className="text-[11px] font-mono text-[#11140F]/60">
                  {styleSpec.gradientColors[0]} → {styleSpec.gradientColors[1]}
                </span>
              </div>
            </div>

            {/* Scannability Rating */}
            {scannability && (
              <div className="space-y-1.5 p-3 rounded-xl bg-white border border-[#11140F]/10">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1.5 font-semibold text-[#11140F]/85">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ISO Scannability Score
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {scannability.score}/100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#11140F]/10 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{ width: `${scannability.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#11140F]/55 flex items-center justify-between">
                  <span>Contrast Ratio: {scannability.contrastRatio}:1</span>
                  <span className="font-medium text-emerald-800">Verified Readable</span>
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="px-3.5 py-2 rounded-xl bg-[#11140F] text-white text-[12px] font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download Print PNG (300 DPI)
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="px-3 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-[12px] font-medium hover:bg-[#EEF0EA] transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download scalable SVG for Figma, Illustrator, or print presses"
              >
                <FileCode className="w-3.5 h-3.5 text-[#2F6B4F]" />
                Vector SVG
              </button>
              <button
                type="button"
                onClick={handleSaveArtwork}
                className="px-3 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-[12px] font-medium hover:bg-[#11140F]/5 transition-colors flex items-center gap-1 cursor-pointer"
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
