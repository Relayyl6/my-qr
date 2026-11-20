import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Unsubscribed | DynamicQR",
  description: "You have been unsubscribed from DynamicQR marketing emails.",
};

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-screen bg-[#080907] text-[#EEF0EA] flex items-center justify-center p-6 selection:bg-[#2F6B4F] selection:text-white">
      <div className="max-w-md w-full bg-[#11140F] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
          <CheckCircle2 className="w-8 h-8 text-white/50" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Unsubscribed
          </h1>
          <p className="text-[14px] text-white/60 leading-relaxed">
            You have been successfully removed from our newsletter and marketing lists. You will not receive any further broadcast emails from us.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#11140F] text-[13.5px] font-semibold hover:bg-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to DynamicQR
          </Link>
        </div>

        <div className="pt-4 border-t border-white/5 text-[11.5px] text-white/40">
          Changed your mind? You can resubscribe anytime from our footer form.
        </div>
      </div>
    </div>
  );
}
