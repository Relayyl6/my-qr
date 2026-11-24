import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Suspense } from 'react';
import SiteVisitorTracker from '@/components/SiteVisitorTracker';
import EntryPromoModal from '@/components/EntryPromoModal';
import ThemeProvider from '@/components/ThemeProvider';
import { APP_URL } from '@/lib/config';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'DynamicQR — Intelligent Dynamic QR Code Routing & Micro-SaaS Hub',
    template: '%s | DynamicQR',
  },
  description: 'A QR code you print once. A destination you can change forever. Intelligent dynamic QR routing with live scan analytics, digital vCards, menus, and Wi-Fi.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'DynamicQR — Intelligent Dynamic QR Code Routing & Micro-SaaS Hub',
    description: 'A QR code you print once. A destination you can change forever. Intelligent dynamic QR routing with live scan analytics, digital vCards, menus, and Wi-Fi.',
    url: APP_URL,
    siteName: 'DynamicQR',
    images: [
      {
        url: `${APP_URL}/icon.svg`,
        width: 800,
        height: 800,
        alt: 'DynamicQR Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DynamicQR — Intelligent Dynamic QR Code Routing',
    description: 'A QR code you print once. A destination you can change forever.',
    images: [`${APP_URL}/icon.svg`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('dynamicqr_theme') || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#F7F7F5] dark:bg-[#080907] min-h-screen text-gray-900 dark:text-[#EEF0EA] transition-colors duration-200`}>
        <ThemeProvider />
        <Suspense fallback={null}>
          <EntryPromoModal />
          <SiteVisitorTracker />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  );
}
