import type { Metadata, Viewport } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import VoiceAssistant from '@/components/VoiceAssistant';
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
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Work Area Container */}
        <div className="flex-1 flex flex-col pl-64 min-h-screen">
          {/* Header Topbar */}
          <Topbar />

          {/* Page Routing Contents */}
          <main className="flex-1 pt-16 p-8 overflow-y-auto bg-transparent flex flex-col justify-between">
            <div className="max-w-7xl mx-auto space-y-6 w-full mb-auto">
              {children}
            </div>
            
            {/* Global Web App Footer */}
            <footer className="mt-16 border-t border-white/5 pt-6 text-xs text-muted-foreground font-mono w-full">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center px-4 gap-4">
                <span>© {new Date().getFullYear()} VELTRIX. All rights reserved.</span>
                <div className="flex items-center space-x-3">
                  <Link href="/privacy" className="hover:text-neon-cyan transition-colors">Privacy Policy</Link>
                  <span className="text-white/10">|</span>
                  <span className="text-muted-foreground/60">System Version 1.0.0</span>
                </div>
              </div>
            </footer>
          </main>
        </div>

        {/* Global Voice Assistant HUD & Listener */}
        <VoiceAssistant />
      </body>
    </html>
  );
}
