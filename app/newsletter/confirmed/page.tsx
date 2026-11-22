import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Subscription Confirmed | DynamicQR",
  description: "Your subscription has been confirmed.",
};

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; business?: string }>;
}) {
  const { status = "success", business } = await searchParams;

  const isSuccess = status === "success";
  const isExpired = status === "expired";

  return (
    <div className="min-h-screen bg-[#080907] text-[#EEF0EA] flex items-center justify-center p-6 selection:bg-[#2F6B4F] selection:text-white">
      <div className="max-w-md w-full bg-[#11140F] border border-white/10 rounded-lg p-8 sm:p-10 shadow-xl text-center space-y-6">
        <div className="mx-auto w-12 h-12 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
          {isSuccess ? (
            <CheckCircle2 className="w-6 h-6 text-[#34D399]" />
          ) : (
            <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-white">
            {isSuccess
              ? "You're all set!"
              : isExpired
              ? "Link Expired"
              : "Invalid Link"}
          </h1>
          <p className="text-[13.5px] text-white/60 leading-relaxed">
            {isSuccess
              ? business
                ? `Your email address is confirmed. You are subscribed to receive updates from ${business}.`
                : "Your email address is confirmed. You will receive updates, engineering notes, and product announcements."
              : isExpired
              ? "This link has expired. Please enter your email again on the subscription form."
              : "We could not find a pending subscription with this link. It may have already been confirmed."}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-[#11140F] text-[13px] font-semibold hover:bg-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
