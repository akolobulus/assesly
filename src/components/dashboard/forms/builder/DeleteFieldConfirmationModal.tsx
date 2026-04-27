
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
import { AlertTriangle } from 'lucide-react';

interface DeleteFieldConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteFieldConfirmationModal({ isOpen, onClose, onConfirm }: DeleteFieldConfirmationModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if(!open) onClose() } }>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-center sm:items-start">
          <div className="flex justify-center w-full mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center sm:text-left text-xl">Are you sure you want to delete this field?</AlertDialogTitle>
          <AlertDialogDescription className="text-center sm:text-left pt-2 text-muted-foreground">
            Deleting this field will permanently remove it from the form. Any associated data from previous submissions will also be deleted and cannot be recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 gap-2 sm:gap-0 sm:space-x-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Delete Field
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
