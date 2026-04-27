import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section id="cta" className="bg-white py-16 md:py-24">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(to right, #E13530 80%, rgba(234, 0, 0, 0.05) 100%)' }}>
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left Content Section */}
            <div className="flex-1 p-8 md:p-12 lg:p-16 text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Get started with<br />
                Assesly today
              </h1>
              <p className="text-lg md:text-xl text-red-100 mb-8 max-w-lg leading-relaxed">
                Whether you're launching a grant or running a global competition,
                Assesly gives you the control, speed, and tools you need.
              </p>
              <Button asChild className="bg-white text-red-500 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-red-50 transition-colors shadow-lg">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Right Image Section */}
            <div className="flex-1 relative p-4 lg:p-8">
              <img 
                src="/img/Assesly-formBuilder.png" 
                alt="Assesly Dashboard Preview" 
                className="w-full h-auto rounded-2xl shadow-2xl transform rotate-3 hover:rotate-1 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
