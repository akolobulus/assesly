
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Folder } from '@/lib/services/folderService';

interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  folder: Folder | null;
  isDeleting: boolean;
}

export function DeleteFolderModal({ isOpen, onClose, onConfirmDelete, folder, isDeleting }: DeleteFolderModalProps) {
  if (!folder) return null;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open && !isDeleting) onClose(); }}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-center sm:items-start">
          <div className="flex justify-center w-full mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center sm:text-left text-xl">Move Folder to Trash?</AlertDialogTitle>
          <AlertDialogDescription className="text-center sm:text-left pt-2 text-muted-foreground">
            Are you sure you want to move "{folder.name}" to the trash? All forms within this folder will also be moved to the trash. They will be permanently deleted after 30 days.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 gap-2 sm:gap-0 sm:space-x-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!isDeleting) {
                  await onConfirmDelete();
                }
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Move to Trash
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
