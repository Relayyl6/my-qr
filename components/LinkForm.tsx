'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createLink } from '@/app/actions';
import { useState, useEffect, useRef } from 'react';
import { enrichUrlAction, EnrichedUrlResult } from '@/lib/ai/features/url-enricher';
import { Sparkles, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-xl bg-[#11140F] px-4 py-3 sm:py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2A2E25] disabled:opacity-50"
    >
      {pending ? 'Creating link…' : 'Create QR link'}
    </button>
  );
}

export default function LinkForm() {
  const [state, formAction] = useFormState(createLink, {});
  const [shortCode, setShortCode] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [label, setLabel] = useState('');
  const [origin, setOrigin] = useState('');
  const [isAiSuggested, setIsAiSuggested] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<EnrichedUrlResult | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setShortCode('');
      setDestinationUrl('');
      setLabel('');
      setIsAiSuggested(false);
      setEnrichmentData(null);
    }
  }, [state.success]);

  const handleEnrich = async (urlToEnrich?: string) => {
    const target = urlToEnrich || destinationUrl;
    if (!target || !target.startsWith('http')) return;

    setIsEnriching(true);
    try {
      const res = await enrichUrlAction(target);
      setEnrichmentData(res);

      if (res.aiSuggestion) {
        if (!shortCode || isAiSuggested) {
          setShortCode(res.aiSuggestion.shortCode);
          setIsAiSuggested(true);
        }
        if (!label && res.aiSuggestion.label) {
          setLabel(res.aiSuggestion.label);
        }
      }
    } catch (err) {
      console.error('Enrichment failed:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  const handlePasteDestination = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted.startsWith('http://') || pasted.startsWith('https://')) {
      setDestinationUrl(pasted);
      // Automatically trigger enrichment on paste
      setTimeout(() => handleEnrich(pasted), 50);
    }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-4 sm:space-y-5 w-full min-w-0 max-w-full">
      {state.message && (
        <div className="rounded-xl border border-[#B8842E]/30 bg-[#B8842E]/10 p-3 text-[13px] text-[#8A631F] font-medium flex items-center justify-between gap-2">
          <span>{state.message}</span>
          {state.message.toLowerCase().includes('upgrade') && (
            <a href="/pricing" className="underline font-bold text-[#11140F] shrink-0 hover:opacity-80">
              View Plans &rarr;
            </a>
          )}
        </div>
      )}

      {/* Destination URL & AI Enricher Trigger */}
      <div className="w-full min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="destinationUrl" className="block text-[13px] font-medium text-[#11140F]/70">
            Destination URL
          </label>
          <button
            type="button"
            onClick={() => handleEnrich()}
            disabled={isEnriching || !destinationUrl}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            {isEnriching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing page…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Auto-Enrich with AI
              </>
            )}
          </button>
        </div>
        <input
          id="destinationUrl"
          type="url"
          name="destinationUrl"
          required
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          onPaste={handlePasteDestination}
          className="block w-full min-w-0 rounded-xl border border-[#11140F]/15 bg-white px-3 py-2.5 sm:py-3 text-[14px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors"
          placeholder="https://example.com/landing"
        />
        {state.errors?.destinationUrl && (
          <p className="mt-1 text-[12px] text-[#B8842E] font-medium">{state.errors.destinationUrl[0]}</p>
        )}
      </div>

      {/* Health Check Warning Banner */}
      {enrichmentData?.health && !enrichmentData.health.isHealthy && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-[12.5px] text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Pre-Print Health Warning</span>
          </div>
          <p className="text-amber-800/90 text-[12px]">
            Checking destination before you print physical flyers:
          </p>
          <ul className="list-disc list-inside text-[11.5px] text-amber-900/80 pl-1 space-y-0.5">
            {enrichmentData.health.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Suggestion Metadata Pill */}
      {enrichmentData?.aiSuggestion && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-[12px] text-emerald-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Page verified & analyzed</span>
            <span className="text-[11px] text-emerald-700/70">
              ({enrichmentData.latencyMs}ms{enrichmentData.cached ? ' • cached' : ''})
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-medium">
              {enrichmentData.aiSuggestion.category}
            </span>
            {enrichmentData.aiSuggestion.suggestedTags?.map((tag, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded bg-white/80 border border-emerald-200 text-emerald-700 text-[10.5px]">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Short Code Field */}
      <div className="w-full min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="shortCode" className="block text-[13px] font-medium text-[#11140F]/70">
            Short code
          </label>
          {isAiSuggested && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              AI Suggested
            </span>
          )}
        </div>
        <div className="flex w-full min-w-0 rounded-xl overflow-hidden border border-[#11140F]/15 bg-white focus-within:border-[#11140F] transition-colors">
          <span
            className="inline-flex items-center border-r border-[#11140F]/10 bg-[#11140F]/[0.03] px-3 text-[13px] text-[#11140F]/45 select-none shrink-0"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            /id/
          </span>
          <input
            id="shortCode"
            type="text"
            name="shortCode"
            required
            value={shortCode}
            onChange={(e) => {
              setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''));
              setIsAiSuggested(false);
            }}
            className="block w-full min-w-0 flex-1 px-3 py-2.5 sm:py-3 text-[#11140F] placeholder:text-[#11140F]/30 text-[14px] outline-none bg-transparent"
            style={{ fontFamily: 'var(--font-mono)' }}
            placeholder="promo-2024"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#11140F]/50 break-all leading-normal" style={{ fontFamily: 'var(--font-mono)' }}>
          Preview: <span className="text-[#11140F]/80 font-medium break-all">{origin || 'https://dynamicqr.co'}/id/{shortCode || 'promo-2024'}</span>
        </p>
        {state.errors?.shortCode && (
          <p className="mt-1 text-[12px] text-[#B8842E] font-medium">{state.errors.shortCode[0]}</p>
        )}
      </div>

      {/* Label Field */}
      <div className="w-full min-w-0">
        <label htmlFor="label" className="block text-[13px] font-medium text-[#11140F]/70 mb-1.5">
          Label <span className="text-[#11140F]/35 font-normal">(optional)</span>
        </label>
        <input
          id="label"
          type="text"
          name="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="block w-full min-w-0 rounded-xl border border-[#11140F]/15 bg-white px-3 py-2.5 sm:py-3 text-[14px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors"
          placeholder="Summer promo flyer"
        />
      </div>

      <SubmitBtn />
    </form>
  );
}
