'use client';

import { useState, useEffect, useMemo } from 'react';
import { deleteLink, updateLink } from '@/app/actions';
import QrCodeCard from './QrCodeCard';

interface QrLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  label: string | null;
  scanCount: number;
  lastScannedAt: Date | null;
}

function timeAgo(date: Date | null) {
  if (!date) return 'Never scanned';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Scanned just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Scanned ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Scanned ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Scanned ${days}d ago`;
}

export default function LinkList({ links }: { links: QrLink[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleCopy = (id: string, shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800);
  };

  const filteredLinks = useMemo(() => {
    if (!search.trim()) return links;
    const query = search.toLowerCase();
    return links.filter(
      (l) =>
        l.shortCode.toLowerCase().includes(query) ||
        (l.label && l.label.toLowerCase().includes(query)) ||
        l.destinationUrl.toLowerCase().includes(query)
    );
  }, [links, search]);

  if (links.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#11140F]/20 p-8 sm:p-10 text-center">
        <p className="text-[14px] text-[#11140F]/55">No links yet.</p>
        <p className="mt-1 text-[13px] text-[#11140F]/40">Create one on the left to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar (shown if multiple links exist) */}
      {links.length > 2 && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by label, short code, or URL..."
            className="w-full rounded-xl border border-[#11140F]/15 bg-white px-3.5 py-2.5 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-[11px] text-[#11140F]/40 hover:text-[#11140F]"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* List container - natural flow on mobile, scrollable viewport on desktop */}
      <div className="lg:max-h-[640px] lg:overflow-y-auto lg:pr-1.5 space-y-4 scroll-smooth">
        {filteredLinks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#11140F]/15 p-8 text-center text-[13px] text-[#11140F]/50">
            No links matching "{search}"
          </div>
        ) : (
          filteredLinks.map((link) => {
            const shortUrl = origin ? `${origin}/id/${link.shortCode}` : '';

            return (
              <div
                key={link.id}
                className="rounded-xl border border-[#11140F]/10 bg-white p-4 sm:p-5 space-y-3.5"
              >
                {/* Header row: Label + Live badge on left, Edit & Delete on right */}
                <div className="flex items-center justify-between gap-2 border-b border-[#11140F]/5 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-[15px] font-medium text-[#11140F] truncate">
                      {link.label || link.shortCode}
                    </h3>
                    <span className="text-[10px] text-[#2F6B4F] bg-[#2F6B4F]/10 rounded-full px-2 py-0.5 shrink-0 font-medium">
                      Live
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[12px]">
                    {editingId !== link.id && (
                      <button
                        onClick={() => setEditingId(link.id)}
                        className="font-medium text-[#11140F]/60 hover:text-[#11140F] transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="font-medium text-[#B8842E] hover:text-[#8A631F] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Content: QR code on left, URL and details on right */}
                <div className="flex items-start gap-4">
                  <QrCodeCard shortCode={link.shortCode} label={link.label} />

                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Short URL + Copy Button */}
                    <div className="flex items-center gap-2">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] sm:text-[13px] text-[#11140F]/65 hover:text-[#11140F] transition-colors truncate font-mono"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {shortUrl.replace(/^https?:\/\//, '')}
                      </a>
                      <button
                        onClick={() => handleCopy(link.id, shortUrl)}
                        className="shrink-0 rounded-full border border-[#11140F]/15 px-2.5 py-0.5 text-[11px] text-[#11140F]/60 hover:border-[#11140F]/30 hover:text-[#11140F] transition-colors"
                      >
                        {copiedId === link.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    {/* Destination URL */}
                    {editingId === link.id ? (
                      <form
                        action={async (formData) => {
                          await updateLink(link.id, formData);
                          setEditingId(null);
                        }}
                        className="space-y-2"
                      >
                        <input
                          type="url"
                          name="destinationUrl"
                          defaultValue={link.destinationUrl}
                          required
                          className="w-full rounded-lg border border-[#11140F]/15 p-2 text-[12px] sm:text-[13px] outline-none focus:border-[#11140F]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="rounded-full bg-[#11140F] px-3.5 py-1 text-[11px] sm:text-[12px] font-medium text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-full border border-[#11140F]/15 px-3.5 py-1 text-[11px] sm:text-[12px] text-[#11140F]/70"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="rounded-lg bg-[#EEF0EA] p-2.5">
                        <p className="text-[10px] text-[#11140F]/40 uppercase tracking-wider font-medium">
                          Current destination
                        </p>
                        <p className="truncate text-[12px] sm:text-[13px] font-medium text-[#11140F]/80 mt-0.5">
                          {link.destinationUrl}
                        </p>
                      </div>
                    )}

                    {/* Scan count & relative time */}
                    <div className="text-[11px] sm:text-[12px] text-[#11140F]/45">
                      <strong className="text-[#11140F] font-medium">{link.scanCount}</strong> scans
                      <span className="mx-1.5">&middot;</span>
                      {timeAgo(link.lastScannedAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
