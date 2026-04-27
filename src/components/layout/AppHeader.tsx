
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react'; 
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import type React from 'react';

const navLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#benefits', label: 'Benefits' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#use-cases', label: 'Use cases' }, 
  { href: '/pricing', label: 'Pricing' },
];

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

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
        </Link>
        
        <nav className="hidden md:flex items-center space-x-10  font-medium text-[16px]">
          {navLinks.map((link) => (
            <Link
              key={link.label} 
              href={link.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              onClick={link.href.startsWith('/#') ? handleSmoothScroll : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button size="sm" asChild className="hidden sm:flex">
            <Link href="/signup">Get-Started</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full h-full p-0 flex flex-col">
              {/* Mobile Sheet Header - SheetContent provides its own X button at top-right */}
              <div className="flex items-center p-6 border-b">
                <Logo />
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex-grow overflow-y-auto">
                {navLinks.map((link, index) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "block px-6 py-4 text-base font-medium text-foreground/90 hover:text-primary hover:bg-accent/50",
                      index < navLinks.length - 1 && "border-b"
                    )}
                    onClick={link.href.startsWith('/#') ? handleSmoothScroll : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Sheet Footer Buttons */}
              <div className="p-6 mt-auto border-t space-y-3">
                <Button className="w-full" size="lg" asChild>
                  <Link href="/signup">Get-Started</Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
