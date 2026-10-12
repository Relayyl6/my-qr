import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import PricingTable from '@/components/PricingTable';

export const dynamic = 'force-dynamic';

function QrMark({ className = 'w-6 h-6', fill = '#11140F' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="1" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="4" width="3" height="3" fill={fill} />
      <rect x="14" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="17" y="4" width="3" height="3" fill={fill} />
      <rect x="1" y="14" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="17" width="3" height="3" fill={fill} />
      <rect x="15" y="15" width="3" height="3" fill={fill} />
      <rect x="20" y="15" width="3" height="3" fill={fill} />
      <rect x="15" y="20" width="3" height="3" fill={fill} />
      <rect x="20" y="20" width="3" height="3" fill={fill} />
    </svg>
  );
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  const currentTier = user?.tier || 'free';

  return (
    <div className="bg-[#EEF0EA] text-[#11140F] min-h-screen w-full">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#EEF0EA]/90 backdrop-blur-md border-b border-[#11140F]/10">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-medium text-[15px] hover:opacity-80 transition-opacity">
            <QrMark className="w-5 h-5" fill="#11140F" />
            <span style={{ fontFamily: 'var(--font-display)' }}>DynamicQR</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] text-[#11140F]/70 hover:text-[#11140F] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to workspace
          </Link>
        </div>
      </nav>

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 pt-32 pb-24 space-y-16">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11140F]/5 text-[#11140F] text-[12px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#2F6B4F]" />
            Simple, Transparent Pricing
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#11140F]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Predictable plans for growing campaigns.
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#11140F]/65 leading-relaxed">
            Every plan includes lightning-fast 307 redirects on Neon Postgres, 300 DPI print-ready exports, and generous monthly AI intelligence budgets.
          </p>
        </div>

        {/* Pricing Cards Component */}
        <PricingTable currentTier={currentTier} isLoggedIn={!!user} />

        {/* Trust & Guarantee Banner */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#11140F]/10 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-[15px] text-[#11140F]">Cancel or switch plans anytime</h4>
            <p className="text-[13px] text-[#11140F]/60">
              No long-term contracts. Your active printed QR codes will never break even if you downgrade — they seamlessly remain live on your permanent short links.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto pt-8 space-y-8">
          <h2
            className="text-2xl font-bold tracking-tight text-center text-[#11140F]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-6 space-y-2">
              <h3 className="font-medium text-[15px] text-[#11140F]">What happens if I update a QR destination URL?</h3>
              <p className="text-[14px] text-[#11140F]/65 leading-relaxed">
                The QR matrix never changes because people scan your short permanent URL (`/id/shortcode`). When someone scans your flyer, our edge router immediately redirects them to your newest destination URL in under 20ms.
              </p>
            </div>

            <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-6 space-y-2">
              <h3 className="font-medium text-[15px] text-[#11140F]">How does AI credit budgeting work?</h3>
              <p className="text-[14px] text-[#11140F]/65 leading-relaxed">
                Every plan includes a generous monthly AI compute allowance. Because our optimized neural models run at ultra-low cost per query, a $5.00/mo Pro budget provides roughly 15,000 AI routing, enrichment, and analysis operations each month.
              </p>
            </div>

            <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-6 space-y-2">
              <h3 className="font-medium text-[15px] text-[#11140F]">Can I print codes on physical materials at 300 DPI?</h3>
              <p className="text-[14px] text-[#11140F]/65 leading-relaxed">
                Yes. DynamicQR exports 1080×1350px high-contrast posters and 1024×1024px PNG assets with exact 10% quiet-zone buffers ready for offset printing, table tents, and billboards.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#11140F]/10 py-10 max-w-[1200px] mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#11140F]/50">
        <p>&copy; {new Date().getFullYear()} DynamicQR • All rights reserved.</p>
        <div className="flex items-center gap-6 text-[12.5px]">
          <Link href="/terms" className="hover:text-[#11140F] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#11140F] transition-colors">Privacy</Link>
          <Link href="/refund" className="hover:text-[#11140F] transition-colors">Refund Policy</Link>
        </div>
      </footer>
    </div>
  );
}
