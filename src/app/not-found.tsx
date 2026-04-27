
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';

// QuestionMarkSvg component removed

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FCFCFD] p-4 relative overflow-hidden">
      {/* Decorative question marks removed */}

      <main className="z-10 flex flex-col items-center text-center">
        <h1 className="text-8xl sm:text-9xl font-extrabold text-primary tracking-tighter">
          Oops
        </h1>
        <p className="mt-4 text-xl sm:text-2xl font-medium text-primary">
          404, you seem to be lost
        </p>
        <Button
          variant="outline"
          className="mt-10 px-8 py-3 text-lg border-primary text-primary hover:bg-primary/10 hover:text-primary focus:ring-primary"
          asChild
        >
          <Link href="/">Home</Link>
        </Button>
      </main>
    </div>
  );
}
