import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import VoiceAssistant from '@/components/VoiceAssistant';
import AuthGate from '@/components/AuthGate';
import SetupBanner from '@/components/SetupBanner';
import Link from 'next/link';

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
    <html lang="en" className="h-full bg-background text-foreground antialiased dark">
      <body className="font-sans min-h-screen bg-cyber-bg text-foreground flex">
        <AuthGate>
          {/* Navigation Sidebar */}
          <Sidebar />

          {/* Main Work Area Container */}
          <div className="flex-1 flex flex-col pl-64 min-h-screen">
            {/* Header Topbar */}
            <Topbar />

            {/* Page Routing Contents */}
            <main className="flex-1 pt-16 p-8 overflow-y-auto bg-transparent flex flex-col justify-between">
              <div className="max-w-7xl mx-auto space-y-6 w-full mb-auto">
                <SetupBanner />
                {children}
              </div>
              
            </main>
          </div>

          {/* Global Voice Assistant HUD & Listener */}
          <VoiceAssistant />
        </AuthGate>
      </body>
    </html>
  );
}

