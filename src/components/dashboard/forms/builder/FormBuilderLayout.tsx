

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import 'intro.js/introjs.css';
import { Steps } from 'intro.js-react';
import { FormBuilderHeader } from './FormBuilderHeader';
import { ElementsSidebar } from './ElementsSidebar';
import { FormCanvas } from './FormCanvas';
import type { FieldDefinition, FormFieldInstance, FormStyles, FormPage, FormBuilderData, WelcomePageConfig, EndingPageConfig, AccessSettings } from './types';
import { CanvasHeader } from './CanvasHeader';
import { FormSettingsContent } from './FormSettingsContent';
import { FormShareContent } from './FormShareContent';
import { FormSubmissionContent } from './FormSubmissionContent';
import { FormAnalyticsContent } from './FormAnalyticsContent';
import { FormPreview } from './FormPreview';
import { PreviewModeHeader } from './PreviewModeHeader';
import type { PreviewViewType } from './ResponsivePreviewControls';
import { useDebounce } from '@/hooks/useDebounce';
import { getFormById, saveForm, publishForm, unpublishForm, trashForm, type FormDocument } from '@/lib/services/formService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth'; 
import { Timestamp } from 'firebase/firestore';
import { fieldCategoriesData } from './ElementsSidebar';
import { cn } from '@/lib/utils';
import { UnpublishFormModal } from './UnpublishFormModal';
import { PublishSuccessModal } from './PublishSuccessModal';
import { DeleteFieldConfirmationModal } from './DeleteFieldConfirmationModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { getInvitationsForForm, type InvitationWithRecipient } from '@/lib/services/invitationService';


interface UndoableFormState {
  formName: string;
  formDescription: string;
  formFields: FormFieldInstance[];
  formStyles: FormStyles;
  formPages: FormPage[];
  welcomePage: WelcomePageConfig;
  endingPage: EndingPageConfig;
  accessSettings: AccessSettings;
  isPublished: boolean;
  formType: 'public' | 'private';
  formCategory?: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null;
  metaImageUrl?: string | null;
  folderId: string | null | undefined;
  enableSubmissionNotifications: boolean;
}


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
    title: 'Welcome to our form!',
    description: 'Please fill out the following information.',
    buttonText: 'Start',
    imageUrl: null,
};

const initialEndingPageConfig: EndingPageConfig = {
  title: 'Thank you!',
  description: 'Your submission has been received!',
};

const initialAccessSettings: AccessSettings = {
  isClosed: false,
  openDate: null,
  closeDate: null,
  submissionLimit: null,
};

const initialDefaultFormPages: FormPage[] = [
  { id: `page-${Date.now()}-1`, title: 'Page 1' },
];

const initialFormFullState: FormBuilderData = {
  formName: "Untitled Form",
  formDescription: "",
  formFields: [] as FormFieldInstance[],
  formStyles: initialDefaultStyles,
  formPages: initialDefaultFormPages,
  welcomePage: initialWelcomePageConfig,
  endingPage: initialEndingPageConfig,
  accessSettings: initialAccessSettings,
  isPublished: false,
  responsesCount: 0,
  thumbnailUrl: `https://placehold.co/600x400.png?text=${encodeURIComponent("Untitled Form")}`,
  metaImageUrl: null,
  formType: 'private',
  formCategory: null,
  folderId: null,
  enableSubmissionNotifications: true,
  sharedWith: [],
  pendingInvites: [],
};

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const getIconComponentById = (fieldId: string): React.ElementType | undefined => {
  for (const category of fieldCategoriesData) {
    const fieldDef = category.fields.find(f => f.id === fieldId);
    if (fieldDef) {
      return fieldDef.icon;
    }
  }
  return undefined;
};

// Helper to compare form states for dirtiness, omitting volatile fields like icons.
const getComparableState = (state: Partial<FormBuilderData>) => {
    const { formFields, ...rest } = state;
    return {
        ...rest,
        formFields: formFields?.map(({ icon, ...field }) => field), // Omit icon function
    };
};

