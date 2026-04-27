import React, { useState } from 'react';
import { FileText, Database, Signal, Filter, TrendingUp, ChevronDown } from 'lucide-react';

const featuresData = [
  {
    id: 'form-builder',
    icon: FileText,
    title: 'Custom Form Builder',
    description: 'Drag-and-drop interface with flexible question types',
    image: '/img/features_img_1.png',
    dataAiHint: 'form builder interface'
  },
  {
    id: 'application-manager',
    icon: Database,
    title: 'Application Manager',
    description: 'View, sort, filter, and tag applicants',
    image: '/img/features_img_2.png',
    dataAiHint: 'data management dashboard'
  },
  {
    id: 'reviewer-access',
    icon: Signal,
    title: 'Reviewer Access & Workflows',
    description: 'Assign scoring tasks to judges or staff',
    image: '/img/features_img_3.png',
    dataAiHint: 'collaboration workflow'
  },
  {
    id: 'smart-filtering',
    icon: Filter,
    title: 'Smart Filtering & Ranking',
    description: 'Automatically Screen for Qualified Candidates', 
    image: '/img/features_img_4.png',
    dataAiHint: 'filter rank system'
  },
  {
    id: 'reports-analytics',
    icon: TrendingUp,
    title: 'Reports & Analytics',
    description: 'Monitor everything from submissions to decisions in one place.',
    image: '/img/features_img_5.png',
    dataAiHint: 'charts graphs'
  }
];

export  function FeaturesSection() {
  const [activeTab, setActiveTab] = useState('form-builder');
  const [expandedMobile, setExpandedMobile] = useState('form-builder');

  const activeFeature = featuresData.find(f => f.id === activeTab);

  return (
    <section id="features" className="py-16 md:py-24 bg-white min-h-screen" >
      <div className="container mx-auto px-4 md:px-6 max-w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Powerful Features Built for Seamless<br />
            Application Management
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            From form creation to final selection, Assesly equips your team with the tools to manage every
            step of the application journey — faster, smarter, and with less manual work.
          </p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block max-w-7xl mx-auto">
          {/* Feature Cards Row */}
          <div className="bg-gray-100 p-4 rounded-2xl mb-12" style={{backgroundColor: '#F8F8FA'}}>
            <div className="grid grid-cols-5 gap-6">
              {featuresData.map((feature) => {
                const IconComponent = feature.icon;
                const isActive = activeTab === feature.id;

                return (
                  <div
                    key={feature.id}
                    onClick={() => setActiveTab(feature.id)}
                    className={`cursor-pointer transition-all duration-300 p-4 rounded-xl ${
                      isActive ? 'bg-white shadow-md' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 p-2  rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-red-500' : 'bg-white border border-gray-200'
                      }`}>
                        <IconComponent
                          className={`h-6 w-6 ${
                            isActive ? 'text-white' : 'text-black'
                          }`}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                   {feature.description}
               </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Large Image Display */}
          {activeFeature && (
            <div className="relative">
            <div className="flex justify-center rounded-3xl overflow-hidden shadow-2xl">
  <img
    src={activeFeature.image}
    alt={activeFeature.title}
    className="max-w-full h-auto"
    data-ai-hint={activeFeature.dataAiHint}
  />
</div>
            </div>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="block md:hidden space-y-4">
          {featuresData.map((feature) => {
            const IconComponent = feature.icon;
            const isExpanded = expandedMobile === feature.id;

            return (
              <div
                key={feature.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200"
              >
                <div
                  onClick={() => setExpandedMobile(isExpanded ? '' : feature.id)}
                  className="p-6 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isExpanded ? 'bg-red-500' : 'bg-gray-100'
                    }`}>
                      <IconComponent
                        className={`h-6 w-6 ${
                          isExpanded ? 'text-white' : 'text-gray-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-red-400 to-red-600">
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          backgroundImage: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
                        }}
                        data-ai-hint={feature.dataAiHint}
                      >
                        <div className="text-center text-white px-4">
                          <feature.icon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                          <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                          <p className="text-sm opacity-90">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}