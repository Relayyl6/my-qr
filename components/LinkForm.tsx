'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createLink } from '@/app/actions';
import { useState, useEffect, useRef } from 'react';

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
  const [origin, setOrigin] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setShortCode('');
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 sm:space-y-5">
      {state.message && (
        <div className="rounded-xl border border-[#B8842E]/30 bg-[#B8842E]/10 p-3 text-[13px] text-[#8A631F] font-medium">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="shortCode" className="block text-[13px] font-medium text-[#11140F]/70 mb-1.5">
          Short code
        </label>
        <div className="flex rounded-xl overflow-hidden border border-[#11140F]/15 bg-white focus-within:border-[#11140F] transition-colors">
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
            onChange={(e) => setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
            className="block w-full min-w-0 flex-1 px-3 py-2.5 sm:py-3 text-[#11140F] placeholder:text-[#11140F]/30 text-[14px] outline-none bg-transparent"
            style={{ fontFamily: 'var(--font-mono)' }}
            placeholder="promo-2024"
          />
        </div>
        {/* Real-time live URL preview */}
        <p className="mt-1.5 text-[11px] sm:text-[12px] text-[#11140F]/50 break-all" style={{ fontFamily: 'var(--font-mono)' }}>
          Preview: <span className="text-[#11140F]/80 font-medium">{origin || 'https://dynamicqr.co'}/id/{shortCode || 'promo-2024'}</span>
        </p>
        {state.errors?.shortCode && (
          <p className="mt-1 text-[12px] text-[#B8842E] font-medium">{state.errors.shortCode[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="destinationUrl" className="block text-[13px] font-medium text-[#11140F]/70 mb-1.5">
          Destination URL
        </label>
        <input
          id="destinationUrl"
          type="url"
          name="destinationUrl"
          required
          className="block w-full rounded-xl border border-[#11140F]/15 bg-white px-3 py-2.5 sm:py-3 text-[14px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors"
          placeholder="https://example.com/landing"
        />
        {state.errors?.destinationUrl && (
          <p className="mt-1 text-[12px] text-[#B8842E] font-medium">{state.errors.destinationUrl[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="label" className="block text-[13px] font-medium text-[#11140F]/70 mb-1.5">
          Label <span className="text-[#11140F]/35 font-normal">(optional)</span>
        </label>
        <input
          id="label"
          type="text"
          name="label"
          className="block w-full rounded-xl border border-[#11140F]/15 bg-white px-3 py-2.5 sm:py-3 text-[14px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors"
          placeholder="Summer promo flyer"
        />
      </div>

      <SubmitBtn />
    </form>
  );
}
