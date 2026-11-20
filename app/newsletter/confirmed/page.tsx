import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Subscription Confirmed | DynamicQR",
  description: "Your subscription to DynamicQR updates has been confirmed.",
};

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "success" } = await searchParams;

  const isSuccess = status === "success";
  const isExpired = status === "expired";

  return (
    <div className="min-h-screen bg-[#080907] text-[#EEF0EA] flex items-center justify-center p-6 selection:bg-[#2F6B4F] selection:text-white">
      <div className="max-w-md w-full bg-[#11140F] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-[#34D399]" />
          ) : (
            <AlertCircle className="w-8 h-8 text-[#F59E0B]" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isSuccess
              ? "You're all set!"
              : isExpired
              ? "Link Expired"
              : "Invalid Link"}
          </h1>
          <p className="text-[14px] text-white/60 leading-relaxed">
            {isSuccess
              ? "Your email address has been verified. You'll receive our engineering notes, feature releases, and Black Friday promotional updates."
              : isExpired
              ? "This verification link has expired (links expire after 72 hours). Please enter your email in the footer again to get a fresh link."
              : "We could not find a pending subscription with this link. It may have already been confirmed."}
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

        <div className="pt-4 border-t border-white/5 text-[11.5px] text-white/40 font-mono">
          One code, printed once. Routed as long as it needs to be.
        </div>
      </div>
    </div>
  );
}
