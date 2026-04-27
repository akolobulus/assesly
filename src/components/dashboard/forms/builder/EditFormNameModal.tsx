"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface EditFormNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSaveName: (newName: string) => void;
  onGoToSettings: () => void;
}

export function EditFormNameModal({ 
    isOpen, 
    onClose, 
    currentName, 
    onSaveName, 
    onGoToSettings 
}: EditFormNameModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, currentName]);

  const handleSubmit = () => {
    if (!newName.trim()) {
      setError('Form name cannot be empty.');
      return;
    }
    setError('');
    setIsSaving(true);
    onSaveName(newName.trim());
    setIsSaving(false);
    onClose();
  };
  
  const handleGoToSettings = () => {
    onGoToSettings();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Form</DialogTitle>
          <DialogDescription>
            Enter a new name for your form below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="formName" className="sr-only">
              Form Name
            </Label>
            <Input
              id="formName"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter form name"
              className={error ? "border-destructive" : ""}
              autoFocus
              disabled={isSaving}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isSaving) handleSubmit();}}
            />
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>

          <Separator />

          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleGoToSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Go to full settings
          </Button>

        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving || !newName.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