export function FormBuilderLayout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser, loading: isLoadingAuth } = useAuth(); // Use our new hook

  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  
  const [formId, setFormId] = useState<string | null>(null);
  const [formOwnerId, setFormOwnerId] = useState<string | null>(null);
  const [formName, setFormName] = useState(initialFormFullState.formName);
  const [formDescription, setFormDescription] = useState(initialFormFullState.formDescription);
  const [formFields, setFormFields] = useState<FormFieldInstance[]>(initialFormFullState.formFields);
  const [formStyles, setFormStyles] = useState<FormStyles>(initialFormFullState.formStyles);
  const [formPages, setFormPages] = useState<FormPage[]>(initialFormFullState.formPages);
  const [welcomePage, setWelcomePage] = useState<WelcomePageConfig>(initialFormFullState.welcomePage);
  const [endingPage, setEndingPage] = useState<EndingPageConfig>(initialFormFullState.endingPage);
  const [accessSettings, setAccessSettings] = useState<AccessSettings>(initialFormFullState.accessSettings);
  const [isPublished, setIsPublished] = useState(initialFormFullState.isPublished);
  const [formType, setFormType] = useState<'public' | 'private'>(initialFormFullState.formType);
  const [formCategory, setFormCategory] = useState<'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null>(initialFormFullState.formCategory || null);
  const [metaImageUrl, setMetaImageUrl] = useState<string | null>(initialFormFullState.metaImageUrl || null);
  const [enableSubmissionNotifications, setEnableSubmissionNotifications] = useState(initialFormFullState.enableSubmissionNotifications);
  
  const collaborationDataRef = useRef<{ sharedWith: any[], sharedWithUids: string[] }>({ sharedWith: [], sharedWithUids: [] });

  const [pendingInvites, setPendingInvites] = useState<string[]>(initialFormFullState.pendingInvites || []);

  const [responsesCount, setResponsesCount] = useState(initialFormFullState.responsesCount);
  const [_thumbnailUrl, setThumbnailUrl] = useState(initialFormFullState.thumbnailUrl);
  const [folderIdState, setFolderIdState] = useState<string | null | undefined>(initialFormFullState.folderId);
  const [_lastEdited, setLastEdited] = useState<Timestamp | null>(null);

  const lastPublishedStateRef = useRef<string | null>(null);
  const [publishedFields, setPublishedFields] = useState<FormFieldInstance[] | null>(null);


  const [activeMainTab, setActiveMainTab] = useState('build');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewViewType, setPreviewViewType] = useState<PreviewViewType>('desktop');
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const lastSavedStateRef = useRef<string | null>(null);
  const isMountedRef = useRef(false);

  const [historyStack, setHistoryStack] = useState<UndoableFormState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const isRestoringFromHistoryRef = useRef(false);
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [isPublishSuccessModalOpen, setIsPublishSuccessModalOpen] = useState(false);
  const [isDeleteFieldModalOpen, setIsDeleteFieldModalOpen] = useState(false);
  const [fieldToDeleteId, setFieldToDeleteId] = useState<string | null>(null);

  const [isTourEnabled, setIsTourEnabled] = useState(false);

  const tourSteps = [
    {
      element: '[data-tour="elements-tab"]',
      intro: 'This is the Elements tab. Drag and drop fields from here onto the canvas to build your form.',
      position: 'right',
    },
    {
      element: '[data-tour="design-tab"]',
      intro: 'Use the Design tab to customize the look and feel of your form, including colors, fonts, and layout options.',
      position: 'right',
    },
    {
      element: '[data-tour="pages-tab"]',
      intro: "Manage your form's structure by adding, reordering, or deleting pages here.",
      position: 'right',
    },
    {
      element: '[data-tour="undo-button"]',
      intro: 'Made a mistake? No problem! Use the Undo button to reverse your last action.',
      position: 'bottom',
    },
    {
      element: '[data-tour="redo-button"]',
      intro: 'Changed your mind again? Use the Redo button to bring back what you just undid.',
      position: 'bottom',
    },
    {
      element: '[data-tour="step-2"]',
      intro: 'Click here to change the name of your form at any time.',
      position: 'bottom',
    },
    {
      element: '[data-tour="step-3"]',
      intro: 'Switch between Build, Settings, Share, and other views using these tabs.',
      position: 'bottom',
    },
    {
      element: '[data-tour="preview-toggle"]',
      intro: 'Use this toggle to switch to Preview mode and see how your form will look to users.',
      position: 'bottom',
    },
    {
      element: '[data-tour="step-5"]',
      intro: "When you're ready, publish your form to make it live and start collecting submissions.",
      position: 'left',
    },
  ];

  const onTourExit = () => {
    setIsTourEnabled(false);
  };

  const currentFormBuilderState: FormBuilderData = useMemo(() => ({
    formName,
    formDescription,
    formFields,
    formStyles,
    formPages,
    welcomePage,
    endingPage,
    accessSettings,
    isPublished,
    responsesCount,
    thumbnailUrl: `https://placehold.co/600x400.png?text=${encodeURIComponent(formName || "Form")}`,
    metaImageUrl,
    formType,
    formCategory,
    folderId: folderIdState,
    enableSubmissionNotifications,
    sharedWith: collaborationDataRef.current.sharedWith,
    sharedWithUids: collaborationDataRef.current.sharedWithUids,
    pendingInvites: pendingInvites,
  }), [formName, formDescription, formFields, formStyles, formPages, welcomePage, endingPage, accessSettings, isPublished, responsesCount, metaImageUrl, formType, formCategory, folderIdState, enableSubmissionNotifications, pendingInvites]);

  const debouncedFormStateForAutosave = useDebounce(currentFormBuilderState, 1500);
  
  const handleSave = useCallback(async (formDataToSave: FormBuilderData, isPublishAction: boolean = false) => {
    if ((isLoadingForm && formId) || isRestoringFromHistoryRef.current) {
        return;
    }
    setSaveStatus('saving');
    try {
        const { success, formId: newFormId, lastEdited } = await saveForm(formId, formDataToSave);
        if (success) {
            if (!formId && newFormId) {
                setFormId(newFormId);
                window.history.replaceState(null, '', `/builder?formId=${newFormId}`);
            }
            if (lastEdited) {
                setLastEdited(lastEdited);
            }
            const savedStateStr = JSON.stringify(getComparableState(formDataToSave));
            lastSavedStateRef.current = savedStateStr;
            if (isPublishAction) {
                lastPublishedStateRef.current = savedStateStr;
            }
            setIsDirty(JSON.stringify(getComparableState(currentFormBuilderState)) !== lastPublishedStateRef.current);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
            throw new Error("Failed to save to Firestore");
        }
    } catch (error) {
        console.error("[FormBuilderLayout] Error saving form data:", error);
        setSaveStatus('error');
        toast({ title: "Save Failed", description: "Could not save changes to the server.", variant: "destructive" });
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [formId, isLoadingForm, toast, currentFormBuilderState]);
  
  useEffect(() => {
    if (!isMountedRef.current || isRestoringFromHistoryRef.current) return;
    
    if (isPublished) {
        const currentStateStr = JSON.stringify(getComparableState(currentFormBuilderState));
        setIsDirty(currentStateStr !== lastPublishedStateRef.current);
    } else {
        const currentStateStr = JSON.stringify(getComparableState(currentFormBuilderState));
        setIsDirty(currentStateStr !== lastSavedStateRef.current);
    }
  }, [currentFormBuilderState, isPublished]);

  useEffect(() => {
    if (!isMountedRef.current || isRestoringFromHistoryRef.current || isLoadingForm || saveStatus === 'saving') return;
  
    const currentDebouncedStateString = JSON.stringify(getComparableState(debouncedFormStateForAutosave));
    if (currentDebouncedStateString !== lastSavedStateRef.current) {
      handleSave(debouncedFormStateForAutosave);
    }
  }, [debouncedFormStateForAutosave, isLoadingForm, saveStatus, handleSave]);
  
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const message = "Changes you made may not be saved.";
      event.preventDefault();
      event.returnValue = message; 
      return message;
    };

    if (isDirty && formStyles.warnBeforeDropoff) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, formStyles.warnBeforeDropoff]);

  const handlePublish = async () => {
    if (!formId) {
        toast({ title: "Cannot Publish", description: "This form has not been saved yet.", variant: "destructive" });
        return;
    }
    setSaveStatus('saving');
    
    await handleSave(currentFormBuilderState, true);

    const result = await publishForm(formId);
    if (result.success) {
        setIsPublished(true);
        const publishedStateStr = JSON.stringify(getComparableState(currentFormBuilderState));
        lastPublishedStateRef.current = publishedStateStr;
        lastSavedStateRef.current = publishedStateStr;
        setIsDirty(false); 
        setSaveStatus('saved');
        setIsPublishSuccessModalOpen(true);
        setPublishedFields([...formFields]);
        setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
        setSaveStatus('error');
        toast({ title: "Publish Failed", description: result.error || "Could not publish the form.", variant: "destructive" });
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleConfirmUnpublish = async () => {
    if (!formId) return;
    const result = await unpublishForm(formId);
    if (result.success) {
        setIsPublished(false);
        toast({ title: "Form Unpublished", description: "Your form is no longer live." });
    } else {
        toast({ title: "Unpublish Failed", description: result.error || "Could not unpublish the form.", variant: "destructive" });
    }
    setIsUnpublishModalOpen(false);
  };

  const handleTrashForm = async () => {
    if (!formId) {
      toast({ title: "Error", description: "Form ID not found. Cannot move to trash.", variant: "destructive" });
      return;
    }
    const result = await trashForm(formId);
    if (result.success) {
      toast({ title: "Form Moved to Trash", description: `"${formName}" has been moved to the trash.` });
      router.replace('/dashboard/forms');
    } else {
      toast({ title: "Error", description: result.error || "Failed to move form to trash.", variant: "destructive" });
    }
  };

  const undoableFormStateForSnapshot: UndoableFormState = useMemo(() => ({
    formName, formDescription, formFields, formStyles, formPages, welcomePage, endingPage, accessSettings, isPublished, formType, formCategory, metaImageUrl, folderId: folderIdState, enableSubmissionNotifications
  }), [formName, formDescription, formFields, formStyles, formPages, welcomePage, endingPage, accessSettings, isPublished, formType, formCategory, metaImageUrl, folderIdState, enableSubmissionNotifications]);

  const debouncedUndoableState = useDebounce(undoableFormStateForSnapshot, 700);

  useEffect(() => {
    if (isLoadingAuth || isLoadingForm || isRestoringFromHistoryRef.current || !isMountedRef.current) {
      return;
    }
    if (historyStack.length === 0 && currentHistoryIndex === -1) {
      if (isMountedRef.current && !isLoadingForm) {
        setHistoryStack([undoableFormStateForSnapshot]);
        setCurrentHistoryIndex(0);
      }
      return;
    }
    const currentStateInHistory = historyStack[currentHistoryIndex];
    if (debouncedUndoableState && currentStateInHistory &&
        JSON.stringify(debouncedUndoableState) !== JSON.stringify(currentStateInHistory)) {
        const newHistory = historyStack.slice(0, currentHistoryIndex + 1);
        newHistory.push(debouncedUndoableState);
        setHistoryStack(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    }
  }, [debouncedUndoableState, isLoadingAuth, isLoadingForm, historyStack, currentHistoryIndex, undoableFormStateForSnapshot]);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!currentUser) {
        router.replace('/login');
        return;
    }

    const formIdFromUrl = searchParams.get('formId');
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['build', 'settings', 'share', 'submission', 'analytics'].includes(tabFromUrl)) {
      setActiveMainTab(tabFromUrl);
    }

    const loadForm = async () => {
      let sourceData: FormDocument;
      let currentFormPagesInit = initialDefaultFormPages;

      if (formIdFromUrl) {
        setFormId(formIdFromUrl);
        setIsLoadingForm(true);
        // Pass the UID to ensure the check is done with the correct, authenticated user.
        const formDoc = await getFormById(formIdFromUrl, currentUser.uid);

        if (formDoc) {
          sourceData = formDoc;
        } else {
          toast({ title: "Error", description: "Form not found or access denied.", variant: "destructive" });
          router.replace('/dashboard/forms');
          return;
        }
      } else {
        sourceData = { ...initialFormFullState, userId: currentUser.uid } as FormDocument;
      }

      currentFormPagesInit = (sourceData.formPages && sourceData.formPages.length > 0)
                           ? sourceData.formPages
                           : initialDefaultFormPages;
      if (currentFormPagesInit.length === 0) {
        currentFormPagesInit = initialDefaultFormPages;
      }
      
      const welcomeConfig = sourceData.welcomePage || initialWelcomePageConfig;
      const endingConfig = sourceData.endingPage || initialEndingPageConfig;
      const accessConfig = sourceData.accessSettings || initialAccessSettings;

      const loadedStyles = sourceData.formStyles || {};
      const stylesToSet = { ...initialDefaultStyles, ...loadedStyles };
      setFormStyles(stylesToSet);
      
      setFormOwnerId(sourceData.userId);
      setFormName(sourceData.formName || initialFormFullState.formName);
      setFormDescription(sourceData.formDescription || initialFormFullState.formDescription);
      const reconstructedFields = (sourceData.formFields || []).map(field => ({
        ...field,
        icon: getIconComponentById((field as any).originalId || field.id) || (() => null),
        pageId: (field as any).pageId || (currentFormPagesInit.length > 0 ? currentFormPagesInit[0].id : 'default-page-id'),
      })) as FormFieldInstance[];
      setFormFields(reconstructedFields);

      if (sourceData.publishedData) {
        lastPublishedStateRef.current = JSON.stringify(getComparableState(sourceData.publishedData as Partial<FormBuilderData>));
        setPublishedFields((sourceData.publishedData.formFields || []).map(field => ({
            ...field,
            icon: getIconComponentById((field as any).originalId || field.id) || (() => null),
            pageId: (field as any).pageId || (currentFormPagesInit.length > 0 ? currentFormPagesInit[0].id : 'default-page-id'),
        })) as FormFieldInstance[]);
      } else {
        lastPublishedStateRef.current = null;
        setPublishedFields(reconstructedFields);
      }
      
      setFormPages(currentFormPagesInit);
      setWelcomePage(welcomeConfig);
      setEndingPage(endingConfig);
      setAccessSettings(accessConfig);
      setIsPublished(sourceData.isPublished || false);
      setResponsesCount(sourceData.responsesCount || 0);
      setThumbnailUrl(sourceData.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(sourceData.formName || "Form")}`);
      setMetaImageUrl(sourceData.metaImageUrl || null);
      setFormType(sourceData.formType || 'private');
      setFormCategory(sourceData.formCategory || null);
      setFolderIdState(sourceData.folderId === undefined ? null : sourceData.folderId);
      setEnableSubmissionNotifications(sourceData.enableSubmissionNotifications ?? true);
      collaborationDataRef.current = {
        sharedWith: sourceData.sharedWith || [],
        sharedWithUids: sourceData.sharedWithUids || [],
      };
      setPendingInvites(sourceData.pendingInvites || []);

      if ((sourceData as FormDocument).lastEdited) {
          const firestoreLastEdited = (sourceData as FormDocument).lastEdited;
          if (firestoreLastEdited instanceof Timestamp) setLastEdited(firestoreLastEdited);
          else if (firestoreLastEdited instanceof Date) setLastEdited(Timestamp.fromDate(firestoreLastEdited));
          else {
              try {
                const parsedDate = new Date(firestoreLastEdited as any);
                if (!isNaN(parsedDate.getTime())) setLastEdited(Timestamp.fromDate(parsedDate));
                else setLastEdited(null);
              } catch { setLastEdited(null); }
          }
      } else {
          setLastEdited(null);
      }
      
      const initialDataForRef: FormBuilderData = {
        formName: sourceData.formName || initialFormFullState.formName,
        formDescription: sourceData.formDescription || initialFormFullState.formDescription,
        formFields: reconstructedFields,
        formStyles: stylesToSet,
        formPages: currentFormPagesInit,
        welcomePage: welcomeConfig,
        endingPage: endingConfig,
        accessSettings: accessConfig,
        isPublished: sourceData.isPublished || false,
        responsesCount: sourceData.responsesCount || 0,
        thumbnailUrl: sourceData.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(sourceData.formName || "Form")}`,
        metaImageUrl: sourceData.metaImageUrl || null,
        formType: sourceData.formType || 'private',
        formCategory: sourceData.formCategory || null,
        folderId: sourceData.folderId === undefined ? null : sourceData.folderId,
        enableSubmissionNotifications: sourceData.enableSubmissionNotifications ?? true,
        sharedWith: sourceData.sharedWith || [],
        sharedWithUids: sourceData.sharedWithUids || [],
        pendingInvites: sourceData.pendingInvites || [],
      };
      lastSavedStateRef.current = JSON.stringify(getComparableState(initialDataForRef));
      setIsDirty(JSON.stringify(getComparableState(initialDataForRef)) !== lastPublishedStateRef.current);

      const initialUndoableSnapshot: UndoableFormState = {
        formName: sourceData.formName || initialFormFullState.formName,
        formDescription: sourceData.formDescription || initialFormFullState.formDescription,
        formFields: reconstructedFields,
        formStyles: stylesToSet,
        formPages: currentFormPagesInit,
        welcomePage: welcomeConfig,
        endingPage: endingConfig,
        accessSettings: accessConfig,
        isPublished: sourceData.isPublished || false,
        formType: sourceData.formType || 'private',
        formCategory: sourceData.formCategory || null,
        metaImageUrl: sourceData.metaImageUrl || null,
        folderId: sourceData.folderId === undefined ? null : sourceData.folderId,
        enableSubmissionNotifications: sourceData.enableSubmissionNotifications ?? true,
      };
      setHistoryStack([initialUndoableSnapshot]);
      setCurrentHistoryIndex(0);

      setIsLoadingForm(false);
      isMountedRef.current = true;
    };
    loadForm();
  }, [searchParams, router, toast, isLoadingAuth, currentUser]);
  
  const handleFormNameChange = (newName: string) => setFormName(newName);
  const handleFormDescriptionChange = (newDescription: string) => setFormDescription(newDescription);
  const handleFormTypeChange = (newType: 'public' | 'private') => {
    setFormType(newType);
    if (newType === 'private') {
      setFormCategory(null);
    }
  };
  const handleFormCategoryChange = (newCategory: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null) => setFormCategory(newCategory);
  const handleAccessSettingsChange = (newSettings: AccessSettings) => setAccessSettings(newSettings);
  const handleMetaImageUrlChange = (url: string | null) => setMetaImageUrl(url);
  const handleEnableSubmissionNotificationsChange = (enabled: boolean) => setEnableSubmissionNotifications(enabled);
  const handleUpdateSharedWith = (newSharedWith: any[]) => {
     collaborationDataRef.current.sharedWith = newSharedWith;
     collaborationDataRef.current.sharedWithUids = newSharedWith.map(c => c.uid);
  };

  const handleStyleChange = (styleName: keyof FormStyles, value: string | boolean | null | number | undefined) => {
    setFormStyles(prevStyles => ({ ...prevStyles, [styleName]: value }));
  };

  const handleWelcomePageChange = (newConfig: Partial<WelcomePageConfig>) => {
    setWelcomePage(prev => ({...prev, ...newConfig}));
  };

  const handleEndingPageChange = (newConfig: Partial<EndingPageConfig>) => {
    setEndingPage(prev => ({...prev, ...newConfig}));
  };

  const handleAddOrDropField = useCallback((fieldDefinition: FieldDefinition, targetPageId?: string, indexOnPage?: number) => {
    const newFieldInstance: FormFieldInstance = {
      ...fieldDefinition,
      instanceId: `${fieldDefinition.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pageId: targetPageId || formPages[formPages.length - 1]?.id, // Default to last page
      label: fieldDefinition.label || fieldDefinition.name,
      placeholder: fieldDefinition.placeholder || '',
      description: fieldDefinition.description || '',
      isRequired: fieldDefinition.isRequired || false,
      isHidden: fieldDefinition.isHidden || false,
      isReadOnly: fieldDefinition.isReadOnly || false,
    };
    
    setFormFields(prevFields => {
      const allFields = [...prevFields];
      
      if (targetPageId && indexOnPage === undefined) {
          const lastIndexOfTargetPage = allFields.map(f => f.pageId).lastIndexOf(targetPageId);
          if (lastIndexOfTargetPage !== -1) {
              allFields.splice(lastIndexOfTargetPage + 1, 0, newFieldInstance);
          } else {
              allFields.push(newFieldInstance);
          }
          return allFields;
      }
      
      if (targetPageId && indexOnPage !== undefined) {
          const firstIndexOfTargetPage = allFields.findIndex(f => f.pageId === targetPageId);
          let insertionIndex = 0;
          if (firstIndexOfTargetPage !== -1) {
              insertionIndex = firstIndexOfTargetPage + indexOnPage;
          } else {
              const pageOrder = formPages.map(p => p.id);
              const targetPageIndex = pageOrder.indexOf(targetPageId);
              let precedingFieldsCount = 0;
              for (let i = 0; i < targetPageIndex; i++) {
                  precedingFieldsCount += allFields.filter(f => f.pageId === pageOrder[i]).length;
              }
              insertionIndex = precedingFieldsCount;
          }
          
          allFields.splice(insertionIndex, 0, newFieldInstance);
          return allFields;
      }

      allFields.push(newFieldInstance);
      return allFields;
    });
  }, [formPages]);


  const handleReorderFields = useCallback((sourceId: string, targetPageId: string, targetIndexOnPage: number) => {
    setFormFields(prevFields => {
        const sourceField = prevFields.find(f => f.instanceId === sourceId);
        if (!sourceField) return prevFields;

        const fieldsWithoutSource = prevFields.filter(f => f.instanceId !== sourceId);
        
        const fieldToInsert = { ...sourceField, pageId: targetPageId };
        
        const firstIndexOfTargetPage = fieldsWithoutSource.findIndex(f => f.pageId === targetPageId);
        let insertionIndex = 0;
        if (firstIndexOfTargetPage !== -1) {
            insertionIndex = firstIndexOfTargetPage + targetIndexOnPage;
        } else {
            const pageOrder = formPages.map(p => p.id);
            const targetPageIndex = pageOrder.indexOf(targetPageId);
            let precedingFieldsCount = 0;
            for (let i = 0; i < targetPageIndex; i++) {
                precedingFieldsCount += fieldsWithoutSource.filter(f => f.pageId === pageOrder[i]).length;
            }
            insertionIndex = precedingFieldsCount;
        }

        const newFields = [...fieldsWithoutSource];
        newFields.splice(insertionIndex, 0, fieldToInsert);

        return newFields;
    });
  }, [formPages]);


  const handleUpdateField = (updatedField: FormFieldInstance) => {
    setFormFields(prevFields =>
      prevFields.map(field => field.instanceId === updatedField.instanceId ? updatedField : field)
    );
  };

  const handleDeleteField = (instanceId: string) => {
    if (isPublished) {
      setFieldToDeleteId(instanceId);
      setIsDeleteFieldModalOpen(true);
    } else {
      setFormFields(prevFields => prevFields.filter(field => field.instanceId !== instanceId));
    }
  };

  const handleConfirmDeleteField = () => {
    if (fieldToDeleteId) {
      setFormFields(prevFields => prevFields.filter(field => field.instanceId !== fieldToDeleteId));
    }
    setFieldToDeleteId(null);
    setIsDeleteFieldModalOpen(false);
  };

  const handleDuplicateField = (instanceId: string) => {
    setFormFields(prevFields => {
      const fieldToDuplicate = prevFields.find(field => field.instanceId === instanceId);
      if (!fieldToDuplicate) return prevFields;
      const duplicatedField: FormFieldInstance = {
        ...fieldToDuplicate,
        instanceId: `${fieldToDuplicate.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-copy`,
        label: `${fieldToDuplicate.label || fieldToDuplicate.name} (Copy)`,
      };
      const originalIndex = prevFields.findIndex(field => field.instanceId === instanceId);
      const newFields = [...prevFields];
      newFields.splice(originalIndex + 1, 0, duplicatedField);
      return newFields;
    });
  };

  const handleMoveField = (instanceId: string, direction: 'up' | 'down') => {
    setFormFields(prevFields => {
        const newFields = [...prevFields];
        const fieldIndex = newFields.findIndex(f => f.instanceId === instanceId);
        if (fieldIndex === -1) return newFields;

        const currentField = newFields[fieldIndex];
        const targetIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;

        if (targetIndex < 0 || targetIndex >= newFields.length) return newFields;

        const targetField = newFields[targetIndex];

        if (currentField.pageId === targetField.pageId) {
            [newFields[fieldIndex], newFields[targetIndex]] = [newFields[targetIndex], newFields[fieldIndex]];
        }
        
        return newFields;
    });
  };

  const handleAddPage = (indexToInsertAt?: number) => {
    const newPageNumber = formPages.length + 1;
    const newPage: FormPage = {
      id: `page-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `Page ${newPageNumber}`,
    };
    setFormPages(prevPages => {
      const newPages = [...prevPages];
      if (indexToInsertAt !== undefined) newPages.splice(indexToInsertAt, 0, newPage);
      else newPages.push(newPage);
      return newPages;
    });
    if (formPages.length === 0) {
      setCurrentPreviewPage(1);
    }
  };

  const handleDeletePage = (pageId: string) => {
    if (formPages.length <= 1) {
        toast({
            title: "Cannot Delete Page",
            description: "A form must have at least one page.",
            variant: "destructive"
        });
        return;
    }
    const pageIndexToDelete = formPages.findIndex(p => p.id === pageId);
    setFormFields(prevFields => prevFields.filter(field => field.pageId !== pageId));
    setFormPages(prevPages => prevPages.filter(page => page.id !== pageId));
    if (currentPreviewPage > pageIndexToDelete + 1) {
        setCurrentPreviewPage(prev => prev -1);
    } else if (currentPreviewPage === pageIndexToDelete + 1 && currentPreviewPage > 1) {
        setCurrentPreviewPage(prev => prev - 1);
    } else if (currentPreviewPage === pageIndexToDelete + 1 && formPages.length > 1) {
        setCurrentPreviewPage(1);
    }
  };

  const handleUpdatePageTitle = (pageId: string, newTitle: string) => {
    setFormPages(prevPages =>
      prevPages.map(page => (page.id === pageId ? { ...page, title: newTitle } : page))
    );
  };

  const handleDuplicatePage = (pageId: string) => {
    let newFieldsToCreate: FormFieldInstance[] = [];
    const newPage: FormPage = {
      id: `page-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `Page ${formPages.length + 1} (Copy)`,
    };

    setFormFields(prevFields => {
      const fieldsFromPage = prevFields.filter(f => f.pageId === pageId);
      newFieldsToCreate = fieldsFromPage.map(field => ({
        ...field,
        instanceId: `${field.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-copy`,
        pageId: newPage.id,
      }));
      const originalPageIndex = formPages.findIndex(p => p.id === pageId);
      const insertIndexForFields = prevFields.map(f => f.pageId).lastIndexOf(formPages[originalPageIndex].id) + 1;
      
      const updatedFields = [...prevFields];
      updatedFields.splice(insertIndexForFields, 0, ...newFieldsToCreate);
      
      return updatedFields;
    });

    setFormPages(prevPages => {
      const originalIndex = prevPages.findIndex(p => p.id === pageId);
      const newPages = [...prevPages];
      newPage.title = `${prevPages[originalIndex].title} (Copy)`;
      newPages.splice(originalIndex + 1, 0, newPage);
      return newPages;
    });
  };

  const handleReorderPages = (draggedId: string, targetId: string) => {
    setFormPages(prevPages => {
      const newPages = [...prevPages];
      const draggedIndex = newPages.findIndex(p => p.id === draggedId);
      const targetIndex = newPages.findIndex(p => p.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prevPages;
      const [draggedItem] = newPages.splice(draggedIndex, 1);
      newPages.splice(targetIndex, 0, draggedItem);
      return newPages;
    });
  };

  const handleNextPagePreview = () => setCurrentPreviewPage(prev => Math.min(prev + 1, formPages.length));
  const handlePrevPagePreview = () => setCurrentPreviewPage(prev => Math.max(1, prev - 1));

  const handleMainTabChange = (tabId: string) => {
    setActiveMainTab(tabId);
    if (formId) window.history.replaceState(null, '', `/builder?formId=${formId}&tab=${tabId}`);
    else window.history.replaceState(null, '', `/builder?tab=${tabId}`);
  };

  const applyStateFromHistory = useCallback((stateToApply: UndoableFormState) => {
    isRestoringFromHistoryRef.current = true;
    setFormName(stateToApply.formName);
    setFormDescription(stateToApply.formDescription);
    setFormFields(stateToApply.formFields);
    setFormStyles(stateToApply.formStyles);
    setFormPages(stateToApply.formPages);
    setWelcomePage(stateToApply.welcomePage);
    setEndingPage(stateToApply.endingPage);
    setAccessSettings(stateToApply.accessSettings);
    setIsPublished(stateToApply.isPublished);
    setFormType(stateToApply.formType);
    setFormCategory(stateToApply.formCategory || null);
    setMetaImageUrl(stateToApply.metaImageUrl || null);
    setFolderIdState(stateToApply.folderId);
    setEnableSubmissionNotifications(stateToApply.enableSubmissionNotifications);
    if (currentPreviewPage > stateToApply.formPages.length) {
        setCurrentPreviewPage(Math.max(1, stateToApply.formPages.length));
    }
    requestAnimationFrame(() => { isRestoringFromHistoryRef.current = false; });
  }, [currentPreviewPage]);

  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      applyStateFromHistory(historyStack[newIndex]);
      setCurrentHistoryIndex(newIndex);
    }
  }, [currentHistoryIndex, historyStack, applyStateFromHistory]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < historyStack.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      applyStateFromHistory(historyStack[newIndex]);
      setCurrentHistoryIndex(newIndex);
    }
  }, [currentHistoryIndex, historyStack, applyStateFromHistory]);

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < historyStack.length - 1;
  const isOwner = currentUser?.uid === formOwnerId;
  const isCollaborator = !!(collaborationDataRef.current.sharedWithUids && currentUser && collaborationDataRef.current.sharedWithUids.includes(currentUser.uid));

  if (isLoadingAuth || (!formId && isLoadingForm) || (formId && isLoadingForm)) {
     return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /> Loading form builder...</div>;
  }

  if (isPreviewMode) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="text-center py-2 text-xs text-muted-foreground bg-background border-b">
          Responses won&apos;t be recorded in preview mode.
        </div>
        <PreviewModeHeader
          isPreviewMode={isPreviewMode}
          onTogglePreviewMode={setIsPreviewMode}
          currentViewType={previewViewType}
          onViewChange={setPreviewViewType}
        />
        <div className="flex-1 overflow-auto pt-8">
          <FormPreview
            formName={formName}
            fields={formFields}
            formStyles={formStyles}
            welcomePage={welcomePage}
            endingPage={endingPage}
            previewViewType={previewViewType}
            formPages={formPages}
            currentPage={currentPreviewPage}
            onNextPage={handleNextPagePreview}
            onPrevPage={handlePrevPagePreview}
          />
        </div>
      </div>
    );
  }

  let mainContent;
  if (activeMainTab === 'build') {
    mainContent = (
      <>
        <CanvasHeader
          isPreviewMode={isPreviewMode}
          onTogglePreviewMode={setIsPreviewMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <div className="flex flex-1 overflow-hidden bg-background">
          <ElementsSidebar
              onAddField={handleAddOrDropField}
              onStyleChange={handleStyleChange}
              currentStyles={formStyles}
              formPages={formPages}
              formFields={formFields}
              onAddPage={handleAddPage}
              onDeletePage={handleDeletePage}
              onUpdatePageTitle={handleUpdatePageTitle}
              onDuplicatePage={handleDuplicatePage}
              onReorderPages={handleReorderPages}
          />
          <FormCanvas
            fields={formFields}
            onDropNewField={handleAddOrDropField}
            onReorderFields={handleReorderFields}
            formStyles={formStyles}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
            onDuplicateField={handleDuplicateField}
            onMoveField={handleMoveField}
            formPages={formPages}
            welcomePage={welcomePage}
            onWelcomePageChange={handleWelcomePageChange}
            endingPage={endingPage}
            onEndingPageChange={handleEndingPageChange}
          />
        </div>
      </>
    );
  } else if (activeMainTab === 'settings') {
      mainContent = <FormSettingsContent
                        formId={formId}
                        formName={formName}
                        formDescription={formDescription}
                        formType={formType}
                        formCategory={formCategory}
                        metaImageUrl={metaImageUrl}
                        isPublished={isPublished}
                        accessSettings={accessSettings}
                        onFormNameChange={handleFormNameChange}
                        onFormDescriptionChange={handleFormDescriptionChange}
                        onFormTypeChange={handleFormTypeChange}
                        onFormCategoryChange={handleFormCategoryChange}
                        onMetaImageUrlChange={handleMetaImageUrlChange}
                        onAccessSettingsChange={handleAccessSettingsChange}
                        onUnpublish={() => setIsUnpublishModalOpen(true)}
                        onTrashForm={handleTrashForm}
                        isOwner={isOwner}
                        enableSubmissionNotifications={enableSubmissionNotifications}
                        onEnableSubmissionNotificationsChange={handleEnableSubmissionNotificationsChange}
                    />;
  } else if (activeMainTab === 'share') {
      mainContent = <FormShareContent 
                        formId={formId} 
                        formName={formName}
                        formThumbnailUrl={_thumbnailUrl}
                        isPublished={isPublished} 
                        isOwner={isOwner}
                        sharedWith={collaborationDataRef.current.sharedWith}
                        onUpdateSharedWith={handleUpdateSharedWith}
                        currentUser={currentUser}
                    />;
  } else if (activeMainTab === 'submission') {
      mainContent = <FormSubmissionContent formId={formId} formFields={publishedFields || formFields} formName={formName} />;
  } else if (activeMainTab === 'analytics') {
      mainContent = <FormAnalyticsContent formId={formId} userId={currentUser?.uid || null} />;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <Steps
          enabled={isTourEnabled}
          steps={tourSteps}
          initialStep={0}
          onExit={onTourExit}
          options={{
            tooltipClass: 'custom-introjs-tooltip',
            highlightClass: 'custom-introjs-highlight',
            doneLabel: 'Finish',
            nextLabel: 'Next',
            prevLabel: 'Back',
          }}
        />
        <FormBuilderHeader
          formId={formId}
          formName={formName}
          saveStatus={saveStatus}
          activeMainTab={activeMainTab}
          onMainTabChange={handleMainTabChange}
          onFormNameChange={handleFormNameChange}
          isPublished={isPublished}
          onPublish={handlePublish}
          isDirty={isDirty}
          onStartTour={() => setIsTourEnabled(true)}
          isOwner={isOwner}
          isCollaborator={isCollaborator}
        />
        {mainContent}
        <UnpublishFormModal
          isOpen={isUnpublishModalOpen}
          onClose={() => setIsUnpublishModalOpen(false)}
          onConfirmUnpublish={handleConfirmUnpublish}
        />
        <PublishSuccessModal
          isOpen={isPublishSuccessModalOpen}
          onClose={() => setIsPublishSuccessModalOpen(false)}
          formId={formId}
          formName={formName}
        />
        <DeleteFieldConfirmationModal
          isOpen={isDeleteFieldModalOpen}
          onClose={() => setIsDeleteFieldModalOpen(false)}
          onConfirm={handleConfirmDeleteField}
        />
      </div>
    </TooltipProvider>
  );
}
