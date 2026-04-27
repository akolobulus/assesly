
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion2, AccordionContent2, AccordionItem2, AccordionTrigger2 } from '@/components/ui/accordion2';
import { 
  Search, Shapes, Palette, Layers, Type, ListChecks, UserCircle2, Minus, AlignLeft, ChevronDownSquare, CheckSquare, ListOrdered, User, Mail, MapPin, Phone, ChevronDown,
  Heading1, Baseline, Hash, CalendarDays, Clock, CalendarRange, Briefcase, Users as GenderIcon, Cake, Globe, Link as LinkIcon, Share2, CircleDot, SlidersHorizontal, FileUp, FileImage, BookOpenCheck, PenTool, Contact, Upload, Gavel, Star, Pilcrow, MessageSquare
} from 'lucide-react';
import type { FieldDefinition, FieldCategory, FormStyles, FormPage, WelcomePageConfig, FormFieldInstance } from './types';
import { FieldItem } from './FieldItem';
import { DesignTabContent } from './DesignTabContent';
import { PagesTabContent } from './PagesTabContent';


const sidebarTabs = [
  { id: 'elements', name: 'Elements', icon: <Shapes className="h-8 w-8" />, 'data-tour': 'elements-tab' },
  { id: 'design', name: 'Design', icon: <Palette className="h-8 w-8" />, 'data-tour': 'design-tab' },
  { id: 'pages', name: 'Pages', icon: <Layers className="h-8 w-8" />, 'data-tour': 'pages-tab' },
];

// Export fieldCategoriesData so it can be used in FormBuilderLayout to reconstruct icons
export const fieldCategoriesData: FieldCategory[] = [
  {
    id: 'description-fields',
    name: 'Description',
    icon: Pilcrow,
    fields: [
      { id: 'heading', name: 'Heading', icon: Heading1, type: 'heading', label: 'Heading' },
      { id: 'paragraph', name: 'Paragraph', icon: Baseline, type: 'paragraph', label: 'Paragraph' },
    ],
  },
  {
    id: 'question-fields',
    name: 'Questions',
    icon: MessageSquare,
    fields: [
      { id: 'name', name: 'Full Name', icon: User, type: 'name', label: 'Name', showFirstName: true, showMiddleName: false, showLastName: true, firstNamePlaceholder: 'First Name', middleNamePlaceholder: 'Middle Name', lastNamePlaceholder: 'Last Name' },
      { id: 'gender', name: 'Gender', icon: GenderIcon, type: 'radio', label: 'Gender', options: [{label: 'Male', value: 'male'}, {label: 'Female', value: 'female'}] },
      { id: 'dob', name: 'Date of Birth', icon: Cake, type: 'date', label: 'Date of Birth', minimumAge: 18 },
      { id: 'email', name: 'Email Address', icon: Mail, type: 'email', label: 'Email Address' },
      { id: 'phone', name: 'Phone Number', icon: Phone, type: 'tel', label: 'Phone Number' },
      { id: 'short-text', name: 'Short Text', icon: Minus, type: 'text', label: 'Short Text' },
      { id: 'long-text', name: 'Long Text', icon: AlignLeft, type: 'textarea', label: 'Long Text' },
      { id: 'number-input', name: 'Number Input', icon: Hash, type: 'number', label: 'Number' },
      { id: 'multiple-choice', name: 'Multiple Choice', icon: CheckSquare, type: 'checkbox', label: 'Multiple Choice', options: [{label: 'Choice 1', value: 'Choice 1'}, {label: 'Choice 2', value: 'Choice 2'}] },
      { id: 'star-rating', name: 'Star Rating', icon: Star, type: 'rating', label: 'Star Rating', maxRating: 5 },
      { id: 'scale-rating', name: 'Scale Rating', icon: ListOrdered, type: 'scale', label: 'Scale Rating', maxRating: 10, minRatingLabel: 'Worst', maxRatingLabel: 'Best' },
      { id: 'date-picker', name: 'Date Picker', icon: CalendarDays, type: 'date', label: 'Date' },
      { id: 'time-picker', name: 'Time Picker', icon: Clock, type: 'time', label: 'Time' },
      { id: 'link', name: 'Link', icon: LinkIcon, type: 'url', label: 'Link' },
      { id: 'file-upload', name: 'File Upload', icon: FileUp, type: 'file', label: 'File Upload', fileTypes: ["PDF", "DOCX", "DOC", "TXT", "RTF"] },
      { id: 'image-upload', name: 'Image Upload', icon: FileImage, type: 'file', label: 'Image Upload', fileTypes: ["JPG", "PNG", "GIF", "WEBP"] },
      { id: 'address', name: 'Address', icon: MapPin, type: 'address', label: 'Address', showAddressLine2: true, showCity: true, showState: true, showZipCode: true },
      { id: 'country', name: 'Country', icon: Globe, type: 'select', label: 'Country', options: [], enableStateSelection: false },
      { id: 'single-choice', name: 'Single Choice', icon: CircleDot, type: 'radio', label: 'Single Choice', options: [{label: 'Option 1', value: 'Option 1'}, {label: 'Option 2', value: 'Option 2'}] },
      { id: 'dropdown-select', name: 'Dropdown', icon: ChevronDownSquare, type: 'select', label: 'Dropdown Select', options: [{label: 'Item 1', value: 'Item 1'}, {label: 'Item 2', value: 'Item 2'}] },
      { id: 'age-range', name: 'Age Range', icon: SlidersHorizontal, type: 'select', label: 'Age Range', options: [{label: '18-25', value: '18-25'}, {label: '26-35', value: '26-35'}, {label: '46+'}] },
      { id: 'terms-conditions', name: 'Terms & Conditions', icon: BookOpenCheck, type: 'terms', label: 'I agree to' },
      { id: 'signature', name: 'Signature', icon: PenTool, type: 'signature', label: 'Signature' },
    ],
  },
];


