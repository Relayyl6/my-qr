'use client';

import { useState, useEffect } from 'react';
import { deleteLink, updateLink } from '@/app/actions';
import QrCodeCard from './QrCodeCard';

type QrLink = {
  id: string; shortCode: string; destinationUrl: string; label: string | null; scanCount: number; lastScannedAt: Date | null;
};

export default function LinkList({ links }: { links: QrLink[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (links.length === 0) {
    return <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">No links created yet.</div>;
  }

  return (
    <div className="space-y-4">
      {links.map((link) => {
        const shortUrl = origin ? `${origin}/id/${link.shortCode}` : '';

        return (
          <div key={link.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-start">
            <div className="shrink-0 mx-auto md:mx-0">
              <QrCodeCard shortCode={link.shortCode} label={link.label} />
            </div>
            
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold truncate">{link.label || link.shortCode}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <a href={shortUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                      {shortUrl}
                    </a>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(shortUrl); alert('Copied!'); }}
                      className="text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Current Destination</div>
                {editingId === link.id ? (
                  <form 
                    action={async (formData) => {
                      const res = await updateLink(link.id, {}, formData);
                      if (res.success) setEditingId(null); else alert(res.message);
                    }} 
                    className="flex gap-2"
                  >
                    <input type="url" name="destinationUrl" defaultValue={link.destinationUrl} required className="flex-1 rounded border-gray-300 px-2 py-1 text-sm border focus:outline-none" />
                    <button type="submit" className="rounded bg-black px-3 py-1 text-sm font-medium text-white">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700">Cancel</button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <a href={link.destinationUrl} target="_blank" rel="noreferrer" className="truncate text-sm text-gray-700 hover:underline">
                      {link.destinationUrl}
                    </a>
                    <button onClick={() => setEditingId(link.id)} className="text-sm font-medium text-blue-600 hover:text-blue-800 shrink-0">Edit</button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <div className="flex gap-4">
                  <span>Scans: <strong className="text-gray-900">{link.scanCount}</strong></span>
                  {link.lastScannedAt && <span>Last scan: {new Date(link.lastScannedAt).toLocaleDateString()}</span>}
                </div>
                <button 
                  onClick={() => confirm('Delete this link? The printed QR will break permanently.') && deleteLink(link.id)} 
                  className="text-red-600 hover:underline font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
