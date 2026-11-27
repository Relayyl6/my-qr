'use client';

import React, { useState } from 'react';
import { Doc, Node, Bp, NodeType, NODE_TYPES } from '@/lib/builder/schema';
import {
  Layers,
  PlusCircle,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Search,
  ChevronRight,
  ChevronDown,
  Trash2,
  Box,
  Type,
  LayoutGrid,
  Columns,
  Square,
  Heading,
  MousePointerClick,
  Link as LinkIcon,
  Phone,
  HelpCircle,
  QrCode,
  Upload,
  Check,
  Copy,
  Loader2,
} from 'lucide-react';

interface AssetItem {
  url: string;
  name: string;
  size: number;
  date: number;
}

interface LeftPanelProps {
  doc: Doc;
  bp: Bp;
  selection: string[];
  activePanel: 'layers' | 'add' | 'assets';
  onSelectPanel: (panel: 'layers' | 'add' | 'assets') => void;
  onSelectNode: (id: string, multi?: boolean) => void;
  onRenameNode: (id: string, name: string) => void;
  onToggleLock: (id: string) => void;
  onToggleHidden: (id: string, bp: Bp) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (type: NodeType) => void;
  onInsertImage?: (url: string, name?: string) => void;
}

function getDisplayNodeName(node: Node): string {
  if (node.name) return node.name;
  if (node.type === 'heading') {
    const text = (node.props?.text as string) || '';
    return text ? `Heading: ${text.slice(0, 18)}${text.length > 18 ? '…' : ''}` : 'Heading';
  }
  if (node.type === 'text') {
    const text = (node.props?.text as string) || '';
    return text ? `Text: ${text.slice(0, 18)}${text.length > 18 ? '…' : ''}` : 'Text';
  }
  if (node.type === 'button') {
    const label = (node.props?.label as string) || '';
    return label ? `Button: ${label}` : 'Button';
  }
  if (node.type === 'linkRow') {
    const label = (node.props?.label as string) || '';
    return label ? `Link: ${label}` : 'Link Row';
  }
  if (node.type === 'priceItem') {
    const name = (node.props?.name as string) || '';
    return name ? `Price: ${name}` : 'Price Item';
  }
  if (node.type === 'badge') {
    const text = (node.props?.text as string) || '';
    return text ? `Badge: ${text}` : 'Badge';
  }
  return node.type.charAt(0).toUpperCase() + node.type.slice(1);
}

