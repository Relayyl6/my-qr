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
}: RightInspectorProps) {
  const node = selectedId ? doc.nodes[selectedId] : null;

  if (!node) {
    return (
      <div className="w-[280px] h-full bg-[#11140F] border-l border-white/10 flex flex-col items-center justify-center p-6 text-center text-white/40 text-xs select-none flex-shrink-0">
        <Sliders className="w-8 h-8 opacity-30 mb-2" />
        <p className="font-medium">No Element Selected</p>
        <p className="text-[11px] opacity-70 mt-1">Select an element on canvas or layers to inspect and edit its properties.</p>
      </div>
    );
  }

  const resolved = resolveStyle(node, bp);
  const activeStyle = bp === 'mobile' ? node.style.mobile : node.style[bp] || {};

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

                {node.props.bind === 'destination' ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11.5px]">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked Destination URL:</span>
                    </div>
                    <p className="font-mono text-[11px] text-white/70 truncate">{doc.destination.url}</p>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold uppercase opacity-60 mb-1 block">Link URL</label>
                    <SmoothInput
                      key={`${node.id}_btn_bind`}
                      type="text"
                      value={(node.props.bind as string) || ''}
                      onChangeValue={(val) => onUpdateProps(node.id, { bind: val })}
                      placeholder="https://..."
                      className="w-full bg-[#181D1A] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                )}
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
          <div className="space-y-3">
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
                <label className="text-[11px] font-semibold uppercase opacity-60">Gap ({resolved.gap || 0}px)</label>
                {renderOverrideDot('gap')}
              </div>
              <input
                type="range"
                min={0}
                max={48}
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

        {/* TAB 3: STYLE */}
        {activeTab === 'style' && (
          <div className="space-y-3">
            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase opacity-60">Font Size ({resolved.fontSize || 16}px)</label>
                {renderOverrideDot('fontSize')}
              </div>
              <input
                type="range"
                min={12}
                max={64}
                step={2}
                value={resolved.fontSize ?? 16}
                onChange={(e) => onUpdateStyle(node.id, bp, { fontSize: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Text Align */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase opacity-60">Text Alignment</label>
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

            {/* Border Radius */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase opacity-60">Radius ({resolved.radius || 0}px)</label>
                {renderOverrideDot('radius')}
              </div>
              <input
                type="range"
                min={0}
                max={32}
                step={2}
                value={resolved.radius ?? 12}
                onChange={(e) => onUpdateStyle(node.id, bp, { radius: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
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
      </div>
    </div>
  );
}
