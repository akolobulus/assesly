
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, CreditCard, User, Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { EditProfileModal } from '@/components/auth/EditProfileModal';
import { ChangeEmailModal } from '@/components/auth/ChangeEmailModal';
import { DeleteAccountModal } from '@/components/auth/DeleteAccountModal';
import { getAuth, deleteUser, type User as FirebaseUser, unlink } from "firebase/auth";
import { useAuth } from '@/hooks/useAuth'; // Use the new hook
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { GoogleIcon } from '@/components/icons/GoogleIcon';


const mockInvoices = [
  { id: "inv_1", description: "Pro Plan (Monthly)", transactionId: "ch_1PtxVv2eZvKYlo2C9a5b4cde", createdOn: "Oct 20, 2024", status: "Paid", totalPayable: "₦30,000" },
  { id: "inv_2", description: "Pro Plan (Monthly)", transactionId: "ch_1PsrTf2eZvKYlo2C8g7h6fgh", createdOn: "Sep 20, 2024", status: "Paid", totalPayable: "₦30,000" },
  { id: "inv_3", description: "Basic Plan Upgrade (Prorated)", transactionId: "ch_1PqnxW2eZvKYlo2C1ijklmno", createdOn: "Aug 20, 2024", status: "Paid", totalPayable: "₦2,800"},
];

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

