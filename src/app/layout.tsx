import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/shell/AppShell';
import AuthGate from '@/components/AuthGate';
import { ToastProvider } from '@/components/Toast';
import { AmbientBackground, AppearanceProvider } from '@/components/ds';

/**
 * Self-hosted via next/font instead of an @import from fonts.googleapis.com.
 * The @import was a render-blocking third-party request that guaranteed a
 * flash of unstyled text; next/font inlines the CSS, preloads the files and
 * generates size-adjusted fallback metrics so swapping in the real face does
 * not shift layout.
 *
 * Outfit (geometric sans — matches the Postel Studio wordmark: bold POSTEL +
 * light STUDIO) is display-only, so only the weights the lockup needs ship.
 */
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
  variable: '--font-outfit',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#04030C',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'PostelOS — the AI command center by Postel Studio',
    template: '%s · PostelOS',
  },
  description:
    'PostelOS — the AI command center by Postel Studio. Autonomous Chief of Staff, CRM, revenue metrics, memory vault and execution pipeline.',
  applicationName: 'PostelOS',
  openGraph: {
    type: 'website',
    siteName: 'PostelOS',
    title: 'PostelOS — the AI command center by Postel Studio',
    description: 'Autonomous Chief of Staff, CRM, revenue metrics, memory vault and execution pipeline.',
    images: [{ url: '/brand/postel-og.png', width: 1200, height: 630, alt: 'PostelOS by Postel Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PostelOS — the AI command center by Postel Studio',
    images: ['/brand/postel-og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${outfit.variable} ${jakarta.variable}`}>
      <body className="vx-root" style={{ background: 'var(--ink-900)' }}>
        <AuthGate>
          <AppearanceProvider>
            <ToastProvider>
              {/* 3D ambient deep-space backdrop */}
              <AmbientBackground />

            <AppShell>{children}</AppShell>
            </ToastProvider>
          </AppearanceProvider>
        </AuthGate>
      </body>
    </html>
  );
}
