import React, { useState, useEffect } from 'react';

const asseslyFeatures = [
  "Lets you assign reviewers and track decisions.",
  "Central dashboard to manage, filter, and sort submissions.",
  "Set custom criteria, deadlines, and restrictions per opportunity.",
  "Supports multi-user access with role-based permissions.",
];

const googleFormsLimitations = [
  "No built-in support for review or scoring workflows.",
  "Responses are stored in a spreadsheet with no filtering tools.",
  "Limited control over eligibility and submission rules.",
  "Offers basic edit access with no role controls.",
];

function AsseslyListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 17 16" fill="none">
      <rect x="0.905029" width="16" height="16" rx="8" fill="#DD5B2B" fillOpacity="0.2" />
      <rect x="4.90503" y="4" width="8" height="8" rx="4" fill="#E13530" />
    </svg>
  );
}

function GoogleFormsListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="8" fill="#8F9398" fillOpacity="0.2" />
      <rect x="4" y="4" width="8" height="8" rx="4" fill="#898C91" />
    </svg>
  );
}

export function WhyUsSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <section id='benefits' className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">
            Why Choose <span className="text-red-500">Assesly</span> Over Google Forms?
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600">
            Google Forms is a good start, but Assesly takes your process to the next level:
          </p>
        </div>

        {/* Card Container */}
        <div
          className={`md:p-8 lg:p-12 md:mx-4 lg:mx-8 rounded-[24px] ${isMobile ? '' : 'bg-[#F8F8FA]'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Assesly Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 md:min-h-[500px] flex flex-col">
              <div className="mb-8">
                <img
                  src="img/logo.png"
                  alt="Assesly Logo"
                  className="h-16 md:h-24 w-auto"
                />
              </div>
              <hr className="border-gray-200 mb-8" />
              <ul className="space-y-6 text-[16px] flex-1">
                {asseslyFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AsseslyListIcon />
                    </div>
                    <span className="text-gray-700 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Google Forms Card */}
            <div
              className={`rounded-xl p-8 md:min-h-[380px] flex flex-col ${isMobile ? 'bg-white shadow-lg' : ''}`}
              style={{
                backgroundColor: isMobile ? '#FFFFFF' : 'transparent',
                boxShadow: isMobile ? '' : 'none'
              }}
            >
              <div className="mb-8">
                <img
                  src="img/google_forms_logo.png"
                  alt="Google Forms Logo"
                  className="h-14 md:h-20 w-auto"
                />
              </div>
              <hr className="border-gray-200 mb-8" />
              <ul className="space-y-6 text-[16px] flex-1">
                {googleFormsLimitations.map((limitation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <GoogleFormsListIcon />
                    </div>
                    <span className="text-gray-700 leading-relaxed">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
