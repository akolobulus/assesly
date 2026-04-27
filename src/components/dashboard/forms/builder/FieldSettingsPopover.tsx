

"use client";

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { FormFieldInstance, FieldOption } from './types';
import { X, AlignLeft, AlignCenter, AlignRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FieldSettingsPopoverProps {
  field: FormFieldInstance | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSave: (updatedField: FormFieldInstance) => void;
}

export function FieldSettingsPopover({ field, anchorEl, onClose, onSave }: FieldSettingsPopoverProps) {
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [enableStateSelection, setEnableStateSelection] = useState(false);

  // New state for static field styles
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [fontSize, setFontSize] = useState<number | undefined>(undefined);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  // State for choice options
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [layout, setLayout] = useState<'one-column' | 'two-columns' | 'three-columns'>('one-column');
  
  // State for rating
  const [maxRating, setMaxRating] = useState(5);
  const [minRatingLabel, setMinRatingLabel] = useState('Worst');
  const [maxRatingLabel, setMaxRatingLabel] = useState('Best');
  
  // State for terms field
  const [linkText, setLinkText] = useState('');
  const [linkType, setLinkType] = useState<'on-page' | 'redirect'>('on-page');
  const [termsContent, setTermsContent] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  // State for character limit
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined);
  const [showCharCount, setShowCharCount] = useState(false);

  // State for DOB minimum age
  const [minimumAge, setMinimumAge] = useState<number | undefined>(undefined);

  // State for address field components
  const [showAddressLine2, setShowAddressLine2] = useState(false);
  const [showCity, setShowCity] = useState(false);
  const [showState, setShowState] = useState(false);
  const [showZipCode, setShowZipCode] = useState(false);

  // State for selection limit
  const [enableSelectionLimit, setEnableSelectionLimit] = useState(false);
  const [maxSelections, setMaxSelections] = useState<number | undefined>(undefined);
  
  // State for name field
  const [showMiddleName, setShowMiddleName] = useState(false);
  const [showLastName, setShowLastName] = useState(true);
  const [firstNamePlaceholder, setFirstNamePlaceholder] = useState('');
  const [middleNamePlaceholder, setMiddleNamePlaceholder] = useState('');
  const [lastNamePlaceholder, setLastNamePlaceholder] = useState('');

  useEffect(() => {
    if (field) {
      setLabel(field.label || field.name);
      setPlaceholder(field.placeholder || '');
      setDescription(field.description || '');
      setIsRequired(field.isRequired || false);
      setIsHidden(field.isHidden || false);
      setIsReadOnly(field.isReadOnly || false);
      setEnableStateSelection(field.enableStateSelection || false);
      // Populate new state
      setTextAlign(field.textAlign || 'left');
      setFontSize(field.fontSize);
      setIsBold(field.isBold || false);
      setIsItalic(field.isItalic || false);
      // Populate options state
      setOptions(field.options || []);
      setLayout(field.layout || 'one-column');
      // Populate rating state
      setMaxRating(field.maxRating || 5);
      setMinRatingLabel(field.minRatingLabel || 'Worst');
      setMaxRatingLabel(field.maxRatingLabel || 'Best');
      // Populate terms state
      setLinkText(field.linkText || 'terms & conditions');
      setLinkType(field.linkType || 'on-page');
      setTermsContent(field.termsContent || '');
      setRedirectUrl(field.redirectUrl || '');
      // Populate character limit state
      setMaxLength(field.maxLength);
      setShowCharCount(field.showCharCount || false);
      // Populate minimum age state
      setMinimumAge(field.minimumAge);
      // Populate address components state
      setShowAddressLine2(field.showAddressLine2 || false);
      setShowCity(field.showCity || false);
      setShowState(field.showState || false);
      setShowZipCode(field.showZipCode || false);
      // Populate selection limit state
      setEnableSelectionLimit(field.enableSelectionLimit || false);
      setMaxSelections(field.maxSelections);
      // Populate name field state
      setShowMiddleName(field.showMiddleName || false);
      setShowLastName(field.showLastName === undefined ? true : field.showLastName);
      setFirstNamePlaceholder(field.firstNamePlaceholder || 'First Name');
      setMiddleNamePlaceholder(field.middleNamePlaceholder || 'Middle Name');
      setLastNamePlaceholder(field.lastNamePlaceholder || 'Last Name');
    }
  }, [field]);

  if (!field || !anchorEl) {
    return null;
  }

  const handleSave = () => {
    const updatedField: FormFieldInstance = {
      ...field,
      label,
      placeholder,
      description,
      isRequired,
      isHidden,
      isReadOnly,
      enableStateSelection,
      // Add new properties to save
      textAlign,
      fontSize,
      isBold,
      isItalic,
      // Add options to save
      options,
      layout,
      maxRating,
      minRatingLabel,
      maxRatingLabel,
      // Add terms to save
      linkText,
      linkType,
      termsContent,
      redirectUrl,
      // Add character limit properties
      maxLength,
      showCharCount,
      // Add minimum age
      minimumAge,
      // Add address components properties
      showAddressLine2,
      showCity,
      showState,
      showZipCode,
      // Add selection limit properties
      enableSelectionLimit,
      maxSelections,
      // Add name field properties
      showMiddleName,
      showLastName,
      firstNamePlaceholder,
      middleNamePlaceholder,
      lastNamePlaceholder,
    };
    onSave(updatedField);
  };
  
  // Option handlers
  const handleOptionChange = (index: number, newLabel: string) => {
    const newOptions = [...options];
    // For simplicity, value is the same as the label. Could be made more complex if needed.
    newOptions[index] = { label: newLabel, value: newLabel };
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    const newOptionNumber = options.length + 1;
    setOptions([...options, { label: `Option ${newOptionNumber}`, value: `Option ${newOptionNumber}` }]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const fieldTypeName = field.name || field.type.charAt(0).toUpperCase() + field.type.slice(1);
  const isStaticField = field && ['heading', 'paragraph'].includes(field.type);
  const isChoiceField = field && ['select', 'radio', 'checkbox'].includes(field.type) && field.id !== 'country';
  const isRadioField = field?.type === 'radio';
  const hasLayoutOptions = field && ['radio', 'checkbox'].includes(field.type);
  const isCheckboxField = field?.type === 'checkbox';
  const isRatingField = field && field.type === 'rating';
  const isScaleRatingField = field && field.type === 'scale';
  const isCountryField = field && field.id === 'country';
  const isAddressField = field && field.type === 'address';
  const isTermsField = field && field.type === 'terms';
  const isCharacterLimitedField = field && ['text', 'textarea'].includes(field.type);
  const isDobField = field && field.id === 'dob';
  const isSignatureField = field?.type === 'signature';
  const isFileUploadField = field?.type === 'file';
  const isNameField = field?.type === 'name';

  return (
    <Popover open={!!field && !!anchorEl} onOpenChange={(open) => { if (!open) onClose(); }}>
      <PopoverAnchor asChild>
        <div style={{ position: 'fixed', top: anchorEl.getBoundingClientRect().bottom + 8, left: anchorEl.getBoundingClientRect().left }} />
      </PopoverAnchor>
      <PopoverContent
        className="w-80 shadow-xl border-border bg-card max-h-[85vh] p-0 flex flex-col"
        side="right"
        align="start"
        sideOffset={10}
        onEscapeKeyDown={onClose}
        onInteractOutside={onClose}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
            <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Properties</h3>
                <p className="text-sm text-foreground font-medium">{fieldTypeName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground hover:bg-muted/20">
              <X className="h-4 w-4" />
            </Button>
        </div>
        
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
          {isTermsField ? (
           <div className="space-y-3">
              <div>
                <Label htmlFor="field-label" className="text-xs font-medium text-muted-foreground">Text before the link</Label>
                <Input id="field-label" value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 text-sm mt-1 bg-background"/>
              </div>
              <div>
                <Label htmlFor="field-linkText" className="text-xs font-medium text-muted-foreground">Link text</Label>
                <Input id="field-linkText" value={linkText} onChange={(e) => setLinkText(e.target.value)} className="h-9 text-sm mt-1 bg-background"/>
              </div>
              <Tabs value={linkType} onValueChange={(value) => setLinkType(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/20">
                  <TabsTrigger value="on-page">On-page</TabsTrigger>
                  <TabsTrigger value="redirect">Redirect</TabsTrigger>
                </TabsList>
                <TabsContent value="on-page" className="mt-2 space-y-2">
                  <Label htmlFor="field-termsContent" className="text-xs font-medium text-muted-foreground">Terms and conditions content (Max. 10000 Chars)</Label>
                  <Textarea
                    id="field-termsContent"
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    className="text-sm mt-1 bg-background min-h-[120px]"
                    maxLength={10000}
                  />
                </TabsContent>
                <TabsContent value="redirect" className="mt-2 space-y-2">
                  <Label htmlFor="field-redirectUrl" className="text-xs font-medium text-muted-foreground">URL</Label>
                  <Input id="field-redirectUrl" type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://example.com/terms" className="h-9 text-sm mt-1 bg-background"/>
                </TabsContent>
              </Tabs>
           </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="field-label" className="text-xs font-medium text-muted-foreground">
                  {isStaticField ? 'Content' : 'Label'}
                </Label>
                {field.type === 'paragraph' ? (
                  <Textarea
                    id="field-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="h-auto min-h-24 text-sm mt-1 bg-background resize-y"
                  />
                ) : (
                  <Input
                    id="field-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="h-9 text-sm mt-1 bg-background"
                  />
                )}
              </div>
              
              {!isStaticField && !isRatingField && !isScaleRatingField && !isSignatureField && !isFileUploadField && !isNameField && (
                  <div>
                    <Label htmlFor="field-placeholder" className="text-xs font-medium text-muted-foreground">Placeholder</Label>
                    <Input
                      id="field-placeholder"
                      value={placeholder}
                      onChange={(e) => setPlaceholder(e.target.value)}
                      className="h-9 text-sm mt-1 bg-background"
                    />
                  </div>
              )}
              
              {!isStaticField && (
                  <div>
                    <Label htmlFor="field-description" className="text-xs font-medium text-muted-foreground">Description</Label>
                    <Textarea
                      id="field-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-sm mt-1 bg-background min-h-[60px]"
                      rows={2}
                    />
                  </div>
              )}
            </div>
          )}
          
          {isStaticField && (
            <>
              <Separator />
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Text Align</Label>
                  <RadioGroup
                    value={textAlign}
                    onValueChange={(value) => setTextAlign(value as 'left' | 'center' | 'right')}
                    className="mt-2 flex rounded-md border overflow-hidden"
                  >
                    {[
                      { value: 'left', icon: AlignLeft, label: 'Left' },
                      { value: 'center', icon: AlignCenter, label: 'Center' },
                      { value: 'right', icon: AlignRight, label: 'Right' },
                    ].map((option, index) => {
                      const isActive = textAlign === option.value;
                      return (
                        <React.Fragment key={option.value}>
                          {index > 0 && <div className="w-px bg-border" />}
                          <Label
                            htmlFor={`align-${option.value}`}
                            className={cn(
                              'flex flex-1 w-full cursor-pointer items-center justify-center gap-2 p-2 text-sm transition-colors',
                              isActive
                                ? 'bg-red-600 text-white'
                                : 'bg-transparent text-muted-foreground hover:bg-muted/10'
                            )}
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={`align-${option.value}`}
                              className="sr-only"
                            />
                            <option.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-muted-foreground')} />
                            <span>{option.label}</span>
                          </Label>
                        </React.Fragment>
                      );
                    })}
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="field-font-size" className="text-xs font-medium text-muted-foreground">Font Size (px)</Label>
                  <Input
                    id="field-font-size"
                    type="number"
                    value={fontSize || ''}
                    onChange={(e) => setFontSize(e.target.value ? Math.min(100, Number(e.target.value)) : undefined)}
                    className="h-9 text-sm mt-1 bg-background"
                    placeholder='Default'
                    max={100}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="field-bold" className="text-sm text-foreground">Bold</Label>
                  <Switch
                    id="field-bold"
                    checked={isBold}
                    onCheckedChange={setIsBold}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="field-italic" className="text-sm text-foreground">Italic</Label>
                  <Switch
                    id="field-italic"
                    checked={isItalic}
                    onCheckedChange={setIsItalic}
                  />
                </div>
              </div>
            </>
          )}

          {isChoiceField && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">Options</Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option.label}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="h-9 text-sm bg-background"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground shrink-0"
                        onClick={() => handleRemoveOption(index)}
                        disabled={isRadioField ? options.length <= 2 : options.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleAddOption}
                  disabled={isRadioField && options.length >= 2}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              </div>
              {hasLayoutOptions && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-2">
                      <Label className="text-xs font-medium text-muted-foreground">Layout</Label>
                      <RadioGroup
                          value={layout}
                          onValueChange={(value) => setLayout(value as any)}
                          className="grid grid-cols-3 gap-2"
                      >
                          {(['one-column', 'two-columns', 'three-columns'] as const).map((value, index) => (
                              <div key={value}>
                                  <RadioGroupItem value={value} id={value} className="sr-only" />
                                  <Label
                                      htmlFor={value}
                                      className={cn(
                                          "flex h-12 w-full cursor-pointer items-center justify-center rounded-md border-2 text-xs font-semibold",
                                          layout === value ? "border-primary bg-primary/10 text-primary" : "border-muted text-muted-foreground hover:border-border"
                                      )}
                                  >
                                      {index + 1} Column{index > 0 ? 's' : ''}
                                  </Label>
                              </div>
                          ))}
                      </RadioGroup>
                  </div>
                </>
              )}
            </>
          )}
          
          {isNameField && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">Name Components</Label>
                <div className="flex items-center justify-between">
                    <Label htmlFor="field-showLastName" className="text-sm text-foreground">Show Last Name</Label>
                    <Switch id="field-showLastName" checked={showLastName} onCheckedChange={setShowLastName} />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="field-showMiddleName" className="text-sm text-foreground">Show Middle Name</Label>
                    <Switch id="field-showMiddleName" checked={showMiddleName} onCheckedChange={setShowMiddleName} />
                </div>
                <Separator />
                <Label className="text-xs font-medium text-muted-foreground">Placeholders</Label>
                <div>
                    <Label htmlFor="firstNamePlaceholder" className="text-sm text-muted-foreground">First Name</Label>
                    <Input id="firstNamePlaceholder" value={firstNamePlaceholder} onChange={(e) => setFirstNamePlaceholder(e.target.value)} className="h-9 text-sm mt-1 bg-background"/>
                </div>
                {showMiddleName && (
                    <div>
                        <Label htmlFor="middleNamePlaceholder" className="text-sm text-muted-foreground">Middle Name</Label>
                        <Input id="middleNamePlaceholder" value={middleNamePlaceholder} onChange={(e) => setMiddleNamePlaceholder(e.target.value)} className="h-9 text-sm mt-1 bg-background"/>
                    </div>
                )}
                {showLastName && (
                    <div>
                        <Label htmlFor="lastNamePlaceholder" className="text-sm text-muted-foreground">Last Name</Label>
                        <Input id="lastNamePlaceholder" value={lastNamePlaceholder} onChange={(e) => setLastNamePlaceholder(e.target.value)} className="h-9 text-sm mt-1 bg-background"/>
                    </div>
                )}
              </div>
            </>
          )}

          {isCheckboxField && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">Selection Limit</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-selection-limit" className="text-sm text-foreground">
                    Limit selections
                  </Label>
                  <Switch
                    id="enable-selection-limit"
                    checked={enableSelectionLimit}
                    onCheckedChange={(checked) => {
                      setEnableSelectionLimit(checked);
                      if (!checked) {
                        setMaxSelections(undefined);
                      } else {
                        setMaxSelections(1);
                      }
                    }}
                  />
                </div>
                {enableSelectionLimit && (
                  <div>
                    <Label htmlFor="max-selections" className="text-xs font-medium text-muted-foreground">
                      Max selections
                    </Label>
                    <Input
                      id="max-selections"
                      type="number"
                      min="1"
                      max={options.length || 1}
                      value={maxSelections || ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        if (value && options.length && value > options.length) {
                          setMaxSelections(options.length);
                        } else if (value && value < 1) {
                          setMaxSelections(1);
                        } else {
                          setMaxSelections(value);
                        }
                      }}
                      className="h-9 text-sm mt-1 bg-background"
                    />
                  </div>
                )}
              </div>
            </>
          )}
          
          {isScaleRatingField && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="max-rating" className="text-xs font-medium text-muted-foreground">Max Rating (5-10)</Label>
                  <Input id="max-rating" type="number" value={maxRating} onChange={(e) => setMaxRating(Number(e.target.value))} min="5" max="10" className="h-9 text-sm mt-1 bg-background"/>
                </div>
                <div>
                  <Label htmlFor="min-rating-label" className="text-xs font-medium text-muted-foreground">Min Rating Label</Label>
                  <Input id="min-rating-label" value={minRatingLabel} onChange={(e) => setMinRatingLabel(e.target.value)} placeholder="e.g. Worst" className="h-9 text-sm mt-1 bg-background"/>
                </div>
                <div>
                  <Label htmlFor="max-rating-label" className="text-xs font-medium text-muted-foreground">Max Rating Label</Label>
                  <Input id="max-rating-label" value={maxRatingLabel} onChange={(e) => setMaxRatingLabel(e.target.value)} placeholder="e.g. Best" className="h-9 text-sm mt-1 bg-background"/>
                </div>
              </div>
            </>
          )}
          
          {isCharacterLimitedField && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">Character Limit</Label>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="field-maxLength-enabled" className="text-sm text-foreground">
                      Set max characters
                    </Label>
                    <Switch
                        id="field-maxLength-enabled"
                        checked={maxLength !== undefined}
                        onCheckedChange={(checked) => setMaxLength(checked ? 200 : undefined)}
                    />
                </div>
                {maxLength !== undefined && (
                  <div className="space-y-3">
                     <Input
                      id="field-maxLength"
                      type="number"
                      value={maxLength || ''}
                      onChange={(e) => setMaxLength(Number(e.target.value) > 0 ? Number(e.target.value) : undefined)}
                      className="h-9 text-sm mt-1 bg-background"
                      min="1"
                    />
                     <div className="flex items-center justify-between">
                        <Label htmlFor="field-showCharCount" className="text-sm text-foreground">
                            Show character count
                        </Label>
                        <Switch
                            id="field-showCharCount"
                            checked={showCharCount}
                            onCheckedChange={setShowCharCount}
                        />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {isDobField && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">Validation</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enforce-min-age" className="text-sm text-foreground pr-2">
                    Enforce minimum age requirement (18 years)
                  </Label>
                  <Switch
                    id="enforce-min-age"
                    checked={minimumAge === 18}
                    onCheckedChange={(checked) => {
                      setMinimumAge(checked ? 18 : undefined);
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {isAddressField && (
            <>
              <Separator />
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">Address Components</Label>
                <div className="flex items-center justify-between">
                    <Label htmlFor="field-showAddressLine2" className="text-sm text-foreground">Address Line 2</Label>
                    <Switch id="field-showAddressLine2" checked={showAddressLine2} onCheckedChange={setShowAddressLine2} />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="field-showCity" className="text-sm text-foreground">City</Label>
                    <Switch id="field-showCity" checked={showCity} onCheckedChange={setShowCity} />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="field-showState" className="text-sm text-foreground">State & Country</Label>
                    <Switch id="field-showState" checked={showState} onCheckedChange={setShowState} />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="field-showZipCode" className="text-sm text-foreground">Zip / Postal Code</Label>
                    <Switch id="field-showZipCode" checked={showZipCode} onCheckedChange={setShowZipCode} />
                </div>
              </div>
            </>
          )}
          
          <Separator />

          <div className="space-y-3">
             {isCountryField && (
                <div className="flex items-center justify-between">
                    <Label htmlFor="enable-state-selection" className="text-sm text-foreground">Enable State selection</Label>
                    <Switch
                        id="enable-state-selection"
                        checked={enableStateSelection}
                        onCheckedChange={setEnableStateSelection}
                    />
                </div>
            )}
            {!isStaticField && (
              <div className="flex items-center justify-between">
                <Label htmlFor="field-required" className="text-sm text-foreground">Required</Label>
                <Switch
                  id="field-required"
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="field-hidden" className="text-sm text-foreground">Hide Field</Label>
              <Switch
                id="field-hidden"
                checked={isHidden}
                onCheckedChange={setIsHidden}
              />
            </div>
            {!isStaticField && !isTermsField && (
              <div className="flex items-center justify-between">
                <Label htmlFor="field-readonly" className="text-sm text-foreground">Read Only</Label>
                <Switch
                  id="field-readonly"
                  checked={isReadOnly}
                  onCheckedChange={setIsReadOnly}
                />
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t sticky bottom-0 bg-card z-10">
          <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Apply Changes</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
