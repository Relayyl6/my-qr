import React from 'react';
import { migrateV2 } from '@/lib/builder/migrate-v2';
import { RenderDoc } from '@/lib/builder/render';
import { Page } from '@/lib/page/schema';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    width?: string;
    palette?: string;
    mode?: string;
  };
}

export default function DevBuilderRenderPage({ searchParams }: PageProps) {
  const widthParam = parseInt(searchParams.width || '390', 10);
  const activeWidth = [390, 820, 1280].includes(widthParam) ? widthParam : 390;
  const palette = searchParams.palette || 'ink';

  const demoV2Page: Page = {
    schemaVersion: 1,
    template: 'creator',
    brand: {
      name: 'Yemuel Creative Studio',
      headline: 'Architecting Digital Identity',
      tagline: 'Precision engineered web experiences and interactive systems for modern businesses.',
      palette: palette as any,
    },
    cta: {
      label: 'Explore Our Work',
      url: 'https://dynamicqr.io',
    },
    links: [
      { label: 'Client Portfolio & Case Studies', url: 'https://github.com' },
      { label: 'Schedule an Architecture Consultation', url: 'https://cal.com' },
    ],
    services: [
      { name: 'Core Design Engine', price: '₦150,000', desc: 'Full custom design tokens and interactive prototypes.' },
      { name: 'Cloud Infrastructure', price: '₦220,000', desc: 'Edge routing, multi-domain SSL, and sub-50ms latency.' },
      { name: 'Physical Print Suite', price: '₦45,000', desc: '300 DPI vector poster and table tent print generation.' },
    ],
    contact: {
      phone: '+234 801 234 5678',
      email: 'founder@yemuel.io',
      whatsapp: '2348012345678',
      instagram: '@yemuel',
      address: '14 Victoria Island, Lagos',
    },
  };

  const doc = migrateV2(demoV2Page, 'https://dynamicqr.io');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-6 px-2">
      {/* Dev Switcher Bar */}
      <div className="w-full max-w-4xl bg-slate-800/90 backdrop-blur-md rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between border border-slate-700 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400">Builder Phase 1 Render Dev Tool</span>
          <span className="bg-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
            Width: {activeWidth}px
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="opacity-70">Switch Breakpoint:</span>
          {[
            { label: 'Mobile (390px)', w: 390 },
            { label: 'Tablet (820px)', w: 820 },
            { label: 'Desktop (1280px)', w: 1280 },
          ].map((item) => (
            <a
              key={item.w}
              href={`/dev/builder-render?width=${item.w}&palette=${palette}`}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeWidth === item.w
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* Frame with Exact Width */}
      <div
        className="rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden bg-black transition-all duration-200"
        style={{ width: `${activeWidth}px`, maxWidth: '100%' }}
      >
        <RenderDoc doc={doc} mode="published" />
      </div>
    </div>
  );
}
