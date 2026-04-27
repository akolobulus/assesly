
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

// Updated schema to not require currentPassword, matching the image.
const formSchema = z.object({
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
  confirmNewPassword: z.string().min(8, { message: "Confirm new password must be at least 8 characters." }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { toast } = useToast();
  const auth = getAuth(app);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  // Current password state removed as it's not in the simplified form

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setIsLoading(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
    }
  }, [isOpen, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const user = auth.currentUser;

    if (!user) {
      toast({
        title: "Error",
        description: "User not found. Please re-login.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // For users who signed up with email/password, Firebase requires re-authentication
    // to change the password. This simplified modal UI (matching the image) doesn't
    // collect the current password. A more robust solution would conditionally ask for it
    // or guide the user through re-authentication if needed.
    // For now, we attempt updatePassword directly. If it fails due to needing recent login,
    // Firebase will throw an error.
    try {
      // Check if user is signed in with Email/Password provider
      const isEmailPasswordUser = user.providerData.some(
        (provider) => provider.providerId === EmailAuthProvider.PROVIDER_ID
      );

      if (isEmailPasswordUser && !user.emailVerified) { // Or some other logic to prompt for current password
         // Ideally, if it's an email/password user changing password,
         // we'd re-authenticate here. Since the UI doesn't collect currentPassword,
         // we'll rely on Firebase's "recent login" requirement for updatePassword.
         // If updatePassword fails with 'auth/requires-recent-login',
         // the user needs to re-login.
      }

      await updatePassword(user, values.newPassword);
      toast({
        title: "Password Set", // Changed from "Password Updated"
        description: "Your password has been successfully set.",
      });
      onClose();
    } catch (error: any) {
      console.error("Password update error:", error);
      let errorMessage = "Failed to set password. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "This operation is sensitive and requires recent authentication. Please log in again before retrying this request.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
      }
      toast({
        title: "Password Set Failed", // Changed title
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Set a password</DialogTitle> {/* Updated Title */}
          <DialogDescription>
            Enter your new password. {/* Updated Description */}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Current Password field removed to match the image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                          aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                          disabled={isLoading}
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmNewPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                          aria-label={showConfirmNewPassword ? "Hide confirm new password" : "Show confirm new password"}
                          disabled={isLoading}
                        >
                          {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set your password {/* Updated Button Text */}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    