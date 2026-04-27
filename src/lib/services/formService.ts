
'use client'; // This is a client-side module
import { auth, db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where, 
  getDocs,
  serverTimestamp,
  orderBy,
  Timestamp,
  deleteDoc,
  writeBatch,
  runTransaction,
  increment,
  arrayRemove,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';
import type { FormFieldInstance, FormStyles, FormPage, FormBuilderData as OriginalFormBuilderData, WelcomePageConfig, EndingPageConfig, AccessSettings } from '@/components/dashboard/forms/builder/types';
import { recordFormView } from './analyticsService';

export type FormBuilderData = OriginalFormBuilderData;

export interface FormDocument {
  id: string;
  userId: string;
  formName: string;
  formDescription: string;
  formFields: Omit<FormFieldInstance, 'icon'>[];
  formStyles: FormStyles;
  formPages: FormPage[];
  welcomePage?: WelcomePageConfig;
  endingPage?: EndingPageConfig;
  accessSettings?: AccessSettings;
  createdAt: Timestamp | string; // Allow string for serializability
  lastEdited: Timestamp | string; // Allow string for serializability
  isPublished: boolean;
  responsesCount: number;
  thumbnailUrl: string;
  metaImageUrl?: string | null;
  formType: 'public' | 'private';
  formCategory?: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null;
  folderId?: string | null;
  trashedAt?: Timestamp | null;
  creatorName?: string;
  creatorEmail?: string;
  creatorAvatarUrl?: string;
  sharedWith?: any[]; // Keep as any[] for client-side flexibility
  sharedWithUids?: string[];
  pendingInvites?: string[];
  ownerAndCollaborators?: string[];
  publishedData?: any;
  enableSubmissionNotifications?: boolean;
}

export type FormSavableData = Omit<FormBuilderData, 'formFields'> & {
  formFields: Omit<FormFieldInstance, 'icon'>[];
};

export type PublicFormResult = {
  status: 'available' | 'closed' | 'unavailable' | 'not-yet-open' | 'closed-by-schedule' | 'limit-reached';
  data: FormDocument | null;
};

// ---- Initial Defaults ----
const initialDefaultStyles: FormStyles = {
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

const initialWelcomePageConfig: WelcomePageConfig = {
  enabled: false,
  title: 'Welcome to our form',
  description: 'Please fill out this form to the best of your ability.',
  buttonText: 'Start Form',
  imageUrl: null,
};

const initialEndingPageConfig: EndingPageConfig = {
  title: 'Thank you!',
  description: 'Your submission has been recorded!',
};

const initialAccessSettings: AccessSettings = {
  isClosed: false,
  openDate: null,
  closeDate: null,
  submissionLimit: null,
};


// ---- Helper: Remove undefined recursively ----
function sanitizeObjectForFirestore(obj: any): any {
  if (obj === null || typeof obj !== 'object' || obj instanceof Timestamp || obj instanceof Date || Array.isArray(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObjectForFirestore(item));
    }
    return obj;
  }

  const sanitized: { [key: string]: any } = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    if (value === undefined || typeof value === 'function') continue;
    sanitized[key] = sanitizeObjectForFirestore(value);
  }
  return sanitized;
}

