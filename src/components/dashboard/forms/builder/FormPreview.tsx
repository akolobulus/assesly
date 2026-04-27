
"use client";

import React from 'react';
import type { FormFieldInstance, FormStyles, FormPage, WelcomePageConfig, EndingPageConfig } from './types';
import { PublicFormRenderer } from '@/components/forms/view/PublicFormRenderer';
import type { PreviewViewType } from './ResponsivePreviewControls';
import { cn } from '@/lib/utils';

interface FormPreviewProps {
  formName: string;
  fields: FormFieldInstance[];
  formStyles: FormStyles;
  welcomePage: WelcomePageConfig;
  endingPage: EndingPageConfig;
  previewViewType: PreviewViewType;
  formPages: FormPage[];
  currentPage: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function FormPreview({
  formName,
  fields,
  formStyles,
  welcomePage,
  endingPage,
  previewViewType,
  formPages,
  currentPage,
  onNextPage,
  onPrevPage
}: FormPreviewProps) {
  const totalPages = formPages.length;
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  const formContent = (
    <PublicFormRenderer
      formId="preview-id"
      formName={formName}
      fields={fields}
      formStyles={formStyles}
      welcomePage={welcomePage}
      endingPage={endingPage}
      formPages={formPages}
      currentPage={currentPage}
      onNextPage={onNextPage}
      onPrevPage={onPrevPage}
      totalPages={totalPages}
      progressPercentage={progressPercentage}
    />
  );

  const renderDeviceFrame = (content: React.ReactNode, deviceType: PreviewViewType) => {
    let frameClasses = "flex flex-col h-full w-full items-center justify-center";
    let screenContainerClasses = "flex flex-col"; // Container for page label + screen content
    let screenClasses = "overflow-hidden flex flex-col h-full w-full";
    let screenStyle: React.CSSProperties = { backgroundColor: formStyles.backgroundColor, fontFamily: formStyles.fontFamily };
    let pageLabelStyle: React.CSSProperties = { color: formStyles.questionsColor };

    if (deviceType === 'tablet') {
      frameClasses = "bg-black p-4 rounded-[24px] shadow-2xl my-auto"; 
      screenContainerClasses = cn(screenContainerClasses, "w-[768px] h-[calc(768px*1.2)] max-h-[90vh]");
      screenClasses = cn(screenClasses, "rounded-[12px] flex-1");
      pageLabelStyle = { ...pageLabelStyle, color: formStyles.questionsColor, paddingLeft: '1rem', paddingTop: '1rem', paddingBottom: '0.5rem', backgroundColor: formStyles.backgroundColor, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' };
    } else if (deviceType === 'mobile') {
      frameClasses = "bg-black p-3 rounded-[40px] shadow-2xl my-auto"; 
      screenContainerClasses = cn(screenContainerClasses, "w-[375px] h-[calc(375px*1.8)] max-h-[85vh]");
      screenClasses = cn(screenClasses, "rounded-[28px] flex-1");
      pageLabelStyle = { ...pageLabelStyle, color: formStyles.questionsColor, paddingLeft: '0.75rem', paddingTop: '0.75rem', paddingBottom: '0.25rem', backgroundColor: formStyles.backgroundColor, borderTopLeftRadius: '28px', borderTopRightRadius: '28px'};
    } else { // desktop
        // The desktop view no longer needs the page label outside the renderer,
        // as the PublicFormRenderer now handles its own state (welcome vs form pages)
        return (
         <div className="flex-1 flex justify-center items-start w-full p-2 md:p-4">
            <div className="w-full max-w-5xl my-auto flex flex-col">
                <div className="h-full w-full shadow-xl rounded-lg overflow-hidden" style={{ backgroundColor: formStyles.backgroundColor, fontFamily: formStyles.fontFamily }}>
                    {content}
                </div>
            </div>
        </div>
      );
    }

    return (
      <div className={frameClasses}>
        <div className={screenContainerClasses} style={{backgroundColor: formStyles.backgroundColor, borderRadius: deviceType === 'tablet' ? '12px' : (deviceType === 'mobile' ? '28px' : '0px') }}>
          {/* Page label is removed as renderer handles welcome page vs form pages internally now */}
          <div className={screenClasses} style={screenStyle}>
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
     <div className="flex justify-center items-start p-4 md:p-8 w-full h-full">
      {renderDeviceFrame(formContent, previewViewType)}
    </div>
  );
}
