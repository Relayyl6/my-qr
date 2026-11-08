'use client';

import { useState } from 'react';
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
} from 'lucide-react';

interface Props {
  onOpenWorkspace: () => void;
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

const BENTO_FEATURES = [
  {
    icon: Zap,
    tag: 'Edge Architecture',
    title: 'Sub-10ms 307 Direct Redirect',
    description:
      'No slow intermediary landing pages. No sponsor ads. The edge server returns a clean HTTP 307 temporary redirect directly into the visitor’s browser.',
    metric: '<10ms',
    metricLabel: 'Edge latency',
  },
  {
    icon: Smartphone,
    tag: 'Device Sensing',
    title: 'Native OS Destination Matrix',
    description:
      'Intelligently routes iOS cameras to the App Store, Android cameras to Google Play, and laptop scans to desktop web portals.',
    metric: '100%',
    metricLabel: 'Device accuracy',
  },
  {
    icon: Printer,
    tag: 'Print Physics',
    title: '300 DPI Sub-Pixel Vector Engine',
    description:
      'Generates mathematically perfect vector SVGs and uncompressed 1024×1024 PNGs with mandatory quiet-zone protection for industrial CMYK printing.',
    metric: '300 DPI',
    metricLabel: 'Print fidelity',
  },
  {
    icon: Clock,
    tag: 'Temporal Dayparting',
    title: 'Time & Day-of-Week Scheduling',
    description:
      'Automatically swap the destination URL based on time of day (UTC) or specific calendar milestones without logging in manually.',
    metric: '24/7',
    metricLabel: 'Autonomous swap',
  },
  {
    icon: Globe2,
    tag: 'Enterprise Masking',
    title: 'Branded Custom Domain Prefix',
    description:
      'Serve dynamic links under your own verified brand domain (e.g. qr.yourbrand.com/promo) to build brand equity and elevate scan trust.',
    metric: '0%',
    metricLabel: 'Third-party branding',
  },
  {
    icon: ShieldCheck,
    tag: 'Zero-Cookie Privacy',
    title: 'Cookieless Edge Scan Telemetry',
    description:
      'Aggregates device trends, peak hours, and country distribution without invasive cookies, remaining fully GDPR and CCPA compliant out of the box.',
    metric: 'GDPR',
    metricLabel: 'Privacy compliant',
  },
];

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
              onClick={onOpenWorkspace}
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
            {/* Left: Device Simulator */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-56 h-[380px] rounded-[38px] border-[5px] border-white/20 bg-black p-3.5 flex flex-col justify-between shadow-2xl relative">
                {/* Dynamic Island */}
                <div className="w-20 h-4 bg-white/20 rounded-full mx-auto" />

                {/* Camera Viewfinder with QR Alignment */}
                <div className="my-auto p-4 rounded-2xl border border-white/20 bg-white/5 flex flex-col items-center justify-center space-y-3">
                  <div className="relative p-2 rounded-xl bg-white">
                    <div className="w-24 h-24 bg-[#11140F] rounded-lg p-2 flex items-center justify-center">
                      <div className="w-20 h-20 border-2 border-white rounded grid grid-cols-3 gap-0.5 p-1">
                        <div className="bg-white rounded-xs" />
                        <div className="bg-transparent" />
                        <div className="bg-white rounded-xs" />
                        <div className="bg-white" />
                        <div className="bg-emerald-400 rounded-full" />
                        <div className="bg-white" />
                        <div className="bg-white rounded-xs" />
                        <div className="bg-white" />
                        <div className="bg-white rounded-xs" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Target Detected: 307 Redirect
                  </span>
                </div>

                {/* Bottom Bar */}
                <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mb-1" />
              </div>
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
                <div className="flex gap-2">
                  {[
                    { id: 'ios', label: 'Apple iPhone (iOS)' },
                    { id: 'android', label: 'Google Pixel (Android)' },
                    { id: 'desktop', label: 'Mac/PC Browser' },
                  ].map((dev) => (
                    <button
                      key={dev.id}
                      onClick={() => setSimulatedDevice(dev.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
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
                  <span className="text-emerald-400">STATUS 307 TEMPORARY REDIRECT</span>
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
                  <span>SSL: Encrypted</span>
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

          {/* Industry Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {(Object.keys(INDUSTRIES) as IndustryTab[]).map((tabKey) => {
              const ind = INDUSTRIES[tabKey];
              const Icon = ind.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
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

            {/* Right Visual Card */}
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                <span>PRINTED ASSET</span>
                <span>PHYSICALLY CIRCULATING</span>
              </div>

              <div className="p-8 rounded-xl bg-white text-black text-center space-y-4 flex flex-col items-center">
                <div className="w-32 h-32 border-4 border-black p-2 rounded-xl flex items-center justify-center">
                  <div className="w-full h-full bg-black rounded flex items-center justify-center text-white font-mono text-[10px]">
                    DYNAMIC CODE
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[13px] font-bold text-black uppercase tracking-wide">
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

      {/* 3. Apple-Style Bento Grid: Pro Architecture */}
      <section className="py-20 md:py-32 px-5 md:px-8 max-w-[1280px] mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-[11.5px] font-mono tracking-wider uppercase">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Core Infrastructure
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENTO_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-8 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all hover:bg-white/[0.05]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    {feat.title}
                  </h3>

                  <p className="text-[13.5px] text-white/60 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-baseline justify-between font-mono">
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {feat.metric}
                  </span>
                  <span className="text-[11.5px] text-white/40 uppercase">
                    {feat.metricLabel}
                  </span>
                </div>
              </div>
            );
          })}
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
            onClick={onOpenWorkspace}
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
