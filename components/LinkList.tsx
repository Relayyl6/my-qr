'use client';

import { useState, useEffect, useMemo } from 'react';
import { deleteLink, updateLink, toggleArchiveLink, checkDestinationHealth } from '@/app/actions';
import QrCodeCard from './QrCodeCard';
import DeleteConfirmModal from './DeleteConfirmModal';
import AiRoutingComposer from './AiRoutingComposer';
import QrArtStudio from './QrArtStudio';
import LandingPageEditor from './LandingPageEditor';
import { Sparkles, Compass, Palette, Smartphone, Activity, CheckCircle2, AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { revertLandingPageAction } from '@/lib/ai/features/landing-page-builder';

interface QrLink {
  id: string;
  shortCode: string;
  destinationUrl: string;
  label: string | null;
  type?: string;
  isArchived: boolean;
  scanCount: number;
  lastScannedAt: Date | null;
  landingPage?: { id: string; spec: any; published: boolean } | null;
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
  const [healthMap, setHealthMap] = useState<Record<string, { ok: boolean; status?: number; error?: string }>>({});
  const [checkingHealthId, setCheckingHealthId] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  // AI Feature Modals state
  const [activeRouterLink, setActiveRouterLink] = useState<QrLink | null>(null);
  const [activeArtLink, setActiveArtLink] = useState<QrLink | null>(null);
  const [activePageLink, setActivePageLink] = useState<QrLink | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleQuickRevert = async (linkId: string) => {
    if (!confirm('Revert this link back to direct URL redirection? (Your mobile showcase page will be unlinked)')) {
      return;
    }
    setRevertingId(linkId);
    try {
      await revertLandingPageAction(linkId);
      window.location.reload();
    } catch (err: any) {
      alert('Failed to revert: ' + err.message);
    } finally {
      setRevertingId(null);
    }
  };

  const handleCheckHealth = async (id: string, url: string) => {
    setCheckingHealthId(id);
    const result = await checkDestinationHealth(url);
    setHealthMap((prev) => ({ ...prev, [id]: result }));
    setCheckingHealthId(null);
  };

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
          <div className="w-48 sm:w-60">
            <input
              type="text"
              placeholder="Search links…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-[#11140F]/15 bg-white px-3 py-1 text-xs text-[#11140F] placeholder:text-[#11140F]/35 outline-none focus:border-[#11140F]"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 w-full min-w-0">
        {filteredLinks.length === 0 ? (
          <div className="w-full min-w-0 rounded-xl border border-dashed border-[#11140F]/15 p-6 text-center text-xs text-[#11140F]/40">
            No {tab} links match your search.
          </div>
        ) : (
          filteredLinks.map((link) => {
            const shortUrl = `${origin || 'https://dynamicqr.co'}/id/${link.shortCode}`;

            return (
              <div
                key={link.id}
                className={`w-full min-w-0 rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                  link.isArchived
                    ? 'border-[#11140F]/10 bg-[#11140F]/[0.02] opacity-80'
                    : 'border-[#11140F]/15 bg-white hover:border-[#11140F]/30'
                }`}
              >
                {/* Header row: Label & primary actions */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-[14px] font-semibold text-[#11140F] truncate" title={link.label || 'Untitled link'}>
                      {link.label || 'Untitled link'}
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
                    {link.type === 'landing-page' && (
                      <span className="text-[10px] text-purple-700 bg-purple-100 rounded-full px-2 py-0.5 shrink-0 font-medium">
                        Mobile Page
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
                    ) : link.type === 'landing-page' && link.landingPage?.published ? (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 min-w-0 w-full space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-blue-900">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                            <span>Mobile Page Live</span>
                            <a
                              href={`/page/${link.shortCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10.5px] font-mono bg-blue-100 text-blue-800 hover:text-blue-950 px-1.5 py-0.5 rounded underline flex items-center gap-0.5"
                            >
                              /page/{link.shortCode}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickRevert(link.id)}
                            disabled={revertingId === link.id}
                            className="text-[11px] font-semibold text-red-600 hover:text-red-700 underline cursor-pointer"
                          >
                            {revertingId === link.id ? 'Reverting…' : 'Revert to Direct URL'}
                          </button>
                        </div>
                        <p className="text-[11px] text-blue-800/80 truncate">
                          Primary destination: <span className="font-mono text-blue-950 font-medium">{link.destinationUrl}</span>
                        </p>
                      </div>
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

                    {/* Destination Health Sentinel */}
                    <div className="flex items-center gap-2 text-[11px]">
                      {healthMap[link.id] ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${
                            healthMap[link.id].ok
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              healthMap[link.id].ok ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                          {healthMap[link.id].ok
                            ? `Live (${healthMap[link.id].status || 200} OK)`
                            : `Offline / Error (${healthMap[link.id].error || `HTTP ${healthMap[link.id].status}`})`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckHealth(link.id, link.destinationUrl)}
                          disabled={checkingHealthId === link.id}
                          className="inline-flex items-center gap-1 text-[11px] text-[#11140F]/50 hover:text-[#11140F] transition-colors"
                        >
                          <Activity className={`w-3 h-3 ${checkingHealthId === link.id ? 'animate-spin' : ''}`} />
                          {checkingHealthId === link.id ? 'Pinging URL…' : 'Ping link health'}
                        </button>
                      )}
                    </div>


                    {/* Scan count & relative time */}
                    <div className="text-[11px] text-[#11140F]/45 truncate">
                      <strong className="text-[#11140F] font-medium">{link.scanCount}</strong> scans
                      <span className="mx-1">&middot;</span>
                      {timeAgo(link.lastScannedAt)}
                    </div>

                    {/* AI Feature Action Pills */}
                    {!link.isArchived && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setActiveRouterLink(link)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-50/60 hover:bg-emerald-100/80 text-[11px] font-medium text-emerald-800 transition-colors"
                        >
                          <Compass className="w-3 h-3 text-emerald-600" />
                          Smart Router
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveArtLink(link)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-500/20 bg-purple-50/60 hover:bg-purple-100/80 text-[11px] font-medium text-purple-800 transition-colors"
                        >
                          <Palette className="w-3 h-3 text-purple-600" />
                          QR Art Studio
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePageLink(link)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                            link.type === 'landing-page' && link.landingPage?.published
                              ? 'border-blue-400 bg-blue-100/80 text-blue-900 font-semibold'
                              : 'border-blue-500/20 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800'
                          }`}
                        >
                          <Smartphone className="w-3 h-3 text-blue-600" />
                          {link.type === 'landing-page' && link.landingPage?.published
                            ? 'Edit Mobile Page'
                            : 'Prompt-to-Page'}
                        </button>
                        <a
                          href={`/api/links/${link.id}/export`}
                          download
                          title="Download complete scan history as CSV"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#11140F]/15 bg-white hover:bg-[#EEF0EA] text-[11px] font-medium text-[#11140F]/75 transition-colors"
                        >
                          <Download className="w-3 h-3 text-[#11140F]/60" />
                          Export CSV
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Smart Destination Router Modal */}
      {activeRouterLink && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <AiRoutingComposer
            linkId={activeRouterLink.id}
            shortCode={activeRouterLink.shortCode}
            defaultDestination={activeRouterLink.destinationUrl}
            onClose={() => setActiveRouterLink(null)}
          />
        </div>
      )}

      {/* AI QR Art Studio Modal */}
      {activeArtLink && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <QrArtStudio
            linkId={activeArtLink.id}
            shortCode={activeArtLink.shortCode}
            destinationUrl={activeArtLink.destinationUrl}
            label={activeArtLink.label}
            onClose={() => setActiveArtLink(null)}
          />
        </div>
      )}

      {/* AI Instant Mobile Landing Page Modal */}
      {activePageLink && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <LandingPageEditor
            linkId={activePageLink.id}
            shortCode={activePageLink.shortCode}
            destinationUrl={activePageLink.destinationUrl}
            initialSpec={activePageLink.landingPage?.spec}
            isCurrentlyActive={activePageLink.type === 'landing-page' && Boolean(activePageLink.landingPage?.published)}
            onSaved={() => {
              window.location.reload();
            }}
            onReverted={() => {
              window.location.reload();
            }}
            onClose={() => setActivePageLink(null)}
          />
        </div>
      )}

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
