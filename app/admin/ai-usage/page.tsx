import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, Activity, DollarSign, Clock, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AiUsageAdminPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    redirect('/');
  }

  // Load invocations from database
  const invocations = await prisma.aiInvocation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalCalls = invocations.length;
  const successfulCalls = invocations.filter((i) => i.success).length;
  const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : "100";

  let totalCostUsd = 0;
  const featureStats: Record<string, { count: number; cost: number; errors: number }> = {};
  const latencies: number[] = [];

  for (const inv of invocations) {
    totalCostUsd += Number(inv.costUsd);
    latencies.push(inv.latencyMs);

    if (!featureStats[inv.feature]) {
      featureStats[inv.feature] = { count: 0, cost: 0, errors: 0 };
    }
    featureStats[inv.feature].count++;
    featureStats[inv.feature].cost += Number(inv.costUsd);
    if (!inv.success) {
      featureStats[inv.feature].errors++;
    }
  }

  latencies.sort((a, b) => a - b);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies.length > 0 ? latencies[p95Index] : 0;
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#11140F] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#11140F]/60 hover:text-[#11140F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            AI Observability Engine
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#11140F]">
            AI Invocations & Observability
          </h1>
          <p className="text-[13px] text-[#11140F]/60">
            Real-time telemetry, model token costs, failure rates, and p95 latency
          </p>
        </div>

        {/* High-level metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-sm">
            <span className="text-[11.5px] uppercase font-semibold text-[#11140F]/50">
              Total Invocations
            </span>
            <p className="text-2xl font-bold text-[#11140F] mt-1 flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-emerald-600" />
              {totalCalls}
            </p>
          </div>

          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-sm">
            <span className="text-[11.5px] uppercase font-semibold text-[#11140F]/50">
              Estimated AI Cost
            </span>
            <p className="text-2xl font-bold text-[#11140F] mt-1 flex items-center gap-1.5">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              ${totalCostUsd.toFixed(4)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-sm">
            <span className="text-[11.5px] uppercase font-semibold text-[#11140F]/50">
              Success Rate
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              {successRate}%
            </p>
          </div>

          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-sm">
            <span className="text-[11.5px] uppercase font-semibold text-[#11140F]/50">
              p95 Latency / Avg
            </span>
            <p className="text-2xl font-bold text-[#11140F] mt-1 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-purple-600" />
              {p95Latency}ms <span className="text-sm font-normal text-[#11140F]/50">({avgLatency}ms)</span>
            </p>
          </div>
        </div>

        {/* Feature Breakdown Table */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-[14px] font-semibold text-[#11140F]">Usage by Feature</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[#11140F]/10 text-[#11140F]/50 font-semibold uppercase text-[11px]">
                  <th className="py-2.5">Feature</th>
                  <th className="py-2.5">Calls</th>
                  <th className="py-2.5">Total Cost</th>
                  <th className="py-2.5">Error Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#11140F]/5">
                {Object.entries(featureStats).map(([feat, s]) => (
                  <tr key={feat} className="hover:bg-[#11140F]/[0.01]">
                    <td className="py-2.5 font-medium font-mono text-[#11140F]">{feat}</td>
                    <td className="py-2.5">{s.count}</td>
                    <td className="py-2.5 font-mono text-emerald-700">${s.cost.toFixed(5)}</td>
                    <td className="py-2.5">
                      {s.errors > 0 ? (
                        <span className="text-red-600 font-semibold">{s.errors}</span>
                      ) : (
                        <span className="text-emerald-700">0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {Object.keys(featureStats).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[#11140F]/40">
                      No invocations logged yet. Make an AI request to populate logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invocations Log */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-[14px] font-semibold text-[#11140F]">Recent AI Invocations (Last 100)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#11140F]/10 text-[#11140F]/50 font-semibold uppercase text-[10.5px]">
                  <th className="py-2">Time</th>
                  <th className="py-2">Feature / Prompt</th>
                  <th className="py-2">Model</th>
                  <th className="py-2">Tokens (In/Out)</th>
                  <th className="py-2">Cost</th>
                  <th className="py-2">Latency</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#11140F]/5">
                {invocations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#11140F]/[0.01]">
                    <td className="py-2 text-[#11140F]/60 whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2 font-mono">
                      <span className="font-semibold text-[#11140F]">{inv.feature}</span>
                      <span className="text-[10px] text-[#11140F]/50 block">{inv.promptKey}</span>
                    </td>
                    <td className="py-2 font-mono text-[#11140F]/70">{inv.model}</td>
                    <td className="py-2 font-mono">
                      {inv.inputTokens} / {inv.outputTokens}
                    </td>
                    <td className="py-2 font-mono text-emerald-700">${Number(inv.costUsd).toFixed(5)}</td>
                    <td className="py-2 font-mono">{inv.latencyMs}ms</td>
                    <td className="py-2">
                      {inv.success ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10.5px] font-medium">
                          OK
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10.5px] font-medium" title={inv.error || ''}>
                          FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
