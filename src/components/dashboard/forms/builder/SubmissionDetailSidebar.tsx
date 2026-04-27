

"use client";

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Submission } from '@/lib/services/submissionService';
import type { FormFieldInstance } from './types';
import { format } from 'date-fns';
import { Loader2, Edit, X, MoreHorizontal, Download, ShieldAlert, Trash2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubmissionDetailSidebarProps {
  submission: Submission | null;
  formFields: FormFieldInstance[];
  formName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (submissionId: string, data: Partial<Submission>) => Promise<boolean>;
  onExportPDF: () => void;
  onMarkAsSpam: () => void;
  onDelete: () => void;
}

export function SubmissionDetailSidebar({ 
  submission, 
  formFields, 
  formName, 
  isOpen, 
  onClose, 
  onUpdate,
  onExportPDF,
  onMarkAsSpam,
  onDelete,
}: SubmissionDetailSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [editedScore, setEditedScore] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (submission) {
      setEditedData(submission.data);
      setEditedScore(submission.score ?? null);
      setIsEditing(false); // Reset editing state when a new submission is viewed
    }
  }, [submission]);

  if (!submission) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onUpdate(submission.id, { data: editedData, score: editedScore as number | undefined });
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };
  
  const handleCancelEdit = () => {
    setEditedData(submission.data);
    setEditedScore(submission.score ?? null);
    setIsEditing(false);
  }
  
  const handleDeleteClick = () => {
    onDelete();
    onClose(); // Close the sidebar after initiating delete
  }
  
  const handleMarkAsSpamClick = () => {
    onMarkAsSpam();
    onClose();
  }

  const renderFieldValue = (field: FormFieldInstance, value: any) => {
    if (value && value instanceof Timestamp) {
        try {
            return <p className="text-foreground whitespace-pre-wrap break-words">{format(value.toDate(), 'PP')}</p>;
        } catch(e) {
            return <p className="text-destructive italic">Invalid Date</p>;
        }
    }
    if (value && typeof value.toDate === 'function') {
        try {
            return <p className="text-foreground whitespace-pre-wrap break-words">{format(value.toDate(), 'PP')}</p>;
        } catch(e) {
            return <p className="text-destructive italic">Invalid Date</p>;
        }
    }

    if (value === null || value === undefined || value === '') {
        return <p className="text-muted-foreground italic">No answer</p>;
    }
    if (field.type === 'file' && typeof value === 'string' && value.startsWith('https://')) {
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value.split('%2F').pop()?.split('?')[0]}</a>;
    }
    if (field.type === 'signature' && typeof value === 'string' && value.startsWith('data:image')) {
        return <img src={value} alt="Signature" className="border rounded-md bg-white h-24 object-contain" />;
    }
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      if (value.hour && value.minute && value.ampm) {
          return <p className="text-foreground whitespace-pre-wrap break-words">{`${value.hour}:${value.minute} ${value.ampm}`}</p>;
      }
      if (value.day && value.month && value.year) {
        return <p className="text-foreground whitespace-pre-wrap break-words">{`${value.month}/${value.day}/${value.year}`}</p>;
      }
      if (value.address1 || value.city || value.country) { // Check for any address-like key
        const addressParts = [value.address1, value.address2, value.city, value.state?.name, value.zip, value.country?.name];
        return <p className="text-foreground whitespace-pre-wrap break-words">{addressParts.filter(Boolean).join(', ')}</p>;
      }
       if (value.firstName || value.middleName || value.lastName) {
        const nameParts = [value.firstName, value.middleName, value.lastName];
        return <p className="text-foreground whitespace-pre-wrap break-words">{nameParts.filter(Boolean).join(' ')}</p>;
      }
      // Generic object fallback
      return <p className="text-foreground whitespace-pre-wrap break-words">{Object.values(value).filter(v => v).join(', ')}</p>;
    }
    return <p className="text-foreground whitespace-pre-wrap break-words">{String(value)}</p>;
  }
  
  // This is a simplified version for now. A full editable form would be much larger.
  const renderEditField = (field: FormFieldInstance) => {
      const value = editedData[field.instanceId] || '';
      // Basic text/textarea for simplicity. A full implementation would need all field types.
      if (field.type === 'textarea') {
        return <Textarea value={value} onChange={(e) => setEditedData({...editedData, [field.instanceId]: e.target.value})} className="bg-background"/>
      }
       if (field.type === 'text' || field.type === 'email' || field.type === 'url') {
        return <Input value={value} onChange={(e) => setEditedData({...editedData, [field.instanceId]: e.target.value})} className="bg-background"/>
      }
      return renderFieldValue(field, value); // Fallback to display for non-editable types
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col" side="right">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{formName}</SheetTitle>
          <SheetDescription>
            Submitted on {format(submission.createdAt.toDate(), 'PPP p')}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="detail-score" className="text-muted-foreground flex items-center gap-2"><Award className="h-4 w-4" /> Score</Label>
                 {isEditing ? (
                     <Input
                        id="detail-score"
                        type="number"
                        min={0}
                        max={100}
                        value={editedScore ?? ''}
                        onChange={(e) => setEditedScore(e.target.value === '' ? null : Number(e.target.value))}
                        className="bg-background w-24"
                        placeholder="N/A"
                     />
                 ) : (
                    <p className="text-foreground font-semibold text-lg">{submission.score ?? <span className="text-muted-foreground italic text-base font-normal">Not scored</span>}</p>
                 )}
            </div>
            {formFields.filter(f => !['heading', 'paragraph'].includes(f.type)).map(field => (
              <div key={field.instanceId} className="grid w-full items-center gap-1.5">
                <Label htmlFor={`detail-${field.instanceId}`} className="text-muted-foreground">{field.label}</Label>
                <div id={`detail-${field.instanceId}`} className="text-sm">
                   {isEditing ? renderEditField(field) : renderFieldValue(field, submission.data[field.instanceId])}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetFooter className="p-4 border-t bg-background flex flex-row items-center justify-between">
            {isEditing ? (
                 <div className="flex w-full justify-end gap-2">
                    <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Changes
                    </Button>
                </div>
            ) : (
                <div className="flex w-full items-center gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-grow">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onExportPDF}>
                                <Download className="mr-2 h-4 w-4"/> Download as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleMarkAsSpamClick}>
                                <ShieldAlert className="mr-2 h-4 w-4"/> Mark as Spam
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete this submission. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
