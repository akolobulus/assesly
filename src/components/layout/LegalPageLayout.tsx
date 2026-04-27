
import type React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';

interface LegalPageLayoutProps {
  pageTitle: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ pageTitle, children }: LegalPageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <nav className="mb-8 text-sm text-muted-foreground">
            <ol className="list-none p-0 inline-flex items-center">
              <li className="flex items-center">
                <Link href="/" className="hover:text-primary">Home</Link>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-foreground font-medium">{pageTitle}</span>
              </li>
            </ol>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {pageTitle}
          </h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none lg:prose-lg">
            {children}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
