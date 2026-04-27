
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal, Search, LayoutGrid, List, ArrowDownUp, Settings2, PlusCircle,
  FilePenLine, FolderKanban, Copy, Trash2, Loader2, Users, Eye as ViewIcon, ExternalLink, Inbox, CheckSquare, Share2, LineChart, FileClock, CalendarClock
} from "lucide-react";
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
import Link from 'next/link';
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { trashForm, type FormDocument, moveFormToFolder, duplicateForm } from '@/lib/services/formService';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import * as htmlToImage from 'html-to-image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DeleteFormModal } from '@/components/dashboard/forms/DeleteFormModal';
import { MoveToFolderModal } from '@/components/dashboard/forms/MoveToFolderModal';
import { useSidebar } from '@/components/ui/sidebar';
import { DuplicateFormModal } from '@/components/dashboard/forms/DuplicateFormModal';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Timestamp } from 'firebase/firestore';
import { BulkMoveToFolderModal } from '@/components/dashboard/forms/BulkMoveToFolderModal';
import { useMyForms } from '@/hooks/useMyForms';


const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 200;

function FormCardActions({
  form,
  onTrashClick,
  onMoveToFolderClick,
  onDuplicateClick,
  isSelected,
  onSelectChange,
}: {
  form: FormDocument,
  onTrashClick: (form: FormDocument) => void,
  onMoveToFolderClick: (formId: string, formName: string, currentFolderId: string | null | undefined) => void,
  onDuplicateClick: (formId: string, formName: string) => void,
  isSelected: boolean,
  onSelectChange: (checked: boolean) => void,
}) {

  const handleSelect = (e: Event) => {
    e.preventDefault();
    onSelectChange(!isSelected);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onSelect={handleSelect}>
          <CheckSquare className="mr-2 h-4 w-4" />
          {isSelected ? 'Deselect' : 'Select'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/builder?formId=${form.id}&tab=share`}>
            <Share2 className="mr-2 h-4 w-4" />
            Invite Collaborators
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/builder?formId=${form.id}&tab=submission`}>
            <Inbox className="mr-2 h-4 w-4" />
            View Submissions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/builder?formId=${form.id}&tab=analytics`}>
            <LineChart className="mr-2 h-4 w-4" />
            View Analytics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
  onDuplicateClick,
  isSelected,
  onSelectChange,
  isAnyFormSelected,
}: {
  form: FormDocument,
  onTrashClick: (form: FormDocument) => void,
  onMoveToFolderClick: (formId: string, formName: string, currentFolderId: string | null | undefined) => void,
  onDuplicateClick: (formId: string, formName: string) => void,
  isSelected: boolean,
  onSelectChange: (checked: boolean) => void,
  isAnyFormSelected: boolean,
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

          const dataUrl = await htmlToImage.toPng(captureRef.current, {
            quality: 0.7,
            pixelRatio: 1,
            width: THUMBNAIL_WIDTH,
            height: THUMBNAIL_HEIGHT,
            backgroundColor: form.formStyles?.backgroundColor || '#ffffff',
          });
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

  const simplifiedPreviewStyles: React.CSSProperties = {
    width: `${THUMBNAIL_WIDTH}px`,
    height: `${THUMBNAIL_HEIGHT}px`,
    backgroundColor: form.formStyles?.backgroundColor || '#ffffff',
    color: form.formStyles?.questionsColor || '#000000',
    fontFamily: form.formStyles?.fontFamily || 'sans-serif',
    padding: '20px',
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnyFormSelected) {
      e.preventDefault();
      onSelectChange(!isSelected);
    }
    // If no form is selected, the Link component will handle navigation.
  };

  return (
    <>
      <div ref={captureRef} style={simplifiedPreviewStyles}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: form.formStyles?.mainColor, marginBottom: '15px', textAlign: 'center', wordBreak: 'break-word' }}>
          {form.formName || 'Untitled Form'}
        </h3>
        {(form.formFields || []).slice(0, 2).map((field, index) => (
          <div
            key={index}
            style={{
              fontSize: '14px',
              marginBottom: '8px',
              width: '80%',
              backgroundColor: form.formStyles?.inputsBackground || '#f0f0f0',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${form.formStyles?.inputsBorderColor || '#cccccc'}`,
              textAlign: 'left',
              wordBreak: 'break-word'
            }}
          >
            {field.label || `Field ${index + 1}`}
          </div>
        ))}
        {form.formFields && form.formFields.length > 2 && <p style={{fontSize: '12px', marginTop: '10px'}}>...</p>}
      </div>

      <Card
        className={cn(
          "overflow-hidden group relative rounded-lg shadow-md hover:shadow-xl transition-all duration-200 flex flex-col",
          isSelected && "ring-2 ring-primary shadow-xl",
          isAnyFormSelected && "cursor-pointer"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <CardContent className="p-0 flex-grow flex flex-col">
          <div className="block aspect-[3/2] bg-muted relative">
            <Link href={`/builder?formId=${form.id}`} className='block w-full h-full' onClick={(e) => { if (isAnyFormSelected) e.preventDefault(); }}>
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
            <div
              className={cn(
                "absolute top-2 left-2 transition-opacity duration-200",
                 (isHovered || isSelected) ? "opacity-100" : "opacity-0"
              )}
              onClick={(e) => { e.stopPropagation(); onSelectChange(!isSelected); }}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectChange}
                className="h-5 w-5 bg-background border-muted-foreground shadow-lg"
                aria-label={`Select form ${form.formName}`}
              />
            </div>
            {isHovered && !isSelected && (
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
                <Link href={`/builder?formId=${form.id}`} className="font-semibold text-foreground text-base hover:underline line-clamp-2" onClick={(e) => { if (isAnyFormSelected) e.preventDefault(); }}>
                  {form.formName}
                </Link>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span>{form.responsesCount || 0} Response{form.responsesCount === 1 ? '' : 's'}</span>
                   {form.isPublished && (
                    <>
                        <span className="text-muted-foreground/50">&bull;</span>
                        <Badge variant="default" className="bg-green-100 text-green-700 border border-green-200 text-xs px-1.5 py-0 hover:bg-green-100">
                           Published
                        </Badge>
                    </>
                  )}
                </div>
              </div>
              <FormCardActions 
                form={form} 
                onTrashClick={onTrashClick} 
                onMoveToFolderClick={onMoveToFolderClick} 
                onDuplicateClick={onDuplicateClick} 
                isSelected={isSelected}
                onSelectChange={onSelectChange}
              />
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
  onDuplicateClick,
  isSelected,
  onSelectChange,
  isAnyFormSelected,
}: {
  form: FormDocument,
  onTrashClick: (form: FormDocument) => void,
  onMoveToFolderClick: (formId: string, formName: string, currentFolderId: string | null | undefined) => void,
  onDuplicateClick: (formId: string, formName: string) => void,
  isSelected: boolean,
  onSelectChange: (checked: boolean) => void,
  isAnyFormSelected: boolean,
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click target is a link or a button inside the card to avoid double actions
    const target = e.target as HTMLElement;
    if (target.closest('a, button, [role="checkbox"]')) {
      return;
    }
    
    if (isAnyFormSelected) {
      e.preventDefault();
      onSelectChange(!isSelected);
    }
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
      
      <Card
        key={form.id}
        className={cn(
          "shadow-sm hover:shadow-md transition-shadow",
          isSelected && "bg-primary/5 border-primary",
          isAnyFormSelected && "cursor-pointer"
        )}
        onClick={handleCardClick}
      >
          <CardContent className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={onSelectChange}
                        className="h-4 w-4"
                        aria-label={`Select form ${form.formName}`}
                    />
                  </div>
                  <Link href={`/builder?formId=${form.id}`} className="block w-16 h-10 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden" onClick={(e) => { if(isAnyFormSelected) e.preventDefault() }}>
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
                      <Link href={`/builder?formId=${form.id}`} className="font-semibold text-foreground text-sm hover:underline line-clamp-1" onClick={(e) => { if(isAnyFormSelected) e.preventDefault() }}>{form.formName}</Link>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span>{form.responsesCount || 0} Response{form.responsesCount !== 1 ? 's' : ''}</span>
                           {form.isPublished && (
                              <>
                                  <span className="text-muted-foreground/50">&bull;</span>
                                  <Badge variant="default" className="bg-green-100 text-green-700 border border-green-200 text-xs px-1.5 py-0 font-normal hover:bg-green-100">
                                      Published
                                  </Badge>
                              </>
                           )}
                          <span className="text-muted-foreground/50">&bull;</span>
                          <span>Edited: {lastEditedRelative}</span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex border-l pl-2 space-x-1">
                     <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50 hover:text-foreground" title="Invite Collaborators">
                        <Link href={`/builder?formId=${form.id}&tab=share`}>
                            <Share2 className="h-4 w-4"/>
                        </Link>
                     </Button>
                     <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50 hover:text-foreground" title="View Submissions">
                        <Link href={`/builder?formId=${form.id}&tab=submission`}>
                            <Inbox className="h-4 w-4"/>
                        </Link>
                     </Button>
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted/50 hover:text-foreground" title="View Analytics">
                         <Link href={`/builder?formId=${form.id}&tab=analytics`}>
                            <LineChart className="h-4 w-4"/>
                        </Link>
                      </Button>
                </div>
                <FormCardActions
                    form={form}
                    onTrashClick={onTrashClick}
                    onMoveToFolderClick={onMoveToFolderClick}
                    onDuplicateClick={onDuplicateClick}
                    isSelected={isSelected}
                    onSelectChange={onSelectChange}
                />
              </div>
          </CardContent>
      </Card>
    </>
  );
}

export default function AllFormsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const auth = getAuth(app);
  const { toast } = useToast();
  const { refetchFolders } = useSidebar();
  const { myForms, loading, error } = useMyForms(currentUser);

  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [formToTrash, setFormToTrash] = useState<FormDocument | null>(null);
  const [isTrashingForm, setIsTrashingForm] = useState(false);

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [formToMove, setFormToMove] = useState<{id: string, name: string, currentFolderId: string | null | undefined} | null>(null);
  
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);

  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [formToDuplicate, setFormToDuplicate] = useState<{id: string, name: string} | null>(null);
  const [isDuplicatingForm, setIsDuplicatingForm] = useState(false);
  
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('last-edited');

  const selectedFormsCount = selectedFormIds.length;
  const isAnyFormSelected = selectedFormsCount > 0;

  useEffect(() => {
    // Load saved preferences from localStorage on component mount
    const savedViewMode = localStorage.getItem('formsViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
    const savedSortOption = localStorage.getItem('formsSortOption');
    if (savedSortOption) {
      setSortOption(savedSortOption);
    }
  }, []);

  useEffect(() => {
    // Save view mode to localStorage whenever it changes
    localStorage.setItem('formsViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    // Save sort option to localStorage whenever it changes
    localStorage.setItem('formsSortOption', sortOption);
  }, [sortOption]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const processAndSortForms = useCallback((forms: FormDocument[]) => {
    let processedForms = [...forms];
    if (searchTerm) {
      processedForms = processedForms.filter(form => form.formName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    const toMillis = (ts: any): number => {
      if (!ts) return 0;
      if (ts instanceof Timestamp) return ts.toMillis();
      if (ts.toDate && typeof ts.toDate === 'function') return ts.toDate().getTime();
      return 0;
    };
    
    if (sortOption === 'last-edited') {
      processedForms.sort((a, b) => toMillis(b.lastEdited) - toMillis(a.lastEdited));
    } else if (sortOption === 'alphabetical') {
      processedForms.sort((a, b) => a.formName.localeCompare(b.formName));
    } else if (sortOption === 'date-created') {
       processedForms.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    }
    return processedForms;
  }, [searchTerm, sortOption]);
  
  const filteredMyForms = useMemo(() => processAndSortForms(myForms), [myForms, processAndSortForms]);

  const allFilteredFormsSelected = useMemo(() => {
    return filteredMyForms.length > 0 && selectedFormIds.length === filteredMyForms.length;
  }, [selectedFormIds, filteredMyForms]);

  const handleSelectForm = (formId: string, checked: boolean) => {
    setSelectedFormIds(prev =>
      checked ? [...prev, formId] : prev.filter(id => id !== formId)
    );
  };

  const handleSelectAllFiltered = (checked: boolean) => {
    if (checked) {
      setSelectedFormIds(filteredMyForms.map(form => form.id));
    } else {
      setSelectedFormIds([]);
    }
  };
  
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const deletePromises = selectedFormIds.map(id => trashForm(id));
    const results = await Promise.allSettled(deletePromises);
    const successfulDeletes = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    if (successfulDeletes > 0) {
      toast({ title: "Forms Moved to Trash", description: `${successfulDeletes} form(s) have been moved to the trash.` });
      setSelectedFormIds([]);
      if (refetchFolders) refetchFolders();
    }
    
    const failedDeletes = results.length - successfulDeletes;
    if (failedDeletes > 0) {
      toast({ title: "Error", description: `Failed to move ${failedDeletes} form(s) to trash.`, variant: "destructive" });
    }
    
    setIsBulkDeleting(false);
    setIsBulkDeleteModalOpen(false);
  };
  
  const handleBulkMoveConfirm = async (newFolderId: string | null) => {
    const movePromises = selectedFormIds.map(formId => moveFormToFolder(formId, newFolderId));
    const results = await Promise.allSettled(movePromises);

    const successfulMoves = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failedMoves = results.length - successfulMoves;

    if (successfulMoves > 0) {
      toast({ title: "Forms Moved", description: `${successfulMoves} form(s) have been moved successfully.` });
      if (refetchFolders) refetchFolders(); // Update sidebar folder counts
      setSelectedFormIds([]); // Clear selection
    }
    if (failedMoves > 0) {
      toast({ title: "Move Failed", description: `Could not move ${failedMoves} form(s).`, variant: "destructive" });
    }
  };


  const handleTrashFormClick = (form: FormDocument) => {
    setFormToTrash(form);
    setIsTrashModalOpen(true);
  };

  const handleConfirmTrashForm = async () => {
    if (!formToTrash) return;
    setIsTrashingForm(true);
    const result = await trashForm(formToTrash.id);
    if (result.success) {
      toast({ title: "Form Moved to Trash", description: `"${formToTrash.formName}" has been moved to the trash.` });
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
      if (refetchFolders) refetchFolders();
    } else {
      toast({ title: "Error", description: result.error || "Failed to duplicate form.", variant: "destructive" });
    }
    setIsDuplicatingForm(false);
    setIsDuplicateModalOpen(false);
    setFormToDuplicate(null);
  };
  
  const noFormsExist = myForms.length === 0;
  const noFormsMatchFilter = filteredMyForms.length === 0 && !noFormsExist;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Forms</h1>
           {isAnyFormSelected && (
            <div className="text-sm text-muted-foreground mt-1">
              {selectedFormsCount} form{selectedFormsCount > 1 ? 's' : ''} selected
            </div>
          )}
        </div>
        <div>
          {isAnyFormSelected ? (
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsBulkMoveModalOpen(true)}>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Move ({selectedFormsCount})
                </Button>
                <Button variant="destructive" onClick={() => setIsBulkDeleteModalOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedFormsCount})
                </Button>
              </div>
          ) : (
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/builder">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Form
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search my forms..." 
                className="pl-8 w-full h-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <ArrowDownUp className="mr-2 h-4 w-4 inline-block text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-edited">
                    <div className="flex items-center">
                      <FileClock className="mr-2 h-4 w-4" />
                      Last Edited
                    </div>
                  </SelectItem>
                  <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                  <SelectItem value="date-created">
                    <div className="flex items-center">
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Date Created
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center rounded-md border bg-background p-0.5">
                <Button variant={viewMode === 'grid' ? "secondary": "ghost"} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? "secondary": "ghost"} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
        </div>
        {filteredMyForms.length > 0 && (
          <div className="flex items-center p-2 border-b">
              <Checkbox
                id="select-all"
                checked={allFilteredFormsSelected}
                onCheckedChange={(checked) => handleSelectAllFiltered(!!checked)}
                className="h-4 w-4 mr-2"
              />
              <label htmlFor="select-all" className="text-sm font-medium text-muted-foreground cursor-pointer">
                Select all ({filteredMyForms.length})
              </label>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading forms...</p>
        </div>
      ) : noFormsExist ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
            <PlusCircle className="mx-auto h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">No forms yet</p>
            <p className="text-sm text-muted-foreground">Create your first form to get started.</p>
            <div className="mt-6">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/builder"><PlusCircle className="mr-2 h-4 w-4" />Create New Form</Link>
            </Button>
            </div>
        </div>
      ) : noFormsMatchFilter ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
            <Inbox className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">No forms found</p>
            <p className="text-sm text-muted-foreground">
            Your search for "{searchTerm}" did not return any results.
            </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMyForms.map((form) => (
                <FormCard
                    key={form.id}
                    form={form}
                    onTrashClick={handleTrashFormClick}
                    onMoveToFolderClick={handleMoveToFolderClick}
                    onDuplicateClick={handleDuplicateFormClick}
                    isSelected={selectedFormIds.includes(form.id)}
                    onSelectChange={(checked) => handleSelectForm(form.id, checked)}
                    isAnyFormSelected={isAnyFormSelected}
                />
            ))}
        </div>
      ) : (
        <div className="space-y-3">
            {filteredMyForms.map(form => (
                <FormListItem
                    key={form.id}
                    form={form}
                    onTrashClick={handleTrashFormClick}
                    onMoveToFolderClick={handleMoveToFolderClick}
                    onDuplicateClick={handleDuplicateFormClick}
                    isSelected={selectedFormIds.includes(form.id)}
                    onSelectChange={(checked) => handleSelectForm(form.id, checked)}
                    isAnyFormSelected={isAnyFormSelected}
                />
            ))}
        </div>
      )}

       <DeleteFormModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        onConfirmDelete={handleConfirmTrashForm}
        formName={formToTrash?.formName}
        isDeleting={isTrashingForm}
        formIsPublished={formToTrash?.isPublished}
      />
      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => { setIsMoveModalOpen(false); setFormToMove(null);}}
        formId={formToMove?.id || null}
        formName={formToMove?.name || null}
        currentFolderId={formToMove?.currentFolderId}
        onMoveConfirm={handleConfirmMoveForm}
      />
      <BulkMoveToFolderModal
        isOpen={isBulkMoveModalOpen}
        onClose={() => setIsBulkMoveModalOpen(false)}
        selectedFormIds={selectedFormIds}
        onMoveConfirm={handleBulkMoveConfirm}
      />
      <DuplicateFormModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onConfirmDuplicate={handleConfirmDuplicateForm}
        formName={formToDuplicate?.name}
        isDuplicating={isDuplicatingForm}
      />
      <AlertDialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move {selectedFormsCount} form(s) to the trash. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting} className="bg-destructive hover:bg-destructive/90">
              {isBulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
