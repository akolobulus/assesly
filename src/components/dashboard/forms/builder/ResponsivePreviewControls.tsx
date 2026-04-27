
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PreviewViewType = 'desktop' | 'tablet' | 'mobile';

interface ResponsivePreviewControlsProps {
  currentView: PreviewViewType;
  onViewChange: (view: PreviewViewType) => void;
}

const viewOptions: { name: PreviewViewType; label: string; icon: React.ElementType }[] = [
  { name: 'desktop', label: 'Desktop', icon: Monitor },
  { name: 'tablet', label: 'Tablet', icon: Tablet },
  { name: 'mobile', label: 'Mobile', icon: Smartphone },
];

export function ResponsivePreviewControls({ currentView, onViewChange }: ResponsivePreviewControlsProps) {
  return (
    <div className="flex flex-col items-center w-auto">
      {/* "Responses won't be recorded" text removed */}
      <div className="flex p-1 bg-background border border-input rounded-lg shadow-sm">
        {viewOptions.map((option) => (
          <Button
            key={option.name}
            variant={currentView === option.name ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(option.name)}
            className={cn(
              "min-w-[100px] h-9", // Adjusted min-width
              currentView === option.name && "bg-muted/30 text-foreground shadow-inner",
              currentView !== option.name && "text-muted-foreground",
              "first:rounded-l-md last:rounded-r-md first:border-r-0 last:border-l-0 rounded-none",
              option.name !== 'desktop' && option.name !=='mobile' && "border-x"
            )}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
