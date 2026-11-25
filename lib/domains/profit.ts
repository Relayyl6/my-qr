/**
 * Computes realized platform profit from paid domain registrations.
 * Filters out unpaid checkouts (PENDING_PAYMENT) and failed orders.
 */
export interface DomainProfitSummary {
  paidOrdersCount: number;
  totalProfitNgn: number;
  totalProfitUsd: number;
  last30dProfitNgn: number;
  last30dProfitUsd: number;
  last365dProfitUsd: number;
}

const PAID_STATUSES = new Set(['ACTIVE', 'PROVISIONING', 'PAID_AWAITING_FUNDS']);

export function calculateDomainSalesProfit(
  orders: Array<{
    status: string;
    totalPaidNgn: number;
    wholesaleUsd: number;
    exchangeRate?: number | null;
    createdAt: Date | string;
  }>,
  fallbackFxRate = 1440
): DomainProfitSummary {
  const now = Date.now();
  const ms30d = 30 * 24 * 60 * 60 * 1000;
  const ms365d = 365 * 24 * 60 * 60 * 1000;

  let paidOrdersCount = 0;
  let totalProfitNgn = 0;
  let totalProfitUsd = 0;
  let last30dProfitNgn = 0;
  let last30dProfitUsd = 0;
  let last365dProfitUsd = 0;

  for (const order of orders) {
    if (!PAID_STATUSES.has(order.status)) continue;
    paidOrdersCount += 1;

    const fxRate = order.exchangeRate && order.exchangeRate > 0 ? order.exchangeRate : fallbackFxRate;
    const wholesaleNgn = Math.round((order.wholesaleUsd || 0) * fxRate);
    const profitNgn = Math.max(0, (order.totalPaidNgn || 0) - wholesaleNgn);
    const profitUsd = profitNgn / fxRate;

    totalProfitNgn += profitNgn;
    totalProfitUsd += profitUsd;

    const ageMs = now - new Date(order.createdAt).getTime();
    if (ageMs <= ms30d) {
      last30dProfitNgn += profitNgn;
      last30dProfitUsd += profitUsd;
    }
    if (ageMs <= ms365d) {
      last365dProfitUsd += profitUsd;
    }
  }

  return {
    paidOrdersCount,
    totalProfitNgn,
    totalProfitUsd: Math.round(totalProfitUsd * 100) / 100,
    last30dProfitNgn,
    last30dProfitUsd: Math.round(last30dProfitUsd * 100) / 100,
    last365dProfitUsd: Math.round(last365dProfitUsd * 100) / 100,
  };
}

export function formatUsdMetric(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString()
    : rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