// ---- Save Form ----
export async function saveForm(
  formId: string | null,
  formData: FormBuilderData
): Promise<{ success: boolean; error?: string; formId?: string; lastEdited?: Timestamp }> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not authenticated.' };

  const formFieldsToSave = formData.formFields.map(({ icon, ...rest }) => rest);

  const saveData = {
    formName: formData.formName || "Untitled Form",
    formDescription: formData.formDescription || "",
    formFields: formFieldsToSave,
    formStyles: { ...initialDefaultStyles, ...(formData.formStyles || {}) },
    formPages: formData.formPages?.length
      ? formData.formPages
      : [{ id: `page-${Date.now()}-1`, title: 'Page 1' }],
    welcomePage: formData.welcomePage || initialWelcomePageConfig,
    endingPage: formData.endingPage || initialEndingPageConfig,
    accessSettings: formData.accessSettings || initialAccessSettings,
    thumbnailUrl:
      formData.thumbnailUrl ||
      `https://placehold.co/600x400.png?text=${encodeURIComponent(formData.formName || "Form")}`,
    metaImageUrl: formData.metaImageUrl || null,
    formType: formData.formType || 'private',
    formCategory: formData.formType === 'public' ? (formData.formCategory || null) : null,
    folderId: formData.folderId ?? null,
    enableSubmissionNotifications: formData.enableSubmissionNotifications ?? true,
  };
  
  const sanitizedData = sanitizeObjectForFirestore(saveData);

  try {
    if (formId) {
      // --- UPDATE EXISTING FORM ---
      await runTransaction(db, async (transaction) => {
        const formRef = doc(db, 'forms', formId);
        const formSnap = await transaction.get(formRef);

        if (!formSnap.exists()) {
          throw new Error("Form not found.");
        }
        
        const existingData = formSnap.data();
        const isOwner = existingData.userId === user.uid;
        const isCollaborator = (existingData.sharedWithUids || []).includes(user.uid);

        if (!isOwner && !isCollaborator) {
          throw new Error("You do not have permission to save this form.");
        }

        // When a collaborator saves, we must preserve the sensitive fields from the existing document.
        const updatePayload: Record<string, any> = {
          ...sanitizedData,
          lastEdited: serverTimestamp(),
          userId: existingData.userId, // Preserve original owner
          sharedWith: existingData.sharedWith || [],
          sharedWithUids: existingData.sharedWithUids || [],
          ownerAndCollaborators: existingData.ownerAndCollaborators || [existingData.userId], // Preserve this array
          pendingInvites: existingData.pendingInvites || [],
        };

        transaction.update(formRef, updatePayload);
      });
      return { success: true, formId, lastEdited: Timestamp.now() };

    } else {
      // --- CREATE NEW FORM ---
      const dataForCreate = {
        ...sanitizedData,
        userId: user.uid,
        isPublished: false,
        responsesCount: 0,
        createdAt: serverTimestamp(),
        lastEdited: serverTimestamp(),
        trashedAt: null,
        sharedWith: [],
        sharedWithUids: [],
        ownerAndCollaborators: [user.uid], // Initialize with owner's UID
        pendingInvites: [],
      };

      const newFormRef = doc(collection(db, 'forms'));
      await setDoc(newFormRef, dataForCreate);

      if (sanitizedData.folderId) {
        const folderRef = doc(db, 'folders', sanitizedData.folderId);
        await runTransaction(db, async (tx) => {
          const folderSnap = await tx.get(folderRef);
          if (folderSnap.exists()) tx.update(folderRef, { formCount: increment(1) });
        });
      }

      return { success: true, formId: newFormRef.id, lastEdited: Timestamp.now() };
    }
  } catch (e: any) {
    console.error("[formService] saveForm error:", e);
    return { success: false, error: e.message || 'Failed to save form.' };
  }
}


// ---- Collaborator Management ----
export async function removeCollaboratorFromForm(
  formId: string,
  emailToRemove: string
): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const formRef = doc(db, 'forms', formId);
    await runTransaction(db, async (transaction) => {
      const formSnap = await transaction.get(formRef);
      if (!formSnap.exists()) {
        throw new Error("Form not found.");
      }

      const formData = formSnap.data();
      if (formData.userId !== user.uid) {
        throw new Error("Only the form owner can remove collaborators.");
      }
      
      const sharedWith = formData.sharedWith || [];
      const pendingInvites = formData.pendingInvites || [];
      
      const collaboratorToRemove = sharedWith.find((c: any) => c.email === emailToRemove);

      const updates: Record<string, any> = {};

      if (pendingInvites.includes(emailToRemove)) {
          updates.pendingInvites = arrayRemove(emailToRemove);
      }
      
      if (collaboratorToRemove) {
          updates.sharedWith = arrayRemove(collaboratorToRemove);
          if (collaboratorToRemove.uid) {
            updates.sharedWithUids = arrayRemove(collaboratorToRemove.uid);
            updates.ownerAndCollaborators = arrayRemove(collaboratorToRemove.uid);
          }
      }

      if (Object.keys(updates).length > 0) {
        transaction.update(formRef, updates);
      } else {
        console.log(`User ${emailToRemove} was not found in pending invites or sharedWith for form ${formId}.`);
      }
    });

    return { success: true };
  } catch (e: any) {
    console.error(`Error removing collaborator ${emailToRemove} from form ${formId}:`, e);
    return { success: false, error: e.message || 'Failed to remove collaborator.' };
  }
}


