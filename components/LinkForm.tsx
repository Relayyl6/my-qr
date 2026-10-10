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
      className="mt-4 w-full rounded-full bg-gray-900 px-4 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-black hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-gray-200"
    >
      {pending ? 'Creating...' : 'Create QR Link'}
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
    <form ref={formRef} action={formAction} className="space-y-5">
      {state.message && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-medium">{state.message}</div>}
      
      <div>
        <label className="block text-[13px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">Short Code</label>
        <div className="flex rounded-xl shadow-sm overflow-hidden border border-gray-300 focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 transition-shadow">
          <span className="inline-flex items-center border-r border-gray-300 bg-gray-50/50 px-4 text-sm text-gray-500 font-medium">
            {origin}/id/
          </span>
          <input
            type="text"
            name="shortCode"
            required
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
            className="block w-full min-w-0 flex-1 px-4 py-3 text-gray-900 placeholder:text-gray-400 sm:text-sm outline-none bg-transparent font-medium"
            placeholder="promo-2024"
          />
        </div>
        {state.errors?.shortCode && <p className="mt-2 text-xs text-red-600 font-medium">{state.errors.shortCode[0]}</p>}
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">Destination URL</label>
        <input
          type="url"
          name="destinationUrl"
          required
          className="block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 sm:text-sm outline-none transition-shadow font-medium placeholder:text-gray-400"
          placeholder="https://example.com/landing"
        />
        {state.errors?.destinationUrl && <p className="mt-2 text-xs text-red-600 font-medium">{state.errors.destinationUrl[0]}</p>}
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-gray-700 mb-2 uppercase tracking-wide">Label <span className="text-gray-400 font-normal normal-case tracking-normal">(Optional)</span></label>
        <input
          type="text"
          name="label"
          className="block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 sm:text-sm outline-none transition-shadow font-medium placeholder:text-gray-400"
          placeholder="Summer Promo Flyer"
        />
      </div>

      <SubmitBtn />
    </form>
  );
}
