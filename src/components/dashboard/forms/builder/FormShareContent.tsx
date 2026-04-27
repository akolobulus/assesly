

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from "react-qr-code";
import * as htmlToImage from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Link as LinkIcon, Loader2, Mail, Trash2, X as XIcon, ShieldAlert, Share, Code, UserPlus, Download, ExternalLink, User } from 'lucide-react';
import { sendInvitation, type InvitationWithRecipient, cancelInvitation, getInvitationsForForm } from '@/lib/services/invitationService';
import { removeCollaboratorFromForm } from '@/lib/services/formService';
import type { User as FirebaseUser } from 'firebase/auth'; // Renamed to avoid conflict
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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

interface FormShareContentProps {
  formId: string | null;
  formName: string;
  formThumbnailUrl: string;
  isPublished: boolean;
  isOwner: boolean;
  sharedWith: any[]; 
  onUpdateSharedWith: (newSharedWith: any[]) => void;
  currentUser: FirebaseUser | null;
}

export function FormShareContent({
  formId,
  formName,
  formThumbnailUrl,
  isPublished,
  isOwner,
  sharedWith,
  onUpdateSharedWith,
  currentUser,
}: FormShareContentProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  const [allInvitations, setAllInvitations] = useState<InvitationWithRecipient[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!formId) {
      setIsLoadingInvites(false);
      return;
    }
    setIsLoadingInvites(true);
    try {
      const invites = await getInvitationsForForm(formId);
      setAllInvitations(invites);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast({ title: "Error", description: "Could not load collaborator information.", variant: "destructive" });
    } finally {
      setIsLoadingInvites(false);
    }
  }, [formId, toast]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const formLink = formId ? `${window.location.origin}/forms/view/${formId}` : '';
  const embedCode = formId ? `<iframe src="${formLink}" width="100%" height="600" frameborder="0"></iframe>` : '';

  const activeCollaboratorsAndInvites = allInvitations.filter(inv => inv.status !== 'declined');
  const totalCollaborators = activeCollaboratorsAndInvites.length;
  const isCollaboratorLimitReached = totalCollaborators >= 5;

  const handleCopy = (textToCopy: string, successMessage: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({ title: successMessage });
    });
  };

  const handleDownloadQR = async (format: 'png' | 'jpg') => {
    if (!qrCodeRef.current) return;
    try {
      let dataUrl;
      const options = { quality: 0.95, backgroundColor: 'white', pixelRatio: 2 };
      const sanitizedFormName = formName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      if (format === 'png') {
        dataUrl = await htmlToImage.toPng(qrCodeRef.current, options);
      } else {
        dataUrl = await htmlToImage.toJpeg(qrCodeRef.current, options);
      }
      const link = document.createElement('a');
      link.download = `${sanitizedFormName}-qrcode.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('QR code download failed:', error);
      toast({ title: 'Download Failed', description: 'Could not generate QR code for download.', variant: 'destructive' });
    }
  };

  const handleShareWithUser = async () => {
    if (!formId || !currentUser) {
      toast({ title: "Form ID or user is missing.", variant: "destructive" });
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (trimmedEmail === currentUser.email) {
      toast({ title: "Cannot Invite Yourself", description: "You are the owner of this form.", variant: "destructive" });
      return;
    }
    if (isCollaboratorLimitReached) {
      toast({ title: "Collaborator Limit Reached", description: "You can invite a maximum of 5 collaborators.", variant: "destructive" });
      return;
    }
    if (allInvitations.some(inv => inv.recipientEmail === trimmedEmail && inv.status !== 'declined')) {
      toast({ title: "User has already been invited or is a collaborator", variant: "destructive" });
      return;
    }

    setLoading(true);
    const result = await sendInvitation(formId, formName, trimmedEmail);

    if (result.success && result.invitation) {
      const invitationLink = `${window.location.origin}/signup?inviteId=${result.invitation.id}`;
      // Send email via API route
      fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: trimmedEmail,
          inviterName: currentUser.displayName || 'A user',
          formName: formName,
          formLink: invitationLink,
        }),
      });

      setAllInvitations(prev => [result.invitation!, ...prev]);
      toast({ title: "Invitation sent successfully!" });
      setEmail('');
    } else {
      console.error("Error creating invitation:", result.error);
      toast({ title: "Failed to send invitation", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  };
  
  const handleRemoveCollaborator = async (emailToRemove: string) => {
    if (!formId) return;
  
    const result = await removeCollaboratorFromForm(formId, emailToRemove);
    if (result.success) {
      setAllInvitations(prev => prev.filter(inv => inv.recipientEmail !== emailToRemove));
  
      // Immediately update collaborator state in parent (UI will update instantly)
      const updatedSharedWith = sharedWith.filter((c: any) => c.email !== emailToRemove);
      onUpdateSharedWith(updatedSharedWith);
  
      toast({ title: `Removed access for ${emailToRemove}` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  

  const handleCancelInvitation = async (invitationId: string) => {
    if (!formId) return;

    const result = await cancelInvitation(invitationId, formId);
    if (result.success) {
      setAllInvitations(allInvitations.filter(inv => inv.id !== invitationId));
      toast({ title: `Invitation canceled.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };


  if (!isPublished) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-y-auto flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground">This form is not published</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Publish your form to get a shareable link, invite collaborators, and start collecting submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        <Tabs defaultValue="share" className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-1 bg-muted/20 p-1 h-auto rounded-lg max-w-sm mx-auto">
                 <TabsTrigger
                    value="share"
                    className={cn(
                        "py-2 text-sm font-medium transition-colors rounded-md",
                        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                        "data-[state=inactive]:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                 >
                    <Share className="mr-2 h-4 w-4" /> Share
                </TabsTrigger>
                 <TabsTrigger
                    value="embed"
                    className={cn(
                        "py-2 text-sm font-medium transition-colors rounded-md",
                        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                        "data-[state=inactive]:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                 >
                    <Code className="mr-2 h-4 w-4" /> Embed
                </TabsTrigger>
                 <TabsTrigger
                    value="invite"
                    className={cn(
                        "py-2 text-sm font-medium transition-colors rounded-md",
                        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                        "data-[state=inactive]:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                 >
                    <UserPlus className="mr-2 h-4 w-4" /> Invite
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="share" className="mt-6">
                 <Card className="shadow-sm border">
                    <CardHeader>
                        <CardTitle className="text-lg">Share your form</CardTitle>
                        <CardDescription>Anyone with the link can view and submit this form.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Input id="form-link" value={formLink} readOnly className="flex-grow bg-muted/30 border-input h-9" />
                            <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => handleCopy(formLink, 'Link copied to clipboard!')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                             <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" asChild>
                                <a href={formLink} target="_blank" rel="noopener noreferrer" aria-label="Open form in new tab">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                            <div ref={qrCodeRef} className="bg-white p-3 rounded-lg border border-border shadow-sm">
                              <QRCode value={formLink} size={128} />
                            </div>
                            <div className="space-y-2 text-center sm:text-left">
                                <h4 className="font-medium text-foreground">Scan QR Code</h4>
                                <p className="text-sm text-muted-foreground">Open this form directly on your mobile device.</p>
                                <div className="flex gap-2 pt-2 justify-center sm:justify-start">
                                   <Button variant="outline" size="sm" onClick={() => handleDownloadQR('png')}><Download className="mr-2 h-4 w-4" /> PNG</Button>
                                   <Button variant="outline" size="sm" onClick={() => handleDownloadQR('jpg')}><Download className="mr-2 h-4 w-4" /> JPG</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="embed">
               <Card className="w-full shadow-md border">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground">Embed on your site</CardTitle>
                  <CardDescription>Copy and paste this code to embed the form on your website.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="embed-code" className="text-sm font-medium">Iframe Embed</Label>
                    <div className="relative mt-1">
                      <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                        {embedCode}
                      </pre>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(embedCode, 'Embed code copied!')}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invite" className="mt-6">
                {isOwner ? (
                    <Card className="shadow-sm border">
                        <CardHeader>
                            <CardTitle className="text-lg">Invite Collaborators</CardTitle>
                            <CardDescription>Invite people to view and manage this form's settings and submissions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="Enter email address..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleShareWithUser()}
                                    disabled={loading || isCollaboratorLimitReached}
                                />
                                <Button onClick={handleShareWithUser} disabled={loading || isCollaboratorLimitReached}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                                </Button>
                            </div>
                             {isCollaboratorLimitReached && (
                                <Alert variant="default" className="border-yellow-500/50 text-yellow-800 bg-yellow-50 dark:bg-yellow-900/30">
                                    <ShieldAlert className="h-4 w-4 !text-yellow-600" />
                                    <AlertTitle>Limit Reached</AlertTitle>
                                    <AlertDescription>
                                        You have reached the maximum of 5 collaborators for this form.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {isLoadingInvites ? (
                                <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                            ) : (totalCollaborators > 0) && (
                                <div className="space-y-2 pt-4">
                                    <Label className="text-xs text-muted-foreground">COLLABORATORS ({totalCollaborators}/5)</Label>
                                    <div className="space-y-2 rounded-md border p-2">
                                    {activeCollaboratorsAndInvites.map((invite) => (
                                        <div key={invite.id} className="flex items-center justify-between p-2 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-foreground">{invite.recipientEmail}</span>
                                                {invite.status === 'accepted' ? (
                                                    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">Accepted</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="hover:bg-secondary">Pending</Badge>
                                                )}
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                          {invite.status === 'accepted' ? 'Remove Collaborator?' : 'Cancel Invitation?'}
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to remove access for {invite.recipientEmail}?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => {
                                                            if (invite.status === 'accepted') handleRemoveCollaborator(invite.recipientEmail);
                                                            else handleCancelInvitation(invite.id);
                                                        }} className="bg-destructive hover:bg-destructive/90">
                                                            {invite.status === 'accepted' ? 'Remove' : 'Cancel Invitation'}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Alert variant="default" className="border-primary/20 bg-primary/5">
                        <Users className="h-4 w-4" />
                        <AlertTitle>Collaboration Settings</AlertTitle>
                        <AlertDescription>
                            Only the form owner can send invitations.
                        </AlertDescription>
                    </Alert>
                )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
