
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
import { Trash2 as TrashIcon, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DeleteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  formName: string | undefined;
  isDeleting: boolean;
  formIsPublished?: boolean;
}

export function DeleteFormModal({ isOpen, onClose, onConfirmDelete, formName, isDeleting, formIsPublished }: DeleteFormModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open && !isDeleting) onClose(); }}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-center sm:items-start">
          <div className="flex justify-center w-full mb-4">
            <TrashIcon className="h-16 w-16 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center sm:text-left text-xl">Move to Trash?</AlertDialogTitle>
          {formIsPublished && (
              <Alert variant="destructive" className="my-4 text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This form is currently published. Moving it to the trash will also unpublish it.
                </AlertDescription>
              </Alert>
          )}
          <AlertDialogDescription className="text-center sm:text-left pt-2 text-muted-foreground">
            Are you sure you want to move "{formName || 'this form'}" to the trash? 
            It will be permanently deleted after 30 days.
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
              Move to Trash
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
