import { create } from 'zustand';
import { produce, produceWithPatches, enablePatches, Patch, applyPatches, Draft } from 'immer';
import { Doc, Node, Style, Bp, BP, BREAKPOINTS, DocSchema } from './schema';
import { resolveStyle, isOverridden, resetOverride } from './resolve';

// Initialize Immer patches support for undo/redo
enablePatches();

export interface Command {
  label: string;
  run: (draft: Draft<Doc>) => void;
}

export interface BuilderUIState {
  bp: Bp;
  zoom: number; // e.g. 1.0 = 100%, 0.75 = 75%
  selection: string[]; // Node IDs currently selected
  hoverId?: string;
  mode: 'edit' | 'preview';
  frameWidth: number; // Exact width in px: 390, 820, 1280 or custom
  isRotated: boolean; // For tablet rotation (1180px)
  panels: {
    left: 'layers' | 'add' | 'assets';
    right: 'inspector' | 'ai';
  };
}

export interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
}

export interface BuilderState {
  doc: Doc;
  ui: BuilderUIState;
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
  };
  baseVersion: number;
  isSaving: boolean;
  saveConflict: boolean;

  // Actions
  exec: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // UI Actions
  setBreakpoint: (bp: Bp) => void;
  setFrameWidth: (width: number) => void;
  toggleRotateTablet: () => void;
  setZoom: (zoom: number) => void;
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setHoverId: (id?: string) => void;
  setMode: (mode: 'edit' | 'preview') => void;
  setLeftPanel: (panel: 'layers' | 'add' | 'assets') => void;
  setRightPanel: (panel: 'inspector' | 'ai') => void;

  // Node Editing Commands
  updateNodeProps: (id: string, props: Record<string, unknown>) => void;
  updateNodeStyle: (id: string, bp: Bp, style: Partial<Style>) => void;
  resetNodeOverride: (id: string, bp: Bp, key: keyof Style) => void;
  copyStylesToBreakpoint: (id: string, fromBp: Bp, toBp: Bp) => void;
  renameNode: (id: string, name: string) => void;
  toggleLockNode: (id: string) => void;
  toggleHiddenNode: (id: string, bp: Bp) => void;
  reorderNode: (id: string, parentId: string, targetIndex: number) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  groupNodes: (ids: string[]) => void;
  ungroupNode: (id: string) => void;
  setNodeDimension: (id: string, bp: Bp, dim: 'width' | 'height', mode: 'fill' | 'hug' | 'fixed', px?: number) => void;
}

