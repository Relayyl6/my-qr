'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Doc, Bp, BREAKPOINTS } from '@/lib/builder/schema';
import { compileDocumentCss } from '@/lib/builder/compile-css';
import { RenderDoc } from '@/lib/builder/render';
import { Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';

interface CanvasFrameProps {
  doc: Doc;
  bp: Bp;
  frameWidth: number;
  zoom: number;
  isRotated: boolean;
  mode: 'edit' | 'preview';
  onWidthChange: (w: number) => void;
  onRotateTablet: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  children?: React.ReactNode;
}

export function CanvasFrame({
  doc,
  bp,
  frameWidth,
  zoom,
  isRotated,
  mode,
  onWidthChange,
  onRotateTablet,
  iframeRef,
  children,
}: CanvasFrameProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const isDraggingHandle = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const compiledCss = React.useMemo(() => compileDocumentCss(doc), [doc]);

  // Set up iframe document when iframe mounts
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      // Ensure base HTML layout
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style id="builder-styles"></style>
            <style>
              *, *::before, *::after { box-sizing: border-box; }
              html {
                color-scheme: dark light;
                scrollbar-color: rgba(255, 255, 255, 0.25) rgba(0, 0, 0, 0.2);
                scrollbar-width: thin;
              }
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              ::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
              }
              ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.25);
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.45);
              }
              body { margin: 0; padding: 0; overflow-x: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: ${doc.tokens?.colors?.bg || '#ffffff'}; }
              [data-node-id] { cursor: pointer; }
              .flex { display: flex; }
              .flex-col { flex-direction: column; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .justify-start { justify-content: flex-start; }
              .gap-2 { gap: 8px; }
              .w-full { width: 100%; }
              .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .whitespace-nowrap { white-space: nowrap; }
            </style>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `);
      iframeDoc.close();

      const root = iframeDoc.getElementById('root');
      setMountNode(root);
      setIframeLoaded(true);
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
    } else {
      iframe.addEventListener('load', handleLoad);
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [iframeRef]);

  // Inject / update CSS in iframe head
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    const styleTag = iframe.contentDocument.getElementById('builder-styles');
    if (styleTag) {
      styleTag.textContent = compiledCss;
    }
  }, [compiledCss, iframeLoaded, iframeRef]);

  // Custom width drag handle logic
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingHandle.current = true;
    startX.current = e.clientX;
    startWidth.current = frameWidth;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingHandle.current) return;
    const deltaX = (e.clientX - startX.current) / zoom;
    const newWidth = Math.max(320, Math.min(1920, Math.round(startWidth.current + deltaX)));
    onWidthChange(newWidth);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingHandle.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Device frame bezel decorations
  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';
  const isDesktop = bp === 'desktop';

  return (
    <div
      className="relative flex items-center justify-center transition-transform duration-100 ease-out"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Device Bezel Shell */}
      <div
        className={`relative flex flex-col bg-[#11140F] shadow-2xl transition-all duration-150 ${
          isMobile
            ? 'rounded-[48px] p-3 ring-1 ring-white/15'
            : isTablet
            ? 'rounded-[32px] p-2.5 ring-1 ring-white/15'
            : 'rounded-xl p-1.5 ring-1 ring-white/10'
        }`}
        style={{
          width: `${frameWidth + (isMobile ? 24 : isTablet ? 20 : 12)}px`,
        }}
      >
        {/* Device Top Bar / Notch */}
        {isMobile && (
          <div className="w-full flex items-center justify-center pb-2 pt-1 relative select-none">
            {/* Phone Notch Pill */}
            <div className="w-28 h-4 bg-black rounded-full flex items-center justify-end px-2.5 z-20 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-blue-900/60" />
            </div>
          </div>
        )}

        {isTablet && (
          <div className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-mono text-white/50 select-none">
            <span className="flex items-center gap-1.5">
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet {frameWidth}px</span>
            </span>
            <button
              onClick={onRotateTablet}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isRotated ? 'Portrait' : 'Landscape'}</span>
            </button>
          </div>
        )}

        {isDesktop && (
          <div className="w-full flex items-center justify-between px-3 py-1.5 bg-[#1C201D] rounded-t-lg text-[11px] text-white/60 select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="ml-2 font-mono text-[10px] opacity-70">Desktop Browser View</span>
            </div>
            <span className="font-mono text-[10.5px] opacity-70">{frameWidth}px</span>
          </div>
        )}

        {/* The Exact-Width Iframe Canvas */}
        <div
          className={`relative overflow-hidden ${
            isMobile ? 'rounded-[36px]' : isTablet ? 'rounded-[22px]' : 'rounded-b-lg'
          }`}
          style={{
            width: `${frameWidth}px`,
            height: isMobile ? '844px' : isTablet ? (isRotated ? '820px' : '1180px') : '800px',
            backgroundColor: doc.tokens?.colors?.bg || '#ffffff',
          }}
        >
          <iframe
            ref={iframeRef}
            title="Builder Canvas Viewport"
            className="w-full h-full border-0 select-none"
            style={{ width: `${frameWidth}px` }}
          />

          {/* React Portal mounting into iframe body root */}
          {mountNode &&
            createPortal(
              <RenderDoc
                doc={doc}
                mode={mode === 'preview' ? 'published' : 'editor'}
                activeBreakpoint={bp}
              />,
              mountNode
            )}

          {/* Selection and interaction overlay anchored directly over the iframe */}
          {children}
        </div>

        {/* Mobile Home Bar */}
        {isMobile && (
          <div className="w-full flex justify-center py-2 select-none">
            <div className="w-32 h-1 bg-white/30 rounded-full" />
          </div>
        )}
      </div>

      {/* Custom Width Drag Handle on Frame's Right Edge - Docked cleanly without overlapping inspector */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-1/2 -right-3 -translate-y-1/2 w-3 h-12 bg-[#11140F]/90 hover:bg-emerald-600 border border-white/20 rounded-full cursor-ew-resize flex items-center justify-center transition-colors group z-20 select-none shadow-md"
        title="Drag to resize custom viewport width"
      >
        <div className="w-0.5 h-5 bg-white/40 group-hover:bg-white rounded-full" />

        {/* Tooltip Badge placed to the left so it never covers the inspector */}
        <div className="absolute right-5 whitespace-nowrap bg-black/90 text-white text-[10.5px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          {frameWidth}px ({bp})
        </div>
      </div>
    </div>
  );
}
