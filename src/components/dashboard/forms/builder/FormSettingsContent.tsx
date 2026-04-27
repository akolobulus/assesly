

"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormSettingsGeneralTab } from './FormSettingsGeneralTab';
import { FormSettingsNotificationsTab } from './FormSettingsNotificationsTab';
import { FormSettingsAccessTab } from './FormSettingsAccessTab';
import { cn } from '@/lib/utils';
import type { AccessSettings } from './types';

interface FormSettingsContentProps {
  formId: string | null;
  formName: string;
  formDescription: string;
  formType: 'public' | 'private';
  formCategory: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null;
  metaImageUrl: string | null;
  isPublished: boolean;
  accessSettings: AccessSettings;
  onFormNameChange: (name: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onFormTypeChange: (type: 'public' | 'private') => void;
  onFormCategoryChange: (category: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null) => void;
  onMetaImageUrlChange: (url: string | null) => void;
  onAccessSettingsChange: (settings: AccessSettings) => void;
  onUnpublish: () => void;
  onTrashForm: () => Promise<void>;
  isOwner: boolean;
  enableSubmissionNotifications: boolean;
  onEnableSubmissionNotificationsChange: (enabled: boolean) => void;
}

const settingsTabs = [
  { id: 'general', label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'access', label: 'Access' },
];

export function FormSettingsContent({
    formId,
    formName,
    formDescription,
    formType,
    formCategory,
    metaImageUrl,
    isPublished,
    accessSettings,
    onFormNameChange,
    onFormDescriptionChange,
    onFormTypeChange,
    onFormCategoryChange,
    onMetaImageUrlChange,
    onAccessSettingsChange,
    onUnpublish,
    onTrashForm,
    isOwner,
    enableSubmissionNotifications,
    onEnableSubmissionNotificationsChange,
}: FormSettingsContentProps) {
  const [activeSubTab, setActiveSubTab] = useState('general');

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-y-auto flex flex-col items-center">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full max-w-3xl">
        <TabsList className="grid w-full grid-cols-3 gap-1 bg-muted/20 p-1 h-auto rounded-lg">
          {settingsTabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                            "py-2 text-sm font-medium transition-colors rounded-md",
                           activeSubTab === tab.id
                            ? "bg-background text-foreground shadow-sm"
                             : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                                                )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-8">
          <FormSettingsGeneralTab
            formId={formId}
            formName={formName}
            formDescription={formDescription}
            formType={formType}
            formCategory={formCategory}
            metaImageUrl={metaImageUrl}
            isPublished={isPublished}
            onFormNameChange={onFormNameChange}
            onFormDescriptionChange={onFormDescriptionChange}
            onFormTypeChange={onFormTypeChange}
            onFormCategoryChange={onFormCategoryChange}
            onMetaImageUrlChange={onMetaImageUrlChange}
            onUnpublish={onUnpublish}
            onTrashForm={onTrashForm}
            isOwner={isOwner}
          />
        </TabsContent>
        <TabsContent value="notifications" className="mt-8">
          <FormSettingsNotificationsTab
            enableSubmissionNotifications={enableSubmissionNotifications}
            onEnableSubmissionNotificationsChange={onEnableSubmissionNotificationsChange}
          />
        </TabsContent>
        <TabsContent value="access" className="mt-8">
          <FormSettingsAccessTab 
            accessSettings={accessSettings}
            onAccessSettingsChange={onAccessSettingsChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
