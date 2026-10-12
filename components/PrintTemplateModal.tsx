'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, LayoutTemplate, Store, CreditCard, Sparkles, Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortCode: string;
  label?: string | null;
  url: string;
}

type TemplateType = 'table-tent' | 'window-sign' | 'card-badge';

export default function PrintTemplateModal({ isOpen, onClose, shortCode, label, url }: Props) {
  const [template, setTemplate] = useState<TemplateType>('table-tent');
  const [headline, setHeadline] = useState(label || 'Scan to Open');
  const [subline, setSubline] = useState('Point your camera at this code');
  const [footerNote, setFooterNote] = useState('No app required • Instant redirect');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Container Card */}
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#11140F]/15 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Controls & Customization */}
        <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#11140F]/10 space-y-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-[#11140F]">Print-Ready Physical Templates</h3>
              </div>
              <button
                onClick={onClose}
                className="text-[#11140F]/40 hover:text-[#11140F] p-1 rounded-lg transition-colors md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-[#11140F]/70 uppercase tracking-wider block">
                Choose Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTemplate('table-tent');
                    setHeadline(label || 'Table Menu & Specials');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                    template === 'table-tent'
                      ? 'border-[#11140F] bg-[#11140F] text-white shadow-sm'
                      : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                  }`}
                >
                  <LayoutTemplate className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold">Table Tent</div>
                    <div className={`text-[10px] ${template === 'table-tent' ? 'text-white/70' : 'text-[#11140F]/50'}`}>4" × 6" Menu</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplate('window-sign');
                    setHeadline(label || 'SCAN HERE');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                    template === 'window-sign'
                      ? 'border-[#11140F] bg-[#11140F] text-white shadow-sm'
                      : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                  }`}
                >
                  <Store className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold">Window Sign</div>
                    <div className={`text-[10px] ${template === 'window-sign' ? 'text-white/70' : 'text-[#11140F]/50'}`}>8" × 8" Sticker</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplate('card-badge');
                    setHeadline(label || 'Event Badge');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                    template === 'card-badge'
                      ? 'border-[#11140F] bg-[#11140F] text-white shadow-sm'
                      : 'border-[#11140F]/15 bg-white text-[#11140F] hover:bg-[#EEF0EA]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-[12px] font-semibold">Badge Card</div>
                    <div className={`text-[10px] ${template === 'card-badge' ? 'text-white/70' : 'text-[#11140F]/50'}`}>3.5" × 2" Pocket</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Customization Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#11140F]/70 block mb-1">Headline Text</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                  placeholder="Scan for Menu"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#11140F]/70 block mb-1">Instruction Subline</label>
                <input
                  type="text"
                  value={subline}
                  onChange={(e) => setSubline(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                  placeholder="Point your phone camera"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#11140F]/70 block mb-1">Footer Note</label>
                <input
                  type="text"
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#11140F]/15 rounded-xl outline-none focus:border-[#11140F]"
                  placeholder="Free guest Wi-Fi"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-[#11140F] text-white text-[14px] font-medium hover:bg-[#2A2E25] transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-[#11140F]/15 text-[#11140F] text-[14px] font-medium hover:bg-[#EEF0EA] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right Side: Live Printable Preview */}
        <div className="p-6 md:p-8 md:w-1/2 bg-[#EEF0EA]/70 flex items-center justify-center overflow-auto min-h-[380px]">
          {/* Printable Sheet Wrapper */}
          <div
            id="print-sheet"
            className={`bg-white shadow-xl transition-all flex flex-col items-center justify-between border border-[#11140F]/15 text-center ${
              template === 'table-tent'
                ? 'w-[280px] h-[390px] p-6 rounded-2xl'
                : template === 'window-sign'
                ? 'w-[320px] h-[320px] p-6 rounded-2xl'
                : 'w-[340px] h-[210px] p-4 rounded-xl flex-row text-left'
            }`}
          >
            {template === 'card-badge' ? (
              // Horizontal Card Layout
              <div className="flex items-center justify-between w-full gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#2F6B4F] font-bold">
                    DynamicQR
                  </div>
                  <h4 className="font-bold text-[16px] text-[#11140F] leading-tight truncate">
                    {headline}
                  </h4>
                  <p className="text-[11px] text-[#11140F]/65">{subline}</p>
                  <div className="pt-1 font-mono text-[10px] text-[#11140F]/50 truncate">
                    /{shortCode}
                  </div>
                </div>

                <div className="p-2 border border-[#11140F]/10 rounded-xl bg-white shadow-xs shrink-0">
                  <QRCodeSVG value={url} size={96} level="H" />
                </div>
              </div>
            ) : (
              // Vertical / Square Posters
              <>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#2F6B4F] font-bold">
                    Official Scan Point
                  </div>
                  <h4 className="font-bold text-[20px] text-[#11140F] leading-tight tracking-tight">
                    {headline}
                  </h4>
                  <p className="text-[12px] text-[#11140F]/65">{subline}</p>
                </div>

                <div className="p-3 border-2 border-[#11140F] rounded-2xl bg-white shadow-sm my-2">
                  <QRCodeSVG value={url} size={template === 'window-sign' ? 140 : 130} level="H" />
                </div>

                <div className="space-y-1">
                  <div className="inline-block px-3 py-1 rounded-full bg-[#11140F] text-white text-[11px] font-mono">
                    /{shortCode}
                  </div>
                  <p className="text-[10px] text-[#11140F]/50">{footerNote}</p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Global Print Media Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-sheet, #print-sheet * {
            visibility: visible !important;
          }
          #print-sheet {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
