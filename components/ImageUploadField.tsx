'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2, Check, Sparkles } from 'lucide-react';
import { getOptimizedStorageUrl, optimizeImageInBrowser } from '@/lib/media';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  aspectRatio?: 'avatar' | 'banner' | 'dish' | 'logo' | 'square';
  variant?: 'avatar' | 'banner' | 'dish' | 'logo' | 'square';
  recommendedDimensions?: string;
  placeholder?: string;
  helpText?: string;
}

export default function ImageUploadField({
  label,
  value = '',
  onChange,
  aspectRatio: rawAspectRatio,
  variant,
  recommendedDimensions,
  placeholder = 'https://example.com/image.jpg',
  helpText,
}: ImageUploadFieldProps) {
  const aspectRatio = variant || rawAspectRatio || 'square';
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, GIF, SVG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // High-performance client-side optimization to compress multi-MB phone photos into crisp WebP (<50KB)
      const optimizedFile = await optimizeImageInBrowser(file, aspectRatio);

      const formData = new FormData();
      formData.append('file', optimizedFile);
      formData.append('folder', aspectRatio);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image to cloud storage');
      }

      onChange(data.url);
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      setError(err.message || 'Cloud upload failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#11140F] dark:text-white flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#2F6B4F] dark:text-[#34D399]" />
          <span>{label}</span>
        </label>
        {recommendedDimensions && (
          <span className="text-[10.5px] font-mono text-[#11140F]/40 dark:text-white/40">
            {recommendedDimensions}
          </span>
        )}
      </div>

      {value ? (
        /* Preview State with Remove / Replace */
        <div className="p-2.5 sm:p-3 rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-[#14161F] flex items-center justify-between gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {aspectRatio === 'avatar' && (
              <img
                src={getOptimizedStorageUrl(value)}
                alt={label}
                loading="eager"
                decoding="async"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#2F6B4F] shrink-0 shadow-xs bg-black/10"
              />
            )}
            {aspectRatio === 'banner' && (
              <img
                src={getOptimizedStorageUrl(value)}
                alt={label}
                loading="eager"
                decoding="async"
                className="w-20 h-11 rounded-lg object-cover border border-[#11140F]/10 dark:border-white/10 shrink-0 bg-black/10"
              />
            )}
            {aspectRatio === 'logo' && (
              <div className="w-11 h-11 rounded-lg bg-white p-1 border border-[#11140F]/10 flex items-center justify-center shrink-0">
                <img
                  src={getOptimizedStorageUrl(value)}
                  alt={label}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            {(aspectRatio === 'dish' || aspectRatio === 'square') && (
              <img
                src={getOptimizedStorageUrl(value)}
                alt={label}
                loading="eager"
                decoding="async"
                className="w-12 h-12 rounded-xl object-cover border border-[#11140F]/10 dark:border-white/10 shrink-0 bg-black/10"
              />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-semibold text-[#11140F] dark:text-white block truncate leading-tight">
                {label || 'Image Attached'}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3 shrink-0" /> Cloud Hosted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="px-2.5 py-1 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/10 hover:bg-[#ECEEEA] dark:hover:bg-white/20 text-[11px] font-semibold text-[#11140F] dark:text-white transition-colors cursor-pointer"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Input State */
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-[11px] font-medium text-[#11140F]/60 dark:text-white/60">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mode === 'upload'
                  ? 'bg-[#11140F] text-white dark:bg-white dark:text-[#11140F] font-bold'
                  : 'hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              Upload File
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mode === 'url'
                  ? 'bg-[#11140F] text-white dark:bg-white dark:text-[#11140F] font-bold'
                  : 'hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              Paste Image URL
            </button>
          </div>

          {mode === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#11140F]/20 dark:border-white/20 hover:border-[#2F6B4F] dark:hover:border-[#34D399] rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all bg-[#F7F8F5]/80 dark:bg-white/[0.03] hover:bg-[#F2F4EF] dark:hover:bg-white/[0.06]"
            >
              {processing ? (
                <div className="flex items-center justify-center gap-2 text-xs text-[#2F6B4F] dark:text-[#34D399] py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to cloud storage...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-5 h-5 mx-auto text-[#11140F]/40 dark:text-white/40" />
                  <div className="text-xs font-semibold text-[#11140F] dark:text-white">
                    Click to browse or drop image here
                  </div>
                  <div className="text-[10.5px] text-[#11140F]/60 dark:text-white/60">
                    PNG, JPG, WebP, GIF, SVG (Original Quality • S3 Cloud Hosted)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#11140F]/40 dark:text-white/40" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-xs bg-white dark:bg-[#14161F] text-[#11140F] dark:text-white focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-[#11140F] text-white dark:bg-white dark:text-[#11140F] text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
          {helpText && <p className="text-[10.5px] text-[#11140F]/50 dark:text-white/50">{helpText}</p>}
        </div>
      )}
    </div>
  );
}
