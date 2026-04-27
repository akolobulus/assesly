"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getAuth, updateProfile, type User } from "firebase/auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon, Image as ImageIcon, UploadCloud } from "lucide-react";
import { cn } from '@/lib/utils';
import { upsertUserInFirestore } from '@/lib/services/userService'; 

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onProfileUpdate: (updatedUser: User) => void; // Callback to update parent state
}

export function EditProfileModal({ isOpen, onClose, currentUser, onProfileUpdate }: EditProfileModalProps) {
  const { toast } = useToast();
  const auth = getAuth(app);
  const storage = getStorage(app);

  const [displayName, setDisplayName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setDisplayName(currentUser.displayName || '');
      setImagePreview(currentUser.photoURL || null);
      setSelectedFile(null); // Reset file selection on open
      setError('');
    }
  }, [isOpen, currentUser]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File is too large. Max 5MB.");
        setSelectedFile(null);
        setImagePreview(currentUser?.photoURL || null); // Revert to original if error
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError("Invalid file type. Use JPG, PNG, GIF, or WEBP.");
        setSelectedFile(null);
        setImagePreview(currentUser?.photoURL || null);
        return;
      }

      setError('');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit() {
    const userToUpdate = auth.currentUser;
    if (!userToUpdate) {
      toast({ title: "Error", description: "Not authenticated.", variant: "destructive" });
      return;
    }
    if (!displayName.trim()) {
      setError("Display name cannot be empty.");
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      let photoURL = userToUpdate.photoURL;

      if (selectedFile) {
        const imageFileRef = storageRef(storage, `profilePictures/${userToUpdate.uid}/${selectedFile.name}`);
        const snapshot = await uploadBytes(imageFileRef, selectedFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateProfile(userToUpdate, {
        displayName: displayName.trim(),
        photoURL: photoURL,
      });

      // After updating, reload the user object to ensure we have the latest data
      await userToUpdate.reload();
      const freshUser = auth.currentUser; // Get the reloaded user

      if (freshUser) {
        await upsertUserInFirestore(freshUser);
        
        // Pass the updated user object to the parent
        onProfileUpdate(freshUser);
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      onClose();

    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your display name and profile picture.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Profile Picture Section */}
          <div>
            <Label className="text-sm font-medium text-foreground">Profile Picture</Label>
            <div className="mt-2 flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imagePreview || undefined} alt={displayName || "User"} data-ai-hint="user avatar" />
                <AvatarFallback className="text-2xl bg-muted">
                  {displayName ? getInitials(displayName) : <UserIcon className="h-8 w-8 text-muted-foreground" />}
                </AvatarFallback>
              </Avatar>
              
              <div 
                className="flex-1 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors flex items-center gap-3"
                onClick={handleUploadAreaClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUploadAreaClick();}}
                role="button"
                tabIndex={0}
                aria-label="Upload profile image"
              >
                <div className="p-2 border border-muted-foreground/30 rounded-md flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Upload Image</p>
                  <p className="text-xs text-muted-foreground">SVG, PNG, JPG (max. 5MB)</p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/svg+xml, image/png, image/jpeg, image/gif, image/webp"
                className="hidden"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Username Section */}
          <div>
            <Label htmlFor="displayName" className="text-sm font-medium text-foreground">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className={cn("mt-1 h-10", error && !selectedFile && "border-destructive")}
              disabled={isLoading}
            />
          </div>
           {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading} onClick={() => { setSelectedFile(null); onClose();}}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={onSubmit} disabled={isLoading || (!displayName.trim() && !selectedFile)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
