import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CircleCheck } from 'lucide-react';

const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
  const anchor = e.currentTarget;
  const href = anchor.getAttribute('href');
  if (href && href.startsWith('/#')) {
    e.preventDefault();
    const targetId = href.substring(2);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

export function HeroSection() {
  const features = [
    { text: "Easy-to-Use Form Builder" },
    { text: "Smart Applicant Filtering" },
    { text: "Role-Based Team Access" },
  ];

  return (
    <section
      id="hero"
      className="py-10 md:py-20 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 40%, rgba(225, 53, 48, 0.1) 70%, rgba(225, 53, 48, 0.8) 100%)',
      }}
    >
      <div className="container mx-auto px-4 md:px-6 text-center">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-foreground">
          Streamline Applications &<br className="hidden md:block" />
          Vetting with Ease
        </h1>
        <p className="mt-6 max-w-4xl mx-auto text-lg md:text-xl text-black font-normal">
          Assesly empowers organizations to create, manage, and automate grant, award, fellowship, and job
          application processes — all in one powerful web-based platform.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/#how-it-works" onClick={handleSmoothScroll}>
              See How it Works
            </Link>
          </Button>
        </div>
        <div className="mt-10">
          <ul className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-black text-base">
                <CircleCheck fill="#E13530" stroke="#fff" className="h-5 w-5 text-primary mr-2" />
                {feature.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Image Section */}
      <div className="container mx-auto px-4 md:px-6 mt-16 md:mt-20">
        <div className="relative w-full max-w-6xl mx-auto rounded-xl shadow-2xl overflow-hidden h-[420px] md:h-[480px] lg:h-[520px]">
          <Image
             src="/img/Assesly-formBuilder.png"
            alt="Assesly Platform Showcase"
            fill
            className="object-cover object-top transform hover:scale-105 transition-transform duration-300"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-red-500/20 pointer-events-none" />
        </div>
      </div>

      {/* Background Radial Effect */}
      <div
        className="absolute -bottom-1/4 left-0 right-0 h-3/4 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom center, rgba(225, 53, 48, 0.4) 0%, rgba(225, 53, 48, 0.2) 40%, transparent 70%)',
        }}
      />
    </section>
  );
}
