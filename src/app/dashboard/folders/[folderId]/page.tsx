
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PlusCircle, Folder as FolderIcon, Loader2, AlertTriangle, MoreHorizontal, Search, LayoutGrid, List, ArrowDownUp, Settings2, FilePenLine, LineChart, CalendarClock, FileClock, FolderKanban, Copy, Trash2, Users, Eye as ViewIcon, ExternalLink, Inbox } from "lucide-react";
import Link from "next/link";
import { getFolderById, type Folder } from '@/lib/services/folderService';
import { useToast } from '@/hooks/use-toast';
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getFormsByFolderId, type FormDocument, trashForm, moveFormToFolder, duplicateForm } from '@/lib/services/formService';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import * as htmlToImage from 'html-to-image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DeleteFormModal } from '@/components/dashboard/forms/DeleteFormModal';
import { MoveToFolderModal } from '@/components/dashboard/forms/MoveToFolderModal';
import { useSidebar } from '@/components/ui/sidebar';
import { DuplicateFormModal } from '@/components/dashboard/forms/DuplicateFormModal';

type FormItem = FormDocument;

const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 200;

function FormCardActions({
  form,
  onTrashClick,
  onMoveToFolderClick,
  onDuplicateClick
}: {
  form: FormItem,
  onTrashClick: (form: FormItem) => void,
  onMoveToFolderClick: (formId: string, formName: string, currentFolderId: string | null | undefined) => void,
  onDuplicateClick: (formId: string, formName: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem asChild>
          <Link href={`/builder?formId=${form.id}`}>
            <FilePenLine className="mr-2 h-4 w-4" />
            Edit Form
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMoveToFolderClick(form.id, form.formName, form.folderId)}>
          <FolderKanban className="mr-2 h-4 w-4" />
          Move to
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicateClick(form.id, form.formName)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
           <Link href={`/builder?formId=${form.id}&tab=settings`}>
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
         {form.isPublished && (
          <DropdownMenuItem asChild>
            <a href={`/forms/view/${form.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Published Form
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onTrashClick(form)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FormCard({
  form,
  onTrashClick,
  onMoveToFolderClick,
  onDuplicateClick
}: {
  form: FormItem,
  onTrashClick: (form: FormItem) => void,
  onMoveToFolderClick: (formId: string, formName: string, currentFolderId: string | null | undefined) => void,
  onDuplicateClick: (formId: string, formName: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string>(form.thumbnailUrl || '');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  useEffect(() => {
    const generateThumbnail = async () => {
      if (captureRef.current && (!form.thumbnailUrl || form.thumbnailUrl.startsWith("https://placehold.co"))) {
        setIsGeneratingThumbnail(true);
        try {
          if (captureRef.current) {
            captureRef.current.style.position = 'fixed';
            captureRef.current.style.left = '0px';
            captureRef.current.style.top = '0px';
            captureRef.current.style.opacity = '1';
            captureRef.current.style.transform = 'translateX(0%)';
            captureRef.current.style.zIndex = '9999';
            captureRef.current.style.pointerEvents = 'none';
          }
          const dataUrl = await htmlToImage.toPng(captureRef.current, { quality: 0.7, pixelRatio: 1, width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT, backgroundColor: form.formStyles?.backgroundColor || '#ffffff' });
          setImageSrc(dataUrl);
        } catch (error) {
          console.error(`[FormCard] Failed to generate thumbnail for form: ${form.formName}`, error);
          setImageSrc('');
        } finally {
          setIsGeneratingThumbnail(false);
          if (captureRef.current) {
            captureRef.current.style.opacity = '0';
            captureRef.current.style.transform = 'translateX(-100%)';
            captureRef.current.style.zIndex = '-1';
            captureRef.current.style.pointerEvents = 'none';
            captureRef.current.style.position = 'fixed';
          }
        }
      } else if (form.thumbnailUrl && !form.thumbnailUrl.startsWith("https://placehold.co")) {
        setImageSrc(form.thumbnailUrl);
      }
    };
    const timer = setTimeout(generateThumbnail, 200 + Math.random() * 300);
    return () => clearTimeout(timer);
  }, [form.formName, form.thumbnailUrl, form.formStyles, form.formFields]);

  const lastEditedRelative = (form.lastEdited && typeof form.lastEdited.toDate === 'function') ? formatDistanceToNow(form.lastEdited.toDate(), { addSuffix: true }) : 'N/A';
  const simplifiedPreviewStyles: React.CSSProperties = { width: `${THUMBNAIL_WIDTH}px`, height: `${THUMBNAIL_HEIGHT}px`, backgroundColor: form.formStyles?.backgroundColor || '#ffffff', color: form.formStyles?.questionsColor || '#000000', fontFamily: form.formStyles?.fontFamily || 'sans-serif', padding: '20px', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0', position: 'fixed', left: '0px', top: '0px', transform: 'translateX(-100%)', opacity: 0, zIndex: -1, pointerEvents: 'none' };

  return (
    <>
      <div ref={captureRef} style={simplifiedPreviewStyles}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: form.formStyles?.mainColor, marginBottom: '15px', textAlign: 'center', wordBreak: 'break-word' }}>{form.formName || 'Untitled Form'}</h3>
        {(form.formFields || []).slice(0, 2).map((field, index) => (<div key={index} style={{ fontSize: '14px', marginBottom: '8px', width: '80%', backgroundColor: form.formStyles?.inputsBackground || '#f0f0f0', padding: '8px', borderRadius: '4px', border: `1px solid ${form.formStyles?.inputsBorderColor || '#cccccc'}`, textAlign: 'left', wordBreak: 'break-word' }}>{field.label || `Field ${index + 1}`}</div>))}
        {form.formFields && form.formFields.length > 2 && <p style={{fontSize: '12px', marginTop: '10px'}}>...</p>}
      </div>
      <Card className="overflow-hidden group relative rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 flex flex-col" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <CardContent className="p-0 flex-grow flex flex-col">
          <div className="block aspect-[3/2] bg-muted relative">
            <Link href={`/builder?formId=${form.id}`} className='block w-full h-full'>
              {isGeneratingThumbnail && !imageSrc ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={form.formName}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="form preview"
                  unoptimized={imageSrc.startsWith('data:image/png')}
                  onError={() => {
                    console.warn(`[FormCard] Error loading image, hiding it for form: ${form.formName}`);
                    setImageSrc('');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <FilePenLine className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </Link>
            {isHovered && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 space-y-2.5 transition-opacity duration-300 opacity-100 backdrop-blur-sm">
                  <Button asChild variant="default" className="w-11/12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transform transition-transform duration-200 group-hover:scale-105">
                      <Link href={`/builder?formId=${form.id}`}>
                        <FilePenLine className="mr-2 h-4 w-4" />
                        Edit Form
                      </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-11/12 bg-background text-foreground hover:bg-accent shadow-md transform transition-transform duration-200 group-hover:scale-105">
                      <Link href={`/builder?formId=${form.id}&tab=settings`}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Open Settings
                      </Link>
                  </Button>
              </div>
            )}
          </div>
          <div className="p-4 bg-card mt-auto">
            <div className="flex justify-between items-start">
              <div>
                <Link href={`/builder?formId=${form.id}`} className="font-semibold text-foreground text-base hover:underline line-clamp-2">{form.formName}</Link>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span>{form.responsesCount || 0} Response{form.responsesCount === 1 ? '' : 's'}</span>
                   {form.isPublished && (<><span className="text-muted-foreground/50">&bull;</span><Badge variant="default" className="bg-green-100 text-green-700 border border-green-200 text-xs px-1.5 py-0 hover:bg-green-100">Published</Badge></>)}
                </div>
              </div>
              <FormCardActions form={form} onTrashClick={onTrashClick} onMoveToFolderClick={onMoveToFolderClick} onDuplicateClick={onDuplicateClick} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function FormListItem({
  form,
  onTrashClick,
  onMoveToFolderClick,
  onDuplicateClick
}: {
  form: FormItem,
  onTrashClick: (form: FormItem) => void,
  onMoveToFolderClick: (formId: string, formName: string, currentFolderId: string | null | undefined) => void,
  onDuplicateClick: (formId: string, formName: string) => void
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string>(form.thumbnailUrl || '');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  useEffect(() => {
    const generateThumbnail = async () => {
      const LIST_THUMBNAIL_WIDTH = 64;
      const LIST_THUMBNAIL_HEIGHT = 40;

      if (captureRef.current && (!form.thumbnailUrl || form.thumbnailUrl.startsWith("https://placehold.co"))) {
        setIsGeneratingThumbnail(true);
        try {
          if (captureRef.current) {
            captureRef.current.style.position = 'fixed';
            captureRef.current.style.left = '0px';
            captureRef.current.style.top = '0px';
            captureRef.current.style.opacity = '1';
            captureRef.current.style.transform = 'translateX(0%)';
            captureRef.current.style.zIndex = '9999';
            captureRef.current.style.pointerEvents = 'none';
          }
          
          const dataUrl = await htmlToImage.toPng(captureRef.current, {
            quality: 0.7,
            pixelRatio: 1,
            width: LIST_THUMBNAIL_WIDTH,
            height: LIST_THUMBNAIL_HEIGHT,
            backgroundColor: form.formStyles?.backgroundColor || '#ffffff',
          });
          
          setImageSrc(dataUrl);
        } catch (error) {
          console.error(`[FormListItem] Failed to generate thumbnail for form: ${form.formName}`, error);
          setImageSrc('');
        } finally {
          setIsGeneratingThumbnail(false);
          if (captureRef.current) {
            captureRef.current.style.opacity = '0';
            captureRef.current.style.transform = 'translateX(-100%)';
            captureRef.current.style.zIndex = '-1';
            captureRef.current.style.pointerEvents = 'none';
            captureRef.current.style.position = 'fixed';
          }
        }
      } else if (form.thumbnailUrl && !form.thumbnailUrl.startsWith("https://placehold.co")) {
        setImageSrc(form.thumbnailUrl);
      }
    };

    const timer = setTimeout(generateThumbnail, 200 + Math.random() * 300);
    return () => clearTimeout(timer);
  }, [form.formName, form.thumbnailUrl, form.formStyles, form.formFields]);

  const lastEditedRelative = (form.lastEdited && typeof form.lastEdited.toDate === 'function')
    ? formatDistanceToNow(form.lastEdited.toDate(), { addSuffix: true })
    : 'N/A';
  
  const simplifiedPreviewStyles: React.CSSProperties = {
    width: `64px`,
    height: `40px`,
    backgroundColor: form.formStyles?.backgroundColor || '#ffffff',
    color: form.formStyles?.questionsColor || '#000000',
    fontFamily: form.formStyles?.fontFamily || 'sans-serif',
    padding: '5px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e0e0e0',
    position: 'fixed',
    left: '0px',
    top: '0px',
    transform: 'translateX(-100%)',
    opacity: 0,
    zIndex: -1,
    pointerEvents: 'none',
  };

  return (
    <>
      <div ref={captureRef} style={simplifiedPreviewStyles}>
        <h3 style={{ fontSize: '8px', fontWeight: 'bold', color: form.formStyles?.mainColor, marginBottom: '2px', textAlign: 'center', wordBreak: 'break-word', lineHeight: '1.1' }}>
          {form.formName || 'Untitled Form'}
        </h3>
        {(form.formFields || []).slice(0, 1).map((field, index) => (
          <div
            key={index}
            style={{
              fontSize: '6px',
              width: '80%',
              backgroundColor: form.formStyles?.inputsBackground || '#f0f0f0',
              padding: '2px',
              borderRadius: '2px',
              border: `1px solid ${form.formStyles?.inputsBorderColor || '#cccccc'}`,
              textAlign: 'left',
              wordBreak: 'break-word',
              lineHeight: '1.1'
            }}
          >
            {field.label || `Field ${index + 1}`}
          </div>
        ))}
      </div>
      
      <Card key={form.id} className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <Link href={`/builder?formId=${form.id}`} className="block w-16 h-10 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {isGeneratingThumbnail && !imageSrc ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : imageSrc ? (
                          <Image
                              src={imageSrc}
                              alt={form.formName}
                              width={64}
                              height={40}
                              objectFit="cover"
                              data-ai-hint="form preview small"
                              unoptimized={imageSrc.startsWith('data:image/png')}
                              onError={() => {
                                  console.warn(`[FormListItem] Error loading image, hiding it for form: ${form.formName}`);
                                  setImageSrc('');
                              }}
                          />
                      ) : (
                          <FilePenLine className="h-6 w-6 text-muted-foreground/50" />
                      )}
                  </Link>
                  <div>
                      <Link href={`/builder?formId=${form.id}`} className="font-semibold text-foreground text-sm hover:underline line-clamp-1">{form.formName}</Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span>{form.responsesCount || 0} Response{form.responsesCount !== 1 ? 's' : ''}</span>
                           {form.isPublished && (<><span className="text-muted-foreground/50">&bull;</span><Badge variant="default" className="bg-green-100 text-green-700 border border-green-200 text-xs px-1.5 py-0 hover:bg-green-100">Published</Badge></>)}
                          <span className="text-muted-foreground/50">&bull;</span>
                          <span>Edited: {lastEditedRelative}</span>
                      </div>
                  </div>
              </div>
              <FormCardActions form={form} onTrashClick={onTrashClick} onMoveToFolderClick={onMoveToFolderClick} onDuplicateClick={onDuplicateClick}/>
          </CardContent>
      </Card>
    </>
  );
}


export default function FolderPage() {
  const params = useParams();
  const folderId = params.folderId as string;
  const [folder, setFolder] = useState<Folder | null>(null);
  const [forms, setForms] = useState<FormItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const auth = getAuth(app);
  const { refetchFolders } = useSidebar();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState('last-edited');

  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [formToTrash, setFormToTrash] = useState<{id: string, name: string, isPublished: boolean} | null>(null);
  const [isTrashingForm, setIsTrashingForm] = useState(false);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [formToMove, setFormToMove] = useState<{id: string, name: string, currentFolderId: string | null | undefined} | null>(null);

  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [formToDuplicate, setFormToDuplicate] = useState<{id: string, name: string} | null>(null);
  const [isDuplicatingForm, setIsDuplicatingForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredForms, setFilteredForms] = useState<FormItem[]>([]);

  useEffect(() => {
    const savedViewMode = localStorage.getItem('formsViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('formsViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsLoading(false);
        setError("Please log in to view folder details.");
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const fetchFolderData = useCallback(async () => {
    if (!currentUser || !folderId) {
      if (!currentUser && folderId) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedFolder = await getFolderById(folderId);
      if (fetchedFolder) {
        setFolder(fetchedFolder);
        const fetchedForms = await getFormsByFolderId(folderId);
        setForms(fetchedForms);
      } else {
        setError("Folder not found or you don't have permission to view it.");
        toast({ title: "Error", description: "Folder not found or access denied.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Error fetching folder data:", err);
      setError(err.message || "Failed to load folder details and forms.");
      toast({ title: "Error", description: err.message || "Could not load folder details. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [folderId, toast, currentUser]);

  useEffect(() => {
    fetchFolderData();
  }, [fetchFolderData]);

  useEffect(() => {
    let processedForms = [...forms];

    if (searchTerm) {
      processedForms = processedForms.filter(form =>
        form.formName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sortOption === 'last-edited') {
      processedForms.sort((a, b) => {
        const dateA = a.lastEdited?.toDate?.().getTime() || 0;
        const dateB = b.lastEdited?.toDate?.().getTime() || 0;
        return dateB - dateA;
      });
    } else if (sortOption === 'alphabetical') {
      processedForms.sort((a, b) => a.formName.localeCompare(b.formName));
    } else if (sortOption === 'date-created') {
       processedForms.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.().getTime() || 0;
        const dateB = b.createdAt?.toDate?.().getTime() || 0;
        return dateB - dateA;
      });
    }
    
    setFilteredForms(processedForms);
  }, [searchTerm, forms, sortOption]);


  const handleTrashFormClick = (form: FormItem) => {
    setFormToTrash({ id: form.id, name: form.formName, isPublished: form.isPublished });
    setIsTrashModalOpen(true);
  };

  const handleConfirmTrashForm = async () => {
    if (!formToTrash) return;
    setIsTrashingForm(true);
    const result = await trashForm(formToTrash.id);
    if (result.success) {
      toast({ title: "Form Moved to Trash", description: `"${formToTrash.name}" has been moved to the trash.` });
      setForms(prevForms => prevForms.filter(form => form.id !== formToTrash.id));
      if (refetchFolders) refetchFolders();
    } else {
      toast({ title: "Error", description: result.error || "Failed to move form to trash.", variant: "destructive" });
    }
    setIsTrashingForm(false);
    setIsTrashModalOpen(false);
    setFormToTrash(null);
  };

  const handleMoveToFolderClick = (formId: string, formName: string, currentFolderId: string | null | undefined) => {
    setFormToMove({ id: formId, name: formName, currentFolderId });
    setIsMoveModalOpen(true);
  };

  const handleConfirmMoveForm = async (formId: string, newFolderId: string | null) => {
    const result = await moveFormToFolder(formId, newFolderId);
    if (result.success) {
      toast({ title: "Form Moved", description: `Form "${formToMove?.name}" has been moved.` });
      fetchFolderData();
      if (refetchFolders) refetchFolders();
    } else {
      toast({ title: "Move Failed", description: result.error || "Could not move the form.", variant: "destructive" });
    }
    setIsMoveModalOpen(false);
    setFormToMove(null);
  };

  const handleDuplicateFormClick = (formId: string, formName: string) => {
    setFormToDuplicate({ id: formId, name: formName });
    setIsDuplicateModalOpen(true);
  };

  const handleConfirmDuplicateForm = async () => {
    if (!formToDuplicate) return;
    setIsDuplicatingForm(true);
    const result = await duplicateForm(formToDuplicate.id);
    if (result.success) {
      toast({ title: "Form Duplicated", description: `A copy of "${formToDuplicate.name}" has been created.` });
      fetchFolderData();
      if (refetchFolders) refetchFolders();
    } else {
      toast({ title: "Error", description: result.error || "Failed to duplicate form.", variant: "destructive" });
    }
    setIsDuplicatingForm(false);
    setIsDuplicateModalOpen(false);
    setFormToDuplicate(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading folder details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/5">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Folder</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/forms">Back to My Forms</Link>
        </Button>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Folder not found.</p>
      </div>
    );
  }

  const formCountText = filteredForms.length === 1 ? "1 form" : `${filteredForms.length} forms`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
           <FolderIcon className="h-7 w-7 text-primary" />
           <h1 className="text-2xl font-semibold text-foreground">
            {folder.name} <span className="text-base text-muted-foreground font-normal">({formCountText})</span>
          </h1>
        </div>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/builder">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Form
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full sm:flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search forms in this folder..." 
            className="pl-8 w-full h-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <Select defaultValue="last-edited" onValueChange={setSortOption}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <ArrowDownUp className="mr-2 h-4 w-4 inline-block text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="last-edited"><div className="flex items-center"><FileClock className="mr-2 h-4 w-4" />Last Edited</div></SelectItem>
              <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
              <SelectItem value="date-created"><div className="flex items-center"><CalendarClock className="mr-2 h-4 w-4" />Date Created</div></SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border bg-background p-0.5">
            <Button variant={viewMode === 'grid' ? "secondary": "ghost"} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'list' ? "secondary": "ghost"} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8"><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      
      {filteredForms.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
            <Inbox className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              {searchTerm ? `No forms found for "${searchTerm}"` : "No forms in this folder yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try a different search term." : "Create your first form in this folder to get started."}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                  <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link href="/builder"><PlusCircle className="mr-2 h-4 w-4" />Create New Form</Link></Button>
              </div>
            )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredForms.map((form) => (<FormCard key={form.id} form={form} onTrashClick={handleTrashFormClick} onMoveToFolderClick={handleMoveToFolderClick} onDuplicateClick={handleDuplicateFormClick} />))}
        </div>
      ) : (
        <div className="space-y-3">
            {filteredForms.map(form => (
                <FormListItem
                    key={form.id}
                    form={form}
                    onTrashClick={handleTrashFormClick}
                    onMoveToFolderClick={handleMoveToFolderClick}
                    onDuplicateClick={handleDuplicateFormClick}
                />
            ))}
        </div>
      )}

      <DeleteFormModal isOpen={isTrashModalOpen} onClose={() => setIsTrashModalOpen(false)} onConfirmDelete={handleConfirmTrashForm} formName={formToTrash?.name} isDeleting={isTrashingForm} formIsPublished={formToTrash?.isPublished}/>
      <MoveToFolderModal isOpen={isMoveModalOpen} onClose={() => { setIsMoveModalOpen(false); setFormToMove(null);}} formId={formToMove?.id || null} formName={formToMove?.name || null} currentFolderId={formToMove?.currentFolderId} onMoveConfirm={handleConfirmMoveForm}/>
      <DuplicateFormModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onConfirmDuplicate={handleConfirmDuplicateForm}
        formName={formToDuplicate?.name}
        isDuplicating={isDuplicatingForm}
      />
    </div>
  );
}

    