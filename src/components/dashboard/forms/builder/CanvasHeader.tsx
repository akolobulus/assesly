
'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Undo2, Redo2 } from 'lucide-react';

interface CanvasHeaderProps {
  isPreviewMode: boolean;
  onTogglePreviewMode: (isPreview: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasHeader({ 
  isPreviewMode, 
  onTogglePreviewMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: CanvasHeaderProps) {
  return (
    <div className="flex h-14 items-center justify-between gap-1 border-b bg-background px-4">
      {/* Left side: Undo/Redo - visible only when not in preview mode */}
      {!isPreviewMode ? (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Undo" 
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border border-border"
            onClick={onUndo}
            disabled={!canUndo}
            data-tour="undo-button"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Redo" 
            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full border border-border"
            onClick={onRedo}
            disabled={!canRedo}
            data-tour="redo-button"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div style={{ width: '70px' }} /> 
      )}

      {/* Right side: Preview Toggle */}
      <div className="flex items-center gap-2 p-1.5 rounded-md" data-tour="preview-toggle">
        <Label htmlFor="preview-mode-switch" className="text-sm font-medium text-foreground pr-1 select-none cursor-pointer">
          Preview Form
        </Label>
        <Switch
          id="preview-mode-switch"
          checked={isPreviewMode}
          onCheckedChange={onTogglePreviewMode}
        />
      </div>
    </div>
  );
}
