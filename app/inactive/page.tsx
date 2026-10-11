import Link from 'next/link';

export default function InactivePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF0EA] px-4 text-center text-[#11140F]">
      <div className="max-w-md rounded-2xl border border-[#11140F]/10 bg-white p-8 sm:p-10 shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B8842E]/10 text-[#B8842E] text-xl font-bold">
          ⏸
        </div>
        <h1 className="text-2xl font-medium tracking-tight">QR Code Paused</h1>
        <p className="text-sm text-[#11140F]/60 leading-relaxed">
          The owner of this QR code has temporarily archived or paused this link. Please check back later.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block rounded-full bg-[#11140F] px-5 py-2.5 text-xs font-medium text-[#EEF0EA] hover:bg-[#2A2E25] transition-colors"
          >
            Create your own dynamic QR
          </Link>
        </div>
      </div>
    </div>
  );
}
