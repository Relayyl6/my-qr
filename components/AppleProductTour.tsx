'use client';

import { useState, useTransition, memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const MemoizedQRCode = memo(function MemoizedQRCode({
  value,
  size,
  level = 'M',
  fgColor = '#11140F',
}: {
  value: string;
  size: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  fgColor?: string;
}) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level={level}
      fgColor={fgColor}
      includeMargin={false}
    />
  );
});
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
  Mail,
  Share2,
  Wifi,
  Contact,
  Link2,
  Download,
  Bot,
  Activity,
  QrCode,
  ArrowUpRight,
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
    secondaryBenefit: 'Sub-10ms Instant Edge Routing',
  },
};

export type MicroSaasTab = 'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi';

interface MicroSaasInfo {
  title: string;
  badge: string;
  replaces: string;
  icon: any;
  headline: string;
  description: string;
  features: string[];
  metrics: { label: string; value: string };
  mockUrl: string;
}

const MICRO_SAAS_APPS: Record<MicroSaasTab, MicroSaasInfo> = {
  mailing: {
    title: 'Customer Mailing Lists',
    badge: 'EMAIL MARKETING & LEAD CAPTURE',
    replaces: 'Replaces $29/mo Mailchimp or Klaviyo',
    icon: Mail,
    headline: 'Turn physical foot traffic into lifetime email subscribers.',
    description:
      'Print QR codes on retail counters, packaging, or table tents. When customers scan, they enter their email on a branded mobile form with automated double opt-in. Dispatch broadcast campaigns straight from your workspace using native Gmail delivery.',
    features: [
      'Self-hosted double opt-in verification with zero spam risk',
      'Native Gmail Nodemailer broadcast engine with zero third-party fees',
      'One-click CSV subscriber export and segmentation tags',
      'Instant real-time scan-to-subscriber conversion attribution',
    ],
    metrics: { label: 'Average Scan Conversion', value: '38.4%' },
    mockUrl: 'https://dynamicqr.co/m/vip-club',
  },
  vcard: {
    title: 'Digital Executive vCards',
    badge: 'TAP-TO-SAVE MOBILE IDENTITY',
    replaces: 'Replaces $19/mo Linktree or Popl subscriptions',
    icon: Contact,
    headline: 'One tap saves your entire executive profile directly to their phone.',
    description:
      'Never print disposable paper business cards again. Scanning your DynamicQR business card opens a sleek obsidian profile and generates an instant .vcf file that saves your name, title, direct phone, WhatsApp, email, and company website directly to their contacts with zero typing.',
    features: [
      'Instant .vcf address book integration on iOS & Android',
      'Dynamic editing: change your phone or title without reprinting badges',
      'Direct social & WhatsApp one-tap action buttons',
      'Full company branding with custom photo and bio badge',
    ],
    metrics: { label: 'Address Book Save Rate', value: '92.1%' },
    mockUrl: 'https://dynamicqr.co/v/alex-chen',
  },
  shortener: {
    title: 'Smart Deep Link Shortener',
    badge: 'CAMPAIGN ATTRIBUTION & APP ROUTING',
    replaces: 'Replaces $49/mo Bitly Pro or Branch.io',
    icon: Link2,
    headline: 'Short links that understand device architecture and UTM telemetry.',
    description:
      'Create high-converting branded short links with automated UTM tagging and deep mobile OS routing. If an iPhone scans, route them straight to the App Store; if Android scans, launch Google Play; if desktop opens, show your web app.',
    features: [
      'Autonomous OS detection: iOS App Store vs Android Google Play routing',
      'Built-in UTM builder (utm_source, utm_medium, utm_campaign)',
      'Sub-10ms 307 temporary redirect engine with zero latency penalty',
      'Granular click analytics by country, device, and referrer',
    ],
    metrics: { label: 'Routing Latency', value: '< 9ms' },
    mockUrl: 'https://dynamicqr.co/s/summer-drop',
  },
  menu: {
    title: 'Digital Restaurant Menus',
    badge: 'TOUCHLESS DINING & LIVE UPDATES',
    replaces: 'Replaces $39/mo QR Menu SaaS subscriptions',
    icon: Utensils,
    headline: 'Update items, daily specials, and prices live without reprinting menus.',
    description:
      'Table menus that update the moment a dish sells out. Organize your culinary offerings into Appetizers, Mains, Cocktails, and Desserts with dietary indicators (Vegan, Gluten-Free, Halal, Spicy) and multi-currency pricing.',
    features: [
      'Zero paper reprints when prices or wine lists change',
      'Dietary flags: Vegan, Gluten-Free, Halal, Spicy, and Chef Specials',
      'Instant mobile-optimized table browsing with zero app download',
      'Supports all global currencies ($, €, £, ₦, ¥, and custom)',
    ],
    metrics: { label: 'Reprint Costs Saved', value: '$1,200/yr' },
    mockUrl: 'https://dynamicqr.co/menu/atelier-bistro',
  },
  wifi: {
    title: 'Instant Wi-Fi Access Points',
    badge: 'ONE-TAP GUEST ONBOARDING',
    replaces: 'Replaces manual paper Wi-Fi sheets & password confusion',
    icon: Wifi,
    headline: 'Connect guests to secure Wi-Fi in one camera scan — zero password typing.',
    description:
      'Eliminate guest frustration and staff interruptions. Scanning your tabletop Wi-Fi card triggers the native iOS and Android prompt: "Join Network DynamicGuest?". Customers tap once and are instantly connected, even with complex 64-character encrypted keys.',
    features: [
      'Native camera join prompt on both Apple iOS & Google Android',
      'Supports WPA2/WPA3 Personal, WEP, and Open networks',
      'Hidden SSID support for private office and VIP lounges',
      'Exportable print-ready tabletop tent card templates',
    ],
    metrics: { label: 'Connection Speed', value: '1 Scan' },
    mockUrl: 'WIFI:S:Guest-Lounge;T:WPA;P:ultra-secure-key-2026;;',
  },
};

