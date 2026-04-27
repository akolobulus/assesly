
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trash2, Check, X as XIcon, Loader2, Inbox, FilePenLine, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { getMyInvitations, respondToInvitation, type InvitationDetails } from '@/lib/services/invitationService';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import type { FormDocument } from '@/lib/services/formService';
import { leaveFormCollaboration } from '@/lib/services/formService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSharedForms } from '@/hooks/useSharedForms';


export default function TeamsPage() {
    const [invitations, setInvitations] = useState<InvitationDetails[]>([]);
    const [isLoadingInvites, setIsLoadingInvites] = useState(true);
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const { sharedForms, setSharedForms, loading: isLoadingSharedForms, error: sharedFormsError } = useSharedForms(currentUser);

    const [formToLeave, setFormToLeave] = useState<FormDocument | null>(null);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    
    const [invitationToRespond, setInvitationToRespond] = useState<InvitationDetails | null>(null);
    const [responseType, setResponseType] = useState<'accepted' | 'declined' | null>(null);

    const [invitesCurrentPage, setInvitesCurrentPage] = useState(1);
    const [sharedFormsCurrentPage, setSharedFormsCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const fetchInvitations = useCallback(async () => {
        if (!currentUser) {
            setIsLoadingInvites(false);
            return;
        }
        setIsLoadingInvites(true);
        try {
            const myInvites = await getMyInvitations();
            setInvitations(myInvites);
        } catch (error) {
            console.error("Failed to fetch invitations:", error);
            toast({ title: "Error", description: "Could not load your invitations.", variant: "destructive" });
        } finally {
            setIsLoadingInvites(false);
        }
    }, [toast, currentUser]);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);
    
    const handleInvitationResponse = async () => {
        if (!currentUser || !invitationToRespond || !responseType) return;
        
        const originalInvitations = [...invitations];
        const updatedInvitations = invitations.filter(inv => inv.id !== invitationToRespond.id);
        setInvitations(updatedInvitations);
        
        const result = await respondToInvitation(invitationToRespond.id, responseType);
        
        if (!result.success) {
            toast({ title: "Error", description: result.error || "Could not respond to invitation.", variant: "destructive"});
            setInvitations(originalInvitations);
        } else {
             toast({
                title: `Invitation ${responseType.charAt(0).toUpperCase() + responseType.slice(1)}`,
                description: responseType === 'accepted' ? 'You can now collaborate on the form.' : 'You have declined the invitation.',
            });
            fetchInvitations();
        }
        
        setInvitationToRespond(null);
        setResponseType(null);
    };

    const handleRespondClick = (invite: InvitationDetails, type: 'accepted' | 'declined') => {
        setInvitationToRespond(invite);
        setResponseType(type);
    };
    
    const handleLeaveFormClick = (form: FormDocument) => {
        setFormToLeave(form);
        setIsLeaveModalOpen(true);
    };
    
    const handleConfirmLeaveForm = async () => {
        if (!currentUser || !formToLeave) return;
        try {
            const result = await leaveFormCollaboration(formToLeave.id);
            if(result.success) {
                 toast({
                    title: "Left Collaboration",
                    description: `You have left the form: "${formToLeave.formName}".`,
                });
                // Optimistically update the UI by removing the form from the local state
                setSharedForms(prevForms => prevForms.filter(f => f.id !== formToLeave.id));
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error leaving form:", error);
            toast({ title: "Error", description: "Could not leave the form collaboration.", variant: "destructive" });
        } finally {
            setIsLeaveModalOpen(false);
            setFormToLeave(null);
        }
    };

    const isLoading = isLoadingInvites || isLoadingSharedForms;
    const pendingInvites = invitations.filter(i => i.status === 'pending');

    // Pagination for Pending Invites
    const totalInvitePages = Math.ceil(pendingInvites.length / itemsPerPage);
    const paginatedInvites = useMemo(() => {
        const startIndex = (invitesCurrentPage - 1) * itemsPerPage;
        return pendingInvites.slice(startIndex, startIndex + itemsPerPage);
    }, [pendingInvites, invitesCurrentPage]);

    // Pagination for Shared Forms
    const totalSharedFormsPages = Math.ceil(sharedForms.length / itemsPerPage);
    const paginatedSharedForms = useMemo(() => {
        const startIndex = (sharedFormsCurrentPage - 1) * itemsPerPage;
        return sharedForms.slice(startIndex, startIndex + itemsPerPage);
    }, [sharedForms, sharedFormsCurrentPage]);


    return (
      <>
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Teams &amp; Sharing</h1>
            
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-auto p-1 bg-muted/20 rounded-lg">
                 <TabsTrigger
                    value="pending"
                    className={cn(
                        "py-2 text-sm font-medium transition-colors rounded-md relative",
                        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                        "data-[state=inactive]:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    data-tour="pending-invites-tab"
                 >
                    Pending Invitations {pendingInvites.length > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">{pendingInvites.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger
                    value="shared"
                    className={cn(
                        "py-2 text-sm font-medium transition-colors rounded-md",
                        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                        "data-[state=inactive]:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    data-tour="shared-forms-tab"
                >
                  Shared Forms
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="mt-6">
                <Card>
                  <CardHeader>
                      <CardTitle>Your Invitations</CardTitle>
                  </CardHeader>
                  <CardContent>
                      {isLoadingInvites ? (
                           <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                      ) : pendingInvites.length > 0 ? (
                          <div className="space-y-3">
                              {paginatedInvites.map(invite => (
                                  <div key={invite.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border gap-4">
                                      <div>
                                          <p className="text-sm text-foreground">
                                              <span className="font-semibold">{invite.inviterName}</span> has invited you to collaborate on <br />
                                              <span className="font-semibold text-primary">{invite.formName}</span>.
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                              Invited on {invite.sentAt ? format(new Date(invite.sentAt), 'dd/MM/yyyy') : ''}
                                          </p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                          <Button
                                            size="sm"
                                            onClick={() => handleRespondClick(invite, 'accepted')}
                                            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                          >
                                            <Check className="h-4 w-4 mr-1.5" />
                                            Accept
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => handleRespondClick(invite, 'declined')} className="bg-red-100 border border-red-200 text-red-700 hover:bg-red-200"><XIcon className="h-4 w-4 mr-1.5"/>Decline</Button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                           <div className="text-center py-10 text-muted-foreground">
                              You have no pending invitations.
                           </div>
                      )}
                  </CardContent>
                  {totalInvitePages > 1 && (
                      <CardFooter className="flex justify-end items-center gap-2 pt-4 border-t">
                          <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setInvitesCurrentPage(prev => Math.max(1, prev - 1))} 
                              disabled={invitesCurrentPage === 1}
                          >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                              Page {invitesCurrentPage} of {totalInvitePages}
                          </span>
                          <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setInvitesCurrentPage(prev => Math.min(totalInvitePages, prev + 1))} 
                              disabled={invitesCurrentPage === totalInvitePages}
                          >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                      </CardFooter>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="shared" className="mt-6">
                <Card>
                  <CardHeader>
                      <CardTitle>Shared Forms ({isLoadingSharedForms ? '...' : sharedForms.length})</CardTitle>
                      <CardDescription>Forms you have access to as a collaborator.</CardDescription>
                  </CardHeader>
                  <CardContent>
                       {isLoadingSharedForms ? (
                          <div className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                       ) : sharedFormsError ? (
                          <div className="text-center py-20 text-destructive">Error loading shared forms.</div>
                       ) : sharedForms.length > 0 ? (
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Form Name</TableHead>
                                      <TableHead className="hidden md:table-cell">Owner</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {paginatedSharedForms.map((form) => (
                                      <TableRow key={form.id} className="hover:bg-transparent">
                                          <TableCell>
                                              <span className="font-medium text-foreground">{form.formName}</span>
                                          </TableCell>
                                          <TableCell className="hidden md:table-cell text-muted-foreground">
                                              {form.creatorName || 'Unknown Owner'}
                                          </TableCell>
                                          <TableCell>
                                              <Badge variant="outline" className="capitalize border-primary/50 text-primary bg-primary/10">
                                                  Editor
                                              </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                              <div className="flex justify-end gap-2">
                                                  <Button asChild variant="outline" size="sm">
                                                      <Link href={`/builder?formId=${form.id}`}><FilePenLine className="mr-2 h-4 w-4"/> Edit Form</Link>
                                                  </Button>
                                                  <Button variant="destructive" size="sm" onClick={() => handleLeaveFormClick(form)}>
                                                      <Trash2 className="mr-2 h-4 w-4" /> Leave
                                                  </Button>
                                              </div>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                              </TableBody>
                          </Table>
                       ) : (
                          <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                              <Inbox className="h-12 w-12 mb-4 opacity-50"/>
                              <p>No forms have been shared with you yet.</p>
                           </div>
                       )}
                  </CardContent>
                   {totalSharedFormsPages > 1 && (
                      <CardFooter className="flex justify-end items-center gap-2 pt-4 border-t">
                          <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSharedFormsCurrentPage(prev => Math.max(1, prev - 1))} 
                              disabled={sharedFormsCurrentPage === 1}
                          >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                              Page {sharedFormsCurrentPage} of {totalSharedFormsPages}
                          </span>
                          <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSharedFormsCurrentPage(prev => Math.min(totalSharedFormsPages, prev + 1))} 
                              disabled={sharedFormsCurrentPage === totalSharedFormsPages}
                          >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                      </CardFooter>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
        </div>
        <AlertDialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Leave this form?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to leave the collaboration for "{formToLeave?.formName}"? You will lose access to its editor and submissions.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmLeaveForm} className="bg-destructive hover:bg-destructive/90">
                        Leave
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!invitationToRespond} onOpenChange={(open) => !open && setInvitationToRespond(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {responseType === 'accepted' ? 'Accept Invitation?' : 'Decline Invitation?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {responseType === 'accepted' 
                            ? `Do you want to accept the invitation to collaborate on "${invitationToRespond?.formName}"?`
                            : `Are you sure you want to decline the invitation for "${invitationToRespond?.formName}"?`
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setInvitationToRespond(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleInvitationResponse}
                        className={cn(responseType === 'declined' && "bg-destructive hover:bg-destructive/90", responseType === 'accepted' && "bg-red-600 hover:bg-red-700 text-white")}
                    >
                        {responseType === 'accepted' ? 'Accept' : 'Decline'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    );
}
