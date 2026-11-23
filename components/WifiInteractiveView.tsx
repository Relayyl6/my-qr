'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wifi, Copy, Check, Smartphone, Eye, EyeOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_URL } from '@/lib/config';
import { getOptimizedStorageUrl } from '@/lib/media';

export interface WifiProps {
  ssid: string;
  password?: string;
  authType: string;
  welcomeMessage?: string;
  location?: string;
  bannerUrl?: string;
  logoUrl?: string;
  wifiQrString: string;
  showBranding: boolean;
}

export default function WifiInteractiveView({
  ssid,
  password = '',
  authType = 'WPA',
  welcomeMessage,
  location,
  bannerUrl,
  logoUrl,
  wifiQrString,
  showBranding = true,
}: WifiProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F0F2EB] text-[#11140F] flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-[#2F6B4F] selection:text-white">
      <div className="w-full max-w-md my-auto space-y-6">
        
        {/* Main Wi-Fi Card */}
        <div className="bg-white rounded-2xl border border-[#11140F]/10 p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden">
          {/* Banner Image */}
          {bannerUrl ? (
            <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-4 h-36 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] overflow-hidden relative bg-black/20">
              <img
                src={getOptimizedStorageUrl(bannerUrl)}
                alt={ssid}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          ) : (
            /* Subtle Top Accent */
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#2F6B4F]" />
          )}

          {/* Header */}
          <div className="text-center space-y-2 pt-2">
            {logoUrl ? (
              <div className="w-14 h-14 mx-auto rounded-xl bg-white p-1.5 shadow-sm border border-[#11140F]/10 flex items-center justify-center">
                <img
                  src={getOptimizedStorageUrl(logoUrl)}
                  alt={ssid}
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#11140F] text-[#34D399] flex items-center justify-center shadow-xs">
                <Wifi className="w-6 h-6" />
              </div>
            )}

            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#2F6B4F] font-bold">
                Guest Wi-Fi Network
              </span>
              <h1 className="text-2xl font-black text-[#11140F] tracking-tight">
                {ssid}
              </h1>
              {location && (
                <p className="text-xs text-[#11140F]/50 font-medium mt-0.5">
                  📍 {location}
                </p>
              )}
            </div>

            {welcomeMessage && (
              <p className="text-xs text-[#11140F]/70 leading-relaxed max-w-xs mx-auto">
                {welcomeMessage}
              </p>
            )}
          </div>

          {/* Camera Auto-Join QR Code */}
          <div className="text-center space-y-2">
            <div className="p-4 bg-gray-50 rounded-md inline-block border border-gray-100 shadow-inner">
              <QRCodeSVG value={wifiQrString} size={200} level="M" />
            </div>
            <p className="text-[11.5px] text-[#11140F]/50 font-mono">
              Scan with your phone&apos;s Camera app to auto-join
            </p>
          </div>

          {/* Password & Copy Box */}
          {password && (
            <div className="p-4 rounded-md bg-[#F7F8F5] border border-[#11140F]/8 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#11140F]/60">
                <span>Network Password:</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#2F6B4F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Hide' : 'Reveal'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-[#11140F] tracking-wider select-all">
                  {showPassword ? password : '••••••••••••'}
                </span>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="px-3.5 py-1.5 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Setup Instructions */}
          <div className="pt-2 border-t border-[#11140F]/8 space-y-2 text-xs text-[#11140F]/70">
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
              <div>
                <strong>iPhone (iOS):</strong> Point your Camera at the QR code and tap the yellow <em>&quot;Join {ssid}&quot;</em> banner.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
              <div>
                <strong>Android:</strong> Point your Camera or Google Lens at the QR code and tap <em>&quot;Connect to Network&quot;</em>.
              </div>
            </div>
          </div>

        </div>

        {/* Powered by DynamicQR Footer */}
        {showBranding && (
          <div className="text-center">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/70 border border-[#11140F]/8 text-[11px] text-[#11140F]/60 hover:text-[#11140F] transition-colors"
            >
              <span>Powered by</span>
              <strong className="text-[#11140F] underline">Dynamic QR</strong>
              <span>• Dynamic Wi-Fi Sharing</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
