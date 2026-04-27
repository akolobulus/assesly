
"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { HeroSection } from '@/components/landing/HeroSection';
import { MiniFeaturesSection } from '@/components/landing/MiniFeaturesSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { WhyUsSection } from '@/components/landing/WhyUsSection';
import { WhoItsForSection } from '@/components/landing/WhoItsForSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
  const { setTheme } = useTheme();
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Set theme to light for landing page
    setTheme('light');
    
    // Get the auth instance only on the client-side
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, redirect to dashboard/forms
        router.replace('/dashboard/forms');
        // No need to setLoadingAuth(false) here as we are redirecting
      } else {
        // User is not logged in, allow landing page to render
        setLoadingAuth(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [setTheme, router]);

  if (loadingAuth) {
    // Optional: Show a loading indicator while auth state is being checked
    // This prevents a flash of the landing page if the user is already logged in.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow">
        <HeroSection />
        <MiniFeaturesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WhyUsSection />
        <WhoItsForSection />
        <FaqSection />
        <CtaSection />
      </main>
      <AppFooter />
    </div>
  );
}