const COMPARISON = [
  {
    feature: 'Integrated Micro-SaaS Applications',
    staticQr: 'None. Only opens a basic static URL.',
    dynamicQr: '5 turnkey micro-apps: Mailing Lists, vCards, Shortener, Menus & Wi-Fi.',
    isWin: true,
  },
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
  const [activeMicroSaas, setActiveMicroSaas] = useState<MicroSaasTab>('mailing');
  const [simulatedDevice, setSimulatedDevice] = useState<'ios' | 'android' | 'desktop'>('ios');
  const [, startTransition] = useTransition();

  const handleOpenWorkspace = () => {
    if (onOpenWorkspace) {
      onOpenWorkspace();
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#workspace';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  };

  const currentIndustry = INDUSTRIES[activeTab];
  const currentMicroSaas = MICRO_SAAS_APPS[activeMicroSaas];

  return (
    <div className="w-full bg-[#11140F] text-white overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* ============================================================ */}
      {/* 1. Finora-Inspired Hero: Glowing Neon Circle Arc & Dashboard */}
      {/* (1:1 Faithful Reproduction of User Reference in Dark Green)  */}
      {/* ============================================================ */}
      <section className="relative pt-6 sm:pt-14 md:pt-20 pb-12 sm:pb-20 md:pb-24 px-3 sm:px-6 md:px-8 max-w-[1360px] mx-auto overflow-hidden">
        {/* Subtle Cyber Grid Lines (Echoing Reference Mockup) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:52px_52px] pointer-events-none -z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#11140F_85%)] pointer-events-none -z-10" />

        {/* Giant Glowing Neon Circular Arc (Emerald / Mint Hue echoing Finora reference) */}
        <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 w-[760px] sm:w-[980px] md:w-[1180px] h-[650px] sm:h-[800px] pointer-events-none -z-10 flex items-center justify-center overflow-hidden">
          {/* Ambient Diffuse Glow Filling the Arc */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_65%,rgba(16,185,129,0.3)_0%,rgba(5,150,105,0.12)_45%,transparent_75%)] blur-3xl" />
          
          {/* Giant Glowing Neon Circular Arc Rim */}
          <div className="w-[700px] sm:w-[920px] md:w-[1120px] h-[700px] sm:h-[920px] md:h-[1120px] rounded-full border-[2.5px] border-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.65),0_0_120px_rgba(16,185,129,0.35),inset_0_0_50px_rgba(16,185,129,0.3)] relative -translate-y-16 sm:-translate-y-20">
            {/* Inner Concentric Fine Line */}
            <div className="absolute inset-8 rounded-full border border-emerald-500/25" />
            {/* Top Apex Intense Flare */}
            <div className="absolute top-0 left-1/4 right-1/4 h-2 bg-gradient-to-r from-transparent via-emerald-200 to-transparent shadow-[0_0_30px_#34d399]" />
          </div>

          {/* Floating Starlight Flecks */}
          <div className="absolute top-16 left-1/4 w-1.5 h-1.5 rounded-full bg-emerald-200 shadow-[0_0_8px_#6ee7b7] animate-pulse" />
          <div className="absolute top-36 right-1/4 w-1.5 h-1.5 rounded-full bg-teal-200 shadow-[0_0_8px_#2dd4bf] animate-ping" />
          <div className="absolute top-52 left-1/3 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#fff]" />
          <div className="absolute top-44 right-1/3 w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399]" />
        </div>

        {/* Section Headline Inside/Above the Glowing Circle Arc */}
        <div className="text-center max-w-5xl xl:max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-5 relative z-10 mb-6 sm:mb-10 md:mb-14">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-[10.5px] sm:text-[12px] font-mono tracking-wide shadow-md backdrop-blur-md">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Your Operations, Fully Under Control</span>
          </div>

          <h1
            className="flex flex-col items-center text-center px-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="block text-[1.55rem] xs:text-[2.1rem] sm:text-[2.75rem] md:text-[3.1rem] lg:text-[3.4rem] xl:text-[3.6rem] font-bold tracking-tight text-white leading-[1.14]">
              Next-Gen Dynamic QR Codes
            </span>
            <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5 xs:gap-x-2 sm:gap-x-3 text-[1.85rem] xs:text-[2.5rem] sm:text-[3.8rem] md:text-[4.6rem] lg:text-[5.2rem] xl:text-[5.6rem] tracking-tight leading-[1.1] overflow-visible -mt-0.5 sm:-mt-1 md:-mt-2">
              <span className="inline-block text-[0.66em] sm:text-[0.72em] font-medium text-white/85">
                With Powerful
              </span>
              <span className="inline-block font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 pt-0.5 pb-1 sm:pb-2 px-1 overflow-visible">
                DynamicQR
              </span>
            </span>
          </h1>

          <p className="text-[13px] xs:text-[14.5px] sm:text-[16.5px] md:text-[18px] text-white/70 max-w-[48ch] sm:max-w-[62ch] mx-auto leading-relaxed font-normal pt-0.5 sm:pt-1 px-3">
            Manage, route, and scale your dynamic QR codes and turnkey micro-apps with smart tools designed for sub-10ms speed, zero reprint costs, and infinite scalability.
          </p>

          {/* Action CTAs - Responsive Side-by-Side Lockup */}
          <div className="pt-2 flex flex-row items-center justify-center gap-2 sm:gap-4 max-w-full px-2">
            <button
              onClick={handleOpenWorkspace}
              className="rounded-full sm:rounded-2xl bg-white px-5 xs:px-6 sm:px-8 py-2.5 sm:py-3.5 text-[12.5px] xs:text-[13px] sm:text-[15px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl shadow-white/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <span>Try for free</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#11140F]" />
            </button>
            <a
              href="#microsaas"
              className="rounded-full sm:rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-md px-3.5 xs:px-5 sm:px-7 py-2.5 sm:py-3.5 text-[12.5px] xs:text-[13px] sm:text-[15px] font-medium text-white/85 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shrink-0"
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden xs:inline">Explore Consolidated Apps</span>
              <span className="xs:hidden">Explore Apps</span>
            </a>
          </div>

          {/* Clean Feature Checklist (2x2 Grid on Mobile, Inline with Dots on Tablet & Desktop) */}
          <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-2 text-[11px] xs:text-[12px] sm:text-[12.5px] text-white/50 font-mono max-w-sm xs:max-w-md sm:max-w-none mx-auto">
            <span className="flex items-center gap-1.5 text-emerald-400 justify-start sm:justify-center">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Sub-10ms 307 Ingress</span>
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 justify-start sm:justify-center">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>300 DPI Vector Math</span>
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 justify-start sm:justify-center">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>5 Turnkey Micro-Apps</span>
            </span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 justify-start sm:justify-center">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Zero Reprint Guarantee</span>
            </span>
          </div>
        </div>

        {/* The Dashboard Frame Nestled Directly at the Base of the Glowing Arc */}
        <div className="max-w-5xl mx-auto relative px-2 z-10">
          {/* Top Emerald Rim Glow */}
          <div className="absolute -top-4 left-1/4 right-1/4 h-8 bg-emerald-400/35 blur-xl pointer-events-none rounded-full" />
          
          {/* Screenshot Frame with Glassmorphism */}
          <div className="rounded-2xl sm:rounded-3xl border border-white/20 bg-[#0E110C] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.98),0_0_60px_rgba(52,211,153,0.2)] overflow-hidden transition-all duration-300 hover:border-emerald-500/40">
            {/* Top Luminous Border Line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399]" />
            <img
              src="/images/dashboard-user.png"
              alt="DynamicQR Unified Command Center Dashboard"
              className="w-full h-auto block object-cover object-top"
            />
          </div>

          {/* Social Proof Row Directly Below Dashboard (1:1 with Finora reference) */}
          <div className="mt-12 sm:mt-16 text-center space-y-5">
            <span className="text-[12px] sm:text-[13px] font-mono uppercase tracking-wider text-white/50 block">
              Trusted by 4,000+ Growing Companies
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-[14px] sm:text-[15px] font-semibold text-white/45 tracking-wider">
              <span className="hover:text-white transition-colors cursor-default">LinkedIn</span>
              <span className="hover:text-white transition-colors cursor-default">Meta</span>
              <span className="hover:text-white transition-colors cursor-default">Google</span>
              <span className="hover:text-white transition-colors cursor-default">amazon</span>
              <span className="hover:text-white transition-colors cursor-default">airbnb</span>
              <span className="hover:text-white transition-colors cursor-default">Stripe</span>
              <span className="hover:text-white transition-colors cursor-default">Vercel</span>
              <span className="hover:text-white transition-colors cursor-default">Shopify</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. The Ancient Bridge Section: Physical-to-Digital Durability */}
      {/* (Featuring Image 3 as Background: ancient-bridge-landscape.jpg) */}
      {/* ============================================================ */}
      <section className="relative py-12 md:py-16 px-5 md:px-8 max-w-[1240px] mx-auto my-8 rounded-3xl overflow-hidden border border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]">
        {/* Image 3 as Background */}
        <div className="absolute inset-0 -z-20">
          <img
            src="/images/ancient-bridge-landscape.jpg"
            alt="The Indestructible Bridge of DynamicQR"
            className="w-full h-full object-cover object-center filter brightness-[0.7] saturate-[1.1]"
          />
        </div>

        {/* Dark Obsidian & Emerald Vignette Gradient Overlays for High-Contrast Text */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#11140F] via-[#11140F]/80 to-[#11140F]/90 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(17,20,15,0.65)_0%,rgba(17,20,15,0.95)_100%)] -z-10" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono tracking-wider uppercase backdrop-blur-md shadow-md">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Architectural Longevity · Zero Reprint Guarantee
          </div>

          <h2
            className="text-xl sm:text-2xl md:text-[2rem] lg:text-[2.35rem] font-bold tracking-tight text-white leading-snug max-w-3xl mx-auto"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Built to last generations.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">
              The indestructible bridge between physical media and digital intelligence.
            </span>
          </h2>

          <p className="text-[13.5px] sm:text-[15px] text-white/70 max-w-[56ch] mx-auto leading-relaxed">
            Physical signage, restaurant tabletop stands, brass plaques, and packaging outlive software cycles. When you print a QR code on physical materials, failure is not an option. DynamicQR provides the permanent bridge that keeps your physical assets alive forever.
          </p>

          {/* 4 Frosted Glass Architectural Pillar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 text-left">
            <div className="rounded-xl border border-white/15 bg-[#11140F]/85 backdrop-blur-md p-4 space-y-1.5 hover:border-emerald-500/40 transition-all shadow-lg">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[13px] font-bold text-white">Zero Reprint Guarantee</h3>
              <p className="text-[11.5px] text-white/60 leading-relaxed">
                Update destinations, menus, or Wi-Fi passwords anytime without re-engraving metal or re-ordering print.
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-[#11140F]/85 backdrop-blur-md p-4 space-y-1.5 hover:border-emerald-500/40 transition-all shadow-lg">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[13px] font-bold text-white">Sub-10ms 307 Ingress</h3>
              <p className="text-[11.5px] text-white/60 leading-relaxed">
                Sub-millisecond edge wire resolution delivers instantaneous mobile handoffs with zero intermediary splash screens.
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-[#11140F]/85 backdrop-blur-md p-4 space-y-1.5 hover:border-emerald-500/40 transition-all shadow-lg">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Printer className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[13px] font-bold text-white">300 DPI Vector Math</h3>
              <p className="text-[11.5px] text-white/60 leading-relaxed">
                Sub-pixel SVG path geometry with mandatory 10% quiet-zone buffers ensures scannability on all print surfaces.
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-[#11140F]/85 backdrop-blur-md p-4 space-y-1.5 hover:border-emerald-500/40 transition-all shadow-lg">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-[13px] font-bold text-white">Temporal Dayparting</h3>
              <p className="text-[11.5px] text-white/60 leading-relaxed">
                Automatically swap morning breakfast specials to evening cocktail hours on a single printed asset.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. Precision Interactive Hardware Mockup Simulator           */}
      {/* ============================================================ */}
      <section className="py-16 md:py-24 px-5 md:px-8 max-w-[1280px] mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-[11px] font-semibold tracking-wider uppercase">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            Adaptive Ingress Simulator
          </div>
          <h2
            className="text-[2.2rem] sm:text-[3rem] font-bold tracking-tight leading-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            One physical print.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">
              Adaptive hardware ingress.
            </span>
          </h2>
          <p className="text-[15px] sm:text-[17px] text-white/60">
            Simulate incoming scan devices in real-time. Scan the live QR code on screen with your phone camera to test instantaneous sub-10ms edge redirection.
          </p>
        </div>

        {/* Floating Precision Interactive Hardware Mockup */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] p-6 sm:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
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
                        <MemoizedQRCode
                          value="https://apps.apple.com/app/festival-guide/id8921"
                          size={118}
                          level="H"
                          fgColor="#11140F"
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
                  {/* Physical Hardware Buttons — placed cleanly on the straight side edge below the 42px curved corner */}
                  <div className="absolute -right-[3px] top-[100px] w-[3px] h-8 bg-white/30 rounded-r shadow-xs" />
                  <div className="absolute -right-[3px] top-[148px] w-[3px] h-14 bg-white/30 rounded-r shadow-xs" />

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
                        <MemoizedQRCode
                          value="https://play.google.com/store/apps/details?id=festival.guide"
                          size={118}
                          level="H"
                          fgColor="#11140F"
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
                /* Authentic MacBook Physical Hardware Body Mockup */
                <div className="w-full flex flex-col items-center transition-all duration-300 animate-fade-in select-none">
                  {/* MacBook Aluminum Display Lid */}
                  <div className="w-[305px] sm:w-[340px] rounded-t-2xl bg-gradient-to-b from-[#2B2F37] via-[#1E2128] to-[#14161B] p-2.5 sm:p-3 pb-1.5 border-t border-x border-white/20 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] relative">
                    {/* FaceTime HD Camera Dot */}
                    <div className="w-2 h-2 rounded-full bg-black border border-white/20 mx-auto mb-1.5 flex items-center justify-center shadow-xs">
                      <div className="w-0.5 h-0.5 rounded-full bg-teal-400/60" />
                    </div>

                    {/* Display Screen with macOS Browser Window Inside */}
                    <div className="w-full h-[295px] sm:h-[315px] rounded-lg bg-[#0F1216] border border-black/80 p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden shadow-inner">
                      {/* macOS Window Chrome Header */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                          </div>
                          <div className="text-[10px] font-mono text-white/50 flex items-center gap-1">
                            <Globe2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>festival-summer.com</span>
                          </div>
                          <div className="w-8" />
                        </div>

                        {/* Omnibox / URL Bar */}
                        <div className="rounded-md bg-black/60 border border-white/10 px-2 py-1 flex items-center gap-1.5 text-[9.5px] font-mono">
                          <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span className="text-white/70 truncate">https://my-qr-sandy.vercel.app/id/summer-festival</span>
                          <span className="ml-auto text-[8.5px] text-emerald-400 font-semibold bg-emerald-500/10 px-1 py-0.2 rounded shrink-0">
                            307
                          </span>
                        </div>
                      </div>

                      {/* Desktop Web Body: Instant Destination Rendering */}
                      <div className="my-auto rounded-lg bg-white/[0.03] border border-white/10 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[8.5px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                              Desktop Ingress Detected
                            </span>
                            <h4 className="text-[12px] font-bold text-white truncate">
                              Summer Festival &apos;26 Desktop Hub
                            </h4>
                          </div>
                          <span className="text-[9px] font-mono text-white/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                            7.4ms
                          </span>
                        </div>

                        <p className="text-[10.5px] text-white/65 leading-relaxed line-clamp-2">
                          Passersby scanning from a laptop bypass mobile app stores to land on the interactive widescreen portal.
                        </p>

                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9.5px] font-mono text-emerald-300">Widescreen 4K Stream</span>
                          </div>
                          <div className="p-1 rounded-sm bg-white">
                            <MemoizedQRCode
                              value="https://festival-summer.com/lineup-desktop"
                              size={34}
                              level="M"
                              fgColor="#11140F"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Window Status */}
                      <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/40">
                        <span>Edge: US-East (IAD)</span>
                        <span>HTTP/2 307 Direct</span>
                      </div>
                    </div>
                  </div>

                  {/* MacBook Aluminum Base / Deck with Iconic Center Thumb Recess */}
                  <div className="w-[330px] sm:w-[368px] h-3.5 bg-gradient-to-b from-[#2A2D35] via-[#22252B] to-[#181A1F] rounded-b-xl border-b border-x border-white/20 shadow-2xl relative flex items-start justify-center">
                    <div className="w-14 sm:w-16 h-1 bg-[#0E1014] rounded-b mx-auto shadow-inner border-b border-white/10" />
                  </div>
                  {/* Under-MacBook Desk Shadow */}
                  <div className="w-[280px] sm:w-[320px] h-2 bg-black/80 blur-md rounded-full -mt-0.5" />
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
                      onClick={() => {
                        startTransition(() => {
                          setSimulatedDevice(dev.id as any);
                        });
                      }}
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
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <h2
            className="text-[2.2rem] sm:text-[3rem] font-bold tracking-tight leading-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Engineered for physical operations.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-white/60">
            Select an industry below to see how physical media stays active without reprints.
          </p>
        </div>

        {/* Industry Tab Selector: Wide container with smooth horizontal scroll and zero cut-off */}
        <div className="w-full max-w-5xl mx-auto overflow-x-auto pb-4 pt-1 mb-10 px-4">
          <div className="flex flex-nowrap items-center gap-2.5 w-max mx-auto px-1">
            {(Object.keys(INDUSTRIES) as IndustryTab[]).map((tabKey) => {
              const ind = INDUSTRIES[tabKey];
              const Icon = ind.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setActiveTab(tabKey);
                    });
                  }}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
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
                  <MemoizedQRCode
                    value={currentIndustry.mockTarget}
                    size={128}
                    level="H"
                    fgColor="#11140F"
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

      {/* 2.5. Apple-Style Turnkey Micro-SaaS Ecosystem */}
      <section id="microsaas" className="py-20 md:py-32 px-5 md:px-8 max-w-[1280px] mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-semibold tracking-wider uppercase shadow-[0_0_20px_rgba(52,211,153,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Turnkey Micro-SaaS Ecosystem
          </div>
          <h2
            className="text-[2.2rem] sm:text-[3rem] font-bold tracking-tight leading-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            One code.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">
              Five turnkey micro-apps.
            </span>
          </h2>
          <p className="text-[15px] sm:text-[17px] text-white/60">
            DynamicQR goes far beyond basic URL redirects. Every dynamic QR code can instantly launch full-fledged customer mailing lists, digital executive vCards, deep link shorteners, restaurant menus, or Wi-Fi cards — zero extra tools required.
          </p>
        </div>

        {/* Micro-SaaS Tab Selector: Wide container with smooth horizontal scroll and zero cut-off */}
        <div className="w-full max-w-5xl mx-auto overflow-x-auto pb-4 pt-1 mb-10 px-4">
          <div className="flex flex-nowrap items-center gap-2.5 w-max mx-auto px-1">
            {(Object.keys(MICRO_SAAS_APPS) as MicroSaasTab[]).map((tabKey) => {
              const app = MICRO_SAAS_APPS[tabKey];
              const Icon = app.icon;
              const isActive = activeMicroSaas === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setActiveMicroSaas(tabKey);
                    });
                  }}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#11140F] font-semibold shadow-md'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {app.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Micro-SaaS Showcase Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 sm:p-12 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Narrative, Value Proposition, Features & Metrics */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11.5px] font-mono uppercase tracking-wider">
                  {currentMicroSaas.badge}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono text-white/70">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{currentMicroSaas.replaces}</span>
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                {currentMicroSaas.headline}
              </h3>

              <p className="text-[15px] text-white/65 leading-relaxed">
                {currentMicroSaas.description}
              </p>

              {/* Core Feature Matrix */}
              <div className="space-y-2 pt-2">
                <span className="text-[12px] font-semibold text-white/80 uppercase tracking-wider block font-mono">
                  Engineered Micro-SaaS Capabilities:
                </span>
                <ul className="space-y-2">
                  {currentMicroSaas.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2.5 text-[13px] font-mono text-emerald-300 bg-white/[0.03] p-2.5 rounded-xl border border-white/5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tangible Metrics & Launch CTA */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <span className="text-[12px] text-white/50 block font-mono uppercase tracking-wider">
                    {currentMicroSaas.metrics.label}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {currentMicroSaas.metrics.value}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenWorkspace}
                  className="px-6 py-3 rounded-xl bg-white text-[#11140F] hover:bg-[#EEF0EA] font-semibold text-[13.5px] flex items-center gap-2 shadow-lg shadow-white/10 transition-all cursor-pointer shrink-0"
                >
                  <span>Build In Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Real-World Simulation */}
            <div className="lg:col-span-5">
              {activeMicroSaas === 'mailing' && (
                <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE LEAD CAPTURE
                    </span>
                    <span>DOUBLE OPT-IN READY</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181C15] to-[#0E110C] border border-white/10 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-white">The Artisan Club</h4>
                        <p className="text-[11px] text-white/50">Scan table card to claim 15% discount</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-[12px] text-white/60 font-mono">
                        customer@example.com
                      </div>
                      <div className="w-full py-2.5 rounded-xl bg-white text-[#11140F] font-semibold text-[12.5px] text-center shadow-md">
                        Join VIP Mailing List
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10.5px] font-mono text-white/40">
                      <span>Native Gmail Nodemailer</span>
                      <span className="text-emerald-400 font-semibold">500 Contacts Free</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white text-black flex items-center gap-4 shadow-lg">
                    <div className="p-2 bg-white rounded-lg border border-black/10 shrink-0">
                      <MemoizedQRCode value={currentMicroSaas.mockUrl} size={64} level="M" fgColor="#11140F" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[11.5px] font-bold text-black uppercase tracking-wide block">
                        Scan with Phone Camera
                      </span>
                      <p className="text-[10.5px] text-black/60 font-mono truncate">
                        Captures subscriber straight to DB
                      </p>
                      <span className="text-[10px] text-emerald-700 font-medium block">✓ Zero third-party fees</span>
                    </div>
                  </div>
                </div>
              )}

              {activeMicroSaas === 'vcard' && (
                <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      EXECUTIVE PROFILE CARD
                    </span>
                    <span>.VCF TAP TO SAVE</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181C15] to-[#0E110C] border border-white/10 space-y-3.5 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black font-bold text-[14px] flex items-center justify-center shadow-md">
                        AC
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-white">Alex Chen</h4>
                        <p className="text-[11.5px] text-emerald-400 font-medium">VP of Architecture &amp; Systems</p>
                        <p className="text-[10.5px] text-white/45">Vanguard Global Technologies</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-[10.5px]">
                      <div className="py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-center text-white/80">
                        📞 Call
                      </div>
                      <div className="py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-center text-white/80">
                        💬 Chat
                      </div>
                      <div className="py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-center text-white/80">
                        📧 Email
                      </div>
                      <div className="py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-center text-white/80">
                        🌐 Web
                      </div>
                    </div>

                    <div className="w-full py-2.5 rounded-xl bg-white text-[#11140F] font-semibold text-[12px] text-center flex items-center justify-center gap-1.5 shadow-md">
                      <Download className="w-3.5 h-3.5 text-[#11140F]" />
                      <span>Save Contact to Phone (.vcf)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white text-black flex items-center gap-4 shadow-lg">
                    <div className="p-2 bg-white rounded-lg border border-black/10 shrink-0">
                      <MemoizedQRCode value={currentMicroSaas.mockUrl} size={64} level="M" fgColor="#11140F" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[11.5px] font-bold text-black uppercase tracking-wide block">
                        Scan with Phone Camera
                      </span>
                      <p className="text-[10.5px] text-black/60 font-mono truncate">
                        One tap adds directly to Address Book
                      </p>
                      <span className="text-[10px] text-emerald-700 font-medium block">✓ Zero paper card reprints</span>
                    </div>
                  </div>
                </div>
              )}

              {activeMicroSaas === 'shortener' && (
                <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                      SMART DEEP LINK DISPATCH
                    </span>
                    <span>SUB-10MS 307</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181C15] to-[#0E110C] border border-white/10 space-y-3 shadow-xl font-mono text-[11px]">
                    <div className="px-3.5 py-2 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-between">
                      <span className="text-white font-semibold">dynamicqr.co/s/app</span>
                      <span className="text-emerald-400 text-[10px]">ACTIVE SHORT LINK</span>
                    </div>

                    <div className="space-y-1.5 pl-2.5 border-l-2 border-emerald-500/30">
                      <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.03] text-white/80">
                        <span>🍎 Apple iOS Device</span>
                        <span className="text-blue-400 font-semibold">→ App Store</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.03] text-white/80">
                        <span>🤖 Android Device</span>
                        <span className="text-emerald-400 font-semibold">→ Google Play</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-white/[0.03] text-white/80">
                        <span>💻 Desktop Browser</span>
                        <span className="text-purple-400 font-semibold">→ Web Landing</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50">
                      <span>Automated UTM Injection</span>
                      <span className="text-emerald-400">7.2ms latency</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white text-black flex items-center gap-4 shadow-lg">
                    <div className="p-2 bg-white rounded-lg border border-black/10 shrink-0">
                      <MemoizedQRCode value={currentMicroSaas.mockUrl} size={64} level="M" fgColor="#11140F" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[11.5px] font-bold text-black uppercase tracking-wide block">
                        Scan with Phone Camera
                      </span>
                      <p className="text-[10.5px] text-black/60 font-mono truncate">
                        Detects OS &amp; branches autonomously
                      </p>
                      <span className="text-[10px] text-emerald-700 font-medium block">✓ Full UTM telemetry</span>
                    </div>
                  </div>
                </div>
              )}

              {activeMicroSaas === 'menu' && (
                <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      TOUCHLESS DINING MENU
                    </span>
                    <span>LIVE EDIT · NO REPRINTS</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181C15] to-[#0E110C] border border-white/10 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[14px] font-bold text-white">L&apos;Atelier Bistro</h4>
                        <p className="text-[10.5px] text-white/50">Dinner &amp; Cocktail Offerings</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
                        Table 14
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10.5px]">
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[#11140F] font-semibold">Mains</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/60">Starters</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/60">Wine List</span>
                    </div>

                    <div className="space-y-2 pt-1 text-[11.5px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                        <div>
                          <span className="font-semibold text-white">Prime Truffle Ribeye</span>
                          <span className="ml-2 text-[9.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">Chef&apos;s Cut</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">$48</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                        <div>
                          <span className="font-semibold text-white">Wild Mushroom Risotto</span>
                          <span className="ml-2 text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">Vegan · GF</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">$32</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                      <span>Updated 4 mins ago</span>
                      <span className="text-emerald-400">Zero reprint cost</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white text-black flex items-center gap-4 shadow-lg">
                    <div className="p-2 bg-white rounded-lg border border-black/10 shrink-0">
                      <MemoizedQRCode value={currentMicroSaas.mockUrl} size={64} level="M" fgColor="#11140F" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[11.5px] font-bold text-black uppercase tracking-wide block">
                        Scan with Phone Camera
                      </span>
                      <p className="text-[10.5px] text-black/60 font-mono truncate">
                        Instant interactive mobile menu
                      </p>
                      <span className="text-[10px] text-emerald-700 font-medium block">✓ No app download needed</span>
                    </div>
                  </div>
                </div>
              )}

              {activeMicroSaas === 'wifi' && (
                <div className="rounded-2xl border border-white/10 bg-black/60 p-6 space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      TABLETOP WI-FI TENT
                    </span>
                    <span>ONE-SCAN NATIVE JOIN</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181C15] to-[#0E110C] border border-white/10 space-y-3.5 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Wifi className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-white">Atelier-Guest-5G</h4>
                        <p className="text-[11px] text-emerald-400 font-mono">WPA3-Personal Secured</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.08] border border-white/15 space-y-2 text-center">
                      <p className="text-[11.5px] text-white font-medium">
                        Join &quot;Atelier-Guest-5G&quot; Network?
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                        <div className="py-1.5 rounded-lg bg-white/10 text-white/70">Cancel</div>
                        <div className="py-1.5 rounded-lg bg-emerald-500 text-black font-bold">Join</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                      <span>Zero password typing</span>
                      <span className="text-emerald-400">iOS &amp; Android Native</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white text-black flex items-center gap-4 shadow-lg">
                    <div className="p-2 bg-white rounded-lg border border-black/10 shrink-0">
                      <MemoizedQRCode value={currentMicroSaas.mockUrl} size={64} level="M" fgColor="#11140F" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[11.5px] font-bold text-black uppercase tracking-wide block">
                        Scan with Phone Camera
                      </span>
                      <p className="text-[10.5px] text-black/60 font-mono truncate">
                        Camera connects to Wi-Fi instantly
                      </p>
                      <span className="text-[10px] text-emerald-700 font-medium block">✓ Supports hidden SSIDs</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Apple-Style Bento Grid: Pro Architecture (Strictly 2 Rows · 1.5x Taller Proportions) */}
      <section className="py-10 md:py-14 px-5 md:px-8 max-w-[1280px] mx-auto border-t border-white/10">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-[11px] font-mono tracking-wider uppercase">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Core Infrastructure Bento
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Built like high-performance hardware.
          </h2>
          <p className="text-[13px] sm:text-[14px] text-white/60">
            Every layer from database pooling to vector math is tuned for zero-failure physical deployments.
          </p>
        </div>

        {/* Strictly 2 Rows: Row 1 = 2+1+1 (4 cols), Row 2 = 1+1+2 (4 cols) · 1.5x Taller Proportions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {/* Row 1 / Item 1: Wide Rectangle (2 Cols) — Sub-10ms 307 Ingress */}
          <div className="sm:col-span-2 md:col-span-2 min-h-[250px] sm:min-h-[265px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-5 sm:p-6 md:p-7 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                    Sub-10ms 307 Ingress
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                    Edge Architecture
                  </span>
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                &lt;10ms
              </span>
            </div>

            <p className="text-[13px] sm:text-[14px] text-white/70 leading-relaxed">
              Zero intermediary splash screens. The edge server returns a clean HTTP 307 temporary redirect directly into the browser with sub-millisecond DNS dispatch.
            </p>

            <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between text-white/80">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Physical Camera → Edge Ingress
                </span>
                <span className="text-emerald-300 font-semibold">7.2ms · 99.99% Edge Cache HIT</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full w-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Row 1 / Item 2: Compact Card (1 Col) — Native OS Branching */}
          <div className="sm:col-span-1 md:col-span-1 min-h-[250px] sm:min-h-[265px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight leading-tight">
                    OS Branching
                  </h3>
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/40">
                    Device Sensing
                  </span>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono text-white">
                100%
              </span>
            </div>

            <p className="text-[12.5px] sm:text-[13px] text-white/65 leading-relaxed">
              Differentiates iOS, Android, and Desktop user-agents at the wire level.
            </p>

            <div className="space-y-1.5 font-mono text-[10.5px]">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/50 border border-white/5 text-white/80">
                <span>Apple iOS</span>
                <span className="text-emerald-400 font-semibold">App Store</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/50 border border-white/5 text-white/80">
                <span>Android</span>
                <span className="text-emerald-400 font-semibold">Google Play</span>
              </div>
            </div>
          </div>

          {/* Row 1 / Item 3: Compact Card (1 Col) — 300 DPI Vector Math */}
          <div className="sm:col-span-1 md:col-span-1 min-h-[250px] sm:min-h-[265px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight leading-tight">
                    300 DPI Vector
                  </h3>
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/40">
                    Print Physics
                  </span>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono text-purple-300">
                Print
              </span>
            </div>

            <p className="text-[12.5px] sm:text-[13px] text-white/65 leading-relaxed">
              Sub-pixel precision SVG with mandatory 10% quiet-zone buffers.
            </p>

            <div className="rounded-xl bg-black/50 border border-white/5 p-2.5 font-mono text-[10.5px] space-y-1.5">
              <div className="flex items-center justify-between text-white/80">
                <span>Vector XML</span>
                <span className="text-purple-300 font-semibold">Clean &lt;path&gt;</span>
              </div>
              <div className="flex items-center justify-between text-white/45 text-[10px]">
                <span>CMYK Proofing</span>
                <span>1024×1024 PNG</span>
              </div>
            </div>
          </div>

          {/* Row 2 / Item 4: Compact Card (1 Col) — Branded Custom Domain */}
          <div className="sm:col-span-1 md:col-span-1 min-h-[250px] sm:min-h-[265px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight leading-tight">
                    Custom Domain
                  </h3>
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-teal-400">
                    Whitelabel
                  </span>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono text-teal-300">
                0% Ads
              </span>
            </div>

            <p className="text-[12.5px] sm:text-[13px] text-white/65 leading-relaxed">
              Serve dynamic links under your verified corporate SSL domain.
            </p>

            <div className="rounded-xl bg-black/50 border border-white/5 px-3 py-2 flex items-center gap-2 font-mono text-[10.5px]">
              <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="text-teal-300 font-semibold truncate">qr.brand.com</span>
              <span className="ml-auto text-[9.5px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold shrink-0">
                TLS 1.3
              </span>
            </div>
          </div>

          {/* Row 2 / Item 5: Compact Card (1 Col) — Zero-Cookie Privacy */}
          <div className="sm:col-span-1 md:col-span-1 min-h-[250px] sm:min-h-[265px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight leading-tight">
                    Zero Cookies
                  </h3>
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-white/40">
                    Privacy Core
                  </span>
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                GDPR
              </span>
            </div>

            <p className="text-[12.5px] sm:text-[13px] text-white/65 leading-relaxed">
              Anonymized diurnal metrics with cryptographic daily rotating salts.
            </p>

            <div className="rounded-xl bg-black/50 border border-white/5 p-2.5 font-mono text-[10.5px] space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                <span>GDPR / CCPA</span>
                <span>100% Compliant</span>
              </div>
              <div className="text-[10px] text-white/50">
                0 tracking cookies stored
              </div>
            </div>
          </div>

          {/* Row 2 / Item 6: Wide Rectangle (2 Cols) — Time & Day-of-Week Dayparting */}
          <div className="sm:col-span-2 md:col-span-2 min-h-[250px] sm:min-h-[265px] rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.01] p-5 sm:p-6 md:p-7 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                    Temporal Dayparting
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                    Day &amp; Hour Swaps
                  </span>
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                24/7
              </span>
            </div>

            <p className="text-[13px] sm:text-[14px] text-white/70 leading-relaxed">
              Swap physical QR targets continuously without human intervention. Breakfast menus at dawn, happy hour in the evening, and VIP access at midnight.
            </p>

            <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 font-mono text-[11px] space-y-2">
              <div className="flex items-center justify-between text-white/60 text-[10px]">
                <span>08:00 BREAKFAST</span>
                <span>12:00 LUNCH</span>
                <span className="text-amber-300 font-bold">17:00 HAPPY HOUR</span>
                <span>20:00 TASTING</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-white/20 rounded-full" />
                <div className="bg-white/20 rounded-full" />
                <div className="bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24]" />
                <div className="bg-white/20 rounded-full" />
              </div>
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
