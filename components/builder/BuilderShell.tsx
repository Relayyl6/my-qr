'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Doc, Bp, NodeType } from '@/lib/builder/schema';
import { createBuilderStore } from '@/lib/builder/store';
import { CanvasFrame } from './CanvasFrame';
import { CanvasOverlay } from './CanvasOverlay';
import { LeftPanel } from './LeftPanel';
import { RightInspector } from './RightInspector';
import {
  Smartphone,
  Tablet,
  Monitor,
  Undo2,
  Redo2,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

interface BuilderShellProps {
  initialDoc: Doc;
  pageId: string;
  onSave?: (doc: Doc) => Promise<void>;
}

export function BuilderShell({ initialDoc, pageId, onSave }: BuilderShellProps) {
  // Initialize zustand store
  const useStore = React.useMemo(() => createBuilderStore(initialDoc), [initialDoc]);

  const doc = useStore((s) => s.doc);
  const ui = useStore((s) => s.ui);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());

  const {
    undo,
    redo,
    setBreakpoint,
    setFrameWidth,
    toggleRotateTablet,
    setZoom,
    selectNode,
    clearSelection,
    setHoverId,
    setMode,
    setLeftPanel,
    setRightPanel,
    updateNodeProps,
    updateNodeStyle,
    resetNodeOverride,
    copyStylesToBreakpoint,
    renameNode,
    toggleLockNode,
    toggleHiddenNode,
    reorderNode,
    deleteNode,
    exec,
  } = useStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'content' | 'layout' | 'style' | 'responsive' | 'ai'>('content');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Trackpad pinch-to-zoom & Ctrl+mousewheel non-passive listener
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const currentZoom = useStore.getState().ui.zoom;
        const newZoom = Math.min(2.5, Math.max(0.3, +(currentZoom - e.deltaY * 0.005).toFixed(2)));
        setZoom(newZoom);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [setZoom, useStore]);

  const handleCommitResize = React.useCallback(
    (nodeId: string, dims: { width?: number; height?: number }) => {
      exec({
        label: `Resize element`,
        run: (draft) => {
          const target = draft.nodes[nodeId];
          if (!target) return;
          const targetStyle = ui.bp === 'mobile' ? target.style.mobile : (target.style[ui.bp] ||= {});
          if (dims.width !== undefined) {
            targetStyle.width = { u: 'px', v: dims.width };
          }
          if (dims.height !== undefined) {
            targetStyle.height = { u: 'px', v: dims.height };
          }
        },
      });
    },
    [exec, ui.bp]
  );

  const handleResetDimensionToHug = React.useCallback(
    (nodeId: string, dims: { width?: boolean; height?: boolean }) => {
      exec({
        label: `Reset dimension to hug`,
        run: (draft) => {
          const target = draft.nodes[nodeId];
          if (!target) return;
          const targetStyle = ui.bp === 'mobile' ? target.style.mobile : (target.style[ui.bp] ||= {});
          if (dims.width) targetStyle.width = 'hug';
          if (dims.height) targetStyle.height = 'hug';
        },
      });
    },
    [exec, ui.bp]
  );

  const handleMoveFreeNode = React.useCallback(
    (id: string, x: number, y: number) => {
      exec({
        label: `Move element`,
        run: (draft) => {
          const target = draft.nodes[id];
          if (!target) return;
          const targetStyle = ui.bp === 'mobile' ? target.style.mobile : (target.style[ui.bp] ||= {});
          targetStyle.position = 'absolute';
          targetStyle.x = Math.round(x);
          targetStyle.y = Math.round(y);
        },
      });
    },
    [exec, ui.bp]
  );

  // Keyboard shortcuts (1, 2, 3, Ctrl+Z, Undo, Redo, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setBreakpoint('mobile');
      } else if (e.key === '2') {
        e.preventDefault();
        setBreakpoint('tablet');
      } else if (e.key === '3') {
        e.preventDefault();
        setBreakpoint('desktop');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && ui.selection.length > 0) {
        e.preventDefault();
        ui.selection.forEach(deleteNode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, deleteNode, redo, setBreakpoint, ui.selection, undo]);

  const handleAddNode = (type: NodeType) => {
    let createdId: string | null = null;
    exec({
      label: `Add ${type} node`,
      run: (draft) => {
        const newId = `${type.slice(0, 3)}_${Math.random().toString(36).substring(2, 8)}`;
        createdId = newId;

        const defaultPropsMap: Partial<Record<NodeType, Record<string, unknown>>> = {
          heading: { text: 'New Heading', level: 2 },
          text: { text: 'New text block for your page description.' },
          button: { label: 'Click Here', variant: 'primary', bind: 'destination' },
          badge: { text: 'Featured' },
          linkRow: { label: 'New Link', href: 'https://' },
          priceItem: { name: 'Item Name', price: '₦5,000', desc: 'Item description' },
        };
        const defaultProps: Record<string, unknown> = defaultPropsMap[type] || {};

        const newNode = {
          id: newId,
          type,
          name: `New ${type}`,
          parent: '',
          children: [] as string[],
          style: {
            mobile: {
              width: 'fill' as const,
              padding: [8, 8, 8, 8] as [number, number, number, number],
            },
          },
          props: defaultProps,
        };

        const containerTypes = ['section', 'stack', 'grid', 'card', 'free'];
        const selectedId = ui.selection[0];
        const selectedNode = selectedId ? draft.nodes[selectedId] : null;

        let targetParentId = draft.root;
        let insertIndex = -1; // -1 means append

        if (type === 'section') {
          // Sections can ONLY go into root
          targetParentId = draft.root;
          if (selectedNode && selectedNode.type === 'section') {
            const rootChildren = draft.nodes[draft.root]?.children || [];
            const idx = rootChildren.indexOf(selectedId);
            insertIndex = idx !== -1 ? idx + 1 : -1;
          }
        } else if (selectedNode) {
          if (containerTypes.includes(selectedNode.type)) {
            // Selected element is a container: add inside it
            targetParentId = selectedId;
            insertIndex = -1;
          } else {
            // Selected element is a leaf node: insert immediately after it inside parent
            const parentId = selectedNode.parent || draft.root;
            const parentNode = draft.nodes[parentId];
            if (parentNode) {
              targetParentId = parentId;
              const idx = parentNode.children.indexOf(selectedId);
              insertIndex = idx !== -1 ? idx + 1 : -1;
            }
          }
        } else {
          // Nothing selected: append into primary section or stack
          const rootNode = draft.nodes[draft.root];
          const firstSectionId = rootNode?.children.find((cid) => draft.nodes[cid]?.type === 'section');
          if (firstSectionId) {
            const sectionNode = draft.nodes[firstSectionId];
            const firstStackId = sectionNode?.children.find((cid) => draft.nodes[cid]?.type === 'stack');
            if (firstStackId) {
              targetParentId = firstStackId;
            } else {
              targetParentId = firstSectionId;
            }
          } else {
            targetParentId = draft.root;
          }
        }

        const parentNode = draft.nodes[targetParentId];
        if (parentNode) {
          newNode.parent = targetParentId;
          draft.nodes[newId] = newNode;
          if (insertIndex >= 0 && insertIndex <= parentNode.children.length) {
            parentNode.children.splice(insertIndex, 0, newId);
          } else {
            parentNode.children.push(newId);
          }
        }
      },
    });

    if (createdId) {
      selectNode(createdId);
    }
  };

  const handleSavePublish = async () => {
    setIsPublishing(true);
    setSaveBanner(null);
    try {
      if (onSave) {
        await onSave(doc);
      }
      setSaveBanner('Page published successfully!');
    } catch (err: any) {
      setSaveBanner(err.message || 'Failed to publish.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0E110F] text-white overflow-hidden select-none">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-14 bg-[#141815] border-b border-white/10 px-4 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Brand & Return */}
        <div className="flex items-center gap-3">
          <Link
            href="/#workspace"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[14.5px] text-emerald-400">DynamicQR Visual Builder</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
              Framer Engine v3
            </span>
          </div>
        </div>

        {/* Center: Breakpoint Switcher & Frame Controls */}
        <div className="flex items-center gap-3">
          {/* Breakpoint Switcher Buttons */}
          <div className="flex items-center bg-[#1D221F] border border-white/10 rounded-xl p-1 gap-1 shadow-inner">
            {[
              { bp: 'mobile', label: 'Mobile', width: 390, icon: Smartphone, hotkey: '1' },
              { bp: 'tablet', label: 'Tablet', width: 820, icon: Tablet, hotkey: '2' },
              { bp: 'desktop', label: 'Desktop', width: 1280, icon: Monitor, hotkey: '3' },
            ].map(({ bp, label, width, icon: Icon, hotkey }) => (
              <button
                key={bp}
                onClick={() => setBreakpoint(bp as Bp)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                  ui.bp === bp
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title={`Switch to ${label} (${width}px) — Key ${hotkey}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                <span className="text-[10px] opacity-40 font-mono">[{hotkey}]</span>
              </button>
            ))}
          </div>

          {/* Width Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-white/70">
            {ui.frameWidth}px
          </span>

          {/* Tablet Rotation Indicator */}
          {ui.bp === 'tablet' && (
            <button
              onClick={toggleRotateTablet}
              className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Rotate tablet orientation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{ui.isRotated ? '1180px: desktop styles apply' : 'Rotate to 1180px'}</span>
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-[#1D221F] border border-white/10 rounded-xl p-1 gap-1 text-[11px] font-mono">
            <button
              onClick={() => setZoom(ui.zoom - 0.1)}
              className="p-1 hover:bg-white/10 rounded cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5">{Math.round(ui.zoom * 100)}%</span>
            <button
              onClick={() => setZoom(ui.zoom + 0.1)}
              className="p-1 hover:bg-white/10 rounded cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-1.5 py-0.5 hover:bg-white/10 rounded font-semibold text-[10px] cursor-pointer"
            >
              Fit
            </button>
          </div>
        </div>

        {/* Right: Undo/Redo, Mode & Save/Publish */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-[#1D221F] border border-white/10 rounded-xl p-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 hover:bg-white/10 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preview Mode Toggle */}
          <button
            onClick={() => setMode(ui.mode === 'edit' ? 'preview' : 'edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-colors cursor-pointer ${
              ui.mode === 'preview'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'border-white/10 bg-[#1D221F] text-white/70 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{ui.mode === 'preview' ? 'Editing' : 'Preview'}</span>
          </button>

          {/* Save & Publish Button */}
          <button
            onClick={handleSavePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[12.5px] transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isPublishing ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </header>

      {/* Save Status Banner */}
      {saveBanner && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 text-[12px] font-semibold text-center z-40">
          {saveBanner}
        </div>
      )}

      {/* 2. THREE-PANE MAIN STUDIO BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Layers / Add / Assets */}
        <LeftPanel
          doc={doc}
          bp={ui.bp}
          selection={ui.selection}
          activePanel={ui.panels.left}
          onSelectPanel={setLeftPanel}
          onSelectNode={selectNode}
          onRenameNode={renameNode}
          onToggleLock={toggleLockNode}
          onToggleHidden={toggleHiddenNode}
          onDeleteNode={deleteNode}
          onAddNode={handleAddNode}
        />

        {/* Center Canvas Workspace */}
        <div
          ref={workspaceRef}
          className="flex-1 bg-[#171B18] overflow-auto relative flex flex-col items-center justify-start py-10 px-6"
        >
          <div className="relative">
            <CanvasFrame
              doc={doc}
              bp={ui.bp}
              frameWidth={ui.frameWidth}
              zoom={ui.zoom}
              isRotated={ui.isRotated}
              mode={ui.mode}
              onWidthChange={setFrameWidth}
              onRotateTablet={toggleRotateTablet}
              iframeRef={iframeRef}
            >
              {/* Selection and interaction overlay anchored directly over the iframe inside the device frame */}
              <CanvasOverlay
                doc={doc}
                bp={ui.bp}
                selection={ui.selection}
                hoverId={ui.hoverId}
                zoom={ui.zoom}
                mode={ui.mode}
                iframeRef={iframeRef}
                onSelectNode={selectNode}
                onHoverNode={setHoverId}
                onCommitResize={handleCommitResize}
                onResetDimensionToHug={handleResetDimensionToHug}
                onReorderNode={reorderNode}
                onMoveFreeNode={handleMoveFreeNode}
              />
            </CanvasFrame>
          </div>

          {/* Floating AI Command Bar (Always visible at bottom of Canvas) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 pointer-events-auto">
            <div className="bg-[#11140F]/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 ml-2 flex-shrink-0 animate-pulse" />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI to change layout, make responsive, or write copy... (Ctrl+K)"
                className="flex-1 bg-transparent border-0 text-[12.5px] text-white placeholder:text-white/40 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (aiPrompt.trim()) {
                    setRightPanel('ai');
                    setActiveInspectorTab('ai');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11.5px] transition-colors cursor-pointer"
              >
                Prompt
              </button>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel */}
        <RightInspector
          doc={doc}
          selectedId={ui.selection[0]}
          bp={ui.bp}
          activeTab={activeInspectorTab}
          onSelectTab={setActiveInspectorTab}
          onUpdateProps={updateNodeProps}
          onUpdateStyle={updateNodeStyle}
          onResetOverride={resetNodeOverride}
          onCopyStyles={copyStylesToBreakpoint}
          onSelectNode={selectNode}
        />
      </div>
    </div>
  );
}
