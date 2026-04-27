import Image from 'next/image'; // Using next/image for optimized images

const stepsData = [
  {
    id: 1,
    iconSrc: "/img/steps_img/step1.svg",
    altText: "Step 1: Numbered icon indicating the first step",
    title: 'Set Up Your Opportunity',
    description: 'Design and share your form, then track, filter, and review submissions — all in one centralized dashboard.',
  },
  {
    id: 2,
    iconSrc: "/img/steps_img/step2.svg",
    altText: "Step 2: Numbered icon indicating the second step",
    title: 'Collect & Manage Applications',
    description: 'Design and share your form, then track, filter, and review submissions — all in one centralized dashboard.',
  },
  {
    id: 3,
    iconSrc: "/img/steps_img/step3.svg",
    altText: "Step 3: Numbered icon indicating the third step",
    title: 'Select & Notify with Ease',
    description: 'Design and share your form, then track, filter, and review submissions — all in one centralized dashboard.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        {/* Centered Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-[48px] font-bold text-foreground leading-tight">
            How <span className="text-primary">Assesly</span> builder works?
          </h2>
        </div>

        {/* Dotted line background - hidden on mobile */}
        <div className="hidden md:flex absolute inset-0 justify-center items-center pointer-events-none">
          <div className="relative w-[60%] h-[60%]">
            <Image
              src="/img/steps_img/dotted-line.svg"
              alt="Dotted connector"
              layout="fill"
              objectFit="contain"
              className="z-0"
            />
          </div>
        </div>

        {/* Steps Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
          {stepsData.map((step) => (
            <div
              key={step.id}
              className="flex flex-col items-center text-center space-y-4"
            >
              {/* Larger Step Icon */}
              <Image
                src={step.iconSrc}
                alt={step.altText}
                width={96} // Increased size
                height={96} // Increased size
                className="drop-shadow-lg"
              />
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
