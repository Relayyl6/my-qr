'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone,
  Sparkles,
  Zap,
  ShieldCheck,
  Globe2,
  Clock,
  Layers,
  ArrowRight,
  Printer,
  CheckCircle2,
  XCircle,
  Cpu,
  BarChart3,
  Sliders,
  Utensils,
  Package,
  Calendar,
  Building2,
  ChevronRight,
  ExternalLink,
  Laptop,
  Play,
  Shield,
  Lock,
  Monitor,
  Radio,
  Compass,
  Check,
} from 'lucide-react';

interface Props {
  onOpenWorkspace?: () => void;
}

type IndustryTab = 'hospitality' | 'packaging' | 'events' | 'retail';

const INDUSTRIES: Record<
  IndustryTab,
  {
    title: string;
    badge: string;
    icon: any;
    headline: string;
    description: string;
    mockTarget: string;
    routeRules: string[];
    benefitLabel: string;
    benefitValue: string;
    secondaryBenefit: string;
  }
> = {
  hospitality: {
    title: 'Hospitality & Menus',
    badge: 'Table & Bar Media',
    icon: Utensils,
    headline: 'Swap lunch to dinner menus without touching the acrylic stands.',
    description:
      'Print metal or wood tabletop QR codes once. Schedule morning breakfast specials, afternoon happy hour menus, and late-night bookings automatically on a single code.',
    mockTarget: 'https://bistro-modern.com/dinner-menu',
    routeRules: ['11:00 - 15:00 → Lunch Specials', '15:00 - 19:00 → Cocktail Hour', '19:00 - Close → Chef Tasting Menu'],
    benefitLabel: 'Reprint Costs Saved',
    benefitValue: '$1,800/yr',
    secondaryBenefit: 'Zero server down-time',
  },
  packaging: {
    title: 'Packaging & Labels',
    badge: 'Consumer Packaged Goods',
    icon: Package,
    headline: 'Every printed box stays connected to the latest documentation.',
    description:
      'Once a cardboard box or cosmetic bottle is sealed, you cannot reprint the QR code. DynamicQR allows QA teams to update warranty links, recalls, and batch lab results on units already on store shelves.',
    mockTarget: 'https://brand-labs.com/batch-verification-7412',
    routeRules: ['US / Canada → North America Portal', 'EU / UK → GDPR Compliant Lab Spec', 'Mobile Scanners → Interactive AR Manual'],
    benefitLabel: 'Packaging Lifespan',
    benefitValue: 'Indefinite',
    secondaryBenefit: 'Instant regulatory compliance',
  },
  events: {
    title: 'Conferences & Festivals',
    badge: 'Badges & Lanyards',
    icon: Calendar,
    headline: 'The attendee lanyard that adapts hour by hour.',
    description:
      'Before the keynote, route to ticket check-in. During the event, route to live stage schedules. After closing remarks, route attendees directly to sponsor decks and session feedback.',
    mockTarget: 'https://summit2026.live/schedule-now',
    routeRules: ['Day 1 09:00 → Live Auditorium Stream', 'Day 1 18:00 → Evening Networking Mixer', 'Post-Event → Speaker Slides & Survey'],
    benefitLabel: 'Badge Re-engagement',
    benefitValue: '94.2%',
    secondaryBenefit: '12,000+ simultaneous scans',
  },
  retail: {
    title: 'Billboards & Street Media',
    badge: 'Outdoor Advertising',
    icon: Building2,
    headline: 'Route iOS to App Store, Android to Google Play from one billboard.',
    description:
      'Physical posters have no screen to ask which device the passerby is holding. DynamicQR detects the camera scanner OS and instantly delivers the native app download.',
    mockTarget: 'https://apps.apple.com/app/fintech-pro/id9921',
    routeRules: ['Apple iOS → App Store Handoff', 'Android → Google Play Store', 'Desktop Browsers → Interactive Web Demo'],
    benefitLabel: 'App Install Conversion',
    benefitValue: '+38%',
    secondaryBenefit: 'Sub-10ms 307 Edge Redirect',
  },
};

