

import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  Timestamp,
  doc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  getDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import UAParser from 'ua-parser-js';
import { createNotification } from './notificationService';

export interface Submission {
  id: string;
  createdAt: Timestamp;
  data: Record<string, any>;
  isStarred?: boolean;
  status?: 'valid' | 'spam';
  formOwnerId?: string;
  device?: string;
  score?: number | null;
}

// Helper function to recursively remove undefined values from an object
// Firestore does not support `undefined` as a field value.
function sanitizeObjectForFirestore(obj: any): any {
  if (obj === null || typeof obj !== 'object' || obj instanceof Timestamp || obj instanceof Date || Array.isArray(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObjectForFirestore(item));
    }
    return obj;
  }

  const sanitized: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // Skip undefined, function, and File values
      if (value === undefined || typeof value === 'function' || (typeof File !== 'undefined' && value instanceof File)) {
        continue;
      }
      sanitized[key] = sanitizeObjectForFirestore(value);
    }
  }
  return sanitized;
}


// Function to create a new submission for a form
export async function createSubmission(
  formId: string,
  submissionData: Record<string, any>,
  userAgentString?: string
): Promise<{ success: boolean; error?: string }> {
  if (!formId) {
    return { success: false, error: 'Form ID is missing.' };
  }

  try {
    const formRef = doc(db, 'forms', formId);
    let formOwnerId: string | null = null;
    let formName: string = "Untitled Form";
    let enableSubmissionNotifications: boolean = false;
    let collaborators: { uid: string }[] = [];
    
    // Get device type
    const parser = new UAParser(userAgentString);
    const deviceTypeRaw = parser.getDevice().type; // e.g., 'mobile', 'tablet', 'console', undefined for desktop
    let device: 'Desktop' | 'Mobile' | 'Tablet' | 'Others' = 'Desktop'; // Default
    if (deviceTypeRaw === 'mobile') device = 'Mobile';
    else if (deviceTypeRaw === 'tablet') device = 'Tablet';
    else if (deviceTypeRaw) device = 'Others';

    // We use a transaction to ensure the form is still published and open when we create the submission.
    await runTransaction(db, async (transaction) => {
      const formSnap = await transaction.get(formRef);

      if (!formSnap.exists()) {
        throw new Error('This form does not exist.');
      }
      
      const formData = formSnap.data();
      formOwnerId = formData.userId;
      formName = formData.formName || "Untitled Form";
      enableSubmissionNotifications = formData.enableSubmissionNotifications ?? true; // Default to true if not set
      collaborators = formData.sharedWithUids || [];


      // Server-side validation of form status
      if (!formData.isPublished) {
        throw new Error('This form is not currently accepting submissions.');
      }

      const accessSettings = formData.accessSettings || {};
      const now = new Date();
       if (accessSettings.isClosed) {
        throw new Error('This form is not currently accepting submissions.');
      }
      if (accessSettings.openDate && now < new Date(accessSettings.openDate)) {
        throw new Error("This form is not open for submissions yet.");
      }
      if (accessSettings.closeDate && now > new Date(accessSettings.closeDate)) {
        throw new Error("This form is now closed for submissions.");
      }
      
      const currentResponses = formData.responsesCount || 0;
      if (accessSettings.submissionLimit && currentResponses >= accessSettings.submissionLimit) {
        throw new Error('This form has reached its submission limit.');
      }

      const newSubmissionRef = doc(collection(db, 'forms', formId, 'submissions'));
      const submissionPayload = {
        data: sanitizeObjectForFirestore(submissionData),
        createdAt: serverTimestamp(),
        formOwnerId: formData.userId,
        isStarred: false,
        status: 'valid' as const,
        device: device,
        score: null,
      };
      
      transaction.set(newSubmissionRef, submissionPayload);
    });

    if (enableSubmissionNotifications && formOwnerId) {
      const recipientIds = new Set<string>();
      recipientIds.add(formOwnerId); // Add owner
      collaborators.forEach(uid => { if(uid) recipientIds.add(uid); }); // Add collaborators from sharedWithUids

      // Create notifications for each unique recipient
      for (const recipientId of recipientIds) {
        await createNotification({
          recipientId: recipientId,
          creatorId: "system", // Or a specific system ID
          title: `New Submission for "${formName}"`,
          message: `A new response has been submitted to "${formName}".`,
          link: `/builder?formId=${formId}&tab=submission`,
          formId: formId,
        });
      }
    }


    console.log('[submissionService] Submission created successfully for form ' + formId + '.');
    return { success: true };

  } catch (e: any) {
    console.error('[submissionService] Error creating submission for form ' + formId + ':', e);
    return { success: false, error: e.message || 'Submission failed. Please check permissions.' };
  }
}

