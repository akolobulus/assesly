
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { app, auth } from "@/lib/firebase"; 

interface FormSettingsGeneralTabProps {
  formId: string | null;
  formName: string;
  formDescription: string;
  formType: 'public' | 'private';
  formCategory: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null;
  metaImageUrl: string | null;
  isPublished: boolean;
  onFormNameChange: (name: string) => void;
  onFormDescriptionChange: (description: string) => void;
  onFormTypeChange: (type: 'public' | 'private') => void;
  onFormCategoryChange: (category: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null) => void;
  onMetaImageUrlChange: (url: string | null) => void;
  onUnpublish: () => void;
  onTrashForm: () => Promise<void>;
  isOwner: boolean;
}

export function FormSettingsGeneralTab({
  formId,
  formName,
  formDescription,
  formType,
  formCategory,
  metaImageUrl,
  isPublished,
  onFormNameChange,
  onFormDescriptionChange,
  onFormTypeChange,
  onFormCategoryChange,
  onMetaImageUrlChange,
  onUnpublish,
  onTrashForm,
  isOwner,
}: FormSettingsGeneralTabProps) {
  const { toast } = useToast();
  const router = useRouter();
  const storage = getStorage(app);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localFormName, setLocalFormName] = useState(formName);
  const [localFormDescription, setLocalFormDescription] = useState(formDescription);
  const [localFormType, setLocalFormType] = useState(formType);
  const [localFormCategory, setLocalFormCategory] = useState(formCategory);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    setLocalFormName(formName);
    setLocalFormDescription(formDescription);
    setLocalFormType(formType);
    setLocalFormCategory(formCategory);
  }, [formName, formDescription, formType, formCategory]);

  useEffect(() => {
    if (
      localFormName !== formName ||
      localFormDescription !== formDescription ||
      localFormType !== formType ||
      localFormCategory !== formCategory
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [localFormName, localFormDescription, localFormType, localFormCategory, formName, formDescription, formType, formCategory]);
  
  const handleCancel = () => {
    setLocalFormName(formName);
    setLocalFormDescription(formDescription);
    setLocalFormType(formType);
    setLocalFormCategory(formCategory);
  };

  const handleUpdate = () => {
    if (!localFormName.trim()) {
      toast({
        title: "Validation Error",
        description: "Form name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    onFormNameChange(localFormName);
    onFormDescriptionChange(localFormDescription);
    onFormTypeChange(localFormType);
    onFormCategoryChange(localFormType === 'public' ? localFormCategory : null);
    toast({
      title: "Settings Updated",
      description: "Your form settings have been saved.",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ title: "File too large", description: "Please select an image smaller than 5MB.", variant: "destructive" });
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
       toast({ title: "Error", description: "You must be logged in to upload files.", variant: "destructive" });
       return;
    }

    if (!formId) {
       toast({ title: "Error", description: "Form must be saved before uploading an image.", variant: "destructive" });
       return;
    }

    setIsUploading(true);
    const imageFileRef = storageRef(storage, `formMetaImages/${formId}/${file.name}`);
    
    const metadata = {
        customMetadata: {
            'ownerUid': user.uid
        }
    };

    uploadBytes(imageFileRef, file, metadata)
      .then(snapshot => getDownloadURL(snapshot.ref))
      .then(url => {
        onMetaImageUrlChange(url);
        toast({ title: "Image Uploaded", description: "Your new meta image has been saved." });
      })
      .catch(error => {
        console.error("Meta image upload error:", error);
        toast({ title: "Upload Failed", description: "Could not upload image. Please check permissions.", variant: "destructive" });
      })
      .finally(() => setIsUploading(false));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">General Settings</h2>
        <p className="text-sm text-muted-foreground">Update your form's general settings.</p>
      </div>

      <Card className="bg-card shadow-none border">
        <CardContent className="p-6 space-y-6">
          <div>
            <Label htmlFor="formNameInput" className="text-sm font-medium text-foreground">Form Name</Label>
            <Input
              id="formNameInput"
              type="text"
              value={localFormName}
              onChange={(e) => setLocalFormName(e.target.value)}
              placeholder="Enter form name"
              className="mt-1 h-10 bg-background border-input"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="formDescriptionInput" className="text-sm font-medium text-foreground">Form Description</Label>
            <Textarea
              id="formDescriptionInput"
              value={localFormDescription}
              onChange={(e) => setLocalFormDescription(e.target.value)}
              placeholder="Enter form description"
              className="mt-1 min-h-[80px] bg-background border-input"
              maxLength={500}
            />
          </div>

          <Separator />
          
          <div>
            <Label className="text-sm font-medium text-foreground">Meta Image</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">This image is used for social media previews when you share the form link.</p>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 bg-muted/30 rounded-md flex items-center justify-center border overflow-hidden relative">
                {metaImageUrl ? (
                  <NextImage src={metaImageUrl} alt="Meta image preview" layout="fill" objectFit="cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                  disabled={isUploading}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                  {metaImageUrl ? 'Change' : 'Upload'}
                </Button>
                {metaImageUrl && (
                  <Button variant="link" className="p-0 h-auto text-destructive text-xs" onClick={() => onMetaImageUrlChange(null)}>
                    Remove image
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <Separator />

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Form Type</Label>
            <RadioGroup
              value={localFormType}
              onValueChange={(value) => {
                const newType = value as 'public' | 'private';
                setLocalFormType(newType);
                if (newType === 'private') {
                  setLocalFormCategory(null);
                }
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="formTypePublic" />
                <Label htmlFor="formTypePublic" className="font-normal text-foreground">Public</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="formTypePrivate" />
                <Label htmlFor="formTypePrivate" className="font-normal text-foreground">Private</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              <strong>Public:</strong> Form will be included on{" "}
              <a
                href="https://thefounders.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 underline"
              >
                thefounders.tech
              </a>{" "}
              platform Directory so people searching opportunities can find it.
              <br />
              <strong>Private:</strong> Form will not be included in the Directory.
            </p>

          </div>
          
          {localFormType === 'public' && (
            <div>
              <Label htmlFor="formCategorySelect" className="text-sm font-medium text-foreground">Form Category</Label>
              <p className="text-xs text-muted-foreground mt-1">Choose the category where this form will be displayed.</p>
              <Select
                value={localFormCategory || ''}
                onValueChange={(value) => setLocalFormCategory(value as 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null)}
              >
                <SelectTrigger id="formCategorySelect" className="mt-2 h-10 bg-background border-input">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funding">Funding</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Discount">Discount</SelectItem>
                  <SelectItem value="Opportunities">Opportunities</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isDirty && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleUpdate}>Save changes</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card shadow-none border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-foreground">Publish Status</h3>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                {isPublished ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    This form is currently published and live.
                  </>
                ) : (
                  'This form is currently a draft and not accessible publicly.'
                )}
              </p>
            </div>
            {isPublished && isOwner && (
              <Button
                variant="outline"
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                onClick={onUnpublish}
              >
                Unpublish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isOwner && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-destructive">Move to Trash</h3>
          <p className="text-sm text-muted-foreground">
            Moving a form to the trash will unpublish it and make it inaccessible. It will be permanently deleted after 30 days.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300"
              >
                Move to Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will move the form "{formName}" to the trash. It will be permanently deleted after 30 days. This action cannot be easily undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onTrashForm} className="bg-destructive hover:bg-destructive/90">
                  Yes, Move to Trash
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
