import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/lib/query-provider';
import { ToastProvider } from '@/components/toast';
import { ThemeProvider } from '@/lib/theme';


export const metadata: Metadata = {
  title: 'AvtoEhtiyot — Admin',
  description: 'Avtoehtiyot marketplace boshqaruv paneli',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        {/* Flash oldini olish: React ishga tushishidan oldin to'g'ri klassni qo'yadi */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('ap_theme');if(t!=='light')document.documentElement.classList.add('dark');})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

