

"use client";

import React, { useState, useRef, createRef } from 'react';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CanvasPlaceholder } from './CanvasPlaceholder';
import type { FieldDefinition, FormFieldInstance, FormStyles, FormPage, WelcomePageConfig, EndingPageConfig } from './types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GripVertical, Settings, Copy, Trash2, ArrowLeft, ArrowRight, PenTool, Image as ImageIcon, Trophy, Check, ChevronDown, UploadCloud, Star, MapPin, Calendar as CalendarIcon, ArrowUp, ArrowDown, Heading1, Pilcrow, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldSettingsPopover } from './FieldSettingsPopover';
import Image from 'next/image';
import { Accordion2, AccordionContent2, AccordionItem2, AccordionTrigger2 } from '@/components/ui/accordion2';
import { AnimatedCheckmark } from '@/components/icons/AnimatedCheckmark';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { WelcomePageEditor } from './WelcomePageEditor';

interface FormCanvasProps {
  fields: FormFieldInstance[];
  onDropNewField: (field: FieldDefinition, targetPageId: string, indexOnPage: number) => void;
  onReorderFields: (sourceId: string, targetPageId: string, targetIndexOnPage: number) => void;
  formStyles: FormStyles;
  onUpdateField: (updatedField: FormFieldInstance) => void;
  onDeleteField: (instanceId: string) => void;
  onDuplicateField: (instanceId: string) => void;
  onMoveField: (instanceId: string, direction: 'up' | 'down') => void;
  formPages: FormPage[];
  welcomePage: WelcomePageConfig;
  onWelcomePageChange: (config: Partial<WelcomePageConfig>) => void;
  endingPage: EndingPageConfig;
  onEndingPageChange: (newConfig: Partial<EndingPageConfig>) => void;
}

const DEFAULT_QUESTIONS_COLOR_HEX_CANVAS = '#1F2937';

const SignatureBoxIcon = () => (
  <svg
    width="80"
    height="40"
    viewBox="0 0 120 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-muted-foreground/70 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
  >
    <path
      d="M20 40C20 40 25 30 35 30C45 30 40 50 50 45C60 40 65 25 75 25C85 25 90 35 100 30"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M70 15L95 40L90 45L65 20L70 15Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <rect x="63" y="13" width="10" height="4" rx="1" transform="rotate(45 63 13)" fill="currentColor" />
  </svg>
);


const EndingPageEditor = ({ config, onChange, formStyles }: { config: EndingPageConfig, onChange: (newConfig: Partial<EndingPageConfig>) => void, formStyles: FormStyles }) => {
    return (
        <Accordion2 type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem2 value="item-1" className="border rounded-lg shadow-xl bg-card overflow-hidden">
                <AccordionTrigger2 className="group flex flex-1 items-center justify-between p-4 md:p-6 text-left font-medium transition-all hover:no-underline">
                    <div className="flex items-center gap-3">
                        <Trophy className="h-6 w-6 text-primary" />
                        <span className="text-base font-semibold text-foreground">Ending</span>
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </AccordionTrigger2>
                <AccordionContent2 className="px-4 md:px-6 pb-6">
                    <div className="pt-4 border-t border-border space-y-6">
                        <div className="text-center flex flex-col items-center gap-4 py-4">
                            <div className="mx-auto">
                                <AnimatedCheckmark color={formStyles.mainColor} />
                            </div>
                            <Input
                                value={config.title}
                                onChange={(e) => onChange({ title: e.target.value })}
                                placeholder="Thank you!"
                                className="text-2xl font-bold h-auto p-2 border-0 shadow-none focus-visible:ring-0 bg-transparent text-center"
                                style={{ color: formStyles.headingColor || formStyles.questionsColor }}
                                maxLength={250}
                            />
                            <Textarea
                                value={config.description}
                                onChange={(e) => onChange({ description: e.target.value })}
                                placeholder="Your submission has been received!"
                                className="text-base border-0 shadow-none focus-visible:ring-0 bg-transparent text-center min-h-[60px] p-2"
                                style={{ color: formStyles.paragraphColor || formStyles.answersColor }}
                                maxLength={250}
                            />
                        </div>
                    </div>
                </AccordionContent2>
            </AccordionItem2>
        </Accordion2>
    );
};

