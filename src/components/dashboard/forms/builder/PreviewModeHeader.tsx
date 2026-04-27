
"use client";

import React from 'react';
import { ResponsivePreviewControls, type PreviewViewType } from './ResponsivePreviewControls';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PreviewModeHeaderProps {
  isPreviewMode: boolean;
  onTogglePreviewMode: (isPreview: boolean) => void;
  currentViewType: PreviewViewType;
  onViewChange: (view: PreviewViewType) => void;
}

export function PreviewModeHeader({
  isPreviewMode,
  onTogglePreviewMode,
  currentViewType,
  onViewChange,
}: PreviewModeHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between gap-1 border-b bg-background px-4">
      {/* Left Spacer - to help center ResponsivePreviewControls */}
      <div style={{ width: '200px' }} /> {/* Adjust width as needed or use flex-grow on a wrapper */}

      {/* Center: Responsive Preview Controls */}
      <div className="flex justify-center">
        <ResponsivePreviewControls
          currentView={currentViewType}
          onViewChange={onViewChange}
        />
      </div>

      {/* Right side: Preview Toggle */}
      <div className="flex items-center gap-2 p-1.5 rounded-md" style={{ width: '200px', justifyContent: 'flex-end' }}> {/* Adjust width as needed */}
        <Label htmlFor="preview-mode-switch-main" className="text-sm font-medium text-foreground pr-1 select-none cursor-pointer">
          Preview Form
        </Label>
        <Switch
          id="preview-mode-switch-main"
          checked={isPreviewMode}
          onCheckedChange={onTogglePreviewMode}
        />
      </div>
    </div>
  );
}
