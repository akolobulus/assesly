
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { finalizeEmailChange } from '@/lib/actions/emailChangeActions';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export function ChangeEmailModal({ isOpen, onClose, currentUser }: ChangeEmailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof changeEmailSchema>>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    }
  });

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setError('');
        setIsLoading(false);
        setShowPassword(false);
        form.reset();
      }, 300);
    }
  }, [isOpen, form]);

  const handleChangeEmail = async (values: z.infer<typeof changeEmailSchema>) => {
    if (!currentUser) {
        setError('User not found. Please log in again.');
        return;
    }
    
    if (currentUser.email === values.newEmail) {
        form.setError('newEmail', { type: 'manual', message: 'New email cannot be the same as the current one.' });
        return;
    }

    setIsLoading(true);
    setError('');

    const result = await finalizeEmailChange(currentUser.uid, currentUser.email, values.newEmail, values.password);
    
    if (result.success) {
      toast({ 
          title: "Verification Email Sent", 
          description: `A verification link has been sent to ${result.newEmail}. Please check your inbox (and spam folder) to complete the change.`,
          duration: 10000,
      });
      onClose();
    } else {
      setError(result.error || 'An unknown error occurred.');
    }
    setIsLoading(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email and current password to confirm the change. A confirmation will be sent to the new address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleChangeEmail)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="newEmail">New Email Address</Label>
            <Input id="newEmail" {...form.register('newEmail')} className="mt-1" />
            {form.formState.errors.newEmail && <p className="text-sm text-destructive mt-1">{form.formState.errors.newEmail.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Current Password</Label>
             <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register('password')}
                    className="mt-1 pr-10"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
            {form.formState.errors.password && <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
