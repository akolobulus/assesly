
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page now redirects to /dashboard/forms
export default function FoldersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/forms');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Loading...</p>
    </div>
  );
}
