import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import VoiceAssistant from '@/components/VoiceAssistant';
import AuthGate from '@/components/AuthGate';
import SetupBanner from '@/components/SetupBanner';
import { ToastProvider } from '@/components/Toast';
import { AmbientBackground, AppearanceProvider } from '@/components/ds';

/**
 * Self-hosted via next/font instead of an @import from fonts.googleapis.com.
 * The @import was a render-blocking third-party request that guaranteed a
 * flash of unstyled text; next/font inlines the CSS, preloads the files and
 * generates size-adjusted fallback metrics so swapping in the real face does
 * not shift layout.
 *
 * Bricolage is display-only at 11–40px, so its weight axis is capped at 600–700
 * rather than shipping the full 400..800 × 12..96 variable range.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-bricolage',
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
};

export const metadata: Metadata = {
  title: 'VELTRIX COMMAND OS - Enterprise AI Business Execution',
  description: 'Autonomous Chief of Staff, CRM, revenue metrics, memory vault and execution pipeline for VELTRIX.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${bricolage.variable} ${jakarta.variable}`}>
      <body className="vx-root" style={{ background: 'var(--ink-900)' }}>
        <AuthGate>
          <AppearanceProvider>
            <ToastProvider>
              {/* 3D ambient deep-space backdrop */}
              <AmbientBackground />

            {/* Command-OS shell — sidebar + main column on a tilting grid */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                isolation: 'isolate',
                display: 'grid',
                gridTemplateColumns: 'var(--sidebar-w) 1fr',
                minHeight: '100vh',
              }}
            >
              <Sidebar />

              <main style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
                <Topbar />
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--space-10)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-10)',
                  }}
                >
                  <SetupBanner />
                  {children}
                </div>
              </main>
            </div>

            {/* Global Voice Assistant HUD & floating mic orb */}
            <VoiceAssistant />
            </ToastProvider>
          </AppearanceProvider>
        </AuthGate>
      </body>
    </html>
  );
}
