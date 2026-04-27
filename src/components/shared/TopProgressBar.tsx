
"use client";

import { useEffect } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';

// nprogress.css is imported globally in src/app/globals.css

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Configure NProgress if it hasn't been configured yet.
    // This can be done once, but calling it multiple times is generally safe.
    NProgress.configure({ showSpinner: false });

    // When the effect runs for a new route, it means the basic structure of the page
    // (including this component) has rendered. We call NProgress.done() here to stop
    // the progress bar that was started by the cleanup of the previous route's effect.
    NProgress.done();

    // The cleanup function is called when the component unmounts or before the
    // effect runs again due to a dependency change (i.e., navigating away).
    // This is where we start the progress bar for the *next* navigation.
    return () => {
      NProgress.start();
    };
  }, [pathname, searchParams]); // Re-run this effect when the route changes

  return null; // NProgress injects its own DOM elements.
}
