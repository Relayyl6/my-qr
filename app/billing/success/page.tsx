import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TIER_CONFIGS } from "@/lib/ai/flags";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: { tier?: string; session_id?: string; ref?: string };
}) {
  const user = await getCurrentUser();
  const tierParam = (searchParams.tier || "").toLowerCase();
  const requestedTier = ["pro", "plus", "ultra"].includes(tierParam) ? tierParam : "pro";
  const ref = searchParams.ref || searchParams.session_id || "";

  let verified = false;
  let verifiedTier = user?.tier || "free";

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  if (user && ref && paystackSecret && !paystackSecret.includes("placeholder")) {
    try {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
        {
          headers: { Authorization: `Bearer ${paystackSecret}` },
          cache: "no-store",
        }
      );
      const verifyData = await verifyRes.json();
      const meta = verifyData.data?.metadata || {};
      const txTier = String(meta.planId || requestedTier).toLowerCase();

      if (
        verifyData.status &&
        verifyData.data?.status === "success" &&
        verifyData.data?.reference === ref &&
        (!meta.userId || meta.userId === user.id) &&
        ["pro", "plus", "ultra"].includes(txTier)
      ) {
        verified = true;
        verifiedTier = txTier;

        if (user.tier !== txTier) {
          await prisma.user
            .update({
              where: { id: user.id },
              data: { tier: txTier },
            })
            .catch(() => {});

          const tierConfig = TIER_CONFIGS[txTier] || TIER_CONFIGS.pro;
          await prisma.aiCredit
            .upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                monthlyLimitUsd: tierConfig.monthlyLimitUsd,
                usedThisMonth: 0,
              },
              update: {
                monthlyLimitUsd: tierConfig.monthlyLimitUsd,
              },
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error("[Billing Success] Payment verification failed:", err);
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF0EA] dark:bg-[#0B0D0C] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#101211] border border-[#11140F]/10 dark:border-white/12 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            verified
              ? "bg-[#2F6B4F]/10 dark:bg-[#34D399]/15 text-[#2F6B4F] dark:text-[#34D399]"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {verified ? <CheckCircle2 className="w-9 h-9" /> : <AlertCircle className="w-9 h-9" />}
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11140F] dark:bg-white/10 text-white text-[12px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
            {verified ? `${verifiedTier} Tier Activated` : "Payment Not Verified"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11140F] dark:text-white">
            {verified ? `Welcome to DynamicQR ${verifiedTier.toUpperCase()}` : "Verification Pending"}
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#11140F]/60 dark:text-white/60 leading-relaxed">
            {verified
              ? "Your payment has been confirmed. Advanced dynamic routing, high-res 300 DPI exports, branded custom domains, and monthly AI budgets are now active on your account."
              : "We could not confirm a completed payment for this reference yet. If you completed checkout, give it a moment or retry from pricing."}
          </p>
          {ref && (
            <p className="text-[11.5px] font-mono text-slate-500 dark:text-white/55 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-lg py-1 px-2.5 inline-block">
              Ref: {ref}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Link
            href={verified ? "/" : "/pricing"}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#11140F] dark:bg-[#34D399] px-5 py-3.5 text-[14px] font-semibold text-white dark:text-[#09110D] hover:bg-[#2A2E25] dark:hover:bg-[#2EC28A] transition-colors"
          >
            {verified ? "Launch Your Workspace" : "Return to Pricing"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