export default function SettingsPage() {
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const { user, loading: isLoadingAuth } = useAuth();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(user); // Local state for mutations

  const [isSocialLogin, setIsSocialLogin] = useState(false);
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);
  
  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);


  const { toast } = useToast();
  const auth = getAuth();
  const router = useRouter();

  useEffect(() => {
    setCurrentUser(user); // Sync local state when auth state changes
    if (user) {
      const socialProvider = user.providerData.find(
        (provider) => provider.providerId === "google.com"
      );
      setIsSocialLogin(!!socialProvider);
      setHasPasswordProvider(user.providerData.some(p => p.providerId === 'password'));
    } else {
      setIsSocialLogin(false);
      setHasPasswordProvider(false);
    }
  }, [user]);
  
  const handleProfileUpdate = (updatedUser: FirebaseUser) => {
    setCurrentUser(updatedUser); 
  };
  
  const handleDownloadInvoice = (invoice: typeof mockInvoices[0]) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 14, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice ID: ${invoice.transactionId}`, 14, 40);
    doc.text(`Date: ${invoice.createdOn}`, 14, 45);
    doc.text(`Status: ${invoice.status}`, 14, 50);
    doc.text(`Bill to:`, 14, 60);
    doc.text(currentUser?.displayName || 'User', 14, 65);
    doc.text(currentUser?.email || 'No email', 14, 70);
    autoTable(doc, {
        startY: 80,
        head: [['Description', 'Amount']],
        body: [[invoice.description, invoice.totalPayable]],
        theme: 'striped',
        headStyles: { fillColor: [216, 19, 14] }
    });
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    if (!currentUser) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      setIsDeletingAccount(false);
      return;
    }
    try {
      await deleteUser(currentUser);
      toast({ title: "Account Deleted", description: "Your account has been successfully deleted." });
      setIsDeleteAccountModalOpen(false);
      router.push('/login');
    } catch (error: any) {
      console.error("Account deletion error:", error);
      let errorMessage = "Failed to delete account. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "This operation is sensitive and requires recent authentication. Please log out and log in again before retrying this request.";
      }
      toast({ title: "Deletion Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!currentUser) return;
    if (!hasPasswordProvider) {
      toast({
        title: "Set Password Required",
        description: "Please set a password for your account before disconnecting Google.",
        variant: 'destructive'
      });
      setIsChangePasswordModalOpen(true);
      return;
    }
    setIsUnlinkConfirmOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!currentUser) return;
    setIsDisconnecting(true);
    try {
      await unlink(currentUser, 'google.com');
      await currentUser.reload();
      const updatedUser = auth.currentUser;
      if (updatedUser) {
        setCurrentUser(updatedUser); // Refresh local user state
        const socialProvider = updatedUser.providerData.find(p => p.providerId === "google.com");
        setIsSocialLogin(!!socialProvider);
        setHasPasswordProvider(updatedUser.providerData.some(p => p.providerId === 'password'));
      }
      toast({
        title: "Account Disconnected",
        description: "Your Google account has been successfully disconnected."
      });
    } catch (error: any) {
      console.error("Disconnect error:", error);
      let message = "Could not disconnect Google account.";
      if (error.code === 'auth/requires-recent-login') {
        message = "This is a sensitive action. Please sign out and sign in again before disconnecting.";
      }
      toast({
        title: "Disconnect Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
      setIsUnlinkConfirmOpen(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height,100px))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const formUsagePercent = 30;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
      
      <Tabs defaultValue="my-account" className="w-full">
        <TabsList className="flex items-center gap-1 sm:gap-2 border-b border-border pb-0 justify-start bg-transparent p-0">
          <TabsTrigger 
            value="my-account" 
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
          >
            <UserCircle className="h-5 w-5" />
            My Account
          </TabsTrigger>
          <TabsTrigger 
            value="plans-billing"
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
          >
            <CreditCard className="h-5 w-5" />
            Plans & Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-account" className="mt-6">
          <Card className="shadow-md">
            <CardContent className="p-6 sm:p-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <Avatar className="h-12 w-12 bg-primary">
                     <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || "User"} data-ai-hint="user avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentUser?.displayName ? getInitials(currentUser.displayName) : <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">Username</h3>
                    <p className="text-sm text-muted-foreground">{currentUser?.displayName || "Set your name"}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto sm:ml-auto rounded-full px-6 bg-muted/50 hover:bg-muted border-border text-sm"
                  onClick={() => setIsEditProfileModalOpen(true)}
                  disabled={!currentUser}
                >
                  Change
                </Button>
              </div>

              {isSocialLogin ? (
                 <>
                    <Separator />
                    <div className="space-y-4 pt-2">
                      <h3 className="text-lg font-semibold text-foreground">Social Logins</h3>
                      <Card className="bg-muted/30 border-0">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="border p-2 rounded-md bg-white">
                              <GoogleIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Google</p>
                              <p className="text-sm text-muted-foreground">{currentUser?.displayName || currentUser?.email}</p>
                            </div>
                          </div>
                          <Button variant="outline" onClick={handleDisconnectGoogle} disabled={isDisconnecting}>
                            {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
                          </Button>
                        </CardContent>
                      </Card>
                       <p className="text-sm text-muted-foreground mt-1">
                        To disconnect your Google account, you must first set a password for your account.
                      </p>
                       <Button 
                          variant="outline" 
                          className="w-full sm:w-auto rounded-full px-6 bg-muted/50 hover:bg-muted border-border text-sm"
                          onClick={() => setIsChangePasswordModalOpen(true)}
                          disabled={!currentUser}
                        >
                          {hasPasswordProvider ? "Change Password" : "Set Password"}
                        </Button>
                    </div>
                  </>
              ) : (
                  <>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex-grow mb-4 sm:mb-0">
                        <h3 className="font-semibold text-foreground">Email</h3>
                        <p className="text-sm text-muted-foreground">{currentUser?.email || "No email provided"}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto sm:ml-auto rounded-full px-6 bg-muted/50 hover:bg-muted border-border text-sm"
                        onClick={() => setIsChangeEmailModalOpen(true)}
                        disabled={!currentUser}
                      >
                        Change
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex-grow mb-4 sm:mb-0">
                        <h3 className="font-semibold text-foreground">Password</h3>
                        <p className="text-sm text-muted-foreground">Change your password.</p>
                        </div>
                        <Button 
                        variant="outline" 
                        className="w-full sm:w-auto rounded-full px-6 bg-muted/50 hover:bg-muted border-border text-sm"
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        disabled={!currentUser}
                        >
                        Change Password
                        </Button>
                    </div>
                  </>
              )}
              
              <div className="pt-8 mt-8 border-t border-border">
                <h3 className="text-lg font-semibold text-destructive">Delete my account</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Deleting your account will result in losing all your data. This action is irreversible; act with caution.
                </p>
                <Button 
                  variant="outline" 
                  className="rounded-full px-6 bg-red-100 text-red-600 hover:bg-red-200 border-red-200 hover:border-red-300 text-sm border"
                  onClick={() => setIsDeleteAccountModalOpen(true)}
                  disabled={!currentUser}
                >
                  Delete account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans-billing" className="mt-6">
          <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border rounded-lg bg-card">
            <Rocket className="h-16 w-16 text-muted-foreground mb-6" />
            <h3 className="text-2xl font-semibold text-foreground">
              New Plans Coming Soon!
            </h3>
            <p className="mt-2 max-w-sm mx-auto text-muted-foreground">
              We're currently finalizing our subscription plans to bring you the best features.
              Please check back later.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        currentUser={currentUser}
        onProfileUpdate={handleProfileUpdate}
      />
      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onClose={() => setIsChangeEmailModalOpen(false)}
        currentUser={currentUser}
      />
      <DeleteAccountModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteAccount}
        isDeleting={isDeletingAccount}
      />
      <AlertDialog open={isUnlinkConfirmOpen} onOpenChange={setIsUnlinkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to disconnect?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be able to sign in with Google. You will need to use your email and password to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisconnect} disabled={isDisconnecting} className="bg-destructive hover:bg-destructive/90">
              {isDisconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
