import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import VoiceAssistant from '@/components/VoiceAssistant';
import AuthGate from '@/components/AuthGate';
import SetupBanner from '@/components/SetupBanner';
import { ToastProvider } from '@/components/Toast';
import { AmbientBackground, AppearanceProvider } from '@/components/ds';

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
    <html lang="en" className="h-full antialiased dark">
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
