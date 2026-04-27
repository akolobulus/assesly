
"use client";

import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { Rocket } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Rocket className="h-20 w-20 mx-auto text-primary mb-6" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
            New Plans Coming Soon!
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
            We're working hard to bring you exciting new pricing plans. Stay tuned for updates!
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
