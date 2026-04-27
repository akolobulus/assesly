
import type React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  type: string;
  icon: LucideIcon | React.ElementType;
  label?: string;
  placeholder?: string;
  options?: FieldOption[];
  description?: string;
  isRequired?: boolean;
  isHidden?: boolean;
  isReadOnly?: boolean;
  fileTypes?: string[];
  // New properties for text styling
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  // Layout for choice fields
  layout?: 'one-column' | 'two-columns' | 'three-columns';
  maxRating?: number;
  minRatingLabel?: string;
  maxRatingLabel?: string;
  enableStateSelection?: boolean;
  // New props for address field
  showAddressLine2?: boolean;
  showCity?: boolean;
  showState?: boolean;
  showZipCode?: boolean;
  // New properties for terms field
  linkText?: string;
  linkType?: 'on-page' | 'redirect';
  termsContent?: string;
  redirectUrl?: string;
  // New properties for character limit
  maxLength?: number;
  showCharCount?: boolean;
  minimumAge?: number;
  // New properties for multiple choice limit
  enableSelectionLimit?: boolean;
  maxSelections?: number;
  // New properties for Name field
  showFirstName?: boolean;
  showMiddleName?: boolean;
  showLastName?: boolean;
  firstNamePlaceholder?: string;
  middleNamePlaceholder?: string;
  lastNamePlaceholder?: string;
}

export interface FormFieldInstance extends FieldDefinition {
  instanceId: string;
  pageId: string; // Added to associate field with a page
}

export interface FieldCategory {
  id: string;
  name: string;
  icon: LucideIcon | React.ElementType;
  fields: FieldDefinition[];
}

export type TransitionType = 'None' | 'Slide Up' | 'Slide Down' | 'Fade In' | 'Bounce In' | 'blur' | 'Scale In' | 'Swipe';

export interface FormStyles {
  backgroundColor: string;
  mainColor: string;
  answersColor: string;
  questionsColor: string;
  headingColor?: string;
  paragraphColor?: string;
  inputsBackground: string;
  inputsBorderColor: string;
  inputBorderType: 'circle' | 'square' | 'rounded';
  buttonBorderType: 'circle' | 'square' | 'rounded';
  fontFamily: string;
  fontWeight: string;
  showBackButton: boolean;
  showFieldNumber: boolean;
  showButtonArrows: boolean;
  transitionType: TransitionType;
  transitionDuration?: number;
  warnBeforeDropoff?: boolean;
  formColor?: string;
  logoUrl?: string | null;
  logoAlignment?: 'left' | 'center' | 'right';
  descriptionFontSize?: number;
  labelFontSize?: number;
  optionFontSize?: number;
  answerFontSize?: number;
}

export interface WelcomePageConfig {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  imageUrl: string | null;
}

export interface EndingPageConfig {
  title: string;
  description: string;
}

export interface AccessSettings {
  isClosed?: boolean;
  openDate?: string | null;
  closeDate?: string | null;
  submissionLimit?: number | null;
}

export interface FormPage {
  id: string;
  title: string;
}

// Type used for the overall state in FormBuilderLayout
export type FormBuilderData = {
  formName: string;
  formDescription: string;
  formFields: FormFieldInstance[];
  formStyles: FormStyles;
  formPages: FormPage[];
  welcomePage: WelcomePageConfig;
  endingPage: EndingPageConfig;
  accessSettings: AccessSettings;
  isPublished: boolean;
  responsesCount: number;
  thumbnailUrl: string;
  metaImageUrl?: string | null;
  formType: 'public' | 'private';
  formCategory?: 'Funding' | 'Equipment' | 'Discount' | 'Opportunities' | null;
  folderId?: string | null;
  enableSubmissionNotifications: boolean;
};
