
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { renameFolder, type Folder } from '@/lib/services/folderService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
  onFolderRenamed: () => void;
}

export function RenameFolderModal({ isOpen, onClose, folder, onFolderRenamed }: RenameFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && folder) {
      setFolderName(folder.name);
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, folder]);

  const handleSubmit = async () => {
    if (!folder) return;
    if (!folderName.trim()) {
      setError('Folder name cannot be empty.');
      return;
    }
    setError('');
    setIsSaving(true);
    const result = await renameFolder(folder.id, folderName.trim());
    setIsSaving(false);

    if (result.success) {
      toast({
        title: "Folder Renamed",
        description: `Folder has been renamed to "${folderName.trim()}".`,
      });
      onFolderRenamed();
      onClose();
    } else {
      toast({
        title: "Failed to Rename Folder",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      });
      setError(result.error || "Could not rename folder.");
    }
  };
  
  if (!folder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="folderName" className="sr-only">
              Folder Name
            </Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                if (error) setError(''); 
              }}
              placeholder="Enter folder name"
              className={error ? "border-destructive" : ""}
              autoFocus
              disabled={isSaving}
              onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleSubmit()}
              maxLength={150}
            />
             {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