// Function to get all submissions for a specific form
export async function getSubmissionsForForm(formId: string): Promise<Submission[]> {
  const user = auth.currentUser;
  if (!user) {
    console.warn(`[submissionService] getSubmissionsForForm: User not authenticated.`);
    return [];
  }

  try {
    const formRef = doc(db, 'forms', formId);
    const formSnap = await getDoc(formRef);

    if (!formSnap.exists()) {
      console.warn(`[submissionService] Form ${formId} not found.`);
      return [];
    }

    const formData = formSnap.data();
    const isOwner = formData.userId === user.uid;
    const isCollaborator = (formData.sharedWithUids || []).includes(user.uid);

    if (!isOwner && !isCollaborator) {
      console.warn(`[submissionService] User ${user.uid} does not have access to form ${formId}.`);
      return [];
    }

    const submissionsCollectionRef = collection(db, 'forms', formId, 'submissions');
    // All submissions belong to the owner, so we query by the owner's ID
    const submissionsQuery = query(submissionsCollectionRef, where('formOwnerId', '==', formData.userId));

    const querySnapshot = await getDocs(submissionsQuery);

    const submissions = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Submission[];

    submissions.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    console.log(`[submissionService] Retrieved ${submissions.length} submissions for form ${formId}.`);
    return submissions;
  } catch (error) {
    console.error(`[submissionService] Failed to fetch submissions for form ${formId}:`, error);
    return [];
  }
}

// Function to delete a submission
export async function deleteSubmission(formId: string, submissionId: string): Promise<{ success: boolean; error?: string }> {
   const user = auth.currentUser;
   if (!user) {
        return { success: false, error: 'User not authenticated.' };
   }

   try {
    const submissionRef = doc(db, 'forms', formId, 'submissions', submissionId);
    
    await deleteDoc(submissionRef);

    console.log(`[submissionService] Submission ${submissionId} deleted successfully from form ${formId}.`);
    return { success: true };
  } catch (e: any)
   {
    console.error(`[submissionService] Error deleting submission ${submissionId}:`, e);
    return { success: false, error: e.message || 'Failed to delete submission.' };
  }
}

// Function to update submission status (starred, spam, etc.) or data
export async function updateSubmission(
  formId: string,
  submissionId: string,
  updateData: Partial<Submission>
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const submissionRef = doc(db, 'forms', formId, 'submissions', submissionId);
    
    // Security check: Make sure user owns the form before updating a submission.
    // This is an extra layer on top of Firestore rules.
    const formRef = doc(db, 'forms', formId);
    const formDoc = await getDoc(formRef);
    if (!formDoc.exists()) {
        throw new Error("Parent form not found.");
    }

    const formData = formDoc.data();
    const isOwner = formData.userId === user.uid;
    const isCollaborator = (formData.sharedWithUids || []).includes(user.uid);

    if (!isOwner && !isCollaborator) {
      throw new Error("You do not have permission to modify submissions for this form.");
    }
    
    await updateDoc(submissionRef, sanitizeObjectForFirestore(updateData));
    return { success: true };
  } catch (e: any) {
    console.error(`[submissionService] Error updating submission ${submissionId}:`, e);
    return { success: false, error: e.message || 'Failed to update submission.' };
  }
}
