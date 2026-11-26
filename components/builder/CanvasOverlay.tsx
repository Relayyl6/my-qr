'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Doc, Bp, NodeType } from '@/lib/builder/schema';
import { calculateDropTarget, DropTarget } from '@/lib/builder/drag-drop';

interface CanvasOverlayProps {
  doc: Doc;
  bp: Bp;
  selection: string[];
  hoverId?: string;
  zoom: number;
  mode: 'edit' | 'preview';
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onSelectNode: (id: string, multi?: boolean) => void;
  onHoverNode: (id?: string) => void;
  onCommitResize?: (nodeId: string, dims: { width?: number; height?: number }) => void;
  onResetDimensionToHug?: (nodeId: string, dims: { width?: boolean; height?: boolean }) => void;
  onReorderNode?: (id: string, parentId: string, targetIndex: number) => void;
  onMoveFreeNode?: (id: string, x: number, y: number) => void;
}

interface NodeRect {
  id: string;
  type: NodeType;
  name?: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ResizeState {
  handle: ResizeHandleType;
  nodeId: string;
  startPointerX: number;
  startPointerY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio: number;
  currentWidth: number;
  currentHeight: number;
}

interface DragMoveState {
  nodeId: string;
  isFree: boolean;
  startPointerX: number;
  startPointerY: number;
  initialNodeX: number;
  initialNodeY: number;
  currentDeltaX: number;
  currentDeltaY: number;
  dropTarget: DropTarget | null;
  hasMoved: boolean;
}

export function CanvasOverlay({
  doc,
  bp,
  selection,
  hoverId,
  zoom,
  mode,
  iframeRef,
  onSelectNode,
  onHoverNode,
  onCommitResize,
  onResetDimensionToHug,
  onReorderNode,
  onMoveFreeNode,
}: CanvasOverlayProps) {
  const [rects, setRects] = useState<Record<string, NodeRect>>({});
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [dragMoveState, setDragMoveState] = useState<DragMoveState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragCandidateRef = useRef<{
    startX: number;
    startY: number;
    hitNodeIds: string[];
    shiftKey: boolean;
    pointerId: number;
  } | null>(null);

  // Scan iframe DOM for exact node bounding rects in iframe unscaled coordinates
  const updateRects = useCallback(() => {
    if (mode === 'preview') return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeDoc = iframe.contentDocument;
    const elements = iframeDoc.querySelectorAll<HTMLElement>(
      '[class*="n_"], [data-node-id], section, main, h1, h2, h3, p, a, div, img, button, footer'
    );
    const newRects: Record<string, NodeRect> = {};

    elements.forEach((el) => {
      // Find matching node ID from className n_<id> or data-node-id
      const match = el.className?.match?.(/\bn_([a-z0-9_-]+)\b/);
      const nodeId = match ? match[1] : el.getAttribute('data-node-id');
      if (!nodeId || !doc.nodes[nodeId]) return;

      const r = el.getBoundingClientRect();
      const node = doc.nodes[nodeId];

      // Exact pixel coordinates relative to iframe document viewport
      newRects[nodeId] = {
        id: nodeId,
        type: node.type,
        name: node.name,
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      };
    });

    setRects(newRects);
  }, [doc.nodes, iframeRef, mode]);

  // Keep rects synchronized with layout changes, scroll, resize, and DOM mutations
  useEffect(() => {
    updateRects();
    const interval = setInterval(updateRects, 200);

    const iframe = iframeRef.current;
    const cw = iframe?.contentWindow;
    const cd = iframe?.contentDocument;

    if (cw) {
      cw.addEventListener('scroll', updateRects, { passive: true });
      cw.addEventListener('resize', updateRects, { passive: true });
    }
    if (cd) {
      cd.addEventListener('scroll', updateRects, { passive: true });
    }

    let observer: MutationObserver | null = null;
    if (cd?.body) {
      observer = new MutationObserver(() => updateRects());
      observer.observe(cd.body, { attributes: true, childList: true, subtree: true });
    }

    return () => {
      clearInterval(interval);
      if (cw) {
        cw.removeEventListener('scroll', updateRects);
        cw.removeEventListener('resize', updateRects);
      }
      if (cd) {
        cd.removeEventListener('scroll', updateRects);
      }
      observer?.disconnect();
    };
  }, [updateRects, iframeRef]);

  // Unified pointer down: record start point, hit-tested nodes, and capture pointer
  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === 'preview' || resizeState) return;
    if (e.button !== 0) return; // Only primary mouse button

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeRect = iframe.getBoundingClientRect();
    const relX = (e.clientX - iframeRect.left) / zoom;
    const relY = (e.clientY - iframeRect.top) / zoom;