interface ElementsSidebarProps {
  onAddField: (field: FieldDefinition) => void;
  onStyleChange: (styleName: keyof FormStyles, value: string | boolean) => void;
  currentStyles: FormStyles;
  formPages: FormPage[];
  formFields: FormFieldInstance[];
  onAddPage: (indexToInsertAt?: number) => void;
  onDeletePage: (pageId: string) => void;
  onUpdatePageTitle: (pageId: string, newTitle: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onReorderPages: (draggedId: string, targetId: string) => void;
}

export function ElementsSidebar({ 
    onAddField, 
    onStyleChange, 
    currentStyles,
    formPages,
    formFields,
    onAddPage,
    onDeletePage,
    onUpdatePageTitle,
    onDuplicatePage,
    onReorderPages,
}: ElementsSidebarProps) {
  const [activeTab, setActiveTab] = useState('elements');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordions, setOpenAccordions] = useState<string[]>(fieldCategoriesData.map(fc => fc.id)); 

  const filteredCategories = fieldCategoriesData.map(category => ({
    ...category,
    fields: category.fields.filter(field =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.fields.length > 0);


  return (
    <aside className="w-96 bg-background border-r border-border flex shrink-0">
      <div className="w-16 border-r border-border flex flex-col items-center py-4 space-y-3">
        {sidebarTabs.map(tab => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`w-12 h-12 flex flex-col items-center justify-center p-8 text-xs
              ${activeTab === tab.id ? 'bg-primary/10 text-primary rounded-md' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
            `}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.name}
            data-tour={tab['data-tour']}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </Button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'elements' && (
          <>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search Fields"
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <Accordion2
                type="multiple"
                value={openAccordions}
                onValueChange={setOpenAccordions}
                className="p-3 space-y-0"
              >
                {filteredCategories.map(category => (
                  <AccordionItem2 value={category.id} key={category.id} className="border-none mb-1">
                    <AccordionTrigger2 className="group py-2 px-2 hover:bg-muted/50 rounded-md text-sm font-medium hover:no-underline">
                      <div className="flex items-center flex-1">
                        <category.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {category.name}
                      </div>
                       <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </AccordionTrigger2>
                    <AccordionContent2 className="pt-1 pb-0">
                      <div className="grid grid-cols-2 gap-2 p-2">
                        {category.fields.map(field => (
                          <FieldItem key={field.id} field={field} onAddField={onAddField} />
                        ))}
                      </div>
                    </AccordionContent2>
                  </AccordionItem2>
                ))}
                {filteredCategories.length === 0 && searchTerm && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No fields found for "{searchTerm}".
                  </div>
                )}
              </Accordion2>
            </ScrollArea>
          </>
        )}
        {activeTab === 'design' && (
          <DesignTabContent onStyleChange={onStyleChange} currentStyles={currentStyles} />
        )}
        {activeTab === 'pages' && (
           <PagesTabContent
            pages={formPages}
            formFields={formFields}
            onAddPage={onAddPage}
            onDeletePage={onDeletePage}
            onUpdatePageTitle={onUpdatePageTitle}
            onDuplicatePage={onDuplicatePage}
            onReorderPages={onReorderPages}
          />
        )}
      </div>
    </aside>
  );
}
