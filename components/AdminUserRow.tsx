'use client';

import { useState } from 'react';
import { adminUpdateUserTier, adminResetAiCredit } from '@/app/admin/actions';
import { Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  createdAt: Date;
  stripeCustomerId: string | null;
  _count: {
    links: number;
  };
}

export default function AdminUserRow({ user, isSelf }: { user: UserRecord; isSelf: boolean }) {
  const [currentTier, setCurrentTier] = useState(user.tier);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleTierChange = async (newTier: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await adminUpdateUserTier(user.id, newTier);
      setCurrentTier(newTier);
      setStatusMsg(`Updated to ${newTier.toUpperCase()}`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCredit = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await adminResetAiCredit(user.id);
      setStatusMsg('AI credit reset to $0');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg('Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-b border-[#11140F]/5 hover:bg-[#F7F8F5]/50 transition-colors text-[13px]">
      <td className="py-3.5 px-4">
        <div className="font-medium text-[#11140F] flex items-center gap-1.5">
          {user.email}
          {isSelf && (
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10.5px] font-mono font-semibold">
              YOU (ADMIN)
            </span>
          )}
        </div>
        {user.name && <div className="text-[12px] text-[#11140F]/50">{user.name}</div>}
      </td>

      <td className="py-3.5 px-4 font-mono text-[12px] text-[#11140F]/70">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>

      <td className="py-3.5 px-4">
        <select
          value={currentTier}
          disabled={loading || isSelf}
          onChange={(e) => handleTierChange(e.target.value)}
          className={`rounded-lg border px-2.5 py-1 text-[12px] font-semibold outline-none transition-all ${
            currentTier === 'ultra'
              ? 'bg-purple-50 border-purple-200 text-purple-800'
              : currentTier === 'plus'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : currentTier === 'pro'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          <option value="free">FREE</option>
          <option value="pro">PRO ($5)</option>
          <option value="plus">PLUS ($12)</option>
          <option value="ultra">ULTRA ($29)</option>
        </select>
      </td>

      <td className="py-3.5 px-4 font-mono font-semibold text-[#11140F]">
        {user._count.links}
      </td>

      <td className="py-3.5 px-4 font-mono text-[11px] text-[#11140F]/50">
        {user.stripeCustomerId ? (
          <span className="text-emerald-700 font-medium">✓ Subscribed</span>
        ) : (
          <span>No Stripe ID</span>
        )}
      </td>

      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {statusMsg && (
            <span className="text-[11px] text-emerald-700 font-medium animate-pulse">
              {statusMsg}
            </span>
          )}
          <button
            onClick={handleResetCredit}
            disabled={loading}
            title="Reset monthly AI compute usage to zero"
            className="rounded-lg border border-[#11140F]/15 px-2.5 py-1 text-[11.5px] font-medium text-[#11140F]/70 hover:text-[#11140F] hover:bg-white transition-all flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Reset AI
          </button>
        </div>
      </td>
    </tr>
  );
}
