
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

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string | null;
  formName: string | null;
  currentFolderId?: string | null;
  onMoveConfirm: (formId: string, newFolderId: string | null) => Promise<void>;
}

export function MoveToFolderModal({
  isOpen,
  onClose,
  formId,
  formName,
  currentFolderId,
  onMoveConfirm,
}: MoveToFolderModalProps) {
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
      // Pre-select based on currentFolderId or null if not provided (root)
      setSelectedFolderId(currentFolderId || null);
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
  }, [isOpen, toast, currentFolderId]);

  const handleConfirm = async () => {
    if (!formId) return;
    setIsMoving(true);
    try {
      await onMoveConfirm(formId, selectedFolderId);
      // Toast and close are handled by the calling component after onMoveConfirm resolves
      onClose(); // Close modal after promise resolves or if error handled by parent
    } catch (err: any) {
      // Error toast is handled by the calling component if onMoveConfirm rejects
      // toast({
      //   title: "Move Failed",
      //   description: err.message || "Could not move the form.",
      //   variant: "destructive",
      // });
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isMoving) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move "{formName || 'Form'}"</DialogTitle>
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

              {folders.length === 0 && (
                <p className="text-sm text-muted-foreground p-3 text-center">No other folders available.</p>
              )}
              {folders.filter(folder => folder.id !== currentFolderId).map(folder => ( // Exclude current folder from list
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
            disabled={isMoving || isLoadingFolders || (selectedFolderId === currentFolderId)} // Disable if selected is same as current
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
