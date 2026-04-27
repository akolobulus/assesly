
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
import { Copy, Loader2 } from 'lucide-react';

interface DuplicateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDuplicate: () => Promise<void>;
  formName: string | undefined;
  isDuplicating: boolean;
}

export function DuplicateFormModal({ isOpen, onClose, onConfirmDuplicate, formName, isDuplicating }: DuplicateFormModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open && !isDuplicating) onClose(); }}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-center sm:items-start">
          <div className="flex justify-center w-full mb-4">
            <Copy className="h-16 w-16 text-primary" />
          </div>
          <AlertDialogTitle className="text-center sm:text-left text-xl">Duplicate Form?</AlertDialogTitle>
          <AlertDialogDescription className="text-center sm:text-left pt-2 text-muted-foreground">
            This will create a new form named "{formName} (Copy)" with the same fields and settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 gap-2 sm:gap-0 sm:space-x-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} disabled={isDuplicating}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={async () => {
                if (!isDuplicating) {
                  await onConfirmDuplicate();
                }
              }}
              disabled={isDuplicating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isDuplicating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Duplicate
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
