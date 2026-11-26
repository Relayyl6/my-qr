'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Doc, Node } from '@/lib/builder/schema';

interface CanvasOverlayProps {
  doc: Doc;
  selection: string[];
  hoverId?: string;
  zoom: number;
  mode: 'edit' | 'preview';
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onSelectNode: (id: string, multi?: boolean) => void;
  onHoverNode: (id?: string) => void;
}

interface NodeRect {
  id: string;
  type: string;
  name?: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export function CanvasOverlay({
  doc,
  selection,
  hoverId,
  zoom,
  mode,
  iframeRef,
  onSelectNode,
  onHoverNode,
}: CanvasOverlayProps) {
  const [rects, setRects] = useState<Record<string, NodeRect>>({});

  // Scan iframe DOM for node rects
  const updateRects = useCallback(() => {
    if (mode === 'preview') return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;
    const elements = iframeDoc.querySelectorAll<HTMLElement>('[class*="n_"], [data-node-id], section, main, h1, h2, h3, p, a, div, img, button, footer');
    const newRects: Record<string, NodeRect> = {};

    elements.forEach((el) => {
      // Find matching node ID from className n_<id>
      const match = el.className.match(/\bn_([a-z0-9_-]+)\b/);
      const nodeId = match ? match[1] : el.getAttribute('data-node-id');
      if (!nodeId || !doc.nodes[nodeId]) return;

      const r = el.getBoundingClientRect();
      const node = doc.nodes[nodeId];

      newRects[nodeId] = {
        id: nodeId,
        type: node.type,
        name: node.name,
        top: r.top * zoom,
        left: r.left * zoom,
        width: r.width * zoom,
        height: r.height * zoom,
      };
    });

    setRects(newRects);
  }, [doc.nodes, iframeRef, mode, zoom]);

  // Keep rects synchronized with layout changes and scroll
  useEffect(() => {
    updateRects();
    const interval = setInterval(updateRects, 200);

    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.addEventListener('scroll', updateRects, { passive: true });
      iframe.contentWindow.addEventListener('resize', updateRects, { passive: true });
    }

    return () => {
      clearInterval(interval);
      if (iframe?.contentWindow) {
        iframe.contentWindow.removeEventListener('scroll', updateRects);
        iframe.contentWindow.removeEventListener('resize', updateRects);
      }
    };
  }, [updateRects, iframeRef]);

  // Hit-testing using elementsFromPoint in iframe
  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === 'preview') return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeRect = iframe.getBoundingClientRect();
    const relX = (e.clientX - iframeRect.left) / zoom;
    const relY = (e.clientY - iframeRect.top) / zoom;

    const elements = iframe.contentDocument.elementsFromPoint(relX, relY);
    for (const el of elements) {
      const match = el.className?.match?.(/\bn_([a-z0-9_-]+)\b/);
      if (match && doc.nodes[match[1]]) {
        onHoverNode(match[1]);
        return;
      }
    }
    onHoverNode(undefined);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === 'preview') return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeRect = iframe.getBoundingClientRect();
    const relX = (e.clientX - iframeRect.left) / zoom;
    const relY = (e.clientY - iframeRect.top) / zoom;

    const elements = iframe.contentDocument.elementsFromPoint(relX, relY);
    for (const el of elements) {
      const match = el.className?.match?.(/\bn_([a-z0-9_-]+)\b/);
      if (match && doc.nodes[match[1]]) {
        onSelectNode(match[1], e.shiftKey);
        return;
      }
    }
  };

  if (mode === 'preview') return null;

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      className="absolute inset-0 pointer-events-auto z-20 overflow-hidden select-none"
    >
      {/* Hover Box Outline */}
      {hoverId && rects[hoverId] && !selection.includes(hoverId) && (
        <div
          className="absolute border border-blue-400/80 bg-blue-500/5 pointer-events-none transition-all duration-75 rounded-xs"
          style={{
            top: `${rects[hoverId].top}px`,
            left: `${rects[hoverId].left}px`,
            width: `${rects[hoverId].width}px`,
            height: `${rects[hoverId].height}px`,
          }}
        >
          <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono leading-none flex items-center gap-1 shadow-xs">
            <span>{rects[hoverId].type}</span>
          </div>
        </div>
      )}

      {/* Selected Node Boxes & Label Chips */}
      {selection.map((id) => {
        const r = rects[id];
        if (!r) return null;
        return (
          <div
            key={id}
            className="absolute border-2 border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5 pointer-events-none transition-all duration-75 rounded-xs"
            style={{
              top: `${r.top}px`,
              left: `${r.left}px`,
              width: `${r.width}px`,
              height: `${r.height}px`,
            }}
          >
            {/* Selection Label Chip */}
            <div className="absolute -top-6 left-0 px-2 py-0.5 rounded-t-md bg-emerald-600 text-white text-[10px] font-semibold font-mono leading-tight flex items-center gap-1.5 shadow-sm">
              <span className="capitalize">{r.type}</span>
              {r.name && <span className="opacity-75 font-normal">({r.name})</span>}
            </div>

            {/* Corner Resize Points (Visual Indicators for Phase 2) */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-emerald-600 rounded-full" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-emerald-600 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-emerald-600 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-emerald-600 rounded-full" />
          </div>
        );
      })}
    </div>
  );
}