export async function leaveFormCollaboration(formId: string): Promise<{ success: boolean; error?: string; }> {
    const user = auth.currentUser;
    if (!user || !user.email) return { success: false, error: 'User not authenticated.' };

    try {
        const formRef = doc(db, 'forms', formId);
        await runTransaction(db, async (transaction) => {
            const formSnap = await transaction.get(formRef);
            if (!formSnap.exists()) {
                throw new Error("Form not found.");
            }
            const formData = formSnap.data();
            const collaboratorToRemove = (formData.sharedWith || []).find((c: any) => c.email === user.email);
            
            if (!collaboratorToRemove) {
                throw new Error("You are not a collaborator on this form.");
            }

            transaction.update(formRef, { 
                sharedWith: arrayRemove(collaboratorToRemove),
                sharedWithUids: arrayRemove(collaboratorToRemove?.uid),
                ownerAndCollaborators: arrayRemove(collaboratorToRemove?.uid)
             });
        });
        return { success: true };
    } catch(e: any) {
        console.error(`Error leaving form ${formId}:`, e);
        return { success: false, error: e.message || 'Failed to leave form.' };
    }
}

export async function getFormById(formId: string, currentUserId: string): Promise<FormDocument | null> {
  if (!currentUserId) {
    console.error(`[getFormById] No currentUserId provided for form ${formId}`);
    return null;
  }
  
  try {
    const formRef = doc(db, 'forms', formId);
    const docSnap = await getDoc(formRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const isOwner = data.userId === currentUserId;
      const isCollaborator = (data.sharedWithUids || []).includes(currentUserId);
      
      if (!isOwner && !isCollaborator) {
        console.error(`User ${currentUserId} does not have access to form ${formId}`);
        return null;
      }

      const submissionsCol = collection(db, 'forms', formId, 'submissions');
      const submissionsQuery = query(submissionsCol, where('formOwnerId', '==', data.userId));
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      return {
        id: docSnap.id,
        userId: data.userId,
        formName: data.formName || "Untitled Form",
        formDescription: data.formDescription || "",
        formFields: data.formFields || [],
        formStyles: { ...initialDefaultStyles, ...(data.formStyles || {}) },
        formPages: (data.formPages && data.formPages.length > 0) ? data.formPages : [{ id: `page-${Date.now()}-1`, title: 'Page 1 Title' }],
        welcomePage: data.welcomePage || initialWelcomePageConfig,
        endingPage: data.endingPage || initialEndingPageConfig,
        accessSettings: data.accessSettings || initialAccessSettings,
        createdAt: data.createdAt as Timestamp,
        lastEdited: data.lastEdited as Timestamp,
        isPublished: data.isPublished || false,
        responsesCount: submissionsSnapshot.size,
        thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.formName || "Form")}`,
        metaImageUrl: data.metaImageUrl || null,
        formType: data.formType || 'private',
        formCategory: data.formCategory || null,
        folderId: data.folderId === undefined ? null : data.folderId,
        sharedWith: data.sharedWith || [],
        sharedWithUids: data.sharedWithUids || [],
        ownerAndCollaborators: data.ownerAndCollaborators || [data.userId],
        pendingInvites: data.pendingInvites || [],
        trashedAt: data.trashedAt || null,
        enableSubmissionNotifications: data.enableSubmissionNotifications ?? true,
      } as FormDocument;
    }
    return null;
  } catch (e: any) {
    console.error(`[formService] Error fetching form by ID ${formId}: `, e);
    return null;
  }
}

// THIS FUNCTION IS FOR THE CLIENT-SIDE PAGE.TSX
// A DUPLICATE EXISTS IN formService.server.ts for METADATA GENERATION
export async function getPublicFormById(formId: string, userAgentString?: string): Promise<PublicFormResult> {
  console.log(`[formService] getPublicFormById (CLIENT): Fetching public form ${formId}`);
  try {
    const formRef = doc(db, 'forms', formId);
    const docSnap = await getDoc(formRef);

    if (docSnap.exists()) {
      if (userAgentString) {
        recordFormView(formId, userAgentString);
      }
      
      const data = docSnap.data();

      if (!data.isPublished || data.trashedAt) {
        return { status: 'unavailable', data: null };
      }
      
      const content = data.publishedData || data;
      const accessSettings = content.accessSettings || {};
      const now = new Date();
      
      const userDocRef = doc(db, 'users', data.userId);
      const userDocSnap = await getDoc(userDocRef);
      const creatorName = userDocSnap.exists() ? userDocSnap.data().displayName : 'Unknown';
      const creatorEmail = userDocSnap.exists() ? userDocSnap.data().email : 'Unknown';

      const formDocument: FormDocument = {
        id: docSnap.id,
        userId: data.userId,
        isPublished: data.isPublished,
        responsesCount: data.responsesCount || 0,
        createdAt: data.createdAt,
        lastEdited: data.lastEdited,
        folderId: data.folderId,
        formName: content.formName || "Untitled Form",
        formDescription: content.formDescription || "",
        formFields: content.formFields || [],
        formStyles: { ...initialDefaultStyles, ...(content.formStyles || {}) },
        formPages: (content.formPages && content.formPages.length > 0) ? content.formPages : [{ id: `page-${Date.now()}-1`, title: 'Page 1' }],
        welcomePage: content.welcomePage || initialWelcomePageConfig,
        endingPage: content.endingPage || initialEndingPageConfig,
        accessSettings: content.accessSettings || initialAccessSettings,
        thumbnailUrl: content.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(content.formName || 'Form')}`,
        metaImageUrl: content.metaImageUrl || null,
        formType: content.formType || 'private',
        formCategory: content.formCategory || null,
        sharedWith: data.sharedWith || [],
        sharedWithUids: data.sharedWithUids || [],
        ownerAndCollaborators: data.ownerAndCollaborators || [data.userId],
        pendingInvites: data.pendingInvites || [],
        trashedAt: data.trashedAt || null,
        creatorName: creatorName,
        creatorEmail: creatorEmail,
        enableSubmissionNotifications: data.enableSubmissionNotifications ?? true,
      };

      if (accessSettings.isClosed) return { status: 'closed', data: formDocument };
      if (accessSettings.openDate && now < new Date(accessSettings.openDate)) return { status: 'not-yet-open', data: formDocument };
      if (accessSettings.closeDate && now > new Date(accessSettings.closeDate)) return { status: 'closed-by-schedule', data: formDocument };
      if (accessSettings.submissionLimit && data.responsesCount >= accessSettings.submissionLimit) return { status: 'limit-reached', data: formDocument };
      
      return { status: 'available', data: formDocument };
    } else {
      return { status: 'unavailable', data: null };
    }
  } catch (e: any) {
    console.error(`[formService] Error fetching public form by ID ${formId}: `, e);
    throw new Error(e.message || `Failed to fetch form ${formId} due to a server error.`);
  }
}

