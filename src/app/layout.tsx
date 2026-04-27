
import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { TopProgressBar } from '@/components/shared/TopProgressBar';
import { Suspense } from 'react';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap', // Added display: 'swap'
});

export const metadata: Metadata = {
  title: 'Assesly - Build Beautiful Forms Easily',
  description: 'Create, manage, and share forms with Assesly. Powerful features, intuitive design.',
  openGraph: {
    title: 'Assesly - Build Beautiful Forms Easily',
    description: 'Create, manage, and share forms with Assesly. Powerful features, intuitive design.',
    images: [{ url: '/img/logo.png' }] // Default social image
  },
  icons: {
    icon: '/img/logo.png',
    shortcut: '/img/logo.png',
    apple: '/img/logo.png',
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/img/logo.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${figtree.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
