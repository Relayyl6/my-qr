'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Doc, Node, Style, Bp, BP } from '@/lib/builder/schema';
import { isOverridden, resolveStyle } from '@/lib/builder/resolve';
import {
  Sliders,
  Type,
  Layout,
  Smartphone,
  Lock,
  RotateCcw,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowRight,
  ChevronDown,
  Globe,
  Palette,
  ExternalLink,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Tag,
  Layers,
  FileText,
} from 'lucide-react';

interface SmoothInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChangeValue: (val: string) => void;
}

function SmoothInput({ value, onChangeValue, onFocus, onBlur, className, ...props }: SmoothInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <input
      {...props}
      value={localValue}
      className={className}
      onFocus={(e) => {
        isFocused.current = true;
        onFocus?.(e);
      }}
      onBlur={(e) => {
        isFocused.current = false;
        if (localValue !== value) {
          onChangeValue(localValue);
        }
        onBlur?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        setLocalValue(next);
        onChangeValue(next);
      }}
    />
  );
}

interface SmoothTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChangeValue: (val: string) => void;
}

function SmoothTextarea({ value, onChangeValue, onFocus, onBlur, className, ...props }: SmoothTextareaProps) {
  const [localValue, setLocalValue] = useState(value);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <textarea
      {...props}
      value={localValue}
      className={className}
      onFocus={(e) => {
        isFocused.current = true;
        onFocus?.(e);
      }}
      onBlur={(e) => {
        isFocused.current = false;
        if (localValue !== value) {
          onChangeValue(localValue);
        }
        onBlur?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        setLocalValue(next);
        onChangeValue(next);
      }}
    />
  );
}

interface RightInspectorProps {
  doc: Doc;
  selectedId?: string;
  bp: Bp;
  activeTab: 'content' | 'layout' | 'style' | 'responsive' | 'ai';
  onSelectTab: (tab: 'content' | 'layout' | 'style' | 'responsive' | 'ai') => void;
  onUpdateProps: (id: string, props: Record<string, unknown>) => void;
  onUpdateStyle: (id: string, bp: Bp, style: Partial<Style>) => void;
  onResetOverride: (id: string, bp: Bp, key: keyof Style) => void;
  onCopyStyles: (id: string, fromBp: Bp, toBp: Bp) => void;
  onSelectNode?: (id: string) => void;
  onUpdateTokens?: (tokens: Partial<Doc['tokens']>) => void;
}