export async function duplicateForm(formId: string): Promise<{ success: boolean; error?: string; newFormId?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const originalFormRef = doc(db, 'forms', formId);
    const originalFormSnap = await getDoc(originalFormRef);

    if (!originalFormSnap.exists()) {
      return { success: false, error: 'Form not found.' };
    }

    const originalData = originalFormSnap.data();
    
    const hasAccess = originalData.userId === user.uid || 
                     (originalData.sharedWith && originalData.sharedWith.some((c: any) => c.uid === user.uid));
    
    if (!hasAccess) {
      return { success: false, error: 'Permission denied.' };
    }

    const { id, ...dataWithoutId } = originalData;
    
    const newFormData = {
      ...dataWithoutId,
      userId: user.uid, // Set current user as owner
      formName: `${originalData.formName} (Copy)`,
      createdAt: serverTimestamp(),
      lastEdited: serverTimestamp(),
      isPublished: false,
      responsesCount: 0,
      publishedData: null,
      trashedAt: null,
      sharedWith: [],
      sharedWithUids: [],
      ownerAndCollaborators: [user.uid],
      pendingInvites: [],
    };
    
    let newFormId: string = '';
    
    await runTransaction(db, async (transaction) => {
      const newFormRef = doc(collection(db, 'forms'));
      transaction.set(newFormRef, newFormData);
      newFormId = newFormRef.id;

      if (newFormData.folderId) {
        const folderRef = doc(db, 'folders', newFormData.folderId);
        const folderSnap = await transaction.get(folderRef);
        if (folderSnap.exists()) {
          transaction.update(folderRef, { formCount: increment(1) });
        }
      }
    });

    return { success: true, newFormId };
  } catch (e: any) {
    console.error(`Error duplicating form ${formId}:`, e);
    return { success: false, error: e.message || 'Failed to duplicate form.' };
  }
}

