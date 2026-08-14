import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from 'next/font/google';
import { AuthRecoveryListener } from '@/components/AuthRecoveryListener';
import { ImpersonationBar } from '@/components/ImpersonationBar';
import { LanguageProvider } from '@/components/LanguageProvider';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lucky — Meet the people already around you',
  description: 'Dating. Business. Social. Right here, right now.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lucky',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0B0A08',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <AuthRecoveryListener />
        <ImpersonationBar />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
