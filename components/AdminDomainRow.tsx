'use client';

import { useState } from 'react';
import { adminForceVerifyDomain } from '@/app/admin/actions';
import { Globe, CheckCircle2, AlertCircle, Zap, Loader2 } from 'lucide-react';

interface DomainRecord {
  id: string;
  domain: string;
  status: string;
  cnameTarget: string;
  verificationTxt: string;
  createdAt: Date;
  user: {
    email: string;
  };
}

export default function AdminDomainRow({ domain }: { domain: DomainRecord }) {
  const [status, setStatus] = useState(domain.status);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleForceVerify = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await adminForceVerifyDomain(domain.id);
      setStatus('verified');
      setMsg('Verified!');
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg('Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="border-b border-[#11140F]/5 text-[12.5px] hover:bg-[#F7F8F5]/50 transition-colors">
      <td className="py-3 px-4 font-mono font-semibold text-[#11140F]">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>{domain.domain}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-[#11140F]/80">
        {domain.user.email}
      </td>
      <td className="py-3 px-4">
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
            status === 'verified'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          {status.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-4 font-mono text-[11px] text-[#11140F]/50">
        CNAME: {domain.cnameTarget}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {msg && <span className="text-[11px] text-emerald-700 font-medium">{msg}</span>}
          {status !== 'verified' ? (
            <button
              onClick={handleForceVerify}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3 text-emerald-200" />
              )}
              Force-Verify
            </button>
          ) : (
            <span className="text-[11px] text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