export async function trashForm(formId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }
  
  try {
    await runTransaction(db, async (transaction) => {
      const formRef = doc(db, 'forms', formId);
      const formSnap = await transaction.get(formRef);

      if (!formSnap.exists()) throw new Error("Form does not exist!");
      if (formSnap.data().trashedAt) return;
      
      if (formSnap.data().userId !== user.uid) {
        throw new Error("You do not have permission to delete this form.");
      }

      const folderId = formSnap.data().folderId;
      transaction.update(formRef, { 
        trashedAt: serverTimestamp(), 
        lastEdited: serverTimestamp() 
      });

      if (folderId) {
        const folderRef = doc(db, 'folders', folderId);
        const folderSnap = await transaction.get(folderRef);
        if (folderSnap.exists()) {
          transaction.update(folderRef, { formCount: increment(-1) });
        }
      }
      
      if (formSnap.data().isPublished) {
        const publicFormRef = doc(db, 'publicForms', formId);
        transaction.delete(publicFormRef);
      }
    });
    return { success: true };
  } catch (e: any) {
    console.error(`Error moving form ${formId} to trash:`, e);
    return { success: false, error: e.message || 'Failed to move form to trash.' };
  }
}

export async function restoreForm(formId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: 'User not authenticated.' };
  }
  
  try {
    await runTransaction(db, async (transaction) => {
      const formRef = doc(db, 'forms', formId);
      const formSnap = await transaction.get(formRef);

      if (!formSnap.exists()) throw new Error("Form does not exist!");
      if (!formSnap.data().trashedAt) return;
      
      if (formSnap.data().userId !== user.uid) {
        throw new Error("You do not have permission to restore this form.");
      }

      const folderId = formSnap.data().folderId;
      transaction.update(formRef, { 
        trashedAt: null, 
        lastEdited: serverTimestamp() 
      });

      if (folderId) {
        const folderRef = doc(db, 'folders', folderId);
        const folderSnap = await transaction.get(folderRef);
        if (folderSnap.exists()) {
          transaction.update(folderRef, { formCount: increment(1) });
        }
      }

      if (formSnap.data().isPublished) {
        const publicFormRef = doc(db, 'publicForms', formId);
        const draftContent = formSnap.data();
        const publicData = {
          formName: draftContent.formName,
          formDescription: draftContent.formDescription,
          thumbnailUrl: draftContent.thumbnailUrl,
          metaImageUrl: draftContent.metaImageUrl,
          formCategory: draftContent.formCategory,
          publishedAt: draftContent.publishedData?.publishedAt || draftContent.lastEdited,
        };
        transaction.set(publicFormRef, sanitizeObjectForFirestore(publicData));
      }
    });
    return { success: true };
  } catch (e: any) {
    console.error(`Error restoring form ${formId}:`, e);
    return { success: false, error: e.message || 'Failed to restore folder.' };
  }
}

async function deleteSubcollection(collectionPath: string) {
  const collectionRef = collection(db, collectionPath);
  let snapshot = await getDocs(query(collectionRef));

  while (snapshot.size > 0) {
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
    await batch.commit();
    snapshot = await getDocs(query(collectionRef));
  }
}

export async function deleteFormPermanently(formId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not authenticated.' };

  try {
    const formRef = doc(db, 'forms', formId);
    const formDoc = await getDoc(formRef);

    if (!formDoc.exists() || formDoc.data().userId !== user.uid) {
      throw new Error('Permission denied or form not found.');
    }

    await deleteSubcollection(`forms/${formId}/submissions`);
    await deleteSubcollection(`forms/${formId}/views`);
    
    const publicFormRef = doc(db, 'publicForms', formId);
    const publicFormSnap = await getDoc(publicFormRef);
    if (publicFormSnap.exists()) {
      await deleteDoc(publicFormRef);
    }

    await deleteDoc(formRef);
    
    return { success: true };
  } catch (e: any) {
    console.error(`Error permanently deleting form ${formId}:`, e);
    return { success: false, error: e.message || 'Failed to delete form.' };
  }
}

