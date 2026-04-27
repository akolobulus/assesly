
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
import { createFolder, type Folder } from '@/lib/services/folderService'; // Import the service
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: (newFolder: Folder) => void; // Callback with the new folder
}

export function CreateFolderModal({ isOpen, onClose, onFolderCreated }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setFolderName(''); 
      setError('');
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!folderName.trim()) {
      setError('Folder name cannot be empty.');
      return;
    }
    setError('');
    setIsCreating(true);
    const result = await createFolder(folderName.trim());
    setIsCreating(false);

    if (result.success && result.folder) {
      toast({
        title: "Folder Created",
        description: `Folder "${result.folder.name}" has been created.`,
      });
      onFolderCreated(result.folder); // Pass the new folder data up
      onClose();
    } else {
      toast({
        title: "Failed to Create Folder",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      });
      setError(result.error || "Could not create folder.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
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
              placeholder="Name your folder"
              className={error ? "border-destructive" : ""}
              autoFocus
              disabled={isCreating}
              maxLength={150}
            />
             {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCreating}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