export const createBuilderStore = (initialDoc: Doc) => {
  return create<BuilderState>((set, get) => ({
    doc: initialDoc,
    ui: {
      bp: 'mobile',
      zoom: 1,
      selection: initialDoc.root ? [initialDoc.root] : [],
      hoverId: undefined,
      mode: 'edit',
      frameWidth: BREAKPOINTS.mobile.frameWidth,
      isRotated: false,
      panels: {
        left: 'layers',
        right: 'inspector',
      },
    },
    history: {
      past: [],
      future: [],
    },
    baseVersion: 1,
    isSaving: false,
    saveConflict: false,

    // Command executor with Immer patch tracking for precise undo/redo
    exec: (cmd: Command) => {
      const { doc, history } = get();
      const [nextDoc, patches, inversePatches] = produceWithPatches(doc, (draft) => {
        cmd.run(draft);
      });

      // No-op if no changes occurred
      if (patches.length === 0) return;

      // Validate invariants: locked destination URL must not be touched
      if (nextDoc.destination.url !== doc.destination.url) {
        console.error('Security invariant violated: destination URL cannot be modified by commands');
        return;
      }

      set({
        doc: nextDoc,
        history: {
          past: [...history.past, { patches, inversePatches }],
          future: [], // New command clears redo stack
        },
      });
    },

    undo: () => {
      const { doc, history } = get();
      if (history.past.length === 0) return;

      const newPast = [...history.past];
      const entry = newPast.pop()!;
      const prevDoc = applyPatches(doc, entry.inversePatches);

      set({
        doc: prevDoc,
        history: {
          past: newPast,
          future: [entry, ...history.future],
        },
      });
    },

    redo: () => {
      const { doc, history } = get();
      if (history.future.length === 0) return;

      const newFuture = [...history.future];
      const entry = newFuture.shift()!;
      const nextDoc = applyPatches(doc, entry.patches);

      set({
        doc: nextDoc,
        history: {
          past: [...history.past, entry],
          future: newFuture,
        },
      });
    },

    canUndo: () => get().history.past.length > 0,
    canRedo: () => get().history.future.length > 0,

    // UI State Setters
    setBreakpoint: (bp: Bp) => {
      const frameWidth =
        bp === 'mobile'
          ? BREAKPOINTS.mobile.frameWidth
          : bp === 'tablet'
          ? BREAKPOINTS.tablet.frameWidth
          : BREAKPOINTS.desktop.frameWidth;

      set((state) => ({
        ui: {
          ...state.ui,
          bp,
          frameWidth,
          isRotated: false,
        },
      }));
    },

    setFrameWidth: (width: number) => {
      // Determine active breakpoint based on width thresholds
      let bp: Bp = 'mobile';
      if (width >= BREAKPOINTS.desktop.minWidth) {
        bp = 'desktop';
      } else if (width >= BREAKPOINTS.tablet.minWidth) {
        bp = 'tablet';
      }

      set((state) => ({
        ui: {
          ...state.ui,
          frameWidth: width,
          bp,
        },
      }));
    },

    toggleRotateTablet: () => {
      set((state) => {
        if (state.ui.bp !== 'tablet' && !state.ui.isRotated) return state;
        const isRotated = !state.ui.isRotated;
        const frameWidth = isRotated ? 1180 : BREAKPOINTS.tablet.frameWidth;
        const bp: Bp = isRotated ? 'desktop' : 'tablet'; // 1180px triggers desktop media queries
        return {
          ui: {
            ...state.ui,
            isRotated,
            frameWidth,
            bp,
          },
        };
      });
    },

    setZoom: (zoom: number) => {
      set((state) => ({
        ui: {
          ...state.ui,
          zoom: Math.max(0.25, Math.min(2.0, zoom)),
        },
      }));
    },

    selectNode: (id: string, multi: boolean = false) => {
      set((state) => {
        if (!state.doc.nodes[id]) return state;
        if (multi) {
          const exists = state.ui.selection.includes(id);
          const selection = exists
            ? state.ui.selection.filter((item) => item !== id)
            : [...state.ui.selection, id];
          return { ui: { ...state.ui, selection } };
        }
        return { ui: { ...state.ui, selection: [id] } };
      });
    },

    clearSelection: () => {
      set((state) => ({
        ui: { ...state.ui, selection: [] },
      }));
    },

    setHoverId: (id?: string) => {
      set((state) => ({
        ui: { ...state.ui, hoverId: id },
      }));
    },

    setMode: (mode: 'edit' | 'preview') => {
      set((state) => ({
        ui: { ...state.ui, mode },
      }));
    },

    setLeftPanel: (panel: 'layers' | 'add' | 'assets') => {
      set((state) => ({
        ui: {
          ...state.ui,
          panels: { ...state.ui.panels, left: panel },
        },
      }));
    },

    setRightPanel: (panel: 'inspector' | 'ai') => {
      set((state) => ({
        ui: {
          ...state.ui,
          panels: { ...state.ui.panels, right: panel },
        },
      }));
    },

    // Node Editing Commands
    updateNodeProps: (id: string, props: Record<string, unknown>) => {
      get().exec({
        label: `Update props for ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (!node) return;
          // Protect locked node
          if (node.locked && id === 'btn_cta' && props.bind && props.bind !== 'destination') {
            return;
          }
          node.props = { ...node.props, ...props };
          node.placeholder = false; // Editing clears placeholder
        },
      });
    },

    updateNodeStyle: (id: string, bp: Bp, style: Partial<Style>) => {
      get().exec({
        label: `Update ${bp} style for ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (!node) return;
          if (bp === 'mobile') {
            node.style.mobile = { ...node.style.mobile, ...style };
          } else {
            node.style[bp] = { ...(node.style[bp] || {}), ...style };
          }
        },
      });
    },

    resetNodeOverride: (id: string, bp: Bp, key: keyof Style) => {
      get().exec({
        label: `Reset override ${String(key)} on ${bp}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (!node) return;
          resetOverride(node as any, bp, key);
        },
      });
    },

    copyStylesToBreakpoint: (id: string, fromBp: Bp, toBp: Bp) => {
      get().exec({
        label: `Copy styles from ${fromBp} to ${toBp}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (!node) return;
          const resolved = resolveStyle(node as any, fromBp);
          if (toBp === 'mobile') {
            node.style.mobile = resolved;
          } else {
            node.style[toBp] = { ...(node.style[toBp] || {}), ...resolved };
          }
        },
      });
    },

    renameNode: (id: string, name: string) => {
      get().exec({
        label: `Rename node ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (node) node.name = name.slice(0, 60);
        },
      });
    },

    toggleLockNode: (id: string) => {
      get().exec({
        label: `Toggle lock on ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (node) node.locked = !node.locked;
        },
      });
    },

    toggleHiddenNode: (id: string, bp: Bp) => {
      get().exec({
        label: `Toggle hidden on ${bp} for ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (!node) return;
          if (!node.hidden) node.hidden = {};
          node.hidden[bp] = !node.hidden[bp];
        },
      });
    },

    reorderNode: (id: string, parentId: string, targetIndex: number) => {
      get().exec({
        label: `Reorder node ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          const newParent = draft.nodes[parentId];
          if (!node || !newParent) return;

          // Remove from old parent
          if (node.parent && draft.nodes[node.parent]) {
            const oldParent = draft.nodes[node.parent];
            oldParent.children = oldParent.children.filter((cid) => cid !== id);
          }

          // Insert into new parent at index
          node.parent = parentId;
          const idx = Math.max(0, Math.min(newParent.children.length, targetIndex));
          newParent.children.splice(idx, 0, id);
        },
      });
    },

    deleteNode: (id: string) => {
      get().exec({
        label: `Delete node ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (!node || node.locked || id === draft.root) return;

          // Remove from parent
          if (node.parent && draft.nodes[node.parent]) {
            const parent = draft.nodes[node.parent];
            parent.children = parent.children.filter((cid) => cid !== id);
          }

          // Recursively delete children
          const deleteRecursive = (nid: string) => {
            const curr = draft.nodes[nid];
            if (!curr) return;
            curr.children.forEach(deleteRecursive);
            delete draft.nodes[nid];
          };
          deleteRecursive(id);
        },
      });
    },

    duplicateNode: (id: string) => {
      get().exec({
        label: `Duplicate node ${id}`,
        run: (draft) => {
          const source = draft.nodes[id];
          if (!source || !source.parent || !draft.nodes[source.parent]) return;

          const cloneSubtree = (srcId: string, newParentId: string): string => {
            const src = draft.nodes[srcId];
            if (!src) return '';
            const newId = `${src.type.slice(0, 3)}_${Math.random().toString(36).substring(2, 8)}`;
            const clonedChildren = src.children.map((cid) => cloneSubtree(cid, newId)).filter(Boolean);

            draft.nodes[newId] = {
              ...JSON.parse(JSON.stringify(src)),
              id: newId,
              name: src.name ? `${src.name} (Copy)` : undefined,
              parent: newParentId,
              children: clonedChildren,
              locked: false, // Duplicates are unlocked
            };
            return newId;
          };

          const parent = draft.nodes[source.parent];
          const newRootId = cloneSubtree(id, source.parent);
          const srcIdx = parent.children.indexOf(id);
          parent.children.splice(srcIdx + 1, 0, newRootId);
        },
      });
    },

    groupNodes: (ids: string[]) => {
      get().exec({
        label: `Group nodes into stack`,
        run: (draft) => {
          if (ids.length === 0) return;
          const firstNode = draft.nodes[ids[0]];
          if (!firstNode || !firstNode.parent || !draft.nodes[firstNode.parent]) return;

          const parent = draft.nodes[firstNode.parent];
          const stackId = `stk_${Math.random().toString(36).substring(2, 8)}`;
          const insertIdx = parent.children.indexOf(ids[0]);

          // Create new stack node
          draft.nodes[stackId] = {
            id: stackId,
            type: 'stack',
            name: 'Group Stack',
            parent: firstNode.parent,
            children: [...ids],
            style: {
              mobile: {
                display: 'flex',
                direction: 'column',
                gap: 12,
                width: 'fill',
              },
            },
            props: {},
          };

          // Reparent selected nodes and remove from original parent
          parent.children = parent.children.filter((cid) => !ids.includes(cid));
          parent.children.splice(insertIdx, 0, stackId);

          ids.forEach((nid) => {
            if (draft.nodes[nid]) {
              draft.nodes[nid].parent = stackId;
            }
          });
        },
      });
    },

    ungroupNode: (id: string) => {
      get().exec({
        label: `Ungroup node ${id}`,
        run: (draft) => {
          const container = draft.nodes[id];
          if (!container || !container.parent || !draft.nodes[container.parent]) return;
          if (container.children.length === 0) return;

          const parent = draft.nodes[container.parent];
          const insertIdx = parent.children.indexOf(id);

          // Move children into parent
          parent.children.splice(insertIdx, 1, ...container.children);
          container.children.forEach((cid) => {
            if (draft.nodes[cid]) {
              draft.nodes[cid].parent = container.parent;
            }
          });

          delete draft.nodes[id];
        },
      });
    },

    setNodeDimension: (id: string, bp: Bp, dim: 'width' | 'height', mode: 'fill' | 'hug' | 'fixed', px?: number) => {
      get().exec({
        label: `Set ${dim} ${mode} on ${id}`,
        run: (draft) => {
          const node = draft.nodes[id];
          if (!node) return;
          const targetStyle = bp === 'mobile' ? node.style.mobile : (node.style[bp] ||= {});

          if (mode === 'fill') {
            targetStyle[dim] = 'fill';
          } else if (mode === 'hug') {
            targetStyle[dim] = 'hug';
          } else if (mode === 'fixed' && px !== undefined) {
            targetStyle[dim] = { u: 'px', v: Math.max(1, Math.round(px)) };
          }
        },
      });
    },
  }));
};