export async function moveFormToFolder(formId: string, newFolderId: string | null): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not authenticated.' };

  try {
    await runTransaction(db, async (transaction) => {
      const formRef = doc(db, 'forms', formId);
      const formSnap = await transaction.get(formRef);
      if (!formSnap.exists()) throw new Error("Form does not exist!");
      
      if (formSnap.data().userId !== user.uid) {
        throw new Error("You do not have permission to move this form.");
      }

      const oldFolderId = formSnap.data().folderId;
      if (oldFolderId === newFolderId) return;

      transaction.update(formRef, { 
        folderId: newFolderId, 
        lastEdited: serverTimestamp() 
      });

      if (oldFolderId) {
        const oldFolderRef = doc(db, 'folders', oldFolderId);
        const oldFolderSnap = await transaction.get(oldFolderRef);
        if (oldFolderSnap.exists()) {
          transaction.update(oldFolderRef, { formCount: increment(-1) });
        }
      }

      if (newFolderId) {
        const newFolderRef = doc(db, 'folders', newFolderId);
        const newFolderSnap = await transaction.get(newFolderRef);
        if (newFolderSnap.exists()) {
          transaction.update(newFolderRef, { formCount: increment(1) });
        }
      }
    });
    return { success: true };
  } catch (e: any) {
    console.error(`Error moving form ${formId} to folder ${newFolderId}: `, e);
    return { success: false, error: e.message || 'Failed to move form.' };
  }
}

export async function getFormsByFolderId(folderId: string): Promise<FormDocument[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const formsCol = collection(db, 'forms');
    const q = query(
      formsCol,
      where('userId', '==', user.uid),
      where('folderId', '==', folderId),
      where('trashedAt', '==', null)
    );
    const formSnapshot = await getDocs(q);

    const formsListPromises = formSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const submissionsCol = collection(db, 'forms', docSnap.id, 'submissions');
      const submissionsSnapshot = await getDocs(query(submissionsCol));
      return {
        id: docSnap.id,
        userId: data.userId,
        formName: data.formName || "Untitled Form",
        formDescription: data.formDescription || "",
        formFields: data.formFields || [],
        formStyles: { ...initialDefaultStyles, ...(data.formStyles || {}) },
        formPages: (data.formPages && data.formPages.length > 0) ? data.formPages : [{ id: `page-${Date.now()}-1`, title: 'Page 1' }],
        welcomePage: data.welcomePage || initialWelcomePageConfig,
        endingPage: data.endingPage || initialEndingPageConfig,
        accessSettings: data.accessSettings || initialAccessSettings,
        createdAt: data.createdAt as Timestamp,
        lastEdited: data.lastEdited as Timestamp,
        isPublished: data.isPublished || false,
        responsesCount: submissionsSnapshot.size,
        thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.formName || 'Form')}`,
        metaImageUrl: data.metaImageUrl || null,
        formType: data.formType || 'private',
        formCategory: data.formCategory || null,
        folderId: data.folderId,
        sharedWith: data.sharedWith || [],
        sharedWithUids: data.sharedWithUids || [],
        ownerAndCollaborators: data.ownerAndCollaborators || [data.userId],
        pendingInvites: data.pendingInvites || [],
        trashedAt: data.trashedAt || null,
        enableSubmissionNotifications: data.enableSubmissionNotifications ?? true,
      } as FormDocument;
    });

    let formsList = await Promise.all(formsListPromises);
    formsList.sort((a, b) => (b.lastEdited as Timestamp)?.toMillis() || 0 - (a.lastEdited as Timestamp)?.toMillis() || 0);

    return formsList;
  } catch (e: any) {
    console.error(`Error fetching forms for folder ${folderId}: `, e);
    throw new Error("Failed to fetch forms for this folder. Please try again later.");
  }
}

export async function getTrashedFormsForCurrentUser(): Promise<FormDocument[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const formsCol = collection(db, 'forms');
    const q = query(
      formsCol,
      where('userId', '==', user.uid),
      where('trashedAt', '!=', null),
      orderBy('trashedAt', 'desc')
    );
    const formSnapshot = await getDocs(q);
    
    const formsListPromises = formSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        userId: data.userId,
        formName: data.formName || "Untitled Form",
        formDescription: data.formDescription || "",
        formFields: data.formFields || [],
        formStyles: { ...initialDefaultStyles, ...(data.formStyles || {}) },
        formPages: (data.formPages && data.formPages.length > 0) ? data.formPages : [{ id: `page-${Date.now()}-1`, title: 'Page 1' }],
        welcomePage: data.welcomePage || initialWelcomePageConfig,
        endingPage: data.endingPage || initialEndingPageConfig,
        accessSettings: data.accessSettings || initialAccessSettings,
        createdAt: data.createdAt as Timestamp,
        lastEdited: data.lastEdited as Timestamp,
        isPublished: data.isPublished || false,
        responsesCount: data.responsesCount || 0,
        thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.formName || 'Form')}`,
        metaImageUrl: data.metaImageUrl || null,
        formType: data.formType || 'private',
        formCategory: data.formCategory || null,
        folderId: data.folderId ?? null,
        sharedWith: data.sharedWith || [],
        sharedWithUids: data.sharedWithUids || [],
        ownerAndCollaborators: data.ownerAndCollaborators || [data.userId],
        pendingInvites: data.pendingInvites || [],
        trashedAt: data.trashedAt || null,
        enableSubmissionNotifications: data.enableSubmissionNotifications ?? true,
      } as FormDocument;
    });

    return await Promise.all(formsListPromises);
  } catch (e: any) {
    console.error("[formService] Error fetching trashed forms: ", e);
    return [];
  }
}

