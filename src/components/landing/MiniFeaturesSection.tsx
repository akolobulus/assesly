import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, LayoutDashboard , UsersRound } from 'lucide-react';

const miniFeatures = [
  {
    icon: <BookText className="h-8 w-8 text-red-500" />,
    title: 'Custom Forms',
    description: 'Collect and manage applications using powerful, customizable forms tailored to your specific program',
  },
  {
    icon: <LayoutDashboard  className="h-8 w-8 text-red-500" />,
    title: 'Centralized Dashboard',
    description: 'Track and review submissions with a centralized dashboard that simplifies scoring, sorting, and',
  },
  {
    icon: <UsersRound className="h-8 w-8 text-red-500" />,
    title: 'Multi-User Access',
    description: 'Track and review submissions with a centralized dashboard that simplifies scoring, sorting, and',
  },
];

export function MiniFeaturesSection() {
  return (
    <section id="mini-features" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header Section */}
     {/* Header Section */}
  <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
    <div>
      <h2 className="text-4xl font-semibold md:text-5xl text-black leading-tight">
        Discover the Smarter Way to Handle Applications!
      </h2>
    </div>
    <div className="space-y-6">
      <p className="text-base text-gray-700 leading-relaxed">
        Traditional tools like Google Forms weren't built for high-stakes opportunities. Assesly solves the chaos with smart workflows, automated vetting, and seamless applicant tracking — so you can focus on impact, not admin.
      </p>
      <Button className="bg-red-500 hover:bg-red-600 text-white px-8 py-3">
        Get-Started
      </Button>
    </div>
  </div>
        
        {/* Features Grid */}
     <div className="grid gap-8 md:grid-cols-3">
  {miniFeatures.map((feature, index) => (
    <div 
      key={index} 
      className="p-0 transition-transform duration-300 transform hover:scale-105 cursor-pointer"
    >
      <div className="space-y-4">
        <div className="w-12 h-12 flex items-center bg-white justify-center rounded-md" 
       
                    style={{
                      boxShadow: '0px 1px 3px rgba(143, 143, 143, 0.2)'
                    }}>
          {feature.icon}
        </div>
        <h3 className="text-xl font-semibold text-black">
          {feature.title}
        </h3>
      </div>
      <div className="mt-4">
        <p className="text-gray-600 leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  ))}
</div>

      </div>
    </section>
  );
}