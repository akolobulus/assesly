import React from 'react';
import { HandCoins, Trophy, School, HeartHandshake, Building2, ClipboardType } from 'lucide-react';

const whoItsForData = [
  {
    title: "Grant Providers & Nonprofits",
    description: "Simplify your grant application and review process with customizable forms and seamless applicant tracking.",
    icon: HandCoins
  },
  {
    title: "Award & Competition Organizers", 
    description: "Manage nominations, evaluations, and winner selections all in one easy-to-use platform.",
    icon: Trophy
  },
  {
    title: "Training & Skills Development Programs",
    description: "Design tailored application forms and track applicants effortlessly for upskilling and mentorship initiatives.",
    icon: School
  },
  {
    title: "Fellowship & Scholarship Programs",
    description: "Gather applications, verify credentials, and manage review cycles with precision and ease.",
    icon: HeartHandshake
  },
  {
    title: "HR & Recruitment Teams",
    description: "Streamline job and volunteer application processes with smart vetting tools and automated workflows.",
    icon: Building2
  },
  {
    title: "Custom Programs & Initiatives",
    description: "Create and manage application processes for any program type with flexible tools and automated communications.",
    icon: ClipboardType
  }
];


export function WhoItsForSection() {
  return (
    <section id='use-cases'  className="py-16 md:py-24 bg-black">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white mb-4">
            Who It's For
          </h2>
          <p className="text-lg text-gray-300">
            Vetify Works Best For:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {whoItsForData.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index} 
                className="p-6 rounded-2xl text-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div className="flex justify-center mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg bg-white flex items-center justify-center"
                    style={{
                      boxShadow: '0px 1px 3px rgba(143, 143, 143, 0.2)'
                    }}
                  >
                    <IconComponent className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}