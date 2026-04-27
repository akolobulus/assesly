
'use server';

import { adminDb, getAuthenticatedUser } from '@/lib/firebaseAdmin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { createNotification } from './notificationService';
import type { FormDocument } from './formService';

const INVITATIONS_COLLECTION = 'formInvitations';
const initialDefaultStyles = {
  backgroundColor: '#FFFFFF',
  mainColor: '#EF4444',
  answersColor: '#374151',
  questionsColor: '#1F2937',
  headingColor: '#1F2937',
  paragraphColor: '#374151',
  inputsBackground: '#FFFFFF',
  inputsBorderColor: '#D1D5DB',
  inputBorderType: 'rounded',
  buttonBorderType: 'rounded',
  fontFamily: 'Figtree',
  fontWeight: 'normal',
  showBackButton: false,
  showFieldNumber: true,
  showButtonArrows: true,
  transitionType: 'Fade In',
  transitionDuration: 0.5,
  warnBeforeDropoff: false,
  formColor: '#F8F8FA',
  logoUrl: null,
  logoAlignment: 'center',
  descriptionFontSize: undefined,
  labelFontSize: undefined,
  optionFontSize: undefined,
  answerFontSize: undefined,
};
const initialWelcomePageConfig = {
  enabled: false,
  title: 'Welcome to our form',
  description: 'Please fill out this form to the best of your ability.',
  buttonText: 'Start Form',
  imageUrl: null,
};
const initialEndingPageConfig = {
  title: 'Thank you!',
  description: 'Your submission has been recorded!',
};
const initialAccessSettings = {
  isClosed: false,
  openDate: null,
  closeDate: null,
  submissionLimit: null,
};

export interface InvitationDetails {
  id: string;
  formId: string;
  formName: string;
  inviterId: string;
  inviterName: string;
  recipientId: string | null;
  recipientEmail: string;
  role: 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string; // serialize timestamp
  updatedAt?: string; // serialize timestamp
}

export interface InvitationWithRecipient extends InvitationDetails {
  recipientName?: string;
  recipientAvatarUrl?: string;
}

/**
 * Send an invitation (owner only). Now securely handled on the server.
 */
export async function sendInvitation(
  formId: string,
  formName: string,
  email: string,
): Promise<{ success: boolean; error?: string; invitation?: InvitationWithRecipient }> {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
        return { success: false, error: "User not authenticated." };
    }

    const inviterId = currentUser.uid;
    const inviterName = currentUser.displayName || currentUser.email || 'An anonymous user';

    const db = adminDb();
    const formRef = db.collection('forms').doc(formId);
    
    return await db.runTransaction(async (transaction) => {
      const formSnap = await transaction.get(formRef);
      if (!formSnap.exists) {
        throw new Error("Form not found.");
      }
      
      const formData = formSnap.data();
      if (!formData || formData.userId !== inviterId) {
          throw new Error("Only the form owner can send invitations.");
      }

      const existingCollaborator = (formData.sharedWith || []).find((c: any) => c.email === email);
      if (existingCollaborator) {
        throw new Error("This user is already a collaborator on this form.");
      }

      if (formData.pendingInvites?.includes(email)) {
          throw new Error("A pending invitation already exists for this email.");
      }

      const invitationsCollection = db.collection(INVITATIONS_COLLECTION);
      const newInviteRef = invitationsCollection.doc();
      const invitationData = {
        formId,
        formName,
        inviterId,
        inviterName,
        recipientEmail: email,
        status: 'pending' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      transaction.set(newInviteRef, invitationData);

      const updatedPendingInvites = Array.from(new Set([...(formData.pendingInvites || []), email]));
      transaction.update(formRef, {
        pendingInvites: updatedPendingInvites,
        lastEdited: Timestamp.now(),
      });
      
      const newInvitation: InvitationWithRecipient = {
        id: newInviteRef.id,
        formId,
        formName,
        inviterId,
        inviterName,
        recipientId: null,
        recipientEmail: email,
        role: 'editor',
        status: 'pending',
        sentAt: new Date().toISOString(),
      };
      
      return { success: true, invitation: newInvitation };
    }).then(async (result) => {
        if (result.success) {
             await createNotification({
                recipientEmail: email,
                creatorId: inviterId,
                title: `You've been invited to collaborate!`,
                message: `${inviterName} invited you to collaborate on "${formName}".`,
                link: `/dashboard/teams`,
                formId: formId,
            });
        }
        return result;
    });

  } catch (e: any) {
    console.error("[invitationService] Error sending invitation:", e);
    return { success: false, error: e.message || "Could not send invitation." };
  }
}

/**
 * Get all invites for a form (owner only).
 */
export async function getInvitationsForForm(formId: string): Promise<InvitationWithRecipient[]> {
  try {
    const db = adminDb();
    const q = db.collection(INVITATIONS_COLLECTION)
      .where('formId', '==', formId);
    
    const snap = await q.get();

    const invitations = snap.docs.map(docSnap => {
      const data = docSnap.data();
      // Ensure timestamps are converted to ISO strings for serialization
      const sentAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
      const updatedAt = (data.updatedAt as Timestamp)?.toDate().toISOString() || sentAt;
      
      return {
        id: docSnap.id,
        formId: data.formId,
        formName: data.formName,
        inviterId: data.inviterId,
        inviterName: data.inviterName,
        recipientId: data.recipientId || null,
        recipientEmail: data.recipientEmail,
        role: data.role || 'editor',
        status: data.status,
        sentAt: sentAt,
        updatedAt: updatedAt,
      } as InvitationWithRecipient;
    });
    
    return invitations.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  } catch (err) {
    console.error(`[invitationService] Error fetching invitations for form ${formId}:`, err);
    return [];
  }
}


/**
 * Get my invitations (as recipient).
 */
export async function getMyInvitations(): Promise<InvitationDetails[]> {
  const user = await getAuthenticatedUser();
  if (!user || !user.email) return [];
  
  try {
    const db = adminDb();
    const q = db.collection(INVITATIONS_COLLECTION)
      .where('recipientEmail', '==', user.email);
    
    const snap = await q.get();

    const invitations = snap.docs.map(docSnap => {
      const data = docSnap.data();
      const sentAt = (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString();
      const updatedAt = (data.updatedAt as Timestamp)?.toDate().toISOString() || sentAt;
      
      return {
        id: docSnap.id,
        formId: data.formId,
        formName: data.formName,
        inviterId: data.inviterId,
        inviterName: data.inviterName,
        recipientId: data.recipientId || null,
        recipientEmail: data.recipientEmail,
        role: data.role || 'editor',
        status: data.status,
        sentAt: sentAt,
        updatedAt: updatedAt,
      } as InvitationDetails;
    });

    return invitations.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  } catch (err) {
    console.error(`[invitationService] Error fetching invitations for ${user.email}:`, err);
    return [];
  }
}

/**
 * Respond to an invitation (recipient only).
 * Correctly structured to perform reads before writes in a transaction.
 */
export async function respondToInvitation(
  invitationId: string,
  response: 'accepted' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const db = adminDb();
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId);
    
    let notificationDetails: { inviterId: string; formName: string; formId: string; } | null = null;

    await db.runTransaction(async (transaction) => {
      const inviteSnap = await transaction.get(invitationRef);
      if (!inviteSnap.exists) throw new Error("Invitation not found.");
      
      const invitationData = inviteSnap.data();
      if (!invitationData || invitationData.recipientEmail !== user.email) {
        throw new Error("This invitation is not for you.");
      }
      
      const formRef = db.collection('forms').doc(invitationData.formId);
      const formSnap = await transaction.get(formRef);

      notificationDetails = {
        inviterId: invitationData.inviterId,
        formName: invitationData.formName,
        formId: invitationData.formId,
      };

      transaction.update(invitationRef, {
        status: response,
        updatedAt: Timestamp.now(),
        recipientId: user.uid,
      });

      if (formSnap.exists) {
        const formData = formSnap.data() as FormDocument;
        const updatedPendingInvites = (formData.pendingInvites || []).filter((email: string) => email !== invitationData.recipientEmail);

        if (response === 'accepted') {
          const newCollaborator = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email,
            role: 'editor',
          };
          
          transaction.update(formRef, {
            sharedWith: FieldValue.arrayUnion(newCollaborator),
            sharedWithUids: FieldValue.arrayUnion(user.uid),
            ownerAndCollaborators: FieldValue.arrayUnion(user.uid),
            pendingInvites: updatedPendingInvites,
            lastEdited: Timestamp.now(),
          });
        } else {
          transaction.update(formRef, {
            pendingInvites: updatedPendingInvites,
            lastEdited: Timestamp.now(),
          });
        }
      }
    });

    if (notificationDetails && response === 'accepted') {
      await createNotification({
        recipientId: notificationDetails.inviterId,
        creatorId: user.uid,
        title: "Invitation Accepted",
        message: `${user.displayName || user.email} accepted your invitation to collaborate on "${notificationDetails.formName}".`,
        formId: notificationDetails.formId,
        link: `/builder?formId=${notificationDetails.formId}&tab=share`
      });
    }
    
    return { success: true };

  } catch (e: any) {
    console.error(`[invitationService] Error responding to invitation ${invitationId}:`, e);
    return { success: false, error: e.message || "Failed to respond to invitation." };
  }
}


/**
 * Cancel a pending invitation (owner only).
 */
export async function cancelInvitation(
  invitationId: string,
  formId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: "User not authenticated."};

  try {
    const db = adminDb();
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId);
    
    return await db.runTransaction(async (transaction) => {
      const inviteSnap = await transaction.get(invitationRef);
      if (!inviteSnap.exists) throw new Error("Invitation not found.");

      const inviteData = inviteSnap.data();
      if (!inviteData || inviteData.formId !== formId) {
        throw new Error("Invitation does not belong to this form.");
      }

      const formRef = db.collection('forms').doc(formId);
      const formSnap = await transaction.get(formRef);
      const formData = formSnap.data();
      if (!formSnap.exists || !formData || formData.userId !== user.uid) {
          throw new Error("Only the form owner can cancel invitations.")
      }

      transaction.delete(invitationRef);
      transaction.update(formRef, {
        pendingInvites: (formData.pendingInvites || []).filter((email: string) => email !== inviteData.recipientEmail),
        lastEdited: Timestamp.now(),
      });

      return { success: true };
    });
  } catch (e: any) {
    console.error(`[invitationService] Error canceling invitation ${invitationId}:`, e);
    return { success: false, error: e.message || "Could not cancel invitation." };
  }
}

export async function getSharedFormsForCurrentUser(): Promise<FormDocument[]> {
  const user = await getAuthenticatedUser();
  if (!user || !user.email) {
      console.warn('[getSharedFormsForCurrentUser] No authenticated user or email found.');
      return [];
  }

  try {
    const db = adminDb();
    // Query based on the UID which is stable and unique.
    const formsQuery = db.collection('forms')
      .where('sharedWithUids', 'array-contains', user.uid)
      .where('trashedAt', '==', null);
      
    const formDocs = await formsQuery.get();
    
    if (formDocs.empty) {
      return [];
    }
    
    const formsListPromises = formDocs.docs.map(async (formDoc) => {
        const data = formDoc.data();
        const userDocRef = db.collection('users').doc(data.userId);
        const userDoc = await userDocRef.get();

        const createdAt = data.createdAt as Timestamp;
        const lastEdited = data.lastEdited as Timestamp;
      
        const form: FormDocument = {
            id: formDoc.id,
            userId: data.userId,
            formName: data.formName,
            formDescription: data.formDescription,
            thumbnailUrl: data.thumbnailUrl,
            creatorName: userDoc.exists ? (userDoc.data()?.displayName || userDoc.data()?.email) : 'Unknown Owner',
            createdAt: createdAt.toDate().toISOString(),
            lastEdited: lastEdited.toDate().toISOString(),
            isPublished: data.isPublished,
            trashedAt: data.trashedAt ?? null,
            formFields: data.formFields || [],
            formStyles: { ...initialDefaultStyles, ...(data.formStyles || {}) },
            formPages: data.formPages || [{ id: `page-${Date.now()}-1`, title: 'Page 1' }],
            welcomePage: data.welcomePage || initialWelcomePageConfig,
            endingPage: data.endingPage || initialEndingPageConfig,
            accessSettings: data.accessSettings || initialAccessSettings,
            responsesCount: data.responsesCount || 0,
            metaImageUrl: data.metaImageUrl || null,
            formType: data.formType || 'private',
            formCategory: data.formCategory || null,
            folderId: data.folderId ?? null,
            sharedWith: data.sharedWith || [],
            sharedWithUids: data.sharedWithUids || [],
            ownerAndCollaborators: data.ownerAndCollaborators || [data.userId],
            pendingInvites: data.pendingInvites || []
        };
        return form;
    });

    const forms = await Promise.all(formsListPromises);
    // Sort by last edited date descending
    forms.sort((a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime());
    return forms;
  } catch (e: any) {
    console.error("[invitationService] getSharedFormsForCurrentUser error:", e);
    return [];
  }
}
