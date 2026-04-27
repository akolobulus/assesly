
"use client";

import { Rocket } from 'lucide-react';

export default function DashboardPricingPage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <Rocket className="h-20 w-20 mx-auto text-primary mb-6" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
          New Plans Coming Soon!
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
          We're working hard to bring you exciting new pricing plans. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
}
