import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'VillaVista - Search & Book Homestays, Villas & Apartments',
  description:
    'Search and compare hundreds of homestays, luxury villas, beach houses, and cozy apartments around the world on VillaVista.',
  icons: { icon: '/logo1.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <Script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="min-h-[60vh]">{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
