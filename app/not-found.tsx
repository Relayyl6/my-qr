import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <h2 className="mb-4 text-4xl font-bold text-gray-900">404 - Link Not Found</h2>
      <p className="mb-8 text-lg text-gray-600">This QR code destination does not exist or has been removed.</p>
      <Link 
        href="/" 
        className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