const DropZone = ({ onDrop, isVisible }: { onDrop: (e: React.DragEvent) => void; isVisible: boolean }) => {
    const [isHovering, setIsHovering] = useState(false);

    if (!isVisible) return null;

    return (
        <div
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsHovering(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsHovering(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDrop(e);
                setIsHovering(false);
            }}
            className={cn(
                "h-2 w-full transition-all duration-150 my-1 rounded-lg",
                isHovering ? "bg-primary/80 h-10" : "bg-primary/20"
            )}
        />
    );
};


export function FormCanvas({
  fields,
  onDropNewField,
  onReorderFields,
  formStyles,
  onUpdateField,
  onDeleteField,
  onDuplicateField,
  onMoveField,
  formPages,
  welcomePage,
  onWelcomePageChange,
  endingPage,
  onEndingPageChange,
}: FormCanvasProps) {
  const [editingField, setEditingField] = useState<FormFieldInstance | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const { theme } = useTheme();
  const pageRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  formPages.forEach(page => {
    if (!pageRefs.current[page.id]) {
      pageRefs.current[page.id] = createRef<HTMLDivElement>();
    }
  });

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent, pageId: string, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    
    const draggedInstanceId = event.dataTransfer.getData('draggedInstanceId');
    const fieldJson = event.dataTransfer.getData('application/json');

    if (draggedInstanceId) {
      onReorderFields(draggedInstanceId, pageId, index);
    } else if (fieldJson) {
      try {
        const field = JSON.parse(fieldJson) as FieldDefinition;
        onDropNewField(field, pageId, index);
      } catch (error) {
        console.error("Failed to parse dropped field data:", error);
      }
    }
    setIsDraggingOver(false);
  };
  
  const handleDragStartExistingField = (event: React.DragEvent<HTMLDivElement>, instanceId: string) => {
    event.dataTransfer.setData('draggedInstanceId', instanceId);
    setIsDraggingOver(true);
  };

  const handleDragEnd = () => {
    setIsDraggingOver(false);
  };

  const handleOpenSettings = (field: FormFieldInstance, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingField(field);
    setPopoverAnchor(event.currentTarget as HTMLElement);
  };

  const handleCloseSettings = () => {
    setEditingField(null);
    setPopoverAnchor(null);
  };

  const handleSaveSettings = (updatedField: FormFieldInstance) => {
    onUpdateField(updatedField);
    handleCloseSettings();
  };
  
  const handleLabelChange = (instanceId: string, newLabel: string) => {
    const fieldToUpdate = fields.find(f => f.instanceId === instanceId);
    if (fieldToUpdate) {
      onUpdateField({ ...fieldToUpdate, label: newLabel });
    }
  };

  const scrollToPage = (pageId: string) => {
    pageRefs.current[pageId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const renderFieldPreview = (field: FormFieldInstance) => {
    const commonInputStyling: React.CSSProperties = {
        backgroundColor: formStyles.inputsBackground,
        borderColor: formStyles.inputsBorderColor,
        color: formStyles.answersColor,
        borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
        fontFamily: formStyles.fontFamily,
    };
    
    const questionStyle: React.CSSProperties = {
      color: (theme === 'dark' && formStyles.questionsColor === DEFAULT_QUESTIONS_COLOR_HEX_CANVAS)
             ? 'hsl(var(--foreground))' 
             : formStyles.questionsColor,
      fontWeight: formStyles.fontWeight as React.CSSProperties['fontWeight'],
      fontFamily: formStyles.fontFamily,
      fontSize: formStyles.labelFontSize ? `${formStyles.labelFontSize}px` : undefined,
    };
    

    switch (field.type) {
      case 'heading':
      case 'paragraph':
        return null;
      case 'tel':
        return (
          <div
            className="flex h-10 w-full items-center rounded-md border border-input px-3 py-2"
            style={{
              ...commonInputStyling,
              backgroundColor: formStyles.inputsBackground,
              borderColor: formStyles.inputsBorderColor,
            }}
          >
            <div className="flex items-center mr-2" style={{color: formStyles.answersColor}}>
              <span role="img" aria-label="United States">🇺🇸</span>
              <ChevronDown className="h-4 w-4 opacity-50 ml-1" />
            </div>
            <input
              type="tel"
              placeholder={field.placeholder || '+1 (555) 123-4567'}
              readOnly
              className="h-auto flex-1 border-none bg-transparent p-0 text-base placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-0 focus:outline-none md:text-sm"
              style={{
                  color: formStyles.answersColor,
                  fontFamily: formStyles.fontFamily,
              }}
            />
          </div>
        );
      case 'text': case 'email': case 'number': case 'url':
        return (
          <>
            <Input type={field.type} placeholder={field.placeholder || 'Preview'} readOnly className="mt-1 bg-background border-input" style={commonInputStyling} />
            {field.showCharCount && field.maxLength && (
              <div className="text-xs text-right text-muted-foreground mt-1 pr-1">
                0 / {field.maxLength}
              </div>
            )}
          </>
        );
      case 'name':
        const nameParts = [
          field.showFirstName && { placeholder: field.firstNamePlaceholder || 'First Name', label: 'First Name' },
          field.showMiddleName && { placeholder: field.middleNamePlaceholder || 'Middle Name', label: 'Middle Name' },
          field.showLastName && { placeholder: field.lastNamePlaceholder || 'Last Name', label: 'Last Name' },
        ].filter(Boolean) as { placeholder: string; label: string }[];
        return (
          <div className="grid gap-3 mt-1" style={{ gridTemplateColumns: `repeat(${nameParts.length}, 1fr)` }}>
            {nameParts.map((part, index) => (
              <div key={index} className="space-y-1">
                <Label className="text-xs" style={{ ...questionStyle, fontSize: '0.75rem' }}>{part.label}</Label>
                <Input type="text" placeholder={part.placeholder} readOnly className="mt-1 bg-background border-input" style={commonInputStyling} />
              </div>
            ))}
          </div>
        );
      case 'address':
        return (
            <div className="space-y-3 mt-1">
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="text" placeholder={field.placeholder || "Address Line 1"} readOnly className="pl-10 bg-background border-input" style={commonInputStyling} />
                </div>
                {field.showAddressLine2 && <Input type="text" placeholder="Address Line 2 (Optional)" readOnly className="bg-background border-input" style={commonInputStyling} />}
                <div className="grid grid-cols-2 gap-3">
                    {field.showCity && <Input type="text" placeholder="City" readOnly className="bg-background border-input" style={commonInputStyling} />}
                    {field.showZipCode && <Input type="text" placeholder="Zip / Postal Code" readOnly className="bg-background border-input" style={commonInputStyling} />}
                </div>
                {field.showState && (
                    <div className="grid grid-cols-2 gap-3">
                        <Select disabled>
                            <SelectTrigger className="w-full bg-background border-input" style={commonInputStyling}>
                                <SelectValue placeholder="Country" />
                            </SelectTrigger>
                        </Select>
                        <Select disabled>
                            <SelectTrigger className="w-full bg-background border-input" style={commonInputStyling}>
                                <SelectValue placeholder="State" />
                            </SelectTrigger>
                        </Select>
                    </div>
                )}
            </div>
        );
      case 'textarea':
        return (
          <>
            <Textarea placeholder={field.placeholder || 'Preview'} readOnly className="mt-1 bg-background border-input" style={commonInputStyling} />
            {field.showCharCount && field.maxLength && (
              <div className="text-xs text-right text-muted-foreground mt-1 pr-1">
                0 / {field.maxLength}
              </div>
            )}
          </>
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger className="w-full mt-1 bg-background border-input" style={commonInputStyling}>
              <SelectValue placeholder={field.placeholder || `Select an option`} />
            </SelectTrigger>
          </Select>
        );
      case 'radio': {
        const layoutClasses = {
          'one-column': 'grid-cols-1',
          'two-columns': 'sm:grid-cols-2',
          'three-columns': 'sm:grid-cols-3',
        }[field.layout || 'one-column'] || 'grid-cols-1';
        return (
          <RadioGroup className={cn("mt-2 grid gap-2", layoutClasses)} disabled>
            {(field.options || [{label: 'Option 1', value: 'opt1'}]).slice(0, 2).map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${field.instanceId}-${opt.value}-preview`} style={{borderColor: formStyles.mainColor}}/>
                <Label htmlFor={`${field.instanceId}-${opt.value}-preview`} style={{color: formStyles.answersColor, fontFamily: formStyles.fontFamily}}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      }
      case 'checkbox': {
        const layoutClasses = {
          'one-column': 'grid-cols-1',
          'two-columns': 'sm:grid-cols-2',
          'three-columns': 'sm:grid-cols-3',
        }[field.layout || 'one-column'] || 'grid-cols-1';
        return (
             <div className={cn("mt-2 grid gap-2", layoutClasses)}>
                {(field.options || [{label: 'Choice 1', value: 'choice1'}]).map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox id={`${field.instanceId}-${opt.value}-preview`} disabled style={{borderColor: formStyles.mainColor}}/>
                    <Label htmlFor={`${field.instanceId}-${opt.value}-preview`} style={{color: formStyles.answersColor, fontFamily: formStyles.fontFamily}}>{opt.label}</Label>
                  </div>
                ))}
            </div>
        );
      }
      case 'file': {
        const isImageUpload = field.id === 'image-upload';
        return (
          <div
            className="mt-1 w-full flex flex-col items-center justify-center p-4 border rounded-lg cursor-default"
            style={{
              backgroundColor: formStyles.inputsBackground,
              borderColor: formStyles.inputsBorderColor,
              borderRadius: commonInputStyling.borderRadius,
            }}
          >
            <UploadCloud className="h-10 w-10 text-muted-foreground/70" />
            <p className="mt-2 text-sm text-center" style={{ color: formStyles.answersColor }}>
              Drag & Drop your files or <span style={{ color: formStyles.mainColor, textDecoration: 'underline' }}>Browse</span>
            </p>
            <p className="text-xs mt-1" style={{ color: formStyles.answersColor, opacity: 0.6 }}>
              Allowed types: {(field.fileTypes || (isImageUpload ? ["JPG", "PNG"] : ["PDF", "DOCX"])).join(', ')}
            </p>
          </div>
        );
      }
      case 'signature':
        return (
            <div
              className="mt-1 p-4 border rounded-md text-center relative min-h-[100px] flex items-center justify-center"
              style={{
                borderColor: formStyles.inputsBorderColor,
                backgroundColor: formStyles.inputsBackground,
                color: formStyles.answersColor,
                borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
              }}
            >
              <SignatureBoxIcon />
              <span className="sr-only">Signature Area</span>
            </div>
        );
      case 'terms':
        return (
            <div className="flex items-start space-x-2 mt-1">
                <Checkbox id={`${field.instanceId}-terms-preview`} disabled style={{borderColor: formStyles.mainColor}}/>
                <Label htmlFor={`${field.instanceId}-terms-preview`} className="text-sm" style={{color: formStyles.answersColor, fontFamily: formStyles.fontFamily}}>
                    {field.label || 'I agree to the terms and conditions.'}
                </Label>
            </div>
        );
      case 'rating': {
        const maxRating = field.maxRating || 5;
        return (
            <div className="mt-2 flex items-center gap-1">
                {[...Array(maxRating)].map((_, i) => (
                    <Star
                        key={i}
                        className="h-6 w-6 text-muted-foreground/50"
                        style={{ stroke: formStyles.mainColor, color: 'transparent' }}
                    />
                ))}
            </div>
        );
      }
      case 'scale': {
        const maxRating = field.maxRating || 10;
        return (
          <div className="mt-2">
            <div className="inline-block">
                <div className="flex flex-wrap gap-2">
                {[...Array(maxRating)].map((_, i) => (
                    <Button key={i} variant="outline" size="icon" className="h-10 w-10 cursor-default" style={commonInputStyling}>
                    {i + 1}
                    </Button>
                ))}
                </div>
                <div className="flex justify-between mt-2 px-1">
                <span className="text-xs" style={{ color: formStyles.answersColor, fontFamily: formStyles.fontFamily }}>{field.minRatingLabel || 'Worst'}</span>
                <span className="text-xs" style={{ color: formStyles.answersColor, fontFamily: formStyles.fontFamily }}>{field.maxRatingLabel || 'Best'}</span>
                </div>
            </div>
          </div>
        );
      }
      case 'date': {
        if (field.id === 'dob') {
            return (
                <div className="flex gap-3 mt-1">
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground" style={{fontFamily: formStyles.fontFamily}}>Day</Label>
                        <Input type="text" placeholder="DD" readOnly className="bg-background border-input" style={commonInputStyling} />
                    </div>
                     <div className="flex-[1.5] space-y-1">
                        <Label className="text-xs text-muted-foreground" style={{fontFamily: formStyles.fontFamily}}>Month</Label>
                        <Select disabled>
                            <SelectTrigger className="w-full bg-background border-input" style={commonInputStyling}>
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground" style={{fontFamily: formStyles.fontFamily}}>Year</Label>
                        <Input type="text" placeholder="YYYY" readOnly className="bg-background border-input" style={commonInputStyling} />
                    </div>
                </div>
            );
        }
        return (
          <div className="relative mt-1">
            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={field.placeholder || "Select a date"}
              readOnly
              className="mt-1 pl-10 bg-background border-input"
              style={commonInputStyling}
            />
          </div>
        );
      }
      default:
        return <Input type="text" value={`Preview for ${field.name}`} readOnly className="mt-1 bg-background border-input" style={commonInputStyling} />;
    }
  };

  const renderEditableField = (field: FormFieldInstance, labelInputStyle: React.CSSProperties) => {
    switch (field.type) {
      case 'heading':
        return (
            <div 
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleLabelChange(field.instanceId, e.currentTarget.textContent || '')}
                onClick={(e) => e.stopPropagation()}
                className="text-2xl font-semibold w-full bg-transparent p-0 outline-none focus:ring-1 focus:ring-primary rounded-sm"
                style={labelInputStyle}
            >
                {field.label || ''}
            </div>
        );
      case 'paragraph':
        return (
            <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleLabelChange(field.instanceId, e.currentTarget.textContent || '')}
                onClick={(e) => e.stopPropagation()}
                className="text-sm w-full bg-transparent p-0 outline-none focus:ring-1 focus:ring-primary rounded-sm min-h-[60px]"
                style={labelInputStyle}
            >
                {field.label || ''}
            </div>
        );
      default:
        return (
          <Input
            type="text"
            placeholder="Type question here"
            value={field.label || ''}
            onChange={(e) => handleLabelChange(field.instanceId, e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-sm font-medium w-full bg-transparent"
            onClick={(e) => e.stopPropagation()}
            style={labelInputStyle}
          />
        );
    }
  };

  return (
    <main
      className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden"
      style={{ fontFamily: formStyles.fontFamily, backgroundColor: formStyles.backgroundColor || '#F9FAFB' }}
      onDragEnter={() => setIsDraggingOver(true)}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingOver(false);
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => {
        handleDrop(e, formPages[0]?.id || 'default-page-id', 0);
      }}
    >
      <ScrollArea className="h-full">
        <div className="max-w-3xl mx-auto space-y-8">
          <WelcomePageEditor config={welcomePage} onChange={onWelcomePageChange} formStyles={formStyles} />

          {formPages.map((page, pageIndex) => {
            const fieldsForThisPage = fields.filter(f => f.pageId === page.id);
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === formPages.length - 1;

            return (
              <div key={page.id} ref={pageRefs.current[page.id]} className="scroll-mt-4">
                <div className="mb-3 text-sm font-medium text-muted-foreground">
                  Page {pageIndex + 1}: {page.title}
                </div>
                <div 
                  className="bg-card rounded-lg shadow-xl p-6 md:p-10 min-h-[calc(100vh-400px)]"
                  style={{ backgroundColor: formStyles.formColor }}
                  onDragOver={handleDragOver}
                >
                  {pageIndex === 0 && formStyles.logoUrl && (
                    <div className={cn("flex w-full mb-6", {
                      'justify-start': formStyles.logoAlignment === 'left',
                      'justify-center': formStyles.logoAlignment === 'center',
                      'justify-end': formStyles.logoAlignment === 'right',
                    })}>
                      <Image
                        src={formStyles.logoUrl}
                        alt="Form Logo"
                        width={120}
                        height={60}
                        style={{ objectFit: 'contain' }}
                        className="max-h-[60px] rounded-md"
                      />
                    </div>
                  )}
                  {fieldsForThisPage.length === 0 ? (
                    <div onDrop={(e) => handleDrop(e, page.id, 0)} className="h-full">
                      <CanvasPlaceholder />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {fieldsForThisPage.map((field, index) => {
                        const isFirstOnPage = index === 0;
                        const isLastOnPage = index === fieldsForThisPage.length - 1;
                        const isStaticField = ['heading', 'paragraph'].includes(field.type);
                        
                        const labelInputStyle: React.CSSProperties = isStaticField
                          ? {
                              fontWeight: field.isBold ? 'bold' : formStyles.fontWeight as React.CSSProperties['fontWeight'],
                              fontStyle: field.isItalic ? 'italic' : 'normal',
                              textAlign: field.textAlign || 'left',
                              fontSize: field.fontSize ? `${field.fontSize}px` : (field.type === 'heading' ? '1.5rem' : '1rem'),
                              color: field.type === 'heading' 
                                  ? (formStyles.headingColor || formStyles.questionsColor) 
                                  : (formStyles.paragraphColor || formStyles.answersColor),
                              fontFamily: formStyles.fontFamily,
                            }
                          : {
                              fontWeight: formStyles.fontWeight as React.CSSProperties['fontWeight'],
                              color: (theme === 'dark' && formStyles.questionsColor === DEFAULT_QUESTIONS_COLOR_HEX_CANVAS)
                                      ? 'hsl(var(--foreground))' 
                                      : formStyles.questionsColor,
                              backgroundColor: 'transparent',
                              fontFamily: formStyles.fontFamily,
                            };
                            
                        return (
                          <div key={field.instanceId}>
                             <DropZone onDrop={(e) => handleDrop(e, page.id, index)} isVisible={isDraggingOver} />
                            <div
                              className={cn(
                                "p-3 bg-card border border-input rounded-md transition-shadow focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
                              )}
                              draggable={true}
                              onDragStart={(e) => handleDragStartExistingField(e, field.instanceId)}
                              onDragEnd={handleDragEnd}
                              tabIndex={0}
                            >
                               <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center flex-grow pt-1">
                                  {isStaticField ? (
                                    field.type === 'heading' ? 
                                    <Heading1 className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" /> : 
                                    <Pilcrow className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                                  ) : (
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mr-2 flex-shrink-0" />
                                  )}
                                  {renderEditableField(field, labelInputStyle)}
                                </div>
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 border border-input hover:bg-muted/20" onClick={(e) => { e.stopPropagation(); onMoveField(field.instanceId, 'up');}} aria-label="Move field up" disabled={isFirstOnPage}>
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 border border-input hover:bg-muted/20" onClick={(e) => { e.stopPropagation(); onMoveField(field.instanceId, 'down');}} aria-label="Move field down" disabled={isLastOnPage}>
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 border border-input hover:bg-muted/20" onClick={(e) => handleOpenSettings(field, e)} aria-label="Field settings">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 border border-input hover:bg-muted/20" onClick={(e) => { e.stopPropagation(); onDuplicateField(field.instanceId);}} aria-label="Duplicate field">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 border border-input text-destructive hover:bg-muted/20" onClick={(e) => { e.stopPropagation(); onDeleteField(field.instanceId);}} aria-label="Delete field">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className={cn("pl-7")}>
                                {renderFieldPreview(field)}
                              </div>
                            </div>
                           </div>
                        );
                      })}
                      <DropZone onDrop={(e) => handleDrop(e, page.id, fieldsForThisPage.length)} isVisible={isDraggingOver} />
                    </div>
                  )}
                  {fieldsForThisPage.length > 0 && isLastPage && (
                    <div className={cn(
                        "mt-8 flex items-center",
                        (formStyles.showBackButton && !isFirstPage) ? "justify-between" : "justify-end"
                    )}>
                      {formStyles.showBackButton && !isFirstPage && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                             if(pageIndex > 0) scrollToPage(formPages[pageIndex - 1].id);
                          }}
                          style={{
                              backgroundColor: 'transparent',
                              borderColor: formStyles.mainColor,
                              color: formStyles.mainColor,
                              borderRadius: formStyles.buttonBorderType === 'circle' ? '9999px' : (formStyles.buttonBorderType === 'rounded' ? '0.375rem' : '0px'),
                          }}
                          className="hover:bg-primary/10"
                        >
                          {formStyles.showButtonArrows && <ArrowLeft className="mr-2 h-4 w-4" />} Back
                        </Button>
                      )}
                      
                        <Button
                          type="button"
                          variant="default"
                          disabled
                          className="hover:opacity-90 cursor-not-allowed"
                          style={{
                              backgroundColor: formStyles.mainColor,
                              color: formStyles.inputsBackground || '#FFFFFF',
                              borderRadius: formStyles.buttonBorderType === 'circle' ? '9999px' : (formStyles.buttonBorderType === 'rounded' ? '0.375rem' : '0px'),
                          }}
                        >
                          Submit
                        </Button>
                      
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <EndingPageEditor config={endingPage} onChange={onEndingPageChange} formStyles={formStyles} />

        </div>
      </ScrollArea>
       {editingField && popoverAnchor && (
        <FieldSettingsPopover
          field={editingField}
          anchorEl={popoverAnchor}
          onClose={handleCloseSettings}
          onSave={handleSaveSettings}
        />
      )}
    </main>
  );
}