export async function getPublishedForms(
  category?: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities'
): Promise<Partial<FormDocument>[]> {
  console.log(`[formService] getPublishedForms: Fetching from publicForms collection. Category: ${category}`);
  try {
    const publicFormsCol = collection(db, 'publicForms');
    
    let q = query(publicFormsCol, orderBy('publishedAt', 'desc'));
    
    if (category) {
      q = query(publicFormsCol, where('formCategory', '==', category), orderBy('publishedAt', 'desc'));
    }
    
    const formSnapshot = await getDocs(q);
    
    console.log(`[formService] getPublishedForms: Firestore query found ${formSnapshot.docs.length} public documents.`);

    const formsList = formSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const publishedAtTimestamp = data.publishedAt;
      
      let publishedAtISOString: string;

      if (publishedAtTimestamp && typeof publishedAtTimestamp.toDate === 'function') {
        publishedAtISOString = publishedAtTimestamp.toDate().toISOString();
      } else {
        console.warn(`[formService] Document ${docSnap.id} in publicForms has an invalid 'publishedAt' field. Using current time as fallback.`);
        publishedAtISOString = new Date().toISOString();
      }

      return {
        id: docSnap.id,
        formName: data.formName || "Untitled Form",
        formDescription: data.formDescription || "",
        thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.formName || 'Form')}`,
        metaImageUrl: data.metaImageUrl || null,
        formCategory: data.formCategory || null,
        publishedAt: publishedAtISOString,
      };
    });

    return formsList;
  } catch (e: any) {
    console.error("[formService] Error fetching published forms: ", e);
    throw new Error(e.message || "Failed to fetch published forms due to a server error.");
  }
}

// Additional helper functions

export async function publishForm(formId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not authenticated.' };

  try {
    await runTransaction(db, async (transaction) => {
      const formRef = doc(db, 'forms', formId);
      const formSnap = await transaction.get(formRef);
      
      if (!formSnap.exists()) {
        throw new Error("Form not found.");
      }
      const formData = formSnap.data();

      const isOwner = formData.userId === user.uid;
      const isCollaborator = (formData.sharedWithUids || []).includes(user.uid);
      if (!isOwner && !isCollaborator) {
        throw new Error("You don't have permission to publish this form.");
      }
      
      transaction.update(formRef, {
        isPublished: true,
        publishedData: {
          ...formData,
          publishedAt: serverTimestamp()
        },
        lastEdited: serverTimestamp()
      });

      if (formData.formType === 'public') {
        const publicFormRef = doc(db, 'publicForms', formId);
        const publicData = {
          formName: formData.formName,
          formDescription: formData.formDescription,
          thumbnailUrl: formData.thumbnailUrl,
          metaImageUrl: formData.metaImageUrl,
          formCategory: formData.formCategory,
          publishedAt: serverTimestamp(),
        };
        transaction.set(publicFormRef, sanitizeObjectForFirestore(publicData));
      }
    });

    return { success: true };
  } catch (e: any) {
    console.error(`Error publishing form ${formId}:`, e);
    return { success: false, error: e.message || 'Failed to publish form.' };
  }
}

export async function unpublishForm(formId: string): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not authenticated.' };

  try {
    await runTransaction(db, async (transaction) => {
      const formRef = doc(db, 'forms', formId);
      const formSnap = await transaction.get(formRef);
      
      if (!formSnap.exists() || formSnap.data().userId !== user.uid) {
        throw new Error("Form not found or you don't have permission to unpublish it.");
      }

      transaction.update(formRef, {
        isPublished: false,
        publishedData: null,
        lastEdited: serverTimestamp()
      });

      const publicFormRef = doc(db, 'publicForms', formId);
      transaction.delete(publicFormRef);
    });

    return { success: true };
  } catch (e: any) {
    console.error(`Error unpublishing form ${formId}:`, e);
    return { success: false, error: e.message || 'Failed to unpublish form.' };
  }
}

export async function getUserForms(userId?: string): Promise<FormDocument[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const targetUserId = userId || user.uid;
  
  if (targetUserId !== user.uid) {
    try {
      const formsCol = collection(db, 'forms');
      const q = query(
        formsCol,
        where('userId', '==', targetUserId),
        where('isPublished', '==', true),
        where('formType', '==', 'public'),
        where('trashedAt', '==', null)
      );
      const formSnapshot = await getDocs(q);
      
      return formSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          responsesCount: data.responsesCount || 0,
        } as FormDocument;
      });
    } catch (e: any) {
      console.error(`Error fetching public forms for user ${targetUserId}:`, e);
      return [];
    }
  }

  // Return all forms for current user
  try {
    const formsCol = collection(db, 'forms');
    const q = query(
      formsCol,
      where('userId', '==', user.uid),
      where('trashedAt', '==', null),
      orderBy('lastEdited', 'desc')
    );
    const formSnapshot = await getDocs(q);

    const formsListPromises = formSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const submissionsCol = collection(db, 'forms', docSnap.id, 'submissions');
      const submissionsSnapshot = await getDocs(query(submissionsCol));
      
      return {
        id: docSnap.id,
        userId: data.userId,
        formName: data.formName || "Untitled Form",
        formDescription: data.formDescription || "",
        formFields: data.formFields || [],
        formStyles: { ...initialDefaultStyles, ...(data.formStyles || {}) },
        formPages: (data.formPages && data.formPages.length > 0) ? data.formPages : [{ id: `page-${Date.now()}-1`, title: 'Page 1' }],
        welcomePage: data.welcomePage || initialWelcomePageConfig,
        endingPage: data.endingPage || initialEndingPageConfig,
        accessSettings: data.accessSettings || initialAccessSettings,
        createdAt: data.createdAt as Timestamp,
        lastEdited: data.lastEdited as Timestamp,
        isPublished: data.isPublished || false,
        responsesCount: submissionsSnapshot.size,
        thumbnailUrl: data.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.formName || 'Form')}`,
        metaImageUrl: data.metaImageUrl || null,
        formType: data.formType || 'private',
        formCategory: data.formCategory || null,
        folderId: data.folderId ?? null,
        sharedWith: data.sharedWith || [],
        sharedWithUids: data.sharedWithUids || [],
        ownerAndCollaborators: data.ownerAndCollaborators || [data.userId],
        pendingInvites: data.pendingInvites || [],
        trashedAt: data.trashedAt || null,
        enableSubmissionNotifications: data.enableSubmissionNotifications ?? true,
      } as FormDocument;
    });

    return await Promise.all(formsListPromises);
  } catch (e: any) {
    console.error(`Error fetching forms for user ${targetUserId}:`, e);
    return [];
  }
}