export function LeftPanel({
  doc,
  bp,
  selection,
  activePanel,
  onSelectPanel,
  onSelectNode,
  onRenameNode,
  onToggleLock,
  onToggleHidden,
  onDeleteNode,
  onAddNode,
  onInsertImage,
}: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('builder_assets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveAssets = (newAssets: AssetItem[]) => {
    setAssets(newAssets);
    try {
      localStorage.setItem('builder_assets', JSON.stringify(newAssets));
    } catch {}
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'builder');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      if (data.url) {
        const newItem: AssetItem = {
          url: data.url,
          name: file.name,
          size: file.size,
          date: Date.now(),
        };
        const updated = [newItem, ...assets.filter((a) => a.url !== data.url)];
        saveAssets(updated);
        if (onInsertImage) {
          onInsertImage(data.url, file.name);
        }
      }
    } catch (err: any) {
      console.error('[Asset Upload Error]:', err);
      setUploadError(err.message || 'Failed to upload asset');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteAsset = (url: string) => {
    const updated = assets.filter((a) => a.url !== url);
    saveAssets(updated);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleFinishRename = (id: string) => {
    if (editName.trim()) {
      onRenameNode(id, editName.trim());
    }
    setEditingId(null);
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'section':
      case 'stack':
        return <Box className="w-3.5 h-3.5 opacity-70 text-blue-400" />;
      case 'grid':
        return <LayoutGrid className="w-3.5 h-3.5 opacity-70 text-indigo-400" />;
      case 'heading':
        return <Heading className="w-3.5 h-3.5 opacity-70 text-amber-400" />;
      case 'text':
      case 'badge':
        return <Type className="w-3.5 h-3.5 opacity-70 text-emerald-400" />;
      case 'button':
        return <MousePointerClick className="w-3.5 h-3.5 opacity-70 text-emerald-500" />;
      case 'linkRow':
        return <LinkIcon className="w-3.5 h-3.5 opacity-70 text-cyan-400" />;
      case 'image':
      case 'gallery':
        return <ImageIcon className="w-3.5 h-3.5 opacity-70 text-purple-400" />;
      case 'contact':
      case 'social':
        return <Phone className="w-3.5 h-3.5 opacity-70 text-rose-400" />;
      case 'qr':
        return <QrCode className="w-3.5 h-3.5 opacity-70 text-teal-400" />;
      default:
        return <Square className="w-3.5 h-3.5 opacity-50" />;
    }
  };

  // Recursive tree node renderer
  const renderLayerItem = (nodeId: string, depth: number = 0): React.ReactNode => {
    const node = doc.nodes[nodeId];
    if (!node) return null;

    // Filter by search query
    if (searchQuery) {
      const matchName = node.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = node.type.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchName && !matchType) return null;
    }

    const isSelected = selection.includes(node.id);
    const isHiddenOnBp = Boolean(node.hidden?.[bp]);
    const isLocked = Boolean(node.locked);
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = Boolean(collapsedNodes[node.id]);

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={(e) => onSelectNode(node.id, e.shiftKey)}
          className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer select-none ${
            isSelected
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'hover:bg-white/5 text-white/80'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 pr-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-0.5 hover:bg-white/10 rounded cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 opacity-60" />
                ) : (
                  <ChevronDown className="w-3 h-3 opacity-60" />
                )}
              </button>
            ) : (
              <span className="w-3" />
            )}

            {getNodeIcon(node.type)}

            {editingId === node.id ? (
              <input
                type="text"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleFinishRename(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename(node.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="bg-black/60 border border-emerald-500 text-white px-1 py-0.5 rounded text-[11.5px] w-full"
              />
            ) : (
              <span
                onDoubleClick={(e) => handleStartRename(node.id, getDisplayNodeName(node), e)}
                className="truncate cursor-text"
                title={`${getDisplayNodeName(node)} (${node.type}) - Double click to rename`}
              >
                {getDisplayNodeName(node)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {/* Visibility Toggle per current breakpoint */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHidden(node.id, bp);
              }}
              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
              title={`Toggle visibility on ${bp}`}
            >
              {isHiddenOnBp ? (
                <EyeOff className="w-3 h-3 text-red-400" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </button>

            {/* Lock Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(node.id);
              }}
              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
              title="Toggle lock"
            >
              {isLocked ? (
                <Lock className="w-3 h-3 text-amber-400" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </button>

            {/* Delete button (unless locked or root) */}
            {!isLocked && node.id !== doc.root && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="p-1 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400"
                title="Delete element"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {node.children.map((cid) => renderLayerItem(cid, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[275px] h-full bg-[#11140F] border-r border-white/10 flex flex-col text-white select-none flex-shrink-0">
      {/* Tab Switcher */}
      <div className="flex items-center border-b border-white/10 p-1.5 gap-1 bg-[#151916]">
        {[
          { key: 'layers', label: 'Layers', icon: Layers },
          { key: 'add', label: 'Add', icon: PlusCircle },
          { key: 'assets', label: 'Assets', icon: ImageIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelectPanel(key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
              activePanel === key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content: Layers */}
      {activePanel === 'layers' && (
        <div className="flex-1 flex flex-col p-2 space-y-2 overflow-y-auto">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search layers..."
              className="w-full bg-[#181D1A] border border-white/10 rounded-lg pl-8 pr-2.5 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:outline-emerald-500"
            />
          </div>

          {/* Tree View */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {doc.root ? renderLayerItem(doc.root) : <p className="text-white/40 text-xs">No root</p>}
          </div>
        </div>
      )}

      {/* Tab Content: Add Elements */}
      {activePanel === 'add' && (
        <div className="flex-1 p-3 overflow-y-auto space-y-4 text-[12px]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
              Layout Containers
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'stack', label: 'Stack (Flex)', icon: Columns },
                { type: 'grid', label: 'Grid', icon: LayoutGrid },
                { type: 'card', label: 'Card', icon: Square },
                { type: 'section', label: 'Section', icon: Box },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => onAddNode(type as NodeType)}
                  className="p-2.5 rounded-xl border border-white/10 bg-[#161B18] hover:border-emerald-500 hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white/90 text-[11.5px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2 block">
              Basic Elements
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'heading', label: 'Heading', icon: Heading },
                { type: 'text', label: 'Text Block', icon: Type },
                { type: 'button', label: 'Button', icon: MousePointerClick },
                { type: 'linkRow', label: 'Link Row', icon: LinkIcon },
                { type: 'priceItem', label: 'Price Item', icon: Square },
                { type: 'badge', label: 'Badge', icon: Type },
                { type: 'qr', label: 'QR Code', icon: QrCode },
                { type: 'contact', label: 'Contact', icon: Phone },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => onAddNode(type as NodeType)}
                  className="p-2.5 rounded-xl border border-white/10 bg-[#161B18] hover:border-emerald-500 hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white/90 text-[11.5px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Assets */}
      {activePanel === 'assets' && (
        <div className="flex-1 p-3 overflow-y-auto space-y-4 text-[12px]">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {/* Interactive Upload Dropzone */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center space-y-2 bg-[#161B18] transition-all cursor-pointer ${
              isUploading
                ? 'border-purple-500/50 bg-purple-500/5 opacity-80 cursor-wait'
                : 'border-white/20 hover:border-purple-400 hover:bg-purple-500/10'
            }`}
          >
            {isUploading ? (
              <div className="py-2 space-y-2">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-purple-400" />
                <p className="font-semibold text-white/90 text-[12px]">Optimizing & Uploading...</p>
                <p className="text-[11px] text-white/50">Processing cloud WebP asset</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-semibold text-white/90 text-[12.5px]">Upload Media Assets</p>
                <p className="text-[11px] text-white/50">Click or drag & drop (PNG, JPG, WebP up to 10 MB)</p>
              </>
            )}
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] flex items-center gap-2">
              <span className="shrink-0 font-bold">⚠️</span>
              <span className="flex-1">{uploadError}</span>
            </div>
          )}

          {/* Uploaded Assets Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Media Library ({assets.length})
              </span>
              {assets.length > 0 && (
                <button
                  type="button"
                  onClick={() => saveAssets([])}
                  className="text-[10px] text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear Library
                </button>
              )}
            </div>

            {assets.length === 0 ? (
              <p className="text-[11px] text-white/40 text-center py-4 border border-white/5 rounded-xl bg-white/[0.02]">
                No media uploaded yet. Drop an image above to start.
              </p>
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.url}
                    className="p-2 rounded-xl bg-[#161B18] border border-white/10 flex items-center gap-2.5 hover:border-white/20 transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium text-[11.5px] text-white/90 truncate" title={asset.name}>
                        {asset.name}
                      </p>
                      <p className="text-[10px] text-white/40 font-mono">
                        {(asset.size / 1024).toFixed(0)} KB
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onInsertImage && onInsertImage(asset.url, asset.name)}
                          className="px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-semibold transition-colors cursor-pointer"
                        >
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(asset.url)}
                          className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                          title="Copy Image URL"
                        >
                          {copiedUrl === asset.url ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.url)}
                          className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors ml-auto cursor-pointer"
                          title="Remove from Library"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
