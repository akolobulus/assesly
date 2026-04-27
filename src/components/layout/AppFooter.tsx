
"use client";

import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import type React from 'react';

const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
  const anchor = e.currentTarget;
  const href = anchor.getAttribute('href');
  if (href && href.startsWith('/#')) {
    e.preventDefault();
    const targetId = href.substring(2);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
      });
    }
  }
};

export function AppFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-black text-background border-t border-transparent"> {/* Ensure border doesn't conflict with dark bg */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="mb-2 inline-block">
              <Logo />
            </Link>
            <p className="text-sm text-background/80 leading-relaxed">
            Launching a grant or running a global competition? 
            Assesly gives you the control, speed, and tools you need. 
            </p>
            <p className="text-sm text-background/70">&copy; {currentYear} Assesly</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-background mb-6">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/#features" 
                  className="text-background/80 hover:text-primary transition-colors"
                  onClick={handleSmoothScroll}
                >
                  Features
                </Link>
              </li>
              <li><Link href="/pricing" className="text-background/80 hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-background mb-6">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-background/80 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-background/80 hover:text-primary transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