export function RightInspector({
  doc,
  selectedId,
  bp,
  activeTab,
  onSelectTab,
  onUpdateProps,
  onUpdateStyle,
  onResetOverride,
  onCopyStyles,
  onSelectNode,
  onUpdateTokens,
}: RightInspectorProps) {
  const node = selectedId ? doc.nodes[selectedId] : null;

  // Render Page Inspector when no element is selected
  if (!node) {
    return (
      <div className="w-[280px] h-full bg-[#11140F] border-l border-white/10 flex flex-col text-white text-[12px] select-none flex-shrink-0 overflow-y-auto">
        {/* Page Inspector Header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#151916]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-[13px] text-white/90 block">Page Inspector</span>
              <span className="text-[10px] font-mono opacity-50 uppercase">Global Page Settings</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold uppercase border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            {bp}
          </span>
        </div>

        <div className="p-3 space-y-4">
          {/* 1. Locked Primary Destination */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase opacity-60 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Locked Destination URL</span>
            </label>
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 space-y-1">
              <p className="font-mono text-[11px] text-emerald-300 break-all select-all">
                {doc.destination?.url || 'https://dynamicqr.io'}
              </p>
              <span className="text-[9.5px] text-emerald-400/70 block">
                🔒 Bound by code guarantee to QR shortcode
              </span>
            </div>
          </div>

          {/* 2. Page Background Color */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase opacity-60 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Page Background</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={doc.tokens?.colors?.bg?.startsWith('#') ? doc.tokens.colors.bg : '#ffffff'}
                onChange={(e) => {
                  onUpdateTokens?.({
                    colors: { bg: e.target.value } as any,
                  });
                }}
                className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer p-0.5 bg-black"
              />
              <SmoothInput
                type="text"
                value={doc.tokens?.colors?.bg || '#ffffff'}
                onChangeValue={(val) => {
                  onUpdateTokens?.({
                    colors: { bg: val } as any,
                  });
                }}
                className="flex-1 bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11.5px]"
              />
            </div>
          </div>

          {/* 3. Global Color Palette Tokens */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase opacity-60 block">Design Color Tokens</label>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(doc.tokens?.colors || {}).map(([key, val]) => (
                <div key={key} className="p-2 rounded-lg bg-[#181D1A] border border-white/10 flex items-center justify-between">
                  <span className="opacity-60 capitalize font-mono text-[10px]">{key}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: val }} />
                    <span className="font-mono text-[10.5px] opacity-80">{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Global Typography Tokens */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase opacity-60 block">Typography Tokens</label>
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-[#181D1A] border border-white/10 flex justify-between items-center text-[11px]">
                <span className="opacity-60">Display Font:</span>
                <span className="font-mono text-[10.5px] text-emerald-400 font-semibold">{doc.tokens?.fonts?.display || 'System Display'}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#181D1A] border border-white/10 flex justify-between items-center text-[11px]">
                <span className="opacity-60">Body Font:</span>
                <span className="font-mono text-[10.5px] text-emerald-400 font-semibold">{doc.tokens?.fonts?.body || 'System Sans'}</span>
              </div>
            </div>
          </div>

          {/* 5. Document Structure Summary */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[11px] font-semibold uppercase opacity-60 block">Document Summary</span>
            <div className="p-2.5 rounded-lg bg-[#181D1A] border border-white/10 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="opacity-60">Total Elements:</span>
                <span className="font-mono font-bold text-white">{Object.keys(doc.nodes).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Root Element:</span>
                <span className="font-mono text-emerald-400">{doc.root}</span>
              </div>
            </div>
            {doc.root && (
              <button
                type="button"
                onClick={() => onSelectNode?.(doc.root)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-semibold text-[11.5px] text-center transition-colors cursor-pointer"
              >
                Select Root Section &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const resolved = resolveStyle(node, bp);

  // Check which properties are overridden on tablet/desktop
  const isKeyOverridden = (key: keyof Style) => isOverridden(node, bp, key);

  // Helper to render override dot
  const renderOverrideDot = (key: keyof Style) => {
    if (!isKeyOverridden(key)) return null;
    return (
      <button
        type="button"
        onClick={() => onResetOverride(node.id, bp, key)}
        className="w-2 h-2 rounded-full bg-blue-400 hover:ring-2 hover:ring-blue-300 ml-1 cursor-pointer"
        title="Overridden on this breakpoint. Click to reset to inherited"
      />
    );
  };

  const bpColors = {
    mobile: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    tablet: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    desktop: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  };

  return (
    <div className="w-[280px] h-full bg-[#11140F] border-l border-white/10 flex flex-col text-white text-[12px] select-none flex-shrink-0">
      {/* Header: Node Title & Active Breakpoint Badge */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#151916]">
        <div className="truncate pr-2">
          <span className="font-bold text-[13px] text-white/90 truncate block capitalize">
            {node.name || node.type}
          </span>
          <span className="text-[10px] font-mono opacity-50 uppercase">{node.type}</span>
        </div>

        {/* Breakpoint Badge with Active Indicator */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold uppercase border ${bpColors[bp]}`}
        >
          {bp}
        </span>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-white/10 bg-[#121613] p-1 gap-0.5">
        {[
          { key: 'content', label: 'Content' },
          { key: 'layout', label: 'Layout' },
          { key: 'style', label: 'Style' },
          { key: 'responsive', label: 'Resp.' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onSelectTab(key as any)}
            className={`flex-1 py-1 px-1 rounded text-center font-semibold text-[11px] transition-colors cursor-pointer ${
              activeTab === key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* TAB 1: CONTENT */}
        {activeTab === 'content' && (
          <div className="space-y-3">
            {/* Button Content */}
            {node.type === 'button' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Button Label</label>
                  <SmoothInput
                    key={`${node.id}_btn_label`}
                    type="text"
                    value={(node.props.label as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { label: val })}
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                {/* Variant Selector */}
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Variant</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['primary', 'secondary', 'ghost'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onUpdateProps(node.id, { variant: v })}
                        className={`py-1 rounded text-center font-semibold capitalize text-[11px] border ${
                          node.props.variant === v
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-white/10 bg-[#181D1A] text-white/70 hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Link Binding */}
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Link Target</label>
                  <div className="grid grid-cols-2 gap-1 mb-2 bg-[#181D1A] p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => onUpdateProps(node.id, { bind: 'destination' })}
                      className={`py-1 rounded text-[10.5px] font-medium transition-colors ${
                        node.props.bind === 'destination'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Locked QR Dest
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (node.props.bind === 'destination') {
                          onUpdateProps(node.id, { bind: 'https://' });
                        }
                      }}
                      className={`py-1 rounded text-[10.5px] font-medium transition-colors ${
                        node.props.bind !== 'destination'
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Custom URL
                    </button>
                  </div>

                  {node.props.bind === 'destination' ? (
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11.5px]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked Destination URL:</span>
                      </div>
                      <p className="font-mono text-[11px] text-white/70 truncate">{doc.destination?.url}</p>
                    </div>
                  ) : (
                    <div>
                      <SmoothInput
                        key={`${node.id}_btn_bind`}
                        type="text"
                        value={(node.props.bind as string) || ''}
                        onChangeValue={(val) => onUpdateProps(node.id, { bind: val })}
                        placeholder="https://..."
                        className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LinkRow Content (Full operability) */}
            {node.type === 'linkRow' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Title / Label</label>
                  <SmoothInput
                    key={`${node.id}_link_label`}
                    type="text"
                    value={(node.props.label as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { label: val })}
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Subtitle (Optional)</label>
                  <SmoothInput
                    key={`${node.id}_link_subtitle`}
                    type="text"
                    value={(node.props.subtitle as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { subtitle: val })}
                    placeholder="e.g. Portfolio, blog, or booking"
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-[11.5px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Target URL</label>
                  <SmoothInput
                    key={`${node.id}_link_href`}
                    type="text"
                    value={(node.props.href as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { href: val })}
                    placeholder="https://example.com"
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11.5px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Icon Name (Optional)</label>
                  <SmoothInput
                    key={`${node.id}_link_icon`}
                    type="text"
                    value={(node.props.icon as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { icon: val })}
                    placeholder="e.g. arrow, globe, mail, phone"
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-[11.5px]"
                  />
                </div>
              </div>
            )}

            {/* Heading Content */}
            {node.type === 'heading' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Heading Text</label>
                  <SmoothTextarea
                    key={`${node.id}_heading_text`}
                    rows={2}
                    value={(node.props.text as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { text: val })}
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Heading Level</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => onUpdateProps(node.id, { level: lvl })}
                        className={`py-1 rounded text-center font-bold text-[11px] border ${
                          node.props.level === lvl
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-white/10 bg-[#181D1A] text-white/70 hover:text-white'
                        }`}
                      >
                        H{lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Text & Badge Content */}
            {(node.type === 'text' || node.type === 'badge') && (
              <div>
                <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Text Content</label>
                <SmoothTextarea
                  key={`${node.id}_text_content`}
                  rows={3}
                  value={(node.props.text as string) || ''}
                  onChangeValue={(val) => onUpdateProps(node.id, { text: val })}
                  className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-[12px]"
                />
              </div>
            )}

            {/* Image Content */}
            {node.type === 'image' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Alt Description</label>
                  <SmoothInput
                    key={`${node.id}_img_alt`}
                    type="text"
                    value={(node.props.alt as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { alt: val })}
                    placeholder="Describe image for accessibility"
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Image Fit</label>
                  <div className="grid grid-cols-2 gap-1">
                    {(['cover', 'contain'] as const).map((fit) => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => onUpdateProps(node.id, { fit })}
                        className={`py-1 rounded text-center font-semibold capitalize text-[11px] border ${
                          node.props.fit === fit
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-white/10 bg-[#181D1A] text-white/70 hover:text-white'
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Image URL (Fallback)</label>
                  <SmoothInput
                    key={`${node.id}_img_url`}
                    type="text"
                    value={(node.props.urlFallback as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { urlFallback: val })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* Price Item Content */}
            {node.type === 'priceItem' && (
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Item Name</label>
                  <SmoothInput
                    key={`${node.id}_price_name`}
                    type="text"
                    value={(node.props.name as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { name: val })}
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Price</label>
                  <SmoothInput
                    key={`${node.id}_price_val`}
                    type="text"
                    value={(node.props.price as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { price: val })}
                    placeholder="e.g. ₦3,500"
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Description</label>
                  <SmoothInput
                    key={`${node.id}_price_desc`}
                    type="text"
                    value={(node.props.desc as string) || ''}
                    onChangeValue={(val) => onUpdateProps(node.id, { desc: val })}
                    className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            )}

            {/* Container Info & Quick Child Selector */}
            {['section', 'card', 'stack', 'grid', 'free'].includes(node.type) && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="text-[11px] font-semibold text-white/90 capitalize flex items-center justify-between">
                    <span>{node.type} Container</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {node.children.length} {node.children.length === 1 ? 'element' : 'elements'}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Click any element on canvas to edit its content, or choose below:
                  </p>
                </div>

                {node.children.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase opacity-60 block">Child Elements</label>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {node.children.map((childId) => {
                        const child = doc.nodes[childId];
                        if (!child) return null;
                        return (
                          <button
                            key={childId}
                            type="button"
                            onClick={() => onSelectNode?.(childId)}
                            className="w-full text-left px-2 py-1.5 rounded bg-[#181D1A] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 flex items-center justify-between group transition-colors cursor-pointer"
                          >
                            <span className="text-[11.5px] truncate text-white/80 group-hover:text-emerald-400 font-medium">
                              {child.name || child.type}
                            </span>
                            <span className="text-[9.5px] font-mono opacity-40 uppercase ml-2 flex-shrink-0">
                              {child.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LAYOUT */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            {/* 1. WIDTH CONTROLS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase opacity-60">Width</label>
                {renderOverrideDot('width')}
              </div>
              {(() => {
                const widthVal = resolved.width;
                const isHug = widthVal === 'hug';
                const isFixed = typeof widthVal === 'object' && widthVal.u === 'px';
                const isFill = !isHug && !isFixed;
                const fixedPx = isFixed ? (widthVal as any).v : 240;

                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-1 bg-[#181D1A] p-1 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => onUpdateStyle(node.id, bp, { width: 'fill' })}
                        className={`py-1 rounded text-[11px] font-medium transition-colors ${
                          isFill ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStyle(node.id, bp, { width: 'hug' })}
                        className={`py-1 rounded text-[11px] font-medium transition-colors ${
                          isHug ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Hug
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStyle(node.id, bp, { width: { u: 'px', v: fixedPx } })}
                        className={`py-1 rounded text-[11px] font-medium transition-colors ${
                          isFixed ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Fixed (px)
                      </button>
                    </div>

                    {isFixed && (
                      <div className="p-2 rounded-lg bg-[#181D1A] border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/50">Width (px)</span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">{fixedPx}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={1200}
                          step={10}
                          value={fixedPx}
                          onChange={(e) => onUpdateStyle(node.id, bp, { width: { u: 'px', v: Number(e.target.value) } })}
                          className="w-full accent-emerald-500"
                        />
                        <SmoothInput
                          type="number"
                          min={20}
                          max={2000}
                          value={fixedPx.toString()}
                          onChangeValue={(val) => {
                            const n = parseInt(val, 10);
                            if (!isNaN(n) && n >= 20) {
                              onUpdateStyle(node.id, bp, { width: { u: 'px', v: n } });
                            }
                          }}
                          className="w-full bg-[#121613] border border-white/10 rounded px-2 py-1 text-white text-[11px] font-mono"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 2. HEIGHT CONTROLS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase opacity-60">Height</label>
                {renderOverrideDot('height')}
              </div>
              {(() => {
                const heightVal = resolved.height;
                const isFixed = typeof heightVal === 'object' && heightVal.u === 'px';
                const isAuto = !isFixed;
                const fixedPx = isFixed ? (heightVal as any).v : 120;

                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1 bg-[#181D1A] p-1 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => onUpdateStyle(node.id, bp, { height: 'hug' })}
                        className={`py-1 rounded text-[11px] font-medium transition-colors ${
                          isAuto ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Auto / Hug
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStyle(node.id, bp, { height: { u: 'px', v: fixedPx } })}
                        className={`py-1 rounded text-[11px] font-medium transition-colors ${
                          isFixed ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Fixed (px)
                      </button>
                    </div>

                    {isFixed && (
                      <div className="p-2 rounded-lg bg-[#181D1A] border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/50">Height (px)</span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">{fixedPx}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={800}
                          step={10}
                          value={fixedPx}
                          onChange={(e) => onUpdateStyle(node.id, bp, { height: { u: 'px', v: Number(e.target.value) } })}
                          className="w-full accent-emerald-500"
                        />
                        <SmoothInput
                          type="number"
                          min={20}
                          max={2000}
                          value={fixedPx.toString()}
                          onChangeValue={(val) => {
                            const n = parseInt(val, 10);
                            if (!isNaN(n) && n >= 20) {
                              onUpdateStyle(node.id, bp, { height: { u: 'px', v: n } });
                            }
                          }}
                          className="w-full bg-[#121613] border border-white/10 rounded px-2 py-1 text-white text-[11px] font-mono"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 3. POSITIONING MODE (In-Flow vs Free Drag) */}
            {node.type !== 'section' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase opacity-60">Positioning</label>
                  {renderOverrideDot('position')}
                </div>
                {(() => {
                  const isFree = resolved.position === 'absolute' || resolved.x !== undefined || resolved.y !== undefined;
                  const currentX = resolved.x ?? 0;
                  const currentY = resolved.y ?? 0;

                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1 bg-[#181D1A] p-1 rounded-lg border border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStyle(node.id, bp, {
                              position: undefined,
                              x: undefined,
                              y: undefined,
                            });
                          }}
                          className={`py-1 rounded text-[11px] font-medium transition-colors ${
                            !isFree ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-white/60 hover:text-white'
                          }`}
                        >
                          In-Flow (Stack)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStyle(node.id, bp, {
                              position: 'absolute',
                              x: resolved.x ?? 20,
                              y: resolved.y ?? 20,
                            });
                          }}
                          className={`py-1 rounded text-[11px] font-medium transition-colors ${
                            isFree ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-white/60 hover:text-white'
                          }`}
                        >
                          Free (Drag)
                        </button>
                      </div>

                      {isFree && (
                        <div className="p-2.5 rounded-lg bg-[#181D1A] border border-white/10 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold opacity-60 block mb-0.5">X (Left px)</label>
                              <SmoothInput
                                type="number"
                                value={currentX.toString()}
                                onChangeValue={(val) => {
                                  const n = parseInt(val, 10);
                                  onUpdateStyle(node.id, bp, { x: isNaN(n) ? 0 : n, position: 'absolute' });
                                }}
                                className="w-full bg-[#121613] border border-white/10 rounded px-2 py-1 text-white text-[11px] font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold opacity-60 block mb-0.5">Y (Top px)</label>
                              <SmoothInput
                                type="number"
                                value={currentY.toString()}
                                onChangeValue={(val) => {
                                  const n = parseInt(val, 10);
                                  onUpdateStyle(node.id, bp, { y: isNaN(n) ? 0 : n, position: 'absolute' });
                                }}
                                className="w-full bg-[#121613] border border-white/10 rounded px-2 py-1 text-white text-[11px] font-mono"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] text-emerald-400/80 leading-tight">
                            ✨ Free mode active: Drag this element directly anywhere on the canvas.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4. CONTAINER SETTINGS (Direction, Gap, Columns) */}
            {['section', 'card', 'stack', 'grid', 'free'].includes(node.type) && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                {/* Direction */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold uppercase opacity-60">Flex Direction</label>
                    {renderOverrideDot('direction')}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['column', 'row'] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => onUpdateStyle(node.id, bp, { direction: dir })}
                        className={`py-1.5 px-2 rounded-lg border text-center font-semibold capitalize text-[11px] ${
                          resolved.direction === dir
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-white/10 bg-[#181D1A] text-white/60 hover:text-white'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold uppercase opacity-60">Gap ({resolved.gap ?? 16}px)</label>
                    {renderOverrideDot('gap')}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={64}
                    step={4}
                    value={resolved.gap ?? 16}
                    onChange={(e) => onUpdateStyle(node.id, bp, { gap: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Grid Columns */}
                {node.type === 'grid' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold uppercase opacity-60">Grid Columns</label>
                      {renderOverrideDot('columns')}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => onUpdateStyle(node.id, bp, { columns: cols })}
                          className={`py-1.5 rounded-lg border font-bold text-[11px] ${
                            resolved.columns === cols
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                              : 'border-white/10 bg-[#181D1A] text-white/60 hover:text-white'
                          }`}
                        >
                          {cols} col
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STYLE (Full Typography & Visual Styling Operability) */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Section A: Typography */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>Typography</span>
              </span>

              {/* Font Family */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">Font Family</label>
                  {renderOverrideDot('fontFamily')}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { key: 'body', label: 'Sans' },
                    { key: 'display', label: 'Display' },
                    { key: 'mono', label: 'Mono' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onUpdateStyle(node.id, bp, { fontFamily: key as any })}
                      className={`py-1.5 rounded border text-center font-medium text-[11px] ${
                        resolved.fontFamily === key
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-semibold'
                          : 'border-white/10 bg-[#181D1A] text-white/70 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size (Range + Number Input) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">
                    Font Size ({resolved.fontSize ?? 16}px)
                  </label>
                  {renderOverrideDot('fontSize')}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={96}
                    step={1}
                    value={resolved.fontSize ?? 16}
                    onChange={(e) => onUpdateStyle(node.id, bp, { fontSize: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500"
                  />
                  <SmoothInput
                    type="number"
                    min={10}
                    max={120}
                    value={(resolved.fontSize ?? 16).toString()}
                    onChangeValue={(val) => {
                      const n = parseInt(val, 10);
                      if (!isNaN(n) && n >= 10 && n <= 120) {
                        onUpdateStyle(node.id, bp, { fontSize: n });
                      }
                    }}
                    className="w-14 bg-[#181D1A] border border-white/10 rounded px-1.5 py-0.5 text-center font-mono text-[11px] text-white"
                  />
                </div>
              </div>

              {/* Font Weight */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">Font Weight</label>
                  {renderOverrideDot('fontWeight')}
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { val: 400, label: 'Reg' },
                    { val: 500, label: 'Med' },
                    { val: 600, label: 'Semi' },
                    { val: 700, label: 'Bold' },
                    { val: 800, label: 'Black' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateStyle(node.id, bp, { fontWeight: val as any })}
                      className={`py-1 rounded border text-center text-[10px] ${
                        resolved.fontWeight === val
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'border-white/10 bg-[#181D1A] text-white/60 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Transform: None / UPPERCASE / Capitalize / lowercase */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">Case / Transform</label>
                  {renderOverrideDot('textTransform')}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { val: 'none', label: 'None' },
                    { val: 'uppercase', label: 'UPPER' },
                    { val: 'capitalize', label: 'Capital' },
                    { val: 'lowercase', label: 'lower' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateStyle(node.id, bp, { textTransform: val as any })}
                      className={`py-1 rounded border text-center text-[10px] ${
                        (resolved.textTransform || 'none') === val
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-semibold'
                          : 'border-white/10 bg-[#181D1A] text-white/60 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">Text Alignment</label>
                  {renderOverrideDot('textAlign')}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => onUpdateStyle(node.id, bp, { textAlign: align })}
                      className={`py-1.5 rounded border flex items-center justify-center ${
                        resolved.textAlign === align
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-white/10 bg-[#181D1A] text-white/60 hover:text-white'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                      {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Height & Letter Spacing */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-semibold opacity-60 block mb-0.5">
                    Line Height ({resolved.lineHeight ?? 1.4})
                  </label>
                  <input
                    type="range"
                    min={0.9}
                    max={2.2}
                    step={0.1}
                    value={resolved.lineHeight ?? 1.4}
                    onChange={(e) => onUpdateStyle(node.id, bp, { lineHeight: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold opacity-60 block mb-0.5">
                    Letter Spacing ({resolved.letterSpacing ?? 0}em)
                  </label>
                  <input
                    type="range"
                    min={-0.02}
                    max={0.2}
                    step={0.01}
                    value={resolved.letterSpacing ?? 0}
                    onChange={(e) => onUpdateStyle(node.id, bp, { letterSpacing: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* Text Color Tokens */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">Text Color</label>
                  {renderOverrideDot('color')}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {['fg', 'muted', 'accent', 'bg', 'surface', 'border'].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => onUpdateStyle(node.id, bp, { color: token as any })}
                      className={`py-1 px-1.5 rounded border text-[10px] font-mono flex items-center justify-between ${
                        resolved.color === token
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'border-white/10 bg-[#181D1A] text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="capitalize">{token}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20"
                        style={{ backgroundColor: `var(--c-${token})` }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section B: Appearance & Look */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Appearance</span>
              </span>

              {/* Background Color Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">Background</label>
                  {renderOverrideDot('bg')}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {['transparent', 'surface', 'bg', 'accent', 'muted'].map((bgToken) => (
                    <button
                      key={bgToken}
                      type="button"
                      onClick={() => onUpdateStyle(node.id, bp, { bg: bgToken === 'transparent' ? undefined : (bgToken as any) })}
                      className={`py-1 px-1.5 rounded border text-[10px] font-mono flex items-center justify-between ${
                        (resolved.bg || 'transparent') === bgToken
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'border-white/10 bg-[#181D1A] text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="capitalize">{bgToken}</span>
                      {bgToken !== 'transparent' && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: `var(--c-${bgToken})` }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">
                    Radius ({resolved.radius || 0}px)
                  </label>
                  {renderOverrideDot('radius')}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={48}
                    step={2}
                    value={resolved.radius ?? 12}
                    onChange={(e) => onUpdateStyle(node.id, bp, { radius: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateStyle(node.id, bp, { radius: 999 })}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      resolved.radius === 999
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'border-white/10 bg-[#181D1A] text-white/60 hover:text-white'
                    }`}
                  >
                    Pill
                  </button>
                </div>
              </div>

              {/* Shadow */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10.5px] font-semibold uppercase opacity-60">Shadow</label>
                  {renderOverrideDot('shadow')}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['none', 'sm', 'md', 'lg'] as const).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => onUpdateStyle(node.id, bp, { shadow: sh })}
                      className={`py-1 rounded border text-center uppercase text-[10px] ${
                        (resolved.shadow || 'none') === sh
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'border-white/10 bg-[#181D1A] text-white/60 hover:text-white'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RESPONSIVE */}
        {activeTab === 'responsive' && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
                Breakpoint Overrides Summary
              </span>
              <div className="p-3 rounded-xl bg-[#161B18] border border-white/10 space-y-2 text-[11.5px]">
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Tablet Overrides:</span>
                  <span className="font-mono text-blue-400 font-bold">
                    {Object.keys(node.style.tablet || {}).length} props
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-70">Desktop Overrides:</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {Object.keys(node.style.desktop || {}).length} props
                  </span>
                </div>
              </div>
            </div>

            {/* Copy Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onCopyStyles(node.id, 'mobile', 'tablet')}
                className="w-full py-2 px-3 rounded-lg border border-white/10 hover:border-blue-500 hover:bg-blue-500/10 text-white font-medium text-[11.5px] text-center transition-all cursor-pointer"
              >
                Copy Mobile Styles to Tablet
              </button>
              <button
                type="button"
                onClick={() => onCopyStyles(node.id, 'mobile', 'desktop')}
                className="w-full py-2 px-3 rounded-lg border border-white/10 hover:border-purple-500 hover:bg-purple-500/10 text-white font-medium text-[11.5px] text-center transition-all cursor-pointer"
              >
                Copy Mobile Styles to Desktop
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: AI ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Design Assistant</span>
              </span>
              <p className="text-[11.5px] text-white/50">
                Use natural language prompts to restyle, rewrite, or expand your mobile landing page.
              </p>
            </div>

            {/* Quick Inspiration Prompts */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-semibold uppercase opacity-60 block">Inspiration Chips</span>
              <div className="flex flex-col gap-1.5">
                {[
                  'Artisan Coffee & Bakery Menu',
                  'High-Converting SaaS Waitlist',
                  'Luxury Real Estate Showcase',
                  'Barbershop & Grooming Services',
                  'Dark Futuristic Creator Portfolio',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Ask AI"]') as HTMLInputElement;
                      if (input) {
                        input.value = preset;
                        input.focus();
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }}
                    className="p-2 rounded-lg border border-white/10 bg-[#161B18] hover:border-emerald-500 hover:bg-emerald-500/10 text-left text-[11.5px] text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>{preset}</span>
                    <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 font-semibold transition-opacity">Apply →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
