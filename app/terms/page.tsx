import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — DynamicQR',
  description: 'Terms of Service and acceptable use policy for DynamicQR.',
};

export default function TermsPage() {
  return (
    <div className="bg-[#EEF0EA] text-[#11140F] min-h-screen">
      <nav className="border-b border-[#11140F]/10 bg-[#EEF0EA]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[900px] mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-[16px]">
            DynamicQR
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#11140F]/70 hover:text-[#11140F]">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-[900px] mx-auto px-5 py-16 space-y-10 leading-relaxed text-[15px]">
        <div className="space-y-2 border-b border-[#11140F]/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-[13px] text-[#11140F]/60">Last updated: October 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using DynamicQR (“the Service”), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, do not access or use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Service Description</h2>
          <p>
            DynamicQR provides dynamic QR code generation, destination redirection, AI-driven routing heuristics, campaign analytics, and physical export templates. You understand that physical QR codes rely on the destination URL remaining compliant with these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Acceptable Use Policy</h2>
          <p>You agree not to use DynamicQR to:</p>
          <ul className="list-disc pl-6 space-y-1 text-[#11140F]/80">
            <li>Redirect users to phishing, malware, malicious downloads, or unauthorized software.</li>
            <li>Promote deceptive marketing scams, illegal content, or unlawful gambling.</li>
            <li>Abuse rate limits or conduct automated denial-of-service attacks against our edge redirectors.</li>
          </ul>
          <p className="text-[14px] text-[#11140F]/70">
            DynamicQR reserves the right to immediately deactivate any link found in violation of this Acceptable Use Policy without notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Subscriptions, AI Credits & Billing</h2>
          <p>
            Paid plans (Pro, Plus, Ultra) are billed on a recurring monthly or yearly subscription through Stripe. Subscriptions include allocated monthly AI execution budgets. Unused AI credits do not roll over to subsequent billing cycles. You may cancel your subscription at any time via the Customer Portal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Uptime & Service Reliability</h2>
          <p>
            Our redirection service runs on edge serverless architecture backed by Neon PostgreSQL. While we aim for 99.9% uptime, we are not liable for business interruptions arising from internet outages or third-party downstream host failures.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Contact</h2>
          <p>
            For questions regarding these Terms, contact our team at <a href="mailto:oseghaleleonard39@gmail.com" className="underline font-medium">oseghaleleonard39@gmail.com</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
