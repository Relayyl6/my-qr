'use client';

import { useState, useEffect, useMemo } from 'react';
import { deleteLink, updateLink, toggleArchiveLink } from '@/app/actions';
import QrCodeCard from './QrCodeCard';
import DeleteConfirmModal from './DeleteConfirmModal';

interface QrLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  label: string | null;
  isArchived: boolean;
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
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [pendingDeleteLink, setPendingDeleteLink] = useState<QrLink | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleCopy = (id: string, shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800);
  };

  const activeLinks = useMemo(() => links.filter((l) => !l.isArchived), [links]);
  const archivedLinks = useMemo(() => links.filter((l) => l.isArchived), [links]);

  const currentTabLinks = tab === 'active' ? activeLinks : archivedLinks;

  const filteredLinks = useMemo(() => {
    if (!search.trim()) return currentTabLinks;
    const query = search.toLowerCase();
    return currentTabLinks.filter(
      (l) =>
        l.shortCode.toLowerCase().includes(query) ||
        (l.label && l.label.toLowerCase().includes(query)) ||
        l.destinationUrl.toLowerCase().includes(query)
    );
  }, [currentTabLinks, search]);

  if (links.length === 0) {
    return (
      <div className="w-full min-w-0 rounded-xl border border-dashed border-[#11140F]/20 p-8 sm:p-10 text-center">
        <p className="text-[14px] text-[#11140F]/55">No links yet.</p>
        <p className="mt-1 text-[13px] text-[#11140F]/40">Create one on the left to see it here.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Tab Switcher: Active vs Archived */}
      <div className="flex items-center justify-between gap-2 border-b border-[#11140F]/10 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('active')}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
              tab === 'active'
                ? 'bg-[#11140F] text-[#EEF0EA]'
                : 'text-[#11140F]/60 hover:text-[#11140F] hover:bg-[#11140F]/5'
            }`}
          >
            Active ({activeLinks.length})
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
              tab === 'archived'
                ? 'bg-[#11140F] text-[#EEF0EA]'
                : 'text-[#11140F]/60 hover:text-[#11140F] hover:bg-[#11140F]/5'
            }`}
          >
            Archived ({archivedLinks.length})
          </button>
        </div>

        {links.length > 2 && (
          <div className="text-[11px] text-[#11140F]/45">
            Total scans: <strong className="text-[#11140F]">{links.reduce((acc, l) => acc + l.scanCount, 0)}</strong>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      {links.length > 2 && (
        <div className="relative w-full min-w-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab} links...`}
            className="w-full min-w-0 rounded-xl border border-[#11140F]/15 bg-white px-3.5 py-2 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2 text-[11px] text-[#11140F]/40 hover:text-[#11140F]"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* List container */}
      <div className="w-full min-w-0 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1.5 space-y-3.5 scroll-smooth">
        {filteredLinks.length === 0 ? (
          <div className="w-full min-w-0 rounded-xl border border-dashed border-[#11140F]/15 p-8 text-center text-[13px] text-[#11140F]/50">
            {search ? `No links matching "${search}"` : `No ${tab} links.`}
          </div>
        ) : (
          filteredLinks.map((link) => {
            const shortUrl = origin ? `${origin}/id/${link.shortCode}` : '';

            return (
              <div
                key={link.id}
                className={`w-full min-w-0 rounded-xl border bg-white p-3.5 sm:p-5 space-y-3 transition-opacity ${
                  link.isArchived ? 'border-[#11140F]/15 bg-white/70 opacity-80' : 'border-[#11140F]/10'
                }`}
              >
                {/* Header row: Label + Live/Archived badge on left, Actions on right */}
                <div className="flex items-center justify-between gap-2 border-b border-[#11140F]/5 pb-2.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h3 className="text-[14px] sm:text-[15px] font-medium text-[#11140F] truncate">
                      {link.label || link.shortCode}
                    </h3>
                    {link.isArchived ? (
                      <span className="text-[10px] text-[#B8842E] bg-[#B8842E]/10 rounded-full px-2 py-0.5 shrink-0 font-medium">
                        Paused
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#2F6B4F] bg-[#2F6B4F]/10 rounded-full px-2 py-0.5 shrink-0 font-medium">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 text-[12px]">
                    {editingId !== link.id && !link.isArchived && (
                      <button
                        onClick={() => setEditingId(link.id)}
                        className="font-medium text-[#11140F]/60 hover:text-[#11140F] transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => toggleArchiveLink(link.id)}
                      className="font-medium text-[#11140F]/60 hover:text-[#11140F] transition-colors"
                      title={link.isArchived ? 'Restore link redirect' : 'Pause link redirect'}
                    >
                      {link.isArchived ? 'Restore' : 'Pause'}
                    </button>
                    <button
                      onClick={() => setPendingDeleteLink(link)}
                      className="font-medium text-[#B8842E] hover:text-[#8A631F] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Content: QR code on left, URL and details on right */}
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                  <QrCodeCard shortCode={link.shortCode} label={link.label} />

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Short URL + Copy Button */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] sm:text-[13px] text-[#11140F]/70 hover:text-[#11140F] transition-colors truncate font-mono min-w-0 flex-1"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {shortUrl.replace(/^https?:\/\//, '')}
                      </a>
                      <button
                        onClick={() => handleCopy(link.id, shortUrl)}
                        className="shrink-0 rounded-full border border-[#11140F]/15 px-2 py-0.5 text-[10px] sm:text-[11px] text-[#11140F]/60 hover:border-[#11140F]/30 hover:text-[#11140F] transition-colors"
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
                        className="space-y-2 w-full min-w-0"
                      >
                        <input
                          type="url"
                          name="destinationUrl"
                          defaultValue={link.destinationUrl}
                          required
                          className="w-full min-w-0 rounded-lg border border-[#11140F]/15 p-2 text-[12px] sm:text-[13px] outline-none focus:border-[#11140F]"
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
                      <div className="rounded-lg bg-[#EEF0EA] p-2 min-w-0 w-full overflow-hidden">
                        <p className="text-[9px] text-[#11140F]/40 uppercase tracking-wider font-medium">
                          Destination
                        </p>
                        <p className="truncate text-[11px] sm:text-[12px] font-medium text-[#11140F]/80 mt-0.5" title={link.destinationUrl}>
                          {link.destinationUrl}
                        </p>
                      </div>
                    )}

                    {/* Scan count & relative time */}
                    <div className="text-[11px] text-[#11140F]/45 truncate">
                      <strong className="text-[#11140F] font-medium">{link.scanCount}</strong> scans
                      <span className="mx-1">&middot;</span>
                      {timeAgo(link.lastScannedAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(pendingDeleteLink)}
        onClose={() => setPendingDeleteLink(null)}
        title={pendingDeleteLink?.label || pendingDeleteLink?.shortCode || ''}
        isArchived={pendingDeleteLink?.isArchived}
        onConfirmArchive={
          pendingDeleteLink && !pendingDeleteLink.isArchived
            ? () => toggleArchiveLink(pendingDeleteLink.id)
            : undefined
        }
        onConfirmDelete={
          pendingDeleteLink ? () => deleteLink(pendingDeleteLink.id) : () => {}
        }
      />
    </div>
  );
}