const COMPARISON = [
  {
    feature: 'Link destination update',
    staticQr: 'Impossible. Requires full reprint.',
    dynamicQr: 'Instant. Update online in 5 seconds.',
    isWin: true,
  },
  {
    feature: 'Device-specific routing (iOS / Android)',
    staticQr: 'Not supported. Single static link.',
    dynamicQr: 'Native detection & automated branching.',
    isWin: true,
  },
  {
    feature: 'Time-of-day dayparting',
    staticQr: 'Requires printing multiple codes.',
    dynamicQr: 'Single code adapts continuously.',
    isWin: true,
  },
  {
    feature: 'Print-grade resolution & quiet-zone',
    staticQr: 'Often blurry raster screenshot.',
    dynamicQr: 'Precision 300 DPI vector math.',
    isWin: true,
  },
  {
    feature: 'Scan telemetry & diurnal analytics',
    staticQr: 'Zero visibility into scans.',
    dynamicQr: 'Real-time device & peak hour metrics.',
    isWin: true,
  },
  {
    feature: 'Branded custom domains',
    staticQr: 'Hardcoded raw destination.',
    dynamicQr: 'Masked under qr.yourbrand.com.',
    isWin: true,
  },
];

export default function AppleProductTour({ onOpenWorkspace }: Props) {
  const [activeTab, setActiveTab] = useState<IndustryTab>('hospitality');
  const [simulatedDevice, setSimulatedDevice] = useState<'ios' | 'android' | 'desktop'>('ios');

  const handleOpenWorkspace = () => {
    if (onOpenWorkspace) {
      onOpenWorkspace();
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#workspace';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };

  const currentIndustry = INDUSTRIES[activeTab];

  return (
    <div className="w-full bg-[#11140F] text-white overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* 1. Cinematic Apple-Style Hero */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 px-5 md:px-8 max-w-[1280px] mx-auto">
        {/* Subtle radial ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="text-center max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-[12px] font-mono tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Engineered for the physical world
          </div>

          <h1
            className="text-[2.6rem] sm:text-[3.8rem] md:text-[5rem] font-bold tracking-tight leading-[1.03] text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            One code.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-white">
              Infinite destinations.
            </span>
          </h1>

          <p className="text-[16px] sm:text-[19px] md:text-[20px] text-white/65 max-w-[55ch] mx-auto leading-relaxed font-normal">
            A dynamic QR code you print once on paper, metal, or packaging.
            Then route, schedule, and measure forever with sub-10ms edge intelligence.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleOpenWorkspace}
              className="rounded-2xl bg-white px-7 py-3.5 text-[15px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-all duration-200 flex items-center gap-2 shadow-lg shadow-white/10 cursor-pointer"
            >
              Open Your Workspace
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#industries"
              className="rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-[15px] font-medium text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.08] transition-all"
            >
              Explore Real-World Use Cases
            </a>
          </div>

          <div className="pt-10 flex items-center justify-center gap-8 text-[12.5px] text-white/45 font-mono">
            <span>✓ 307 Edge Handoff</span>
            <span>•</span>
            <span>✓ 300 DPI Vector Math</span>
            <span>•</span>
            <span>✓ Zero Reprint Guarantee</span>
          </div>
        </div>

        {/* Floating Precision Interactive Hardware Mockup */}
        <div className="mt-16 md:mt-24 max-w-4xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Device Simulator with Real Hardware & Actual Scannable QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center min-h-[460px]">
              {simulatedDevice === 'ios' && (
                /* Apple iPhone Realistic Titanium Hardware Mockup */
                <div className="w-[245px] sm:w-[260px] h-[460px] rounded-[48px] bg-gradient-to-b from-[#383A35] via-[#20211D] to-[#11120F] p-[8px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.15)] relative border border-white/10 flex flex-col justify-between transition-all duration-300 animate-fade-in">
                  {/* Physical Hardware Buttons */}
                  <div className="absolute -left-[3px] top-24 w-[3px] h-7 bg-white/30 rounded-l" />
                  <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-white/30 rounded-l" />
                  <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-white/30 rounded-l" />
                  <div className="absolute -right-[3px] top-36 w-[3px] h-16 bg-white/30 rounded-r" />

                  {/* Display Screen */}
                  <div className="w-full h-full rounded-[40px] bg-black overflow-hidden relative flex flex-col justify-between p-3 select-none">
                    {/* Dynamic Island */}
                    <div className="w-24 h-[22px] bg-black rounded-full mx-auto border border-white/15 flex items-center justify-between px-2.5 z-30 shadow-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0f] border border-[#222] relative flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#151515]" />
                    </div>

                    {/* iOS App Store / Safari Banner Notification */}
                    <div className="mt-1 px-1 z-20">
                      <div className="rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 p-2 flex items-center gap-2 shadow-lg animate-fade-in">
                        <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9.5px] font-medium text-white/50 leading-tight">Safari • Ingress 307</div>
                          <div className="text-[11px] font-semibold text-white truncate">Open &quot;apps.apple.com&quot;</div>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-500 text-white shrink-0">
                          Open
                        </span>
                      </div>
                    </div>

                    {/* Camera Viewfinder & Actual Scannable QR Code */}
                    <div className="relative my-auto flex flex-col items-center justify-center p-2">
                      <div className="relative p-2.5 rounded-2xl bg-white shadow-2xl border-2 border-white/90">
                        <QRCodeSVG
                          value="https://apps.apple.com/app/festival-guide/id8921"
                          size={118}
                          level="H"
                          fgColor="#11140F"
                          includeMargin={false}
                        />
                        {/* Animated Laser Scanning Line */}
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                      </div>

                      {/* iOS Camera Yellow Detection Corner Brackets */}
                      <div className="absolute inset-x-7 inset-y-3 pointer-events-none">
                        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />
                      </div>

                      <div className="mt-2 text-[10.5px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5 bg-black/70 px-2.5 py-0.5 rounded-full border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Target: App Store (iOS)</span>
                      </div>
                    </div>

                    {/* iOS Camera Shutter & Home Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-around px-4">
                        <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20" />
                        <div className="w-11 h-11 rounded-full border-[3px] border-white flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white" />
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/70">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="w-24 h-1 bg-white/40 rounded-full mx-auto" />
                    </div>
                  </div>
                </div>
              )}

              {simulatedDevice === 'android' && (
                /* Google Pixel Realistic Hardware Mockup */
                <div className="w-[245px] sm:w-[260px] h-[460px] rounded-[42px] bg-gradient-to-b from-[#2E333D] via-[#1F232B] to-[#121418] p-[8px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.15)] relative border border-white/10 flex flex-col justify-between transition-all duration-300 animate-fade-in">
                  {/* Physical Hardware Buttons */}
                  <div className="absolute -right-[3px] top-28 w-[3px] h-10 bg-white/30 rounded-r" />
                  <div className="absolute -right-[3px] top-42 w-[3px] h-16 bg-white/30 rounded-r" />

                  {/* Display Screen */}
                  <div className="w-full h-full rounded-[34px] bg-[#0E1116] overflow-hidden relative flex flex-col justify-between p-3 select-none">
                    {/* Pixel Centered Punch-Hole Camera */}
                    <div className="w-3.5 h-3.5 bg-black rounded-full mx-auto border border-[#333] flex items-center justify-center z-30 shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400/40" />
                    </div>

                    {/* Google Lens Detection Overlay */}
                    <div className="mt-1 px-1 z-20">
                      <div className="rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 p-2 flex items-center gap-2 shadow-lg animate-fade-in">
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9.5px] font-medium text-white/50 leading-tight">Google Play • Sub-10ms</div>
                          <div className="text-[11px] font-semibold text-white truncate">Open &quot;play.google.com&quot;</div>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500 text-black shrink-0">
                          Install
                        </span>
                      </div>
                    </div>

                    {/* Camera Viewfinder & Actual Scannable QR Code */}
                    <div className="relative my-auto flex flex-col items-center justify-center p-2">
                      <div className="relative p-2.5 rounded-2xl bg-white shadow-2xl border-2 border-white/90">
                        <QRCodeSVG
                          value="https://play.google.com/store/apps/details?id=festival.guide"
                          size={118}
                          level="H"
                          fgColor="#11140F"
                          includeMargin={false}
                        />
                        {/* Animated Laser Scanning Line */}
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_#2dd4bf] animate-pulse top-1/2 -translate-y-1/2" />
                      </div>

                      {/* Google Lens Cyan Rounded Corner Brackets */}
                      <div className="absolute inset-x-7 inset-y-3 pointer-events-none">
                        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                      </div>

                      <div className="mt-2 text-[10.5px] font-mono text-teal-300 font-semibold flex items-center gap-1.5 bg-black/70 px-2.5 py-0.5 rounded-full border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                        <span>Target: Google Play (Android)</span>
                      </div>
                    </div>

                    {/* Android Navigation Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-around px-4">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50">
                          Lens
                        </div>
                        <div className="w-11 h-11 rounded-full border-[3px] border-emerald-400 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white" />
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="w-20 h-1 bg-white/40 rounded-full mx-auto" />
                    </div>
                  </div>
                </div>
              )}

              {simulatedDevice === 'desktop' && (
                /* Mac/PC Realistic Hardware Desktop Mockup */
                <div className="w-full max-w-[340px] sm:max-w-[370px] h-[370px] sm:h-[400px] rounded-2xl bg-[#1B1E22] border border-white/15 p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.12)] flex flex-col justify-between transition-all duration-300 animate-fade-in">
                  {/* macOS / PC Window Chrome Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                        <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                      </div>
                      <div className="text-[11px] font-mono text-white/50 flex items-center gap-1.5">
                        <Globe2 className="w-3 h-3 text-emerald-400" />
                        <span>festival-summer.com</span>
                      </div>
                      <div className="w-10" />
                    </div>

                    {/* Omnibox / URL Bar */}
                    <div className="rounded-lg bg-black/60 border border-white/10 px-2.5 py-1.5 flex items-center gap-2 text-[10.5px] font-mono">
                      <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-white/70 truncate">https://my-qr-sandy.vercel.app/id/summer-festival</span>
                      <span className="ml-auto text-[9.5px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                        307
                      </span>
                    </div>
                  </div>

                  {/* Desktop Web Body: Instant Destination Rendering */}
                  <div className="my-auto rounded-xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                          Desktop Ingress Detected
                        </span>
                        <h4 className="text-[13.5px] font-bold text-white">
                          Summer Festival &apos;26 Desktop Hub
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        7.4ms
                      </span>
                    </div>

                    <p className="text-[11.5px] text-white/65 leading-relaxed">
                      Passersby scanning from a laptop or desktop bypass mobile app stores and land directly on your interactive widescreen portal.
                    </p>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10.5px] font-mono text-emerald-300">Widescreen 4K Stream Online</span>
                      </div>
                      <div className="p-1 rounded-md bg-white">
                        <QRCodeSVG
                          value="https://festival-summer.com/lineup-desktop"
                          size={40}
                          level="M"
                          fgColor="#11140F"
                          includeMargin={false}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Window Status */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
                    <span>Edge: US-East (IAD)</span>
                    <span>HTTP/2 307 Direct</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Routing Rule Engine */}
            <div className="md:col-span-7 space-y-5">
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Edge Route Evaluation
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  One Physical Print. Adaptive Ingress.
                </h3>
                <p className="text-[13.5px] text-white/60 leading-relaxed">
                  When a physical customer scans, our edge router inspects user-agent headers and clock state in under 10ms without showing an interstitial screen.
                </p>
              </div>

              {/* Interactive Device Selector */}
              <div className="space-y-2">
                <span className="text-[12px] font-medium text-white/70">Simulate incoming scan device:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'ios', label: 'Apple iPhone (iOS)' },
                    { id: 'android', label: 'Google Pixel (Android)' },
                    { id: 'desktop', label: 'Mac/PC Browser' },
                  ].map((dev) => (
                    <button
                      key={dev.id}
                      onClick={() => setSimulatedDevice(dev.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
                        simulatedDevice === dev.id
                          ? 'bg-emerald-500 text-black font-semibold shadow-xs'
                          : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {dev.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Box */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-2 font-mono text-[12.5px]">
                <div className="flex items-center justify-between text-white/50 text-[11px]">
                  <span>HTTP INGRESS HEADERS</span>
                  <span className="text-emerald-400 font-semibold">STATUS 307 TEMPORARY REDIRECT</span>
                </div>
                <p className="text-white/80">
                  <span className="text-white/40">Request:</span> GET /id/summer-festival
                </p>
                <p className="text-emerald-300 font-semibold break-all">
                  <span className="text-white/40">Target:</span>{' '}
                  {simulatedDevice === 'ios'
                    ? 'https://apps.apple.com/app/festival-guide/id8921'
                    : simulatedDevice === 'android'
                    ? 'https://play.google.com/store/apps/details?id=festival.guide'
                    : 'https://festival-summer.com/lineup-desktop'}
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
                  <span>Routing Latency: 7.4ms</span>
                  <span>SSL: Encrypted TLS 1.3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Apple-Style Perspective Showcase: Real World Industries */}
      <section id="industries" className="py-20 md:py-32 px-5 md:px-8 max-w-[1280px] mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <h2
            className="text-[2.2rem] sm:text-[3rem] font-bold tracking-tight leading-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Engineered for physical operations.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-white/60">
            Select an industry below to see how physical media stays active without reprints.
          </p>

          {/* Industry Tab Selector: Strictly in ONE Single Line */}
          <div className="flex flex-nowrap items-center justify-start sm:justify-center gap-2 pt-4 overflow-x-auto max-w-full pb-2 px-1">
            {(Object.keys(INDUSTRIES) as IndustryTab[]).map((tabKey) => {
              const ind = INDUSTRIES[tabKey];
              const Icon = ind.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[12.5px] sm:text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-white text-[#11140F] font-semibold shadow-md'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {ind.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Industry Showcase Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 sm:p-12 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Narrative & Benefit Metrics */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11.5px] font-mono uppercase tracking-wider">
                {currentIndustry.badge}
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                {currentIndustry.headline}
              </h3>

              <p className="text-[15px] text-white/65 leading-relaxed">
                {currentIndustry.description}
              </p>

              {/* Automated Ingress Rules */}
              <div className="space-y-2 pt-2">
                <span className="text-[12px] font-semibold text-white/80 uppercase tracking-wider block font-mono">
                  Autonomous Ingress Matrix:
                </span>
                <ul className="space-y-2">
                  {currentIndustry.routeRules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2.5 text-[13px] font-mono text-emerald-300 bg-white/[0.03] p-2.5 rounded-xl border border-white/5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tangible Metrics */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[12px] text-white/50 block">{currentIndustry.benefitLabel}</span>
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {currentIndustry.benefitValue}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] text-white/50 block">Operational Assurance</span>
                  <span className="text-base sm:text-lg font-semibold text-emerald-400">
                    {currentIndustry.secondaryBenefit}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Visual Card with Real Scannable QR Code */}
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                <span>PRINTED ASSET</span>
                <span className="text-emerald-400">PHYSICALLY CIRCULATING</span>
              </div>

              <div className="p-7 rounded-2xl bg-white text-black text-center space-y-4 flex flex-col items-center shadow-xl">
                <div className="p-3 bg-white rounded-xl border border-black/10 shadow-inner">
                  <QRCodeSVG
                    value={currentIndustry.mockTarget}
                    size={128}
                    level="H"
                    fgColor="#11140F"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[12.5px] font-bold text-black uppercase tracking-wide">
                    Scan with any phone camera
                  </span>
                  <p className="text-[11px] text-black/60 font-mono">
                    Permanent Shortcode: /id/{activeTab}-fleet
                  </p>
                </div>
              </div>

              <div className="text-[12px] font-mono space-y-1 text-white/70">
                <div className="text-white/40 text-[10.5px]">CURRENT ACTIVE DESTINATION:</div>
                <div className="text-emerald-400 truncate font-semibold">
                  {currentIndustry.mockTarget}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Apple-Style Bento Grid: Pro Architecture (Rectangles & Squares across Mobile, Tablet & Desktop) */}
      <section className="py-20 md:py-32 px-5 md:px-8 max-w-[1280px] mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[11.5px] font-mono tracking-wider uppercase">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Core Infrastructure Bento
          </div>
          <h2
            className="text-[2.2rem] sm:text-[3rem] font-bold tracking-tight text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Built like high-performance hardware.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-white/60">
            Every layer from database pooling to vector math is tuned for zero-failure physical deployments.
          </p>
        </div>

        {/* Asymmetrical Bento Grid: Harmonious rectangles and squares */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Bento Item 1: Wide Rectangle (2 Cols) — Sub-10ms 307 Direct Redirect */}
          <div className="md:col-span-2 lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Edge Architecture
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Sub-10ms 307 Direct Redirect
                </h3>
                <p className="mt-1 text-[13.5px] text-white/60 leading-relaxed max-w-[65ch]">
                  Zero intermediary splash screens. Zero tracking ads. The edge server returns a clean HTTP 307 temporary redirect directly into the visitor’s browser with sub-millisecond DNS dispatch.
                </p>
              </div>

              {/* Interactive Edge Pipeline Schematic */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11.5px] space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-white/40">Physical Camera</span>
                    <span className="text-white">→ Ingress</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span>Edge Hop: 7.2ms</span>
                    <span className="text-white/30">•</span>
                    <span>99.99% Edge Cache HIT</span>
                  </div>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full w-full animate-pulse" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-baseline justify-between font-mono">
              <span className="text-3xl font-bold text-white tracking-tight">
                &lt;10ms
              </span>
              <span className="text-[11.5px] text-white/40 uppercase">
                Zero-interstitial edge handoff
              </span>
            </div>
          </div>

          {/* Bento Item 2: Square (1 Col) — Native Device OS Branching */}
          <div className="col-span-1 lg:col-span-1 aspect-square md:aspect-auto lg:aspect-square rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-7 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
                  Device Sensing
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Native OS Branching
                </h3>
                <p className="mt-1 text-[13px] text-white/60 leading-relaxed">
                  Differentiates iOS, Android, and Desktop user-agents at the wire level.
                </p>
              </div>

              {/* Compact OS Badges */}
              <div className="space-y-1.5 pt-1 font-mono text-[11px]">
                <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
                  <span>Apple iOS</span>
                  <span className="text-emerald-400">App Store</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70">
                  <span>Android</span>
                  <span className="text-emerald-400">Google Play</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-white tracking-tight">
                100%
              </span>
              <span className="text-[11px] text-white/40 uppercase">
                Device Accuracy
              </span>
            </div>
          </div>

          {/* Bento Item 3: Square (1 Col) — 300 DPI Sub-Pixel Vector Engine */}
          <div className="col-span-1 lg:col-span-1 aspect-square md:aspect-auto lg:aspect-square rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-7 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
                  Print Physics
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  300 DPI Vector Math
                </h3>
                <p className="mt-1 text-[13px] text-white/60 leading-relaxed">
                  Sub-pixel precision SVG with mandatory 10% quiet-zone buffers.
                </p>
              </div>

              {/* CMYK & SVG Badge */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between text-white/70">
                  <span>Vector XML</span>
                  <span className="text-purple-300">Clean &lt;path&gt;</span>
                </div>
                <div className="flex items-center justify-between text-white/40 text-[10px]">
                  <span>CMYK Proofing</span>
                  <span>1024×1024 PNG</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-white tracking-tight">
                300 DPI
              </span>
              <span className="text-[11px] text-white/40 uppercase">
                Industrial Print
              </span>
            </div>
          </div>

          {/* Bento Item 4: Wide Rectangle (2 Cols) — Time & Day-of-Week Dayparting */}
          <div className="md:col-span-2 lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Temporal Dayparting
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Time &amp; Day-of-Week Dayparting
                </h3>
                <p className="mt-1 text-[13.5px] text-white/60 leading-relaxed max-w-[65ch]">
                  Swap physical QR targets continuously without human intervention. Breakfast menus at dawn, cocktail cards in the afternoon, and live music passes at midnight.
                </p>
              </div>

              {/* Visual 24-Hour Timeline Scrubber */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-white/50 text-[10.5px]">
                  <span>08:00 BREAKFAST</span>
                  <span>12:00 LUNCH</span>
                  <span className="text-amber-300 font-bold">17:00 HAPPY HOUR</span>
                  <span>20:00 TASTING</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-2">
                  <div className="bg-white/20 rounded-full" />
                  <div className="bg-white/20 rounded-full" />
                  <div className="bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]" />
                  <div className="bg-white/20 rounded-full" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-baseline justify-between font-mono">
              <span className="text-3xl font-bold text-white tracking-tight">
                24/7
              </span>
              <span className="text-[11.5px] text-white/40 uppercase">
                Autonomous schedule swaps
              </span>
            </div>
          </div>

          {/* Bento Item 5: Wide Rectangle (2 Cols) — Branded Custom Domain Prefix */}
          <div className="md:col-span-2 lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Globe2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                  Enterprise Whitelabel
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Branded Custom Domain Prefix
                </h3>
                <p className="mt-1 text-[13.5px] text-white/60 leading-relaxed max-w-[65ch]">
                  Serve dynamic links under your own verified corporate domain (e.g. qr.yourbrand.com/promo). Eliminates generic third-party URLs to elevate physical scan trust.
                </p>
              </div>

              {/* Realistic Domain Bar */}
              <div className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 flex items-center gap-2 font-mono text-[12px]">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-300 font-semibold">https://qr.acme-corp.com</span>
                <span className="text-white/40">/summer-promo</span>
                <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  TLS 1.3 Certified
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-baseline justify-between font-mono">
              <span className="text-3xl font-bold text-white tracking-tight">
                0%
              </span>
              <span className="text-[11.5px] text-white/40 uppercase">
                Third-party vendor branding
              </span>
            </div>
          </div>

          {/* Bento Item 6: Square (1 Col) — Cookieless Edge Telemetry */}
          <div className="col-span-1 lg:col-span-1 aspect-square md:aspect-auto lg:aspect-square rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-7 sm:p-8 flex flex-col justify-between hover:border-white/20 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
                  Privacy Core
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Zero-Cookie Privacy
                </h3>
                <p className="mt-1 text-[13px] text-white/60 leading-relaxed">
                  Anonymized diurnal metrics with cryptographic daily rotating salts.
                </p>
              </div>

              {/* Privacy Compliance Badges */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>GDPR / CCPA</span>
                  <span>100% Compliant</span>
                </div>
                <div className="text-[10px] text-white/40">
                  No tracking cookies stored
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-white tracking-tight">
                GDPR
              </span>
              <span className="text-[11px] text-white/40 uppercase">
                Cookieless Standard
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Apple-Style Split Comparison Matrix: Static vs Dynamic */}
      <section className="py-20 md:py-28 px-5 md:px-8 max-w-[1100px] mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <h2
            className="text-[2rem] sm:text-[2.6rem] font-bold tracking-tight text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            The Single Point of Failure. Solved.
          </h2>
          <p className="text-[14.5px] sm:text-[16px] text-white/60">
            A static QR code printed on 10,000 flyers is an unchangeable liability. Here is how DynamicQR upgrades physical media.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 bg-white/[0.06] p-4 sm:p-5 border-b border-white/10 text-[12px] font-mono font-semibold text-white/60 uppercase tracking-wider">
            <div className="col-span-4 sm:col-span-5">Operational Dimension</div>
            <div className="col-span-4 sm:col-span-3 text-red-400">Static QR Code</div>
            <div className="col-span-4 text-emerald-400">DynamicQR Architecture</div>
          </div>

          <div className="divide-y divide-white/5">
            {COMPARISON.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 p-4 sm:p-5 text-[13px] items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-4 sm:col-span-5 font-medium text-white">
                  {row.feature}
                </div>
                <div className="col-span-4 sm:col-span-3 text-white/40 text-[12.5px] flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 hidden sm:inline" />
                  <span>{row.staticQr}</span>
                </div>
                <div className="col-span-4 text-emerald-300 font-semibold text-[12.5px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden sm:inline" />
                  <span>{row.dynamicQr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Minimalist Apple-Style Closing CTA */}
      <section className="py-24 md:py-32 px-5 md:px-8 max-w-[960px] mx-auto text-center space-y-6 border-t border-white/10">
        <h2
          className="text-[2.6rem] sm:text-[3.5rem] md:text-[4rem] font-bold tracking-tight text-white leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Print with total confidence.
        </h2>
        <p className="text-[16px] sm:text-[18px] text-white/65 max-w-[45ch] mx-auto leading-relaxed">
          Create up to 5 dynamic QR codes on our Free plan right now. No credit card required.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleOpenWorkspace}
            className="rounded-2xl bg-white px-8 py-4 text-[15px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-all duration-200 shadow-xl shadow-white/10 flex items-center gap-2 cursor-pointer"
          >
            Launch Your Workspace &rarr;
          </button>
          <a
            href="/pricing"
            className="rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-[15px] font-medium text-white hover:bg-white/10 transition-all"
          >
            View Pricing Plans
          </a>
        </div>
      </section>
    </div>
  );
}
