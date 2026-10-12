import Link from "next/link";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: { tier?: string; session_id?: string; mode?: string };
}) {
  const user = await getCurrentUser();
  const tierName = searchParams.tier || user?.tier || "pro";

  return (
    <div className="min-h-screen bg-[#EEF0EA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-[#11140F]/10 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-[#2F6B4F]/10 text-[#2F6B4F] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11140F] text-white text-[12px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#96A689]" />
            {tierName} Tier Activated
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11140F]">
            Welcome to DynamicQR {tierName.toUpperCase()}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#11140F]/60 leading-relaxed">
            Your account has been upgraded. All advanced AI routing, high-res exports, and generous monthly AI budgets are now active.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#11140F] px-5 py-3.5 text-[14px] font-medium text-white hover:bg-[#2A2E25] transition-colors"
          >
            Launch Your Workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