    const elements = iframe.contentDocument.elementsFromPoint(relX, relY);
    const hitNodeIds: string[] = [];
    for (const el of elements) {
      const match = el.className?.match?.(/\bn_([a-z0-9_-]+)\b/);
      const nodeId = match ? match[1] : el.getAttribute('data-node-id');
      if (nodeId && doc.nodes[nodeId] && !hitNodeIds.includes(nodeId)) {
        hitNodeIds.push(nodeId);
      }
    }

    try {
      (overlayRef.current as HTMLElement)?.setPointerCapture(e.pointerId);
    } catch {}

    dragCandidateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      hitNodeIds,
      shiftKey: e.shiftKey,
      pointerId: e.pointerId,
    };
  };

  // Active drag move calculation for free frames and auto-layout drop targets
  const handleActiveDragMove = (e: React.PointerEvent) => {
    if (!dragMoveState) return;

    const deltaX = (e.clientX - dragMoveState.startPointerX) / zoom;
    const deltaY = (e.clientY - dragMoveState.startPointerY) / zoom;

    if (dragMoveState.isFree) {
      setDragMoveState((prev) =>
        prev
          ? {
              ...prev,
              hasMoved: true,
              currentDeltaX: deltaX,
              currentDeltaY: deltaY,
            }
          : null
      );
    } else {
      const iframe = iframeRef.current;
      if (iframe?.contentDocument) {
        const iframeRect = iframe.getBoundingClientRect();
        const relX = (e.clientX - iframeRect.left) / zoom;
        const relY = (e.clientY - iframeRect.top) / zoom;

        const elementsAtPoint = Array.from(
          iframe.contentDocument.elementsFromPoint(relX, relY)
        );

        const drop = calculateDropTarget({
          doc,
          source: {
            type: 'canvas',
            nodeType: doc.nodes[dragMoveState.nodeId]?.type || 'stack',
            nodeId: dragMoveState.nodeId,
          },
          relX,
          relY,
          zoom: 1, // relX and relY are in unscaled iframe coordinates
          elementsAtPoint,
          nodeRects: rects,
        });

        setDragMoveState((prev) =>
          prev
            ? {
                ...prev,
                hasMoved: true,
                currentDeltaX: deltaX,
                currentDeltaY: deltaY,
                dropTarget: drop,
              }
            : null
        );
      }
    }
  };

  // Unified pointer move: handles resize, active drag, drag threshold initiation, or hover
  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === 'preview') return;
    if (resizeState) {
      handleResizePointerMove(e);
      return;
    }

    if (dragMoveState) {
      handleActiveDragMove(e);
      return;
    }

    if (dragCandidateRef.current) {
      const dx = e.clientX - dragCandidateRef.current.startX;
      const dy = e.clientY - dragCandidateRef.current.startY;
      if (Math.hypot(dx, dy) > 3) {
        // Pointer moved > 3px: initiate dragging!
        const { hitNodeIds } = dragCandidateRef.current;
        const selectedHit = hitNodeIds.find((id) => selection.includes(id));
        const dragTargetId = selectedHit || hitNodeIds[0];

        if (dragTargetId) {
          const node = doc.nodes[dragTargetId];
          if (node && !node.locked) {
            if (!selection.includes(dragTargetId)) {
              onSelectNode(dragTargetId, false);
            }
            const parentNode = node.parent ? doc.nodes[node.parent] : null;
            const isFree = parentNode?.type === 'free';
            const initialX = node.style[bp]?.x ?? node.style.mobile?.x ?? 0;
            const initialY = node.style[bp]?.y ?? node.style.mobile?.y ?? 0;

            setDragMoveState({
              nodeId: dragTargetId,
              isFree,
              startPointerX: dragCandidateRef.current.startX,
              startPointerY: dragCandidateRef.current.startY,
              initialNodeX: initialX,
              initialNodeY: initialY,
              currentDeltaX: dx / zoom,
              currentDeltaY: dy / zoom,
              dropTarget: null,
              hasMoved: true,
            });
            return;
          }
        }
      }
      return;
    }

    // Hover hit-testing
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const iframeRect = iframe.getBoundingClientRect();
    const relX = (e.clientX - iframeRect.left) / zoom;
    const relY = (e.clientY - iframeRect.top) / zoom;

    const elements = iframe.contentDocument.elementsFromPoint(relX, relY);
    for (const el of elements) {
      const match = el.className?.match?.(/\bn_([a-z0-9_-]+)\b/);
      const nodeId = match ? match[1] : el.getAttribute('data-node-id');
      if (nodeId && doc.nodes[nodeId]) {
        onHoverNode(nodeId);
        return;
      }
    }
    onHoverNode(undefined);
  };

  // Unified pointer up: handles resize completion, drag drop commit, or click selection cycling
  const handlePointerUp = (e: React.PointerEvent) => {
    if (resizeState) {
      handleResizePointerUp(e);
      return;
    }

    if (dragCandidateRef.current) {
      const { pointerId, hitNodeIds, shiftKey } = dragCandidateRef.current;
      try {
        (overlayRef.current as HTMLElement)?.releasePointerCapture(pointerId);
      } catch {}

      if (dragMoveState && dragMoveState.hasMoved) {
        // Commit drag gesture
        if (dragMoveState.isFree) {
          const finalX = Math.round(dragMoveState.initialNodeX + dragMoveState.currentDeltaX);
          const finalY = Math.round(dragMoveState.initialNodeY + dragMoveState.currentDeltaY);
          onMoveFreeNode?.(dragMoveState.nodeId, finalX, finalY);
        } else if (dragMoveState.dropTarget && dragMoveState.dropTarget.isValid) {
          onReorderNode?.(
            dragMoveState.nodeId,
            dragMoveState.dropTarget.containerId,
            dragMoveState.dropTarget.index
          );
        }
      } else {
        // Pointer moved <= 3px: IT IS A CLICK!
        if (hitNodeIds.length === 0) {
          // Empty canvas click clears selection
          onSelectNode('', false);
        } else {
          const deepest = hitNodeIds[0];
          const currentSelected = selection[0];

          if (shiftKey) {
            onSelectNode(deepest, true);
          } else if (!currentSelected || !hitNodeIds.includes(currentSelected)) {
            // Select the deepest child under cursor
            onSelectNode(deepest, false);
          } else {
            const currentIndex = hitNodeIds.indexOf(currentSelected);
            if (currentIndex !== 0) {
              // An ancestor was selected and user clicked a child: select the deepest child
              onSelectNode(deepest, false);
            } else {
              // Deepest child was already selected: cycle to parent (spec 6.3)
              const nextIndex = (currentIndex + 1) % hitNodeIds.length;
              onSelectNode(hitNodeIds[nextIndex], false);
            }
          }
        }
      }

      dragCandidateRef.current = null;
      setDragMoveState(null);
    }
  };

  // Double click container to select first child (spec 6.3)
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (mode === 'preview') return;
    const currentSelected = selection[0];
    if (!currentSelected) return;
    const node = doc.nodes[currentSelected];
    if (node && node.children && node.children.length > 0) {
      onSelectNode(node.children[0], false);
    }
  };

  // --- 1. RESIZE HANDLERS ---
  const handleResizePointerDown = (
    e: React.PointerEvent,
    nodeId: string,
    handle: ResizeHandleType,
    rect: NodeRect
  ) => {
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    setResizeState({
      handle,
      nodeId,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      aspectRatio: rect.width / (rect.height || 1),
      currentWidth: Math.round(rect.width),
      currentHeight: Math.round(rect.height),
    });
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!resizeState) return;
    e.stopPropagation();

    const deltaX = (e.clientX - resizeState.startPointerX) / zoom;
    const deltaY = (e.clientY - resizeState.startPointerY) / zoom;

    const hasE = ['e', 'se', 'ne'].includes(resizeState.handle);
    const hasW = ['w', 'sw', 'nw'].includes(resizeState.handle);
    const hasS = ['s', 'se', 'sw'].includes(resizeState.handle);
    const hasN = ['n', 'ne', 'nw'].includes(resizeState.handle);

    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;

    if (hasE) newWidth = resizeState.startWidth + deltaX;
    if (hasW) newWidth = resizeState.startWidth - deltaX;
    if (hasS) newHeight = resizeState.startHeight + deltaY;
    if (hasN) newHeight = resizeState.startHeight - deltaY;

    // Shift-drag locks aspect ratio
    if (e.shiftKey) {
      if ((hasE || hasW) && (hasS || hasN)) {
        const scale = Math.max(newWidth / resizeState.startWidth, newHeight / resizeState.startHeight);
        newWidth = Math.round(resizeState.startWidth * scale);
        newHeight = Math.round(resizeState.startHeight * scale);
      } else if (hasE || hasW) {
        newHeight = Math.round(newWidth / resizeState.aspectRatio);
      } else if (hasS || hasN) {
        newWidth = Math.round(newHeight * resizeState.aspectRatio);
      }
    }

    newWidth = Math.max(20, Math.round(newWidth));
    newHeight = Math.max(20, Math.round(newHeight));

    setResizeState((prev) =>
      prev ? { ...prev, currentWidth: newWidth, currentHeight: newHeight } : null
    );
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!resizeState) return;
    e.stopPropagation();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const { handle, nodeId, currentWidth, currentHeight } = resizeState;
    const hasHoriz = ['e', 'w', 'se', 'sw', 'ne', 'nw'].includes(handle);
    const hasVert = ['s', 'n', 'se', 'sw', 'ne', 'nw'].includes(handle);

    // Commit as ONE undo step on pointer up
    onCommitResize?.(nodeId, {
      width: hasHoriz ? currentWidth : undefined,
      height: hasVert ? currentHeight : undefined,
    });

    setResizeState(null);
  };

  const handleDoubleClickHandle = (
    e: React.MouseEvent,
    nodeId: string,
    handle: ResizeHandleType
  ) => {
    e.stopPropagation();
    const hasHoriz = ['e', 'w', 'se', 'sw', 'ne', 'nw'].includes(handle);
    const hasVert = ['s', 'n', 'se', 'sw', 'ne', 'nw'].includes(handle);

    // Double-clicking a handle returns dimension to 'hug'
    onResetDimensionToHug?.(nodeId, {
      width: hasHoriz,
      height: hasVert,
    });
  };

  if (mode === 'preview') return null;

  return (
    <div
      ref={overlayRef}
      onPointerMove={resizeState ? handleResizePointerMove : handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      className="absolute inset-0 pointer-events-auto z-20 select-none overflow-hidden"
    >
      {/* 1. Drop Target Container Highlight */}
      {dragMoveState?.hasMoved && dragMoveState.dropTarget?.highlightRect && (
        <div
          className="absolute border-2 border-dashed border-blue-400 bg-blue-500/10 pointer-events-none rounded-lg z-30 transition-all duration-75"
          style={{
            top: `${dragMoveState.dropTarget.highlightRect.top}px`,
            left: `${dragMoveState.dropTarget.highlightRect.left}px`,
            width: `${dragMoveState.dropTarget.highlightRect.width}px`,
            height: `${dragMoveState.dropTarget.highlightRect.height}px`,
          }}
        />
      )}

      {/* 2. Drop Target Blue Insertion Line Indicator */}
      {dragMoveState?.hasMoved && dragMoveState.dropTarget?.lineRect && (
        <div
          className="absolute bg-blue-500 rounded-full z-40 pointer-events-none shadow-md animate-pulse"
          style={{
            top: `${dragMoveState.dropTarget.lineRect.top}px`,
            left: `${dragMoveState.dropTarget.lineRect.left}px`,
            width: `${dragMoveState.dropTarget.lineRect.width}px`,
            height: `${dragMoveState.dropTarget.lineRect.height}px`,
          }}
        />
      )}

      {/* 3. Hover Box Outline */}
      {hoverId && rects[hoverId] && !selection.includes(hoverId) && !resizeState && !dragMoveState?.hasMoved && (
        <div
          className="absolute border border-blue-400/80 bg-blue-500/5 pointer-events-none transition-all duration-75 rounded-xs"
          style={{
            top: `${rects[hoverId].top}px`,
            left: `${rects[hoverId].left}px`,
            width: `${rects[hoverId].width}px`,
            height: `${rects[hoverId].height}px`,
          }}
        >
          <div
            className="absolute px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-mono leading-none flex items-center gap-1 shadow-xs pointer-events-none"
            style={{
              top: rects[hoverId].top < 20 ? '0px' : '-20px',
              left: '0px',
            }}
          >
            <span>{rects[hoverId].type}</span>
          </div>
        </div>
      )}

      {/* 4. Selected Node Boxes & Interactive Handles */}
      {selection.map((id) => {
        const r = rects[id];
        if (!r) return null;
        const node = doc.nodes[id];
        if (!node) return null;

        const isResizing = resizeState?.nodeId === id;
        const isDragging = dragMoveState?.nodeId === id && dragMoveState.hasMoved;

        const boxWidth = isResizing ? resizeState.currentWidth : r.width;
        const boxHeight = isResizing ? resizeState.currentHeight : r.height;

        let boxLeft = r.left;
        let boxTop = r.top;

        if (isDragging) {
          boxLeft += dragMoveState.currentDeltaX;
          boxTop += dragMoveState.currentDeltaY;
        }

        return (
          <div
            key={id}
            className={`absolute border-2 border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5 rounded-xs select-none pointer-events-none ${
              isDragging ? 'opacity-80 shadow-2xl z-40' : 'z-30'
            }`}
            style={{
              top: `${boxTop}px`,
              left: `${boxLeft}px`,
              width: `${boxWidth}px`,
              height: `${boxHeight}px`,
            }}
          >
            {/* Selection Label Chip */}
            <div
              className="absolute px-2 py-0.5 rounded-t-md bg-emerald-600 text-white text-[10px] font-semibold font-mono leading-tight flex items-center gap-1.5 shadow-sm pointer-events-none"
              style={{
                top: r.top < 24 ? '0px' : '-24px',
                left: '0px',
              }}
            >
              <span className="capitalize">{r.type}</span>
              {r.name && <span className="opacity-75 font-normal">({r.name})</span>}
              {node.locked && <span className="text-[9px] opacity-90 font-bold">🔒</span>}
            </div>

            {/* Live Size Pill During Resize */}
            {isResizing && (
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-white text-[10.5px] font-mono whitespace-nowrap shadow-md pointer-events-none z-50">
                {boxWidth} × {boxHeight} px
              </div>
            )}

            {/* Live Free Coordinate Pill During Drag */}
            {isDragging && dragMoveState.isFree && (
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-white text-[10.5px] font-mono whitespace-nowrap shadow-md pointer-events-none z-50">
                X: {Math.round(dragMoveState.initialNodeX + dragMoveState.currentDeltaX)}px, Y: {Math.round(dragMoveState.initialNodeY + dragMoveState.currentDeltaY)}px
              </div>
            )}

            {/* Interactive Corner and Edge Resize Handles (Only for unlocked nodes) */}
            {!node.locked && (
              <>
                {/* NW Corner */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 'nw', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 'nw')}
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize (Shift for aspect ratio, double-click to hug)"
                />

                {/* N Edge */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 'n', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 'n')}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize height (double-click to hug)"
                />

                {/* NE Corner */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 'ne', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 'ne')}
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize (Shift for aspect ratio, double-click to hug)"
                />

                {/* E Edge */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 'e', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 'e')}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize width (double-click to hug)"
                />

                {/* SE Corner */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 'se', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 'se')}
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nwse-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize (Shift for aspect ratio, double-click to hug)"
                />

                {/* S Edge */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 's', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 's')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ns-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize height (double-click to hug)"
                />

                {/* SW Corner */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 'sw', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 'sw')}
                  className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-nesw-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize (Shift for aspect ratio, double-click to hug)"
                />

                {/* W Edge */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, id, 'w', r)}
                  onPointerMove={resizeState ? handleResizePointerMove : undefined}
                  onPointerUp={resizeState ? handleResizePointerUp : undefined}
                  onDoubleClick={(e) => handleDoubleClickHandle(e, id, 'w')}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-emerald-600 rounded-xs cursor-ew-resize hover:scale-125 transition-transform z-40 shadow-xs pointer-events-auto"
                  title="Drag to resize width (double-click to hug)"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
