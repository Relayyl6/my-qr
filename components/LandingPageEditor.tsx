'use client';

import { useState } from 'react';
import {
  buildLandingPageSpecAction,
  saveLandingPageAction,
  revertLandingPageAction,
} from '@/lib/ai/features/landing-page-builder';
import { LandingPageSpec, LandingBlock } from '@/lib/landing/types';
import { RenderLandingPage } from '@/lib/landing/render';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Globe,
  Eye,
  Edit3,
  X,
  Undo2,
  Link as LinkIcon,
  ExternalLink,
  Sliders,
  AlertCircle,
  Plus,
  Trash2,
  Star,
  Smartphone,
  Monitor,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';

interface LandingPageEditorProps {
  linkId: string;
  shortCode: string;
  destinationUrl: string;
  initialSpec?: LandingPageSpec | null;
  isCurrentlyActive?: boolean;
  onSaved?: () => void;
  onReverted?: () => void;
  onClose?: () => void;
}

export default function LandingPageEditor({
  linkId,
  shortCode,
  destinationUrl,
  initialSpec,
  isCurrentlyActive = false,
  onSaved,
  onReverted,
  onClose,
}: LandingPageEditorProps) {
  const [promptText, setPromptText] = useState(
    'Create an artisanal showcase & links page with our core website, booking specials, opening hours, and Instagram link.'
  );
  const [spec, setSpec] = useState<LandingPageSpec | null>(initialSpec || null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'links' | 'preview'>('prompt');
  const [viewportMode, setViewportMode] = useState<'mobile' | 'desktop'>('mobile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [isActive, setIsActive] = useState(isCurrentlyActive);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await buildLandingPageSpecAction(promptText, undefined, destinationUrl);
      setSpec(res.spec);
      setActiveTab('links');
      setMessage({ text: 'Landing page generated! You can now add, remove, and customize your buttons below.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Generation failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!spec) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveLandingPageAction(linkId, spec, true);
      setIsActive(true);
      setMessage({
        text: `Landing page published! Scans to /id/${shortCode} now display this mobile showcase.`,
        type: 'success',
      });
      onSaved?.();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save page.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    setReverting(true);
    setMessage(null);
    try {
      await revertLandingPageAction(linkId);
      setIsActive(false);
      setMessage({
        text: `Successfully reverted! Scans now redirect directly to ${destinationUrl}`,
        type: 'success',
      });
      onReverted?.();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to revert to direct URL.', type: 'error' });
    } finally {
      setReverting(false);
    }
  };

  // Helper to update a LinkList item's URL or title
  const handleUpdateLinkItem = (
    blockIndex: number,
    itemIndex: number,
    field: 'title' | 'url' | 'subtitle',
    value: string
  ) => {
    if (!spec) return;
    const newBlocks = [...spec.blocks];
    const targetBlock = newBlocks[blockIndex];
    if (targetBlock && targetBlock.type === 'linkList') {
      const newItems = [...targetBlock.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        [field]: value,
      };
      newBlocks[blockIndex] = {
        ...targetBlock,
        items: newItems,
      };
      setSpec({ ...spec, blocks: newBlocks });
    }
  };

  // Helper to set item URL directly to link's destinationUrl
  const handleSetToDestination = (blockIndex: number, itemIndex: number) => {
    handleUpdateLinkItem(blockIndex, itemIndex, 'url', destinationUrl);
  };

  // Helper to add a new button
  const handleAddButton = (blockIndex: number, presetTitle?: string, presetUrl?: string) => {
    if (!spec) return;
    const newBlocks = [...spec.blocks];
    const targetBlock = newBlocks[blockIndex];
    if (targetBlock && targetBlock.type === 'linkList') {
      const newItems = [
        ...targetBlock.items,
        {
          title: presetTitle || `Button #${targetBlock.items.length + 1}`,
          url: presetUrl || destinationUrl || 'https://',
          subtitle: '',
          highlight: false,
        },
      ];
      newBlocks[blockIndex] = {
        ...targetBlock,
        items: newItems,
      };
      setSpec({ ...spec, blocks: newBlocks });
      setMessage({ text: 'New button added! Configure its label and destination URL below.', type: 'success' });
    }
  };

  // Helper to remove a button
  const handleRemoveButton = (blockIndex: number, itemIndex: number) => {
    if (!spec) return;
    const newBlocks = [...spec.blocks];
    const targetBlock = newBlocks[blockIndex];
    if (targetBlock && targetBlock.type === 'linkList') {
      if (targetBlock.items.length <= 1) {
        alert('Your page must have at least one button for visitors to take action.');
        return;
      }
      const newItems = targetBlock.items.filter((_, idx) => idx !== itemIndex);
      newBlocks[blockIndex] = {
        ...targetBlock,
        items: newItems,
      };
      setSpec({ ...spec, blocks: newBlocks });
      setMessage({ text: 'Button removed.', type: 'success' });
    }
  };

  // Helper to toggle highlight / primary CTA
  const handleToggleHighlight = (blockIndex: number, itemIndex: number) => {
    if (!spec) return;
    const newBlocks = [...spec.blocks];
    const targetBlock = newBlocks[blockIndex];
    if (targetBlock && targetBlock.type === 'linkList') {
      const newItems = [...targetBlock.items];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        highlight: !newItems[itemIndex].highlight,
      };
      newBlocks[blockIndex] = {
        ...targetBlock,
        items: newItems,
      };
      setSpec({ ...spec, blocks: newBlocks });
    }
  };

  // Helper to reorder buttons
  const handleMoveButton = (blockIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    if (!spec) return;
    const newBlocks = [...spec.blocks];
    const targetBlock = newBlocks[blockIndex];
    if (targetBlock && targetBlock.type === 'linkList') {
      const targetIdx = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (targetIdx < 0 || targetIdx >= targetBlock.items.length) return;
      const newItems = [...targetBlock.items];
      const temp = newItems[itemIndex];
      newItems[itemIndex] = newItems[targetIdx];
      newItems[targetIdx] = temp;
      newBlocks[blockIndex] = {
        ...targetBlock,
        items: newItems,
      };
      setSpec({ ...spec, blocks: newBlocks });
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/15 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-w-3xl sm:max-w-4xl w-full max-h-[92vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#11140F] flex items-center gap-2">
              Prompt-to-Page Studio for <span className="font-mono text-emerald-700">/{shortCode}</span>
            </h3>
            <p className="text-[12px] text-[#11140F]/55 truncate max-w-md">
              Primary destination: <span className="font-mono text-[#11140F]/80">{destinationUrl}</span>
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1.5 rounded-lg hover:bg-[#11140F]/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode / Revert Status Banner */}
      <div className="shrink-0 rounded-xl p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[12px] transition-colors bg-[#F7F8F5] border-[#11140F]/10">
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <div>
                <strong className="text-blue-900 font-semibold">Active Mode: Mobile Showcase Page</strong>
                <p className="text-[#11140F]/60 text-[11px]">
                  Scans load your showcase at <code>/page/{shortCode}</code>
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <div>
                <strong className="text-emerald-900 font-semibold">Active Mode: Direct URL Redirect</strong>
                <p className="text-[#11140F]/60 text-[11px]">
                  Scans instantly redirect to your destination URL
                </p>
              </div>
            </>
          )}
        </div>

        {isActive && (
          <button
            type="button"
            onClick={handleRevert}
            disabled={reverting}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium text-[11.5px] shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {reverting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Reverting…
              </>
            ) : (
              <>
                <Undo2 className="w-3.5 h-3.5 text-red-500" />
                Revert to Direct URL
              </>
            )}
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b pb-2 shrink-0">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'prompt'
                ? 'bg-[#11140F] text-white'
                : 'text-[#11140F]/60 hover:bg-[#11140F]/5'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            AI Prompt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            disabled={!spec}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
              activeTab === 'links'
                ? 'bg-[#11140F] text-white'
                : 'text-[#11140F]/60 hover:bg-[#11140F]/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Customize Buttons & Desktop View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            disabled={!spec}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
              activeTab === 'preview'
                ? 'bg-[#11140F] text-white'
                : 'text-[#11140F]/60 hover:bg-[#11140F]/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </button>
        </div>

        {spec && (
          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                Publish & Link QR
              </>
            )}
          </button>
        )}
      </div>

      {/* Body Area */}
      <div className="overflow-y-auto flex-1 min-h-[340px] max-h-[520px] pr-1">
        {/* TAB 1: AI Prompt */}
        {activeTab === 'prompt' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-medium text-[#11140F]/70">
                Describe your business or mobile offer:
              </label>
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe your business, menu items, key actions, social links, and vibe..."
                className="w-full rounded-xl border border-[#11140F]/15 bg-[#11140F]/[0.02] p-3 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors resize-none"
              />
              <p className="text-[11px] text-[#11140F]/50">
                Your destination URL (<span className="font-mono text-[#11140F]/70">{destinationUrl}</span>) will be automatically assigned to the primary call-to-action button.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !promptText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating Mobile Showcase…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Generate Mobile Page with AI
                  </>
                )}
              </button>
            </div>

            {spec && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-[12px] text-emerald-900 flex items-center justify-between">
                <div>
                  <strong>{spec.businessName}</strong> is ready with {spec.blocks.length} sections.
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('links')}
                    className="font-semibold text-emerald-800 underline"
                  >
                    Manage Buttons →
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="font-semibold text-emerald-800 underline"
                  >
                    Preview Mobile & Desktop →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Customize Buttons & Links (Add / Remove Buttons + Desktop Feature) */}
        {activeTab === 'links' && spec && (
          <div className="space-y-4 pt-1">
            {spec.blocks.map((block, blockIdx) => {
              if (block.type === 'linkList') {
                return (
                  <div key={blockIdx} className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b">
                      <div>
                        <h4 className="text-[12.5px] font-semibold text-[#11140F] uppercase tracking-wider">
                          {block.title || 'Quick Links & Action Buttons'} ({block.items.length})
                        </h4>
                        <p className="text-[11px] text-[#11140F]/55">
                          Add, reorder, or remove buttons. On desktop, buttons automatically flow into a responsive grid.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddButton(blockIdx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11140F] text-white text-[11.5px] font-semibold hover:bg-[#2A2E25] transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Button
                      </button>
                    </div>

                    {/* List of Buttons */}
                    <div className="space-y-3">
                      {block.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                            item.highlight
                              ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                              : 'border-[#11140F]/10 bg-[#F7F8F5]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#11140F]/10 text-[#11140F] flex items-center justify-center text-[10.5px] font-bold font-mono">
                                {itemIdx + 1}
                              </span>
                              <span className="text-[12.5px] font-semibold text-[#11140F]">
                                {item.title || 'Untitled Button'}
                              </span>
                              {item.highlight && (
                                <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                                  Primary CTA
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Set to Destination Button */}
                              {item.url !== destinationUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetToDestination(blockIdx, itemIdx)}
                                  className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                                  title="Point this button to your QR code's destination URL"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                  Point to Destination
                                </button>
                              ) : (
                                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  Matches Destination
                                </span>
                              )}

                              {/* Reorder Buttons */}
                              <div className="flex items-center border border-[#11140F]/10 rounded-lg bg-white overflow-hidden">
                                <button
                                  type="button"
                                  disabled={itemIdx === 0}
                                  onClick={() => handleMoveButton(blockIdx, itemIdx, 'up')}
                                  className="p-1 hover:bg-[#EEF0EA] disabled:opacity-30 transition-colors"
                                  title="Move button up"
                                >
                                  <ArrowUp className="w-3 h-3 text-[#11140F]/70" />
                                </button>
                                <button
                                  type="button"
                                  disabled={itemIdx === block.items.length - 1}
                                  onClick={() => handleMoveButton(blockIdx, itemIdx, 'down')}
                                  className="p-1 hover:bg-[#EEF0EA] disabled:opacity-30 transition-colors border-l border-[#11140F]/10"
                                  title="Move button down"
                                >
                                  <ArrowDown className="w-3 h-3 text-[#11140F]/70" />
                                </button>
                              </div>

                              {/* Highlight Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleHighlight(blockIdx, itemIdx)}
                                className={`p-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                                  item.highlight
                                    ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
                                    : 'border-[#11140F]/10 bg-white text-[#11140F]/60 hover:text-[#11140F]'
                                }`}
                                title="Toggle primary button style"
                              >
                                <Star className={`w-3.5 h-3.5 ${item.highlight ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                              </button>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveButton(blockIdx, itemIdx)}
                                className="p-1.5 rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                                title="Delete this button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-[#11140F]/50 mb-0.5">
                                Button Label
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) =>
                                  handleUpdateLinkItem(blockIdx, itemIdx, 'title', e.target.value)
                                }
                                className="w-full rounded-lg border border-[#11140F]/15 bg-white p-2 text-[12px] outline-none focus:border-[#11140F]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-[#11140F]/50 mb-0.5">
                                Target URL
                              </label>
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) =>
                                  handleUpdateLinkItem(blockIdx, itemIdx, 'url', e.target.value)
                                }
                                className="w-full rounded-lg border border-[#11140F]/15 bg-white p-2 text-[12px] font-mono text-[11.5px] outline-none focus:border-[#11140F]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-[#11140F]/50 mb-0.5">
                              Subtitle (optional)
                            </label>
                            <input
                              type="text"
                              value={item.subtitle || ''}
                              onChange={(e) =>
                                handleUpdateLinkItem(blockIdx, itemIdx, 'subtitle', e.target.value)
                              }
                              className="w-full rounded-lg border border-[#11140F]/15 bg-white p-1.5 text-[11.5px] outline-none focus:border-[#11140F]"
                              placeholder="Add short description or callout"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Add & Preset Buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddButton(blockIdx)}
                        className="py-2 px-3 rounded-xl border border-dashed border-[#11140F]/30 bg-white text-[#11140F] hover:bg-[#EEF0EA] text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#2F6B4F]" />
                        + Add Another Button
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[#11140F]/50">Quick add:</span>
                        <button
                          type="button"
                          onClick={() => handleAddButton(blockIdx, 'Follow on Instagram', 'https://instagram.com/')}
                          className="px-2 py-1 rounded-lg border border-[#11140F]/10 bg-white hover:bg-[#EEF0EA] text-[11px] text-[#11140F]/80 transition-colors"
                        >
                          + Instagram
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddButton(blockIdx, 'Book Appointment', 'https://calendly.com/')}
                          className="px-2 py-1 rounded-lg border border-[#11140F]/10 bg-white hover:bg-[#EEF0EA] text-[11px] text-[#11140F]/80 transition-colors"
                        >
                          + Booking
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddButton(blockIdx, 'View Catalog & Menu', destinationUrl)}
                          className="px-2 py-1 rounded-lg border border-[#11140F]/10 bg-white hover:bg-[#EEF0EA] text-[11px] text-[#11140F]/80 transition-colors"
                        >
                          + Catalog
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* TAB 3: Live Preview (Mobile & Desktop Viewports) */}
        {activeTab === 'preview' && spec && (
          <div className="space-y-3">
            {/* Viewport Switcher */}
            <div className="flex items-center justify-between pb-1 border-b">
              <span className="text-[12px] font-medium text-[#11140F]/70">
                Preview how visitors see your page:
              </span>
              <div className="flex items-center gap-1 bg-[#EEF0EA] p-1 rounded-xl text-[12px]">
                <button
                  type="button"
                  onClick={() => setViewportMode('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                    viewportMode === 'mobile'
                      ? 'bg-white text-[#11140F] shadow-xs font-semibold'
                      : 'text-[#11140F]/60 hover:text-[#11140F]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile View (Phone)
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                    viewportMode === 'desktop'
                      ? 'bg-white text-[#11140F] shadow-xs font-semibold'
                      : 'text-[#11140F]/60 hover:text-[#11140F]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop View (PC / Tablet)
                </button>
              </div>
            </div>

            {/* Preview Container */}
            <div className="flex flex-col items-center p-3 sm:p-5 bg-[#11140F]/[0.03] rounded-2xl overflow-x-auto">
              {viewportMode === 'mobile' ? (
                // Realistic Mobile Phone Mockup
                <div className="w-[360px] max-w-full rounded-[38px] overflow-hidden shadow-2xl border-[8px] border-slate-900 bg-white relative">
                  {/* Phone Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  </div>
                  <div className="max-h-[520px] overflow-y-auto">
                    <RenderLandingPage
                      spec={spec}
                      destinationUrl={destinationUrl}
                      forceViewMode="mobile"
                      shortCode={shortCode}
                    />
                  </div>
                </div>
              ) : (
                // Realistic Desktop Browser Mockup
                <div className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-white">
                  {/* Browser Window Header */}
                  <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 max-w-sm mx-auto bg-slate-900/80 rounded-md px-3 py-0.5 text-[11px] font-mono text-slate-300 truncate text-center">
                      https://dynamicqr.co/page/{shortCode}
                    </div>
                  </div>
                  <div className="max-h-[550px] overflow-y-auto">
                    <RenderLandingPage
                      spec={spec}
                      destinationUrl={destinationUrl}
                      forceViewMode="desktop"
                      shortCode={shortCode}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Message */}
      {message && (
        <div
          className={`p-2.5 rounded-xl text-[12px] font-medium flex items-center gap-2 shrink-0 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
