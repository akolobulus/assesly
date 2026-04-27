
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Folder as FolderIcon, AlertTriangle } from 'lucide-react';
import { getFoldersForCurrentUser, type Folder } from '@/lib/services/folderService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BulkMoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormIds: string[];
  onMoveConfirm: (newFolderId: string | null) => Promise<void>;
}

export function BulkMoveToFolderModal({
  isOpen,
  onClose,
  selectedFormIds,
  onMoveConfirm,
}: BulkMoveToFolderModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsLoadingFolders(true);
      setError(null);
      setSelectedFolderId(null); 
      getFoldersForCurrentUser()
        .then(fetchedFolders => {
          setFolders(fetchedFolders);
        })
        .catch(err => {
          console.error("Error fetching folders for modal:", err);
          setError("Could not load folders. Please try again.");
          toast({
            title: "Error",
            description: "Failed to load folders.",
            variant: "destructive",
          });
        })
        .finally(() => setIsLoadingFolders(false));
    }
  }, [isOpen, toast]);

  const handleConfirm = async () => {
    setIsMoving(true);
    try {
      await onMoveConfirm(selectedFolderId);
      onClose();
    } catch (err: any) {
       // Errors are typically handled by the parent component's onMoveConfirm handler
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isMoving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {selectedFormIds.length} Form{selectedFormIds.length > 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>Select a destination folder.</DialogDescription>
        </DialogHeader>

        {isLoadingFolders ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-destructive">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] my-4 pr-3">
            <RadioGroup
              value={selectedFolderId || "root"}
              onValueChange={(value) => setSelectedFolderId(value === "root" ? null : value)}
              className="space-y-1"
            >
              <Label
                htmlFor="move-to-root"
                className={cn(
                  "flex items-center p-3 rounded-md border cursor-pointer transition-colors",
                  (selectedFolderId === null)
                    ? "bg-primary/10 border-primary ring-1 ring-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="root" id="move-to-root" className="mr-3" />
                <FolderIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium text-foreground">My Forms (Root)</span>
              </Label>

              {folders.map(folder => (
                <Label
                  key={folder.id}
                  htmlFor={`folder-${folder.id}`}
                  className={cn(
                    "flex items-center p-3 rounded-md border cursor-pointer transition-colors",
                    selectedFolderId === folder.id
                      ? "bg-primary/10 border-primary ring-1 ring-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value={folder.id} id={`folder-${folder.id}`} className="mr-3" />
                  <FolderIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="font-medium text-foreground">{folder.name}</span>
                </Label>
              ))}
            </RadioGroup>
          </ScrollArea>
        )}

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isMoving}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isMoving || isLoadingFolders}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move Forms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
