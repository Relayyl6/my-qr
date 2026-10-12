import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy — DynamicQR',
  description: 'Refund, cancellation, and dispute policy for DynamicQR subscriptions.',
};

export default function RefundPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Refund & Cancellation Policy</h1>
          <p className="text-[13px] text-[#11140F]/60">Last updated: October 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. 14-Day Money-Back Guarantee</h2>
          <p>
            We want you to be completely satisfied with DynamicQR. If you subscribe to any paid plan (Pro, Plus, or Ultra) and determine within 14 days of your initial payment that it does not fit your needs, email us for a 100% full refund with no questions asked.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Easy Self-Service Cancellation</h2>
          <p>
            You may cancel your subscription at any time with a single click in your Customer Portal. Once cancelled:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-[#11140F]/80">
            <li>You will continue to have full access to your paid tier features until the end of your prepaid billing period.</li>
            <li>You will not be billed again.</li>
            <li>Your already printed QR codes will continue to redirect seamlessly under the Free tier limit.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Requesting a Refund</h2>
          <p>
            To request a refund, simply send an email with your account email address to <a href="mailto:oseghaleleonard39@gmail.com" className="underline font-medium">oseghaleleonard39@gmail.com</a>. Refunds are processed through Stripe within 3-5 business days.
          </p>
        </section>
      </main>
    </div>
  );
}
