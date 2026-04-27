
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

interface UnpublishFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnpublish: () => Promise<void>;
}

export function UnpublishFormModal({ isOpen, onClose, onConfirmUnpublish }: UnpublishFormModalProps) {
  const [isUnpublishing, setIsUnpublishing] = React.useState(false);
  
  const handleConfirm = async () => {
    setIsUnpublishing(true);
    await onConfirmUnpublish();
    // The parent component will handle closing the modal.
    setIsUnpublishing(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open && !isUnpublishing) onClose(); }}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-center sm:items-start">
          <div className="flex justify-center w-full mb-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
          <AlertDialogTitle className="text-center sm:text-left text-xl">Unpublish Form</AlertDialogTitle>
          <AlertDialogDescription className="text-center sm:text-left pt-2 text-muted-foreground">
            Are you sure you want to unpublish this form? The public link will no longer be active, and no new submissions will be accepted until you publish it again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 gap-2 sm:gap-0 sm:space-x-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} disabled={isUnpublishing}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isUnpublishing}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isUnpublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Unpublish
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
