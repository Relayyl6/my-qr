import Link from "next/link";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_CONFIGS } from "@/lib/ai/flags";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: { tier?: string; session_id?: string; ref?: string; mode?: string; amountNgn?: string };
}) {
  const user = await getCurrentUser();
  const tierParam = (searchParams.tier || "").toLowerCase();
  const targetTier = ['pro', 'plus', 'ultra'].includes(tierParam) ? tierParam : (user?.tier || "pro");

  // Instant fulfillment for returning Paystack subscribers
  if (user && ['pro', 'plus', 'ultra'].includes(targetTier)) {
    if (searchParams.ref?.startsWith('SUB_') || searchParams.mode === 'dev' || searchParams.session_id) {
      if (user.tier !== targetTier) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: targetTier },
        }).catch(() => {});

        const tierConfig = TIER_CONFIGS[targetTier] || TIER_CONFIGS.pro;
        await prisma.aiCredit.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            monthlyLimitUsd: tierConfig.monthlyLimitUsd,
            usedThisMonth: 0,
          },
          update: {
            monthlyLimitUsd: tierConfig.monthlyLimitUsd,
          },
        }).catch(() => {});
      }
    }
  }

  const tierName = targetTier;

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
            Your payment has been confirmed. Advanced dynamic routing, high-res 300 DPI exports, branded custom domains, and monthly AI budgets are now active on your account.
          </p>
          {searchParams.ref && (
            <p className="text-[11.5px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 inline-block">
              Ref: {searchParams.ref}
            </p>
          )}
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
