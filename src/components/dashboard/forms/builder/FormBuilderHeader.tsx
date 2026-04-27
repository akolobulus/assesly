

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Blocks, Loader2, AlertTriangle, LayoutGrid, Settings as SettingsIcon, Share2, FileCheck2, LineChart as LineChartIcon, Rocket, Edit, HelpCircle, Users } from 'lucide-react';
import type { SaveStatus } from './FormBuilderLayout';
import { cn } from '@/lib/utils';
import { EditFormNameModal } from './EditFormNameModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const mainNavItems = [
  { id: 'build', label: 'Build', icon: Blocks },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'submission', label: 'Submission', icon: FileCheck2 },
  { id: 'analytics', label: 'Analytics', icon: LineChartIcon },
];

interface FormBuilderHeaderProps {
  formId: string | null;
  formName: string;
  saveStatus: SaveStatus;
  activeMainTab: string;
  onMainTabChange: (tabId: string) => void;
  onFormNameChange: (newName: string) => void;
  isPublished: boolean;
  onPublish: () => void;
  isDirty: boolean;
  onStartTour: () => void;
  isOwner: boolean; // New prop
  isCollaborator: boolean; // New prop
}

export function FormBuilderHeader({
  formId,
  formName,
  saveStatus,
  activeMainTab,
  onMainTabChange,
  onFormNameChange,
  isPublished,
  onPublish,
  isDirty,
  onStartTour,
  isOwner, // New prop
  isCollaborator,
}: FormBuilderHeaderProps) {
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  const SaveIndicator = () => {
    let icon;
    let text = "Autosave on";
    let textColor = "text-muted-foreground";

    if (saveStatus === 'saving') {
      icon = <Loader2 className="h-3 w-3 mr-1 animate-spin" />;
      text = "Saving...";
      textColor = "text-muted-foreground";
    } else if (saveStatus === 'saved') {
      icon = <CheckCircle className="h-3 w-3 mr-1 text-green-600" />;
      textColor = "text-green-600";
      text = "Saved";
    } else if (saveStatus === 'error') {
      icon = <AlertTriangle className="h-3 w-3 mr-1 text-destructive" />;
      text = "Save error";
      textColor = "text-destructive";
    } else {
      icon = <CheckCircle className="h-3 w-3 mr-1 text-muted-foreground" />;
    }

    return (
      <div className={cn("flex items-center text-xs", textColor)}>
        {icon}
        {text}
      </div>
    );
  };

  const PublishStatusIndicator = () => {
    const statusColor = isPublished ? 'bg-green-500' : 'bg-gray-400';
    const statusText = isPublished ? 'Published' : 'Draft';
    return (
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", statusColor)} />
        <span className="text-sm font-medium text-muted-foreground">{statusText}</span>
      </div>
    );
  };
  
  const getPublishButtonText = () => {
    if (isPublished) {
      return isDirty ? 'Publish Changes' : 'Published';
    }
    return 'Publish';
  };


  return (
    <>
      <header className="bg-background border-b border-border px-4 py-2 flex items-center justify-between h-16 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/forms" passHref>
            <Logo  />
          </Link>
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                className="flex items-center h-9 px-3 rounded-md border border-input w-auto hover:bg-muted/50 gap-2"
                onClick={() => setIsEditNameModalOpen(true)}
                data-tour="step-2"
              >
                <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                  {formName || "Untitled Form"}
                </span>
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <SaveIndicator />
            </div>
             {!isOwner && (
                <Badge variant="default" className="bg-green-100 text-green-700 border border-green-200 text-xs px-1.5 py-0.5 font-medium hover:bg-green-100 ml-1">
                  <Users className="h-3 w-3 mr-1" />
                  Shared Form
                </Badge>
              )}
          </div>
        </div>

        <nav className="flex items-center justify-center gap-1" data-tour="step-3">
          {mainNavItems.map((item) => {
            const isActive = activeMainTab === item.id;
            const IconComponent = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onMainTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center h-auto px-3 py-1.5  rounded-md hover:bg-muted/20",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <IconComponent className={cn("h-8 w-8 mb-0.5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[14px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {item.label}
                </span>
                {isActive && <div className="mt-1 h-0.5 w-full bg-primary rounded-full" />}
              </Button>
            );
          })}
        </nav>


        <div className="flex items-center gap-2">
      
           <PublishStatusIndicator />
          <Button
            variant="default"
            size="sm"
            onClick={onPublish}
            disabled={(!isOwner && !isCollaborator) || (isPublished && !isDirty) || saveStatus === 'saving'}
            data-tour="step-5"
          >
            <Rocket className="mr-2 h-4 w-4" />
            {getPublishButtonText()}
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onStartTour}>
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start Tour</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
      <EditFormNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => setIsEditNameModalOpen(false)}
        currentName={formName}
        onSaveName={onFormNameChange}
        onGoToSettings={() => onMainTabChange('settings')}
      />
    </>
  );
}
