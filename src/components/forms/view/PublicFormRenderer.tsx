

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import SignatureCanvas from 'react-signature-canvas';
import type { SignatureCanvasProps } from 'react-signature-canvas'; // Import props type
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FormFieldInstance, FormStyles, FormPage, WelcomePageConfig, EndingPageConfig } from '@/components/dashboard/forms/builder/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, ArrowLeft, ArrowRight, X as XIcon, Loader2, PartyPopper, AlertTriangle, Image as ImageIcon, Zap, FileText, Star, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { createSubmission } from '@/lib/services/submissionService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Country, State } from 'country-state-city';
import type { ICountry, IState } from 'country-state-city';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AnimatedCheckmark } from '@/components/icons/AnimatedCheckmark';
import '@/styles/animated-checkmark.css';
import { Timestamp } from 'firebase/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, type UploadTask } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_QUESTIONS_COLOR_HEX = '#1F2937';
const DEFAULT_ANSWERS_COLOR_HEX = '#374151';

// Helper function to convert HEX to HSL string for CSS variables
function hexToHsl(hex: string): string | null {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    return null;
  }
  let c = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  const colorInt = parseInt('0x' + c.join(''));
  let r = (colorInt >> 16) & 255;
  let g = (colorInt >> 8) & 255;
  let b = colorInt & 255;

  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const NameInput = ({ field, formStyles, value, onChange }: { field: FormFieldInstance; formStyles: FormStyles; value: Record<string, any>; onChange: (value: Record<string, any>) => void; }) => {
    const handleInputChange = (part: 'firstName' | 'middleName' | 'lastName', val: string) => {
        onChange({ ...value, [part]: val });
    };

    const commonInputStyling: React.CSSProperties = {
      backgroundColor: formStyles.inputsBackground,
      borderColor: formStyles.inputsBorderColor,
      color: formStyles.answersColor,
      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
      fontFamily: formStyles.fontFamily,
      accentColor: formStyles.mainColor,
      fontSize: formStyles.answerFontSize ? `${formStyles.answerFontSize}px` : undefined,
    };
    const mainColorHsl = hexToHsl(formStyles.mainColor);
    const primaryColorStyle = mainColorHsl ? { '--primary': mainColorHsl, '--ring': mainColorHsl } as React.CSSProperties : {};
    
    const nameParts = [
        field.showFirstName && { key: 'firstName', placeholder: field.firstNamePlaceholder || 'First Name', label: 'First Name', required: field.isRequired },
        field.showMiddleName && { key: 'middleName', placeholder: field.middleNamePlaceholder || 'Middle Name', label: 'Middle Name', required: false },
        field.showLastName && { key: 'lastName', placeholder: field.lastNamePlaceholder || 'Last Name', label: 'Last Name', required: field.isRequired },
    ].filter(Boolean) as { key: 'firstName' | 'middleName' | 'lastName'; placeholder: string; label: string, required: boolean | undefined }[];

    return (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${nameParts.length}, 1fr)` }}>
            {nameParts.map(part => (
                <div key={part.key} className="space-y-1">
                    <Label htmlFor={`${field.instanceId}-${part.key}`} className="text-xs" style={{ fontFamily: formStyles.fontFamily, color: formStyles.questionsColor, opacity: 0.8 }}>{part.label}</Label>
                    <Input
                        id={`${field.instanceId}-${part.key}`}
                        type="text"
                        placeholder={part.placeholder}
                        value={value[part.key] || ''}
                        onChange={(e) => handleInputChange(part.key, e.target.value)}
                        required={part.required}
                        className="mt-1"
                        style={{ ...commonInputStyling, ...primaryColorStyle }}
                    />
                </div>
            ))}
        </div>
    );
};

const AddressInput = ({ field, formStyles, value, onChange }: { field: FormFieldInstance; formStyles: FormStyles; value: Record<string, any>; onChange: (value: Record<string, any>) => void; }) => {
    const allCountries = Country.getAllCountries();
    const [states, setStates] = useState<IState[]>([]);

    useEffect(() => {
        if (value.country?.isoCode) {
            setStates(State.getStatesOfCountry(value.country.isoCode));
        } else {
            setStates([]);
        }
    }, [value.country]);

    const handleInputChange = (subFieldName: string, subFieldValue: any) => {
        onChange({ ...value, [subFieldName]: subFieldValue });
    };

    const commonInputStyling: React.CSSProperties = {
      backgroundColor: formStyles.inputsBackground,
      borderColor: formStyles.inputsBorderColor,
      color: formStyles.answersColor,
      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
      fontFamily: formStyles.fontFamily,
      accentColor: formStyles.mainColor,
      fontSize: formStyles.answerFontSize ? `${formStyles.answerFontSize}px` : undefined,
    };
    const mainColorHsl = hexToHsl(formStyles.mainColor);
    const primaryColorStyle = mainColorHsl ? { '--primary': mainColorHsl, '--ring': mainColorHsl } as React.CSSProperties : {};

    return (
        <div className="space-y-3">
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: formStyles.answersColor, opacity: 0.6 }} />
                <Input
                    type="text"
                    placeholder={field.placeholder || "Address Line 1"}
                    value={value.address1 || ''}
                    onChange={(e) => handleInputChange('address1', e.target.value)}
                    required={field.isRequired}
                    className="pl-10"
                    style={{...commonInputStyling, ...primaryColorStyle}}
                />
            </div>
            {field.showAddressLine2 && (
                <Input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={value.address2 || ''}
                    onChange={(e) => handleInputChange('address2', e.target.value)}
                    style={{...commonInputStyling, ...primaryColorStyle}}
                />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field.showCity && (
                    <Input
                        type="text"
                        placeholder="City"
                        value={value.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required={field.isRequired}
                        style={{...commonInputStyling, ...primaryColorStyle}}
                    />
                )}
                {field.showZipCode && (
                    <Input
                        type="text"
                        placeholder="Zip / Postal Code"
                        value={value.zip || ''}
                        onChange={(e) => handleInputChange('zip', e.target.value)}
                        required={field.isRequired}
                        style={{...commonInputStyling, ...primaryColorStyle}}
                    />
                )}
            </div>
            {field.showState && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                        value={value.country?.isoCode}
                        onValueChange={(isoCode) => {
                            const country = allCountries.find(c => c.isoCode === isoCode);
                            // Combine state updates to avoid using stale `value` from closure
                            onChange({ ...value, country: country, state: undefined });
                        }}
                        required={field.isRequired}
                    >
                        <SelectTrigger className="w-full" style={{...commonInputStyling, ...primaryColorStyle}}>
                            <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent style={{fontFamily: formStyles.fontFamily}}>
                            {allCountries.map(country => (
                                <SelectItem key={country.isoCode} value={country.isoCode} style={{fontSize: formStyles.optionFontSize ? `${formStyles.optionFontSize}px` : undefined}} className="focus:bg-muted/20 focus:text-foreground">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{country.flag}</span>
                                        <span>{country.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={value.state?.isoCode}
                        onValueChange={(isoCode) => {
                            const state = states.find(s => s.isoCode === isoCode);
                            handleInputChange('state', state);
                        }}
                        disabled={!value.country || states.length === 0}
                        required={field.isRequired}
                    >
                        <SelectTrigger className="w-full" style={{...commonInputStyling, ...primaryColorStyle}}>
                            <SelectValue placeholder="State / Province" />
                        </SelectTrigger>
                        <SelectContent style={{fontFamily: formStyles.fontFamily}}>
                            {states.map(state => (
                                <SelectItem key={state.isoCode} value={state.isoCode} style={{fontSize: formStyles.optionFontSize ? `${formStyles.optionFontSize}px` : undefined}} className="focus:bg-muted/20 focus:text-foreground">{state.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
};


const DobInput = ({ field, formStyles, value, onChange, questionStyle }: { field: FormFieldInstance; formStyles: FormStyles; value: { day: string; month: string; year: string; }; onChange: (value: { day: string; month: string; year: string; }) => void; questionStyle: React.CSSProperties; }) => {
    const commonInputStyling: React.CSSProperties = {
      backgroundColor: formStyles.inputsBackground,
      borderColor: formStyles.inputsBorderColor,
      color: formStyles.answersColor,
      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
      fontFamily: formStyles.fontFamily,
      accentColor: formStyles.mainColor,
      fontSize: formStyles.answerFontSize ? `${formStyles.answerFontSize}px` : undefined,
    };
    const mainColorHsl = hexToHsl(formStyles.mainColor);
    const primaryColorStyle = mainColorHsl ? { '--primary': mainColorHsl, '--ring': mainColorHsl } as React.CSSProperties : {};
    
    const months = [
        { label: 'January', value: '01' }, { label: 'February', value: '02' }, { label: 'March', value: '03' },
        { label: 'April', value: '04' }, { label: 'May', value: '05' }, { label: 'June', value: '06' },
        { label: 'July', value: '07' }, { label: 'August', value: '08' }, { label: 'September', value: '09' },
        { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' },
    ];

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const day = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
        
        if (day === '') {
            onChange({ ...value, day: '' });
            return;
        }
        
        if (day === '0') {
            onChange({ ...value, day });
            return;
        }
        
        const num = parseInt(day, 10);
        
        if (num >= 1 && num <= 31) {
            onChange({ ...value, day });
        }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const year = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        onChange({ ...value, year });
    };

    return (
        <div className="flex gap-3">
            <div className="flex-1 space-y-1">
                <Label htmlFor={`${field.instanceId}-day`} className="text-xs" style={{...questionStyle, fontSize: '0.75rem'}}>Day</Label>
                <Input
                    id={`${field.instanceId}-day`}
                    type="text"
                    pattern="[0-9]*"
                    placeholder="DD"
                    value={value.day}
                    onChange={handleDayChange}
                    maxLength={2}
                    className="mt-1"
                    style={{...commonInputStyling, ...primaryColorStyle}}
                    required={field.isRequired}
                />
            </div>
            <div className="flex-[1.5] space-y-1">
                <Label htmlFor={`${field.instanceId}-month`} className="text-xs" style={{...questionStyle, fontSize: '0.75rem'}}>Month</Label>
                 <Select
                    value={value.month}
                    onValueChange={(month) => onChange({ ...value, month: month })}
                    required={field.isRequired}
                >
                    <SelectTrigger id={`${field.instanceId}-month`} className="w-full mt-1" style={{...commonInputStyling, ...primaryColorStyle}}>
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent style={{fontFamily: formStyles.fontFamily}}>
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value} style={{fontSize: formStyles.optionFontSize ? `${formStyles.optionFontSize}px` : undefined}} className="focus:bg-muted/20 focus:text-foreground">{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1 space-y-1">
                <Label htmlFor={`${field.instanceId}-year`} className="text-xs" style={{...questionStyle, fontSize: '0.75rem'}}>Year</Label>
                <Input
                    id={`${field.instanceId}-year`}
                    type="text"
                    pattern="[0-9]*"
                    placeholder="YYYY"
                    value={value.year}
                    onChange={handleYearChange}
                    maxLength={4}
                    className="mt-1"
                    style={{...commonInputStyling, ...primaryColorStyle}}
                    required={field.isRequired}
                />
            </div>
        </div>
    );
};


const StarRatingInput = ({ field, formStyles, value, onChange }: { field: FormFieldInstance; formStyles: FormStyles; value: number; onChange: (value: number) => void; }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const maxRating = field.maxRating || 5;

  const handleRatingClick = (newRating: number) => {
    const finalRating = value === newRating ? 0 : newRating;
    onChange(finalRating);
  };

  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= (hoverRating || value);
    stars.push(
      <Star
        key={i}
        className="h-8 w-8 cursor-pointer transition-colors"
        onClick={() => handleRatingClick(i)}
        onMouseEnter={() => setHoverRating(i)}
        onMouseLeave={() => setHoverRating(0)}
        style={{
          fill: isFilled ? formStyles.mainColor : 'transparent',
          stroke: formStyles.mainColor,
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {stars}
        {(hoverRating || value) > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
               style={{ backgroundColor: formStyles.mainColor, color: formStyles.inputsBackground || '#fff' }}>
            {hoverRating || value}
          </div>
        )}
      </div>
      <input type="hidden" name={field.instanceId} value={value || ''} required={field.isRequired} readOnly />
    </div>
  );
};

const ScaleRatingInput = ({ field, formStyles, value, onChange, questionStyle }: { field: FormFieldInstance; formStyles: FormStyles; value: number | null; onChange: (value: number | null) => void; questionStyle: React.CSSProperties; }) => {
  const maxRating = field.maxRating || 10;

  const handleSelect = (selectedValue: number) => {
    const newValue = value === selectedValue ? null : selectedValue;
    onChange(newValue);
  };

  const commonBoxStyling: React.CSSProperties = {
    fontFamily: formStyles.fontFamily,
    borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
  };

  return (
    <div className="inline-block">
      <div className="flex flex-wrap gap-2">
        {[...Array(maxRating)].map((_, i) => {
          const ratingValue = i + 1;
          const isSelected = value === ratingValue;
          return (
            <Button
              key={ratingValue}
              type="button"
              variant={isSelected ? "default" : "outline"}
              onClick={() => handleSelect(ratingValue)}
              className="h-10 w-10 flex-shrink-0"
              style={{
                ...commonBoxStyling,
                backgroundColor: isSelected ? formStyles.mainColor : formStyles.inputsBackground,
                borderColor: formStyles.inputsBorderColor,
                color: isSelected ? formStyles.inputsBackground : formStyles.answersColor,
              }}
            >
              {ratingValue}
            </Button>
          );
        })}
      </div>
       <div className="flex justify-between mt-2 px-1">
        <span className="text-xs" style={{ ...questionStyle, fontSize: '0.75rem' }}>
          {field.minRatingLabel || 'Worst'}
        </span>
        <span className="text-xs" style={{ ...questionStyle, fontSize: '0.75rem' }}>
          {field.maxRatingLabel || 'Best'}
        </span>
      </div>
      <input
        type="number"
        name={field.instanceId}
        value={value ?? ''}
        required={field.isRequired}
        className="sr-only"
        readOnly
      />
    </div>
  );
};


const CountrySelectInput = ({ field, formStyles, value, onChange }: { field: FormFieldInstance; formStyles: FormStyles; value: { country?: ICountry; state?: IState }; onChange: (value: { country?: ICountry; state?: IState }) => void; }) => {
    const allCountries = Country.getAllCountries();
    const [statesOfSelectedCountry, setStatesOfSelectedCountry] = useState<IState[]>([]);

    useEffect(() => {
        if (value.country?.isoCode) {
            setStatesOfSelectedCountry(State.getStatesOfCountry(value.country.isoCode));
        } else {
            setStatesOfSelectedCountry([]);
        }
    }, [value.country]);

    const commonInputStyling: React.CSSProperties = {
      backgroundColor: formStyles.inputsBackground,
      borderColor: formStyles.inputsBorderColor,
      color: formStyles.answersColor,
      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
      fontFamily: formStyles.fontFamily,
      accentColor: formStyles.mainColor,
      fontSize: formStyles.answerFontSize ? `${formStyles.answerFontSize}px` : undefined,
    };
    const mainColorHsl = hexToHsl(formStyles.mainColor);
    const primaryColorStyle = mainColorHsl ? { '--primary': mainColorHsl, '--ring': mainColorHsl } as React.CSSProperties : {};

    const combinedValue = value?.country ? (value.state ? `${value.country.name}, ${value.state.name}` : value.country.name) : '';

    return (
        <>
            <div className="grid gap-2" style={{ gridTemplateColumns: field.enableStateSelection ? '1fr 1fr' : '1fr' }}>
                <Select
                    value={value.country?.isoCode}
                    onValueChange={(isoCode) => {
                        const country = allCountries.find(c => c.isoCode === isoCode);
                        onChange({ country: country, state: undefined });
                    }}
                    required={field.isRequired}
                >
                    <SelectTrigger className="w-full" style={{ ...commonInputStyling, ...primaryColorStyle }}>
                        <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent style={{ fontFamily: formStyles.fontFamily }}>
                        {allCountries.map(country => (
                            <SelectItem key={country.isoCode} value={country.isoCode} style={{ fontSize: formStyles.optionFontSize ? `${formStyles.optionFontSize}px` : undefined }} className="focus:bg-muted/20 focus:text-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{country.flag}</span>
                                    <span>{country.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {field.enableStateSelection && (
                    <Select
                        value={value.state?.isoCode}
                        onValueChange={(isoCode) => {
                            const state = statesOfSelectedCountry.find(s => s.isoCode === isoCode);
                            onChange({ ...value, state: state });
                        }}
                        disabled={!value.country || statesOfSelectedCountry.length === 0}
                        required={field.isRequired}
                    >
                        <SelectTrigger className="w-full" style={{ ...commonInputStyling, ...primaryColorStyle }}>
                            <SelectValue placeholder="State / Province" />
                        </SelectTrigger>
                        <SelectContent style={{ fontFamily: formStyles.fontFamily }}>
                            {statesOfSelectedCountry.map(state => (
                                <SelectItem key={state.isoCode} value={state.isoCode} style={{ fontSize: formStyles.optionFontSize ? `${formStyles.optionFontSize}px` : undefined }} className="focus:bg-muted/20 focus:text-foreground">{state.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <input type="text" className="sr-only" name={field.instanceId} value={combinedValue} readOnly />
        </>
    );
};

const mimeTypeMap: { [key: string]: string } = {
  // Documents
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  TXT: 'text/plain',
  RTF: 'application/rtf',
  // Images
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
};

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const FileUploadInput = ({ field, formId, formStyles, value, onChange, submissionId }: { field: FormFieldInstance; formId: string, formStyles: FormStyles; value: string | undefined; onChange: (value: string | undefined) => void; submissionId: string }) => {
    const { toast } = useToast();
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTaskRef = useRef<UploadTask | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadComplete, setUploadComplete] = useState(false);

    const commonInputStyling: React.CSSProperties = {
      backgroundColor: formStyles.inputsBackground,
      borderColor: formStyles.inputsBorderColor,
      color: formStyles.answersColor,
      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
      fontFamily: formStyles.fontFamily,
    };
    
    const acceptedMimeTypes = (field.fileTypes || []).map(type => mimeTypeMap[type.toUpperCase()]).filter(Boolean);
    const isImageUpload = field.id === 'image-upload';

    useEffect(() => {
        setUploadComplete(!!value);
        if (isImageUpload && value) {
            setImagePreview(value);
        }
    }, [value, isImageUpload]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (acceptedMimeTypes.length > 0 && !acceptedMimeTypes.includes(file.type)) {
                setError(`Invalid file type. Please upload one of: ${field.fileTypes?.join(', ')}`);
                setFileToUpload(null);
                setImagePreview(null);
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File is too large. Maximum size is 5MB.');
                setFileToUpload(null);
                setImagePreview(null);
                return;
            }
            setError(null);
            setFileToUpload(file);
            if (isImageUpload) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result as string);
                reader.readAsDataURL(file);
            }
        }
    };
    
    useEffect(() => {
        if (fileToUpload) {
            handleUpload();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileToUpload]);


    const handleUpload = async () => {
        if (!fileToUpload || !submissionId) return;

        setIsUploading(true);
        setError(null);
        
        try {
            const uniqueFileName = `${Date.now()}-${uuidv4()}-${fileToUpload.name}`;
            const storagePath = `submissions/${formId}/${submissionId}/${uniqueFileName}`;
            const storageRef = ref(storage, storagePath);
            
            const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
            uploadTaskRef.current = uploadTask;

            uploadTask.on('state_changed',
              () => {},
              (error) => {
                console.error("Upload failed:", error);
                setError("Upload failed. Please try again.");
                toast({
                    title: "Upload Failed",
                    description: "There was an error uploading your file.",
                    variant: "destructive",
                });
                setIsUploading(false);
                setFileToUpload(null);
                setImagePreview(null);
              },
              () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                  onChange(downloadURL);
                  setIsUploading(false);
                  uploadTaskRef.current = null;
                  setUploadComplete(true);
                });
              }
            );
            
        } catch (err) {
            console.error("Upload failed:", err);
            setError("Upload failed. Please try again.");
            toast({
                title: "Upload Failed",
                description: "There was an error uploading your file.",
                variant: "destructive",
            });
            setIsUploading(false);
            setFileToUpload(null);
            setImagePreview(null);
        }
    };
    
    const handleRemoveFile = () => {
        if (uploadTaskRef.current) {
            uploadTaskRef.current.cancel();
        }
        setIsUploading(false);
        setFileToUpload(null);
        setImagePreview(null);
        setError(null);
        setUploadComplete(false);
        onChange(undefined);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    }
    
    // UI Logic
    if (isUploading && fileToUpload) {
      if (isImageUpload && imagePreview) {
        return (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border" style={{ borderColor: formStyles.inputsBorderColor }}>
            <Image src={imagePreview} alt="Uploading preview" layout="fill" objectFit="cover" data-ai-hint="image preview"/>
            <div className="absolute inset-0 bg-black/60 text-white p-4 flex flex-col justify-between">
              <div>
                <p className="font-medium truncate">{fileToUpload.name}</p>
                <p className="text-sm opacity-80">{formatBytes(fileToUpload.size)}</p>
              </div>
              <div className="flex items-center justify-end text-right cursor-pointer" onClick={handleRemoveFile}>
                <div className="text-right mr-2">
                    <p className="font-medium">Uploading</p>
                    <p className="text-xs opacity-80">tap to cancel</p>
                </div>
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </div>
          </div>
        )
      }
      return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700 text-white" style={commonInputStyling}>
            <div>
                <p className="font-medium truncate">{fileToUpload.name}</p>
                <p className="text-sm opacity-80">{formatBytes(fileToUpload.size)}</p>
            </div>
            <div className="flex items-center justify-end text-right cursor-pointer" onClick={handleRemoveFile}>
                <div className="text-right mr-2">
                    <p className="font-medium">Uploading</p>
                    <p className="text-xs opacity-80">tap to cancel</p>
                </div>
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        </div>
      );
    }
    
    if (uploadComplete && value) {
        if (isImageUpload && imagePreview) {
            return (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border" style={{ borderColor: formStyles.inputsBorderColor }}>
                    <Image src={imagePreview} alt="Uploaded image" layout="fill" objectFit="cover" data-ai-hint="uploaded image"/>
                    <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 text-white rounded-full p-1 pr-3">
                         <button onClick={handleRemoveFile} className="h-6 w-6 rounded-full bg-black/70 hover:bg-black flex items-center justify-center">
                            <XIcon className="h-4 w-4"/>
                        </button>
                        <div>
                             <p className="font-medium text-sm leading-tight truncate max-w-[150px]">{fileToUpload?.name || 'Image'}</p>
                             {fileToUpload && <p className="text-xs opacity-80 leading-tight">{formatBytes(fileToUpload.size)}</p>}
                        </div>
                    </div>
                </div>
            );
        }
        return (
             <div className="flex items-center gap-2 p-2 mt-2 rounded-md" style={{backgroundColor: '#374151'}}>
                <button onClick={handleRemoveFile} className="h-6 w-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center flex-shrink-0">
                    <XIcon className="h-4 w-4 text-white"/>
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{fileToUpload?.name || 'File Uploaded'}</p>
                    {fileToUpload && <p className="text-xs text-gray-300">{formatBytes(fileToUpload.size)}</p>}
                </div>
             </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    "w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    error ? "border-destructive" : "hover:border-primary"
                )}
                style={commonInputStyling}
                onClick={() => fileInputRef.current?.click()}
            >
                <UploadCloud className="h-10 w-10 text-muted-foreground/70" />
                <p className="mt-2 text-sm text-center" style={{ color: formStyles.answersColor }}>
                    Drag & Drop or <span style={{ color: formStyles.mainColor, textDecoration: 'underline' }}>Browse</span>
                </p>
                <p className="text-xs mt-1" style={{ color: formStyles.answersColor, opacity: 0.6 }}>
                    Max file size: 5MB
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept={acceptedMimeTypes.join(',')}
                    required={field.isRequired && !value}
                />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            <input type="text" className="sr-only" name={field.instanceId} value={value || ''} required={field.isRequired} readOnly/>
        </div>
    );
};


interface PublicFormRendererProps {
  formId: string;
  formName: string;
  fields: FormFieldInstance[];
  formStyles: FormStyles;
  welcomePage: WelcomePageConfig;
  endingPage?: EndingPageConfig;
  formPages: FormPage[];
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  totalPages: number;
  progressPercentage: number;
}


export function PublicFormRenderer({
  formId,
  formName,
  fields,
  formStyles,
  welcomePage,
  endingPage,
  formPages,
  currentPage,
  onNextPage,
  onPrevPage,
  totalPages,
  progressPercentage
}: PublicFormRendererProps) {
  const { theme } = useTheme();
  const signaturePadRef = useRef<SignatureCanvasProps & { clear: () => void; getTrimmedCanvas: () => HTMLCanvasElement, isEmpty: () => boolean } | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [signatureError, setSignatureError] = useState(false);
  const [animationClass, setAnimationClass] = useState('animate-fade-in');
  const [controlledFieldValues, setControlledFieldValues] = useState<Record<string, any>>({});
  const [termsModalData, setTermsModalData] = useState<{ title: string; content: string } | null>(null);
  
  // Create a stable, unique ID for this submission session
  const [submissionId] = useState(() => uuidv4());

  useEffect(() => {
    const font = formStyles.fontFamily;
    if (font) {
      const linkId = 'google-font-dynamic-link';
      let linkElement = document.getElementById(linkId) as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.id = linkId;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }
      linkElement.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
    }
  }, [formStyles.fontFamily]);

  const handleControlledValueChange = (fieldId: string, value: any) => {
    setControlledFieldValues(prev => ({...prev, [fieldId]: value}));
  };

  useEffect(() => {
    const transitionMap = {
      'None': '',
      'Slide Up': 'animate-slide-up',
      'Slide Down': 'animate-slide-down',
      'Fade In': 'animate-fade-in',
      'Bounce In': 'animate-bounce-in',
      'blur': 'animate-blur-in',
      'Scale In': 'animate-scale-in',
      'Swipe': 'animate-swipe-in'
    };
    
    const animation = transitionMap[formStyles.transitionType || 'Fade In'] || 'animate-fade-in';
    setAnimationClass(animation);
  }, [currentPage, formStyles.transitionType]);


  const fieldsForCurrentPage = fields.filter(field => field.pageId === formPages[currentPage - 1]?.id);

  const validateCurrentPage = (): boolean => {
    if (!formRef.current) return false;
    setSignatureError(false);

    // Use a flag to track validity, allowing all fields to be checked
    let isPageValid = true;

    for (const field of fieldsForCurrentPage) {
        if (field.type === 'signature') {
            if (field.isRequired && signaturePadRef.current?.isEmpty()) {
                setSignatureError(true);
                isPageValid = false;
            }
        } else {
            // Leverage HTML5 validation for inputs inside the form
            const elements = formRef.current.elements.namedItem(field.instanceId);
            if (!elements) continue;
            
            const element = (elements instanceof RadioNodeList ? elements[0] : elements) as HTMLInputElement;

            if (element && typeof element.checkValidity === 'function' && !element.checkValidity()) {
                isPageValid = false; // Mark page as invalid but continue checking other fields
            }
        }
    }
    
    // If after checking all fields, the page is not valid, report validity to show browser messages.
    if (!isPageValid) {
        formRef.current.reportValidity();
    }
    
    return isPageValid;
  };

  const handleFinalSubmit = async () => {
    setSubmissionStatus('submitting');
    setSubmissionError(null);

    if (formId === 'preview-id') {
      setTimeout(() => setSubmissionStatus('success'), 500);
      return;
    }
    
    const submissionData = { ...controlledFieldValues, submissionId };

    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const signatureField = fields.find(f => f.type === 'signature');
      if (signatureField) {
        submissionData[signatureField.instanceId] = signaturePadRef.current.toDataURL();
      }
    }
    
    const result = await createSubmission(formId, submissionData, navigator.userAgent);

    if (result.success) {
      setSubmissionStatus('success');
    } else {
      setSubmissionStatus('error');
      setSubmissionError(result.error || 'An unknown error occurred.');
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };
  
  const handleNextPageClick = () => {
    if (validateCurrentPage()) {
      onNextPage();
    }
  };

  const renderLogo = () => {
    if (!formStyles.logoUrl) return null;
    const alignmentClass = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }[formStyles.logoAlignment || 'center'];

    return (
      <div className={cn("flex w-full px-6 md:px-8 pt-6", alignmentClass)}>
        <Image
          src={formStyles.logoUrl}
          alt={`${formName} Logo`}
          width={120}
          height={60}
          style={{ objectFit: 'contain' }}
          className="max-h-[60px] rounded-md"
        />
      </div>
    );
  };

  const getStaticFieldStyle = (field: FormFieldInstance): React.CSSProperties => ({
      color: (theme === 'dark' && formStyles.questionsColor === DEFAULT_QUESTIONS_COLOR_HEX)
             ? 'hsl(var(--foreground))'
             : formStyles.questionsColor,
      fontWeight: field.isBold ? 'bold' : formStyles.fontWeight as React.CSSProperties['fontWeight'],
      fontStyle: field.isItalic ? 'italic' : 'normal',
      textAlign: field.textAlign || 'left',
      fontSize: field.fontSize ? `${field.fontSize}px` : (field.type === 'heading' ? '1.5rem' : '1rem'),
      fontFamily: formStyles.fontFamily,
  });

  const renderFormField = (field: FormFieldInstance, index: number) => {
    const mainColorHsl = hexToHsl(formStyles.mainColor);
    const primaryColorStyle = mainColorHsl ? { '--primary': mainColorHsl, '--ring': mainColorHsl } as React.CSSProperties : {};

    const commonInputStyling: React.CSSProperties = {
      backgroundColor: formStyles.inputsBackground,
      borderColor: formStyles.inputsBorderColor,
      color: formStyles.answersColor,
      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
      fontFamily: formStyles.fontFamily,
      accentColor: formStyles.mainColor,
      fontSize: formStyles.answerFontSize ? `${formStyles.answerFontSize}px` : undefined,
    };

    const questionStyle: React.CSSProperties = {
      color: (theme === 'dark' && formStyles.questionsColor === DEFAULT_QUESTIONS_COLOR_HEX)
             ? 'hsl(var(--foreground))'
             : formStyles.questionsColor,
      fontWeight: formStyles.fontWeight as React.CSSProperties['fontWeight'],
      fontFamily: formStyles.fontFamily,
      fontSize: formStyles.labelFontSize ? `${formStyles.labelFontSize}px` : undefined,
    };

    const descriptionStyle: React.CSSProperties = {
        color: (theme === 'dark' && formStyles.answersColor === DEFAULT_ANSWERS_COLOR_HEX)
               ? 'hsl(var(--muted-foreground))'
               : formStyles.answersColor,
        fontFamily: formStyles.fontFamily,
        fontSize: formStyles.descriptionFontSize ? `${formStyles.descriptionFontSize}px` : undefined,
    };
    
    const optionStyle: React.CSSProperties = {
        ...descriptionStyle,
        color: formStyles.answersColor,
        fontSize: formStyles.optionFontSize ? `${formStyles.optionFontSize}px` : undefined,
    };

    const fieldNumber = formStyles.showFieldNumber ? `${index + 1}. ` : '';
    const controlledValue = controlledFieldValues[field.instanceId] || '';


    switch (field.type) {
      case 'heading':
        return <h2 className="text-2xl font-semibold break-words" style={{ ...getStaticFieldStyle(field), color: formStyles.headingColor || formStyles.questionsColor }}>{field.label || 'Heading'}</h2>;
      case 'paragraph':
        return <p className="text-base break-words" style={{ ...getStaticFieldStyle(field), color: formStyles.paragraphColor || formStyles.answersColor }}>{field.label || 'Paragraph text'}</p>;
      case 'tel':
        const phoneValue = controlledFieldValues[field.instanceId] as string | undefined;
        return (
          <div className="space-y-1">
            <Label htmlFor={field.instanceId} style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <PhoneInput
              id={field.instanceId}
              name={field.instanceId}
              placeholder={field.placeholder || "Enter phone number"}
              required={field.isRequired}
              international
              defaultCountry="US"
              value={phoneValue}
              onChange={(value) => handleControlledValueChange(field.instanceId, value)}
              style={{ ...commonInputStyling, accentColor: undefined, fontSize: undefined, ...primaryColorStyle }}
            />
          </div>
        );
      case 'name': {
          const nameValue = controlledFieldValues[field.instanceId] || { firstName: '', middleName: '', lastName: '' };
          return (
              <div className="space-y-1">
                  <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                  {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
                  <div className="mt-2">
                      <NameInput
                          field={field}
                          formStyles={formStyles}
                          value={nameValue}
                          onChange={(newValue) => handleControlledValueChange(field.instanceId, newValue)}
                      />
                  </div>
                  <input type="text" className="sr-only" name={field.instanceId} value={JSON.stringify(nameValue)} required={field.isRequired} readOnly aria-hidden="true" />
              </div>
          );
      }
      case 'text': case 'email': case 'number': case 'url':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.instanceId} style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <Input
              type={field.type}
              id={field.instanceId}
              name={field.instanceId}
              placeholder={field.placeholder}
              required={field.isRequired}
              style={{...commonInputStyling, ...primaryColorStyle}}
              maxLength={field.maxLength}
              value={controlledValue}
              onChange={(e) => handleControlledValueChange(field.instanceId, e.target.value)}
            />
            {field.showCharCount && field.maxLength && (
              <p className="text-xs text-right" style={{ color: formStyles.answersColor, opacity: 0.8 }}>
                {controlledValue.length} / {field.maxLength}
              </p>
            )}
          </div>
        );
      case 'address':
        const addressValue = controlledFieldValues[field.instanceId] || {};
        return (
            <div className="space-y-1">
                <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
                <div className="mt-2">
                    <AddressInput
                        field={field}
                        formStyles={formStyles}
                        value={addressValue}
                        onChange={(newValue) => handleControlledValueChange(field.instanceId, newValue)}
                    />
                </div>
                <input
                    type="text"
                    className="sr-only"
                    name={field.instanceId}
                    value={JSON.stringify(addressValue)}
                    required={field.isRequired}
                    readOnly
                    aria-hidden="true"
                />
            </div>
        );
      case 'date': {
        if (field.id === 'dob') {
            const dobValue = controlledFieldValues[field.instanceId] as { day: string; month: string; year: string; } || { day: '', month: '', year: '' };
            
            const combinedDateValue = (dobValue.year && dobValue.month && dobValue.day) 
                ? `${dobValue.year}-${String(dobValue.month).padStart(2, '0')}-${String(dobValue.day).padStart(2, '0')}`
                : '';
                
            return (
                 <div className="space-y-1">
                    <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                    {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
                    <div className="mt-2">
                        <DobInput
                            field={field}
                            formStyles={formStyles}
                            value={dobValue}
                            onChange={(newValue) => handleControlledValueChange(field.instanceId, newValue)}
                            questionStyle={questionStyle}
                        />
                    </div>
                    <input
                        type="date"
                        className="sr-only"
                        name={field.instanceId}
                        value={combinedDateValue}
                        required={field.isRequired}
                        readOnly
                        aria-hidden="true"
                    />
                </div>
            );
        }
        const dateValue = controlledFieldValues[field.instanceId] as Date | undefined;
        const calendarStyle = primaryColorStyle;
        return (
            <div className="space-y-1">
                <Label htmlFor={field.instanceId} style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateValue && "text-muted-foreground"
                            )}
                            style={{...commonInputStyling, ...primaryColorStyle}}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateValue ? format(dateValue, "PPP") : <span>{field.placeholder || 'Pick a date'}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateValue}
                            onSelect={(date) => handleControlledValueChange(field.instanceId, date)}
                            initialFocus
                            style={calendarStyle}
                        />
                    </PopoverContent>
                </Popover>
                <input
                    type="text"
                    className="sr-only"
                    name={field.instanceId}
                    value={dateValue ? dateValue.toISOString() : ''}
                    required={field.isRequired}
                    readOnly
                />
            </div>
        );
      }
      case 'time': {
        const timeValue = controlledFieldValues[field.instanceId] as { hour?: string; minute?: string; ampm?: 'AM' | 'PM' } || { ampm: 'AM' };
        const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
        const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
        const ampmOptions = ['AM', 'PM'];

        const combinedTimeValue = (timeValue.hour && timeValue.minute && timeValue.ampm)
          ? `${timeValue.hour}:${timeValue.minute} ${timeValue.ampm}`
          : '';

        return (
          <div className="space-y-1">
            <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <div
              className="flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              style={{
                borderColor: formStyles.inputsBorderColor,
                backgroundColor: formStyles.inputsBackground,
                borderRadius: commonInputStyling.borderRadius,
                ...primaryColorStyle
              }}
            >
              <Select
                value={timeValue.hour}
                onValueChange={(hour) => handleControlledValueChange(field.instanceId, { ...timeValue, hour })}
                required={field.isRequired}
              >
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map(h => <SelectItem key={h} value={h} className="focus:bg-muted/20 focus:text-foreground">{h}</SelectItem>)}
                </SelectContent>
              </Select>

              <span className="mx-1" style={{ color: formStyles.answersColor }}>:</span>

              <Select
                value={timeValue.minute}
                onValueChange={(minute) => handleControlledValueChange(field.instanceId, { ...timeValue, minute })}
                required={field.isRequired}
              >
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map(m => <SelectItem key={m} value={m} className="focus:bg-muted/20 focus:text-foreground">{m}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select
                value={timeValue.ampm || 'AM'}
                onValueChange={(ampm) => handleControlledValueChange(field.instanceId, { ...timeValue, ampm: ampm as 'AM' | 'PM' })}
                required={field.isRequired}
              >
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto ml-2">
                  <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                  {ampmOptions.map(val => <SelectItem key={val} value={val} className="focus:bg-muted/20 focus:text-foreground">{val}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <input type="text" className="sr-only" name={field.instanceId} value={combinedTimeValue} required={field.isRequired} readOnly />
          </div>
        );
      }
      case 'textarea':
        return (
          <div className="space-y-1">
            <Label htmlFor={field.instanceId} style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <Textarea
              id={field.instanceId}
              name={field.instanceId}
              placeholder={field.placeholder}
              required={field.isRequired}
              style={{...commonInputStyling, ...primaryColorStyle}}
              maxLength={field.maxLength}
              value={controlledValue}
              onChange={(e) => handleControlledValueChange(field.instanceId, e.target.value)}
            />
            {field.showCharCount && field.maxLength && (
              <p className="text-xs text-right" style={{ color: formStyles.answersColor, opacity: 0.8 }}>
                {controlledValue.length} / {field.maxLength}
              </p>
            )}
          </div>
        );
      case 'select':
        if (field.id === 'country') {
            const countryValue = controlledFieldValues[field.instanceId] || {};
            return (
                 <div className="space-y-1">
                    <Label htmlFor={field.instanceId} style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
                    {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
                    <CountrySelectInput field={field} formStyles={formStyles} value={countryValue} onChange={(value) => handleControlledValueChange(field.instanceId, value)} />
                </div>
            )
        }
        return (
          <div className="space-y-1">
            <Label htmlFor={field.instanceId} style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <Select
              name={field.instanceId}
              required={field.isRequired}
              value={controlledFieldValues[field.instanceId] || ''}
              onValueChange={(value) => handleControlledValueChange(field.instanceId, value)}
            >
              <SelectTrigger id={field.instanceId} className="w-full" style={{...commonInputStyling, ...primaryColorStyle}}>
                <SelectValue placeholder={field.placeholder || `Select...`} />
              </SelectTrigger>
              <SelectContent style={{fontFamily: formStyles.fontFamily}}>
                {(field.options || []).map(opt => (
                  <SelectItem key={opt.value} value={opt.value} style={{color: formStyles.answersColor, fontSize: formStyles.optionFontSize ? `${formStyles.optionFontSize}px` : undefined}} className="focus:bg-muted/20 focus:text-foreground">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'radio': {
        const radioLayoutClasses = {
            'one-column': 'grid-cols-1',
            'two-columns': 'sm:grid-cols-2',
            'three-columns': 'sm:grid-cols-3',
        }[field.layout || 'one-column'] || 'grid-cols-1';
        const selectedValue = controlledFieldValues[field.instanceId];
        return (
          <div className="space-y-1">
            <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <RadioGroup
              name={field.instanceId}
              required={field.isRequired}
              className={cn("mt-2 grid gap-2", radioLayoutClasses)}
              value={selectedValue}
              onValueChange={(value) => handleControlledValueChange(field.instanceId, value)}
              style={primaryColorStyle}
            >
              {(field.options || []).map(opt => {
                const isSelected = opt.value === selectedValue;
                return (
                  <Label
                    htmlFor={`${field.instanceId}-${opt.value}`}
                    key={opt.value}
                    className={cn("flex items-center space-x-3 p-3 rounded-md border transition-all duration-200 cursor-pointer", isSelected ? 'ring-2' : '')}
                    style={{
                      borderColor: isSelected ? formStyles.mainColor : formStyles.inputsBorderColor,
                      backgroundColor: isSelected ? hexToRgba(formStyles.mainColor, 0.1) : formStyles.inputsBackground,
                      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
                    }}
                  >
                    <RadioGroupItem value={opt.value} id={`${field.instanceId}-${opt.value}`} />
                    <span className="font-normal flex-1" style={optionStyle}>{opt.label}</span>
                  </Label>
                )
              })}
            </RadioGroup>
          </div>
        );
      }
      case 'checkbox': {
        const checkboxLayoutClasses = {
            'one-column': 'grid-cols-1',
            'two-columns': 'sm:grid-cols-2',
            'three-columns': 'sm:grid-cols-3',
        }[field.layout || 'one-column'] || 'grid-cols-1';
        const selectedValues = (controlledFieldValues[field.instanceId] || []) as string[];
        const limitReached = field.enableSelectionLimit && field.maxSelections !== undefined && selectedValues.length >= field.maxSelections;

        const handleCheckboxChange = (checked: boolean, optionValue: string) => {
          const newSelectedValues = checked
            ? [...selectedValues, optionValue]
            : selectedValues.filter((v) => v !== optionValue);
          handleControlledValueChange(field.instanceId, newSelectedValues);
        };

        return (
          <div className="space-y-1">
            <Label style={questionStyle}>
              {fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}
              {field.enableSelectionLimit && field.maxSelections && (
                <span className="text-xs font-normal ml-2" style={{ color: formStyles.answersColor, opacity: 0.8 }}>
                  (Select up to {field.maxSelections})
                </span>
              )}
            </Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <div className={cn("mt-2 grid gap-2", checkboxLayoutClasses)} role="group" style={primaryColorStyle}>
              {(field.options || []).map(opt => {
                const isChecked = selectedValues.includes(opt.value);
                const isDisabled = limitReached && !isChecked;

                return (
                  <Label
                    key={opt.value}
                    htmlFor={`${field.instanceId}-${opt.value}`}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-md border transition-all duration-200",
                      isChecked ? 'ring-2' : '',
                      isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    )}
                    style={{
                      borderColor: isChecked ? formStyles.mainColor : formStyles.inputsBorderColor,
                      backgroundColor: isChecked ? hexToRgba(formStyles.mainColor, 0.1) : formStyles.inputsBackground,
                      borderRadius: formStyles.inputBorderType === 'circle' ? '9999px' : (formStyles.inputBorderType === 'rounded' ? '0.375rem' : '0px'),
                    }}
                  >
                    <Checkbox
                      id={`${field.instanceId}-${opt.value}`}
                      name={field.instanceId}
                      value={opt.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheckboxChange(!!checked, opt.value)}
                      disabled={isDisabled}
                    />
                     <span className="font-normal flex-1" style={optionStyle}>
                      {opt.label}
                    </span>
                  </Label>
                );
              })}
            </div>
            {field.isRequired && (
              <input
                type="text"
                className="sr-only"
                value={selectedValues.length > 0 ? "filled" : ""}
                required
                tabIndex={-1}
                aria-hidden="true"
                onChange={() => {}}
              />
            )}
          </div>
        );
      }
      case 'file': {
        return (
          <div className="space-y-1">
            <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <FileUploadInput
                field={field}
                formId={formId}
                formStyles={formStyles}
                value={controlledFieldValues[field.instanceId]}
                onChange={(url) => handleControlledValueChange(field.instanceId, url)}
                submissionId={submissionId}
            />
          </div>
        );
      }
      case 'signature':
        return (
          <div className="space-y-2">
            <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <div
              className={cn(
                "relative border rounded-md overflow-hidden transition-all",
                signatureError && "border-destructive ring-1 ring-destructive"
              )}
              style={{
                borderColor: formStyles.inputsBorderColor,
                borderRadius: commonInputStyling.borderRadius
              }}
            >
              <SignatureCanvas
                ref={(ref) => { signaturePadRef.current = ref as any; }}
                penColor={formStyles.answersColor || DEFAULT_ANSWERS_COLOR_HEX}
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'sigCanvas w-full',
                  style: {
                    backgroundColor: formStyles.inputsBackground,
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSignature}
                className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Clear signature"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            {signatureError && <p className="text-xs text-destructive mt-1">This field is required.</p>}
          </div>
        );
      case 'terms': {
        const handleLinkClick = (e: React.MouseEvent) => {
            if (field.linkType === 'on-page') {
              e.preventDefault();
              setTermsModalData({
                title: field.linkText || 'Terms and Conditions',
                content: field.termsContent || 'No terms provided.'
              });
            }
        };
        const checkboxStyle = primaryColorStyle;

        return (
            <div className="flex items-start space-x-2.5 mt-1 p-2 rounded-md border" style={{borderColor: formStyles.inputsBorderColor, backgroundColor: formStyles.inputsBackground}}>
                <Checkbox 
                  id={`${field.instanceId}-terms`} 
                  name={field.instanceId} 
                  required={field.isRequired}
                  checked={!!controlledFieldValues[field.instanceId]}
                  onCheckedChange={(checked) => handleControlledValueChange(field.instanceId, checked)}
                  style={{...checkboxStyle, '--main-color': formStyles.mainColor, '--ring': hexToHsl(formStyles.mainColor)} as any} 
                  className="mt-0.5"
                />
                <Label htmlFor={`${field.instanceId}-terms`} className="text-sm font-normal flex-1 cursor-pointer" style={optionStyle}>
                    {field.label || 'I agree to'}{' '}
                    <a
                      href={field.redirectUrl || '#'}
                      target={field.linkType === 'redirect' ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      onClick={handleLinkClick}
                      className="underline hover:no-underline"
                      style={{ color: formStyles.mainColor }}
                    >
                      {field.linkText || 'terms and conditions'}
                    </a>
                    {field.isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
            </div>
        );
      }
       case 'rating':
        return (
          <div className="space-y-1">
            <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <StarRatingInput field={field} formStyles={formStyles} value={controlledFieldValues[field.instanceId] || 0} onChange={(value) => handleControlledValueChange(field.instanceId, value)} />
          </div>
        );
      case 'scale':
        return (
          <div className="space-y-1">
              <Label style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
              {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <div className="mt-2">
              <ScaleRatingInput field={field} formStyles={formStyles} value={controlledFieldValues[field.instanceId] || null} onChange={(value) => handleControlledValueChange(field.instanceId, value)} questionStyle={questionStyle}/>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <Label htmlFor={field.instanceId} style={questionStyle}>{fieldNumber}{field.label}{field.isRequired && <span className="text-destructive ml-1">*</span>}</Label>
            {field.description && <p className="text-sm text-muted-foreground" style={descriptionStyle}>{field.description}</p>}
            <Input id={field.instanceId} name={field.instanceId} type="text" placeholder={`Preview for ${field.name}`} style={{...commonInputStyling, ...primaryColorStyle}} />
          </div>
        );
    }
  };

  const mainColorHsl = hexToHsl(formStyles.mainColor);

  const mainPageStyle: React.CSSProperties = {
    backgroundColor: formStyles.backgroundColor,
    fontFamily: formStyles.fontFamily,
    ...(mainColorHsl && { '--ring': mainColorHsl, '--primary': mainColorHsl }),
  };

  const formContainerStyle: React.CSSProperties = {
    backgroundColor: formStyles.formColor,
  };

  const banner = (
    <a
      href="https://www.assesly.com"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity hover:opacity-90"
      style={{ backgroundColor: formStyles.mainColor }}
    >
      <Zap className="h-4 w-4" />
      <span>Made with <strong>Assesly</strong></span>
    </a>
  );

  const finalScreenLayout = (content: React.ReactNode) => (
     <div className="flex min-h-screen w-full items-center justify-center p-4" style={mainPageStyle}>
      <div className="w-full max-w-2xl rounded-lg shadow-xl" style={formContainerStyle}>
        {renderLogo()}
        <div className="p-8 text-center">
            {content}
        </div>
      </div>
      {banner}
    </div>
  );

  if (submissionStatus === 'success') {
    return finalScreenLayout(
      <>
        <div className="mb-6 flex justify-center">
          <AnimatedCheckmark color={formStyles.mainColor} />
        </div>
        <h2 className="text-2xl font-semibold mb-3" style={{color: formStyles.headingColor || formStyles.questionsColor, fontWeight: 'bold'}}>
          {endingPage?.title || 'Thank you!'}
        </h2>
        <p style={{ color: formStyles.paragraphColor || formStyles.answersColor }}>
          {endingPage?.description || 'Your submission has been received.'}
        </p>
      </>
    );
  }

  if (submissionStatus === 'error') {
    return finalScreenLayout(
      <>
        <AlertTriangle className="h-16 w-16 text-destructive mb-6 mx-auto" />
        <h2 className="text-2xl font-semibold mb-3" style={{ color: formStyles.questionsColor }}>Submission Failed</h2>
        <p style={{ color: formStyles.answersColor }} className="mb-4">{submissionError}</p>
        <Button onClick={() => setSubmissionStatus('idle')} variant="outline" className="mt-6">Try Again</Button>
      </>
    );
  }

  return (
    <>
    <div className="flex min-h-screen w-full items-center justify-center p-4" style={mainPageStyle}>
        <div 
            className="w-full max-w-2xl rounded-lg shadow-xl overflow-hidden flex flex-col my-8"
            style={formContainerStyle}
        >
            {renderLogo()}
            <form 
                ref={formRef} 
                className="flex flex-col h-full"
                noValidate
            >
                <div className="flex-grow">
                    <ScrollArea>
                        <div
                          key={currentPage}
                          className={cn("p-6 md:p-8 space-y-8", animationClass)}
                          style={{ animationDuration: `${formStyles.transitionDuration || 0.5}s` }}
                        >
                            {welcomePage.enabled && currentPage === 1 && (
                                <div className="space-y-4 text-center">
                                    {welcomePage.imageUrl && (
                                    <div className="w-full aspect-video rounded-lg bg-muted/30 flex items-center justify-center relative overflow-hidden">
                                        <Image src={welcomePage.imageUrl} layout="fill" objectFit="cover" alt="Welcome" data-ai-hint="welcome background"/>
                                    </div>
                                    )}
                                    <h1 className="text-3xl font-bold" style={{color: formStyles.headingColor || formStyles.questionsColor}}>{welcomePage.title}</h1>
                                    <p className="text-base" style={{color: formStyles.paragraphColor || formStyles.answersColor}}>{welcomePage.description}</p>
                                </div>
                            )}

                            {fieldsForCurrentPage.length === 0 ? (
                                <div className="text-center py-20" style={{ color: formStyles.answersColor }}>
                                    This page is empty.
                                </div>
                            ) : (
                                fieldsForCurrentPage.map((field, index) => {
                                    if (field.isHidden) return null;
                                    return (
                                        <div key={field.instanceId} className="bg-transparent">
                                            {renderFormField(field, index)}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {fieldsForCurrentPage.length > 0 && (
                    <div className="mt-auto p-6 bg-transparent border-t" style={{ borderColor: formStyles.inputsBorderColor }}>
                        {totalPages > 1 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span style={{color: formStyles.answersColor, fontFamily: formStyles.fontFamily}}>Page {currentPage} of {totalPages}</span>
                                    <span style={{color: formStyles.answersColor, fontFamily: formStyles.fontFamily}}>{Math.round(progressPercentage)}% Completed</span>
                                </div>
                                <Progress value={progressPercentage} className="w-full h-2 rounded-full bg-muted/30" indicatorClassName="rounded-full" style={{ '--primary-color': formStyles.mainColor } as React.CSSProperties} />
                            </div>
                        )}
                        <div className={cn("flex", (formStyles.showBackButton && currentPage > 1) ? "justify-between" : "justify-end")}>
                            {(formStyles.showBackButton && currentPage > 1) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onPrevPage}
                                    disabled={submissionStatus === 'submitting'}
                                    style={{
                                        fontFamily: formStyles.fontFamily,
                                        borderColor: formStyles.mainColor,
                                        color: formStyles.mainColor,
                                        backgroundColor: 'transparent',
                                        borderRadius: formStyles.buttonBorderType === 'circle' ? '9999px' : (formStyles.buttonBorderType === 'rounded' ? '0.375rem' : '0px'),
                                    }}
                                    className="hover:bg-primary/10"
                                >
                                    {formStyles.showButtonArrows && <ArrowLeft className="mr-2 h-4 w-4"/>} Back
                                </Button>
                            )}
                            
                            {currentPage < totalPages ? (
                                <Button
                                    type="button"
                                    onClick={handleNextPageClick}
                                    style={{
                                        fontFamily: formStyles.fontFamily,
                                        backgroundColor: formStyles.mainColor,
                                        color: formStyles.inputsBackground || '#FFFFFF',
                                        borderRadius: formStyles.buttonBorderType === 'circle' ? '9999px' : (formStyles.buttonBorderType === 'rounded' ? '0.375rem' : '0px'),
                                    }}
                                    className="hover:opacity-90"
                                >
                                    Next {formStyles.showButtonArrows && <ArrowRight className="ml-2 h-4 w-4"/>}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (validateCurrentPage()) {
                                            handleFinalSubmit();
                                        }
                                    }}
                                    disabled={submissionStatus === 'submitting'}
                                    style={{
                                        fontFamily: formStyles.fontFamily,
                                        backgroundColor: formStyles.mainColor,
                                        color: formStyles.inputsBackground || '#FFFFFF',
                                        borderRadius: formStyles.buttonBorderType === 'circle' ? '9999px' : (formStyles.buttonBorderType === 'rounded' ? '0.375rem' : '0px'),
                                    }}
                                    className="hover:opacity-90"
                                >
                                    {submissionStatus === 'submitting' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </form>
        </div>
        {banner}
    </div>
    <Dialog open={!!termsModalData} onOpenChange={(open) => !open && setTermsModalData(null)}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{termsModalData?.title}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4 mt-4">
                <div className="prose prose-sm dark:prose-invert max-w-none" style={{ whiteSpace: 'pre-wrap' }}>
                    {termsModalData?.content}
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
                <Button onClick={() => setTermsModalData(null)}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}



