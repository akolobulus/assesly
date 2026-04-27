
'use server';

import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import type { FormDocument, PublicFormResult } from './formService'; // Use types from the client service
import { recordFormView } from './analyticsService.server'; // Use server-side analytics

// ---- Initial Defaults ----
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

// THIS IS THE SERVER-SIDE VERSION FOR METADATA GENERATION
export async function getPublicFormById(formId: string, userAgentString?: string): Promise<PublicFormResult> {
  const db = adminDb();
  console.log(`[formService.server] getPublicFormById: Fetching public form ${formId}`);
  try {
    const formRef = db.collection('forms').doc(formId);
    const docSnap = await formRef.get();

    if (docSnap.exists) {
      if (userAgentString) {
        // Note: recordFormView must also be a server function or callable from server
        await recordFormView(formId, userAgentString);
      }
      
      const data = docSnap.data();
      if (!data) return { status: 'unavailable', data: null };


      if (!data.isPublished || data.trashedAt) {
        return { status: 'unavailable', data: null };
      }
      
      const content = data.publishedData || data;
      const accessSettings = content.accessSettings || {};
      const now = new Date();
      
      const userDocRef = db.collection('users').doc(data.userId);
      const userDocSnap = await userDocRef.get();
      const creatorName = userDocSnap.exists ? userDocSnap.data()?.displayName : 'Unknown';
      const creatorEmail = userDocSnap.exists ? userDocSnap.data()?.email : 'Unknown';

      const formDocument: FormDocument = {
        id: docSnap.id,
        userId: data.userId,
        isPublished: data.isPublished,
        responsesCount: data.responsesCount || 0,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
        lastEdited: (data.lastEdited as Timestamp).toDate().toISOString(),
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
        pendingInvites: data.pendingInvites || [],
        trashedAt: data.trashedAt || null,
        creatorName: creatorName,
        creatorEmail: creatorEmail,
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
    console.error(`[formService.server] Error fetching public form by ID ${formId}: `, e);
    throw new Error(e.message || `Failed to fetch form ${formId} due to a server error.`);
  }
}
