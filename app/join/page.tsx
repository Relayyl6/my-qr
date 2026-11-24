import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { APP_URL } from '@/lib/config';
import JoinSignupView from '@/components/JoinSignupView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Sign Up Free — DynamicQR | Claim Your Digital vCard & QR Routing',
  description: 'Create your free DynamicQR account in 10 seconds. Get your permanent scannable digital vCard, dynamic redirects, and real-time scan analytics.',
  alternates: {
    canonical: `${APP_URL}/join`,
  },
  openGraph: {
    title: 'Sign Up Free — DynamicQR | Claim Your Digital vCard & QR Routing',
    description: 'Create your free DynamicQR account in 10 seconds. Get your permanent scannable digital vCard, dynamic redirects, and real-time scan analytics.',
    url: `${APP_URL}/join`,
    siteName: 'DynamicQR',
    type: 'website',
    images: [
      {
        url: `${APP_URL}/icon.svg`,
        width: 800,
        height: 800,
        alt: 'DynamicQR Sign Up',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Sign Up Free — DynamicQR | Claim Your Digital vCard',
    description: 'Create your free DynamicQR account in 10 seconds. Scannable RFC 6350 vCards, dynamic QR redirects, and scan analytics.',
    images: [`${APP_URL}/icon.svg`],
  },
};

export default async function JoinPage() {
  const user = await getCurrentUser();

  // If already logged in, redirect directly to user's vCard section in workspace
  if (user) {
    redirect('/?section=vcard#workspace');
  }

  return <JoinSignupView />;
}
