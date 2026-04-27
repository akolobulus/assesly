
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import type { FormStyles } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const Chrome = dynamic(
  () => import('@uiw/react-color-chrome').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="w-[225px] h-[245px]" />,
  }
);

interface CustomizeTabPanelProps {
  currentStyles: FormStyles;
  onStyleChange: (styleName: keyof FormStyles, value: string | boolean | null | number | undefined) => void;
}

const initialFormStyles: Omit<FormStyles, 'showBackButton' | 'showFieldNumber' | 'inputBorderType' | 'buttonBorderType'> = {
  backgroundColor: '#F9FAFB', 
  mainColor: '#EF4444',      
  answersColor: '#374151',   
  questionsColor: '#1F2937',
  headingColor: '#1F2937',
  paragraphColor: '#374151',
  inputsBackground: '#FFFFFF', 
  inputsBorderColor: '#D1D5DB',
  fontFamily: 'Figtree',
  fontWeight: 'normal',
  formColor: '#F8F8FA',
};

const fontsourceFonts = [
  "Figtree", "Inter", "Roboto", "Lato", "Montserrat", "Oswald", "Raleway", 
  "Poppins", "Nunito", "Merriweather", "Playfair Display", "Open Sans", 
  "Source Sans Pro", "Ubuntu", "PT Sans", "Work Sans", "Zilla Slab",
  "Lora", "Rubik", "Fira Sans", "Arvo", "Cabin", "Josefin Sans", "Abel",
  "Anton", "Bebas Neue", "Bitter", "Dosis", "Exo 2", "Karla", "Libre Baskerville",
  "Lobster", "Mulish", "Noto Sans", "Pacifico", "PT Serif", "Quicksand", 
  "Space Mono", "Titillium Web", "Varela Round"
];


export function CustomizeTabPanel({ currentStyles, onStyleChange }: CustomizeTabPanelProps) {
  const [colors, setColors] = useState({
    mainColor: currentStyles.mainColor,
    headingColor: currentStyles.headingColor || '#1F2937',
    paragraphColor: currentStyles.paragraphColor || '#374151',
    answersColor: currentStyles.answersColor,
    questionsColor: currentStyles.questionsColor,
    backgroundColor: currentStyles.backgroundColor,
    formColor: currentStyles.formColor || '#F8F8FA',
    inputsBackground: currentStyles.inputsBackground,
    inputsBorderColor: currentStyles.inputsBorderColor,
  });

  const [activePopoverKey, setActivePopoverKey] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<string>(currentStyles.fontFamily);
  const [fontSearchTerm, setFontSearchTerm] = useState('');
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setColors({
      mainColor: currentStyles.mainColor,
      headingColor: currentStyles.headingColor || '#1F2937',
      paragraphColor: currentStyles.paragraphColor || '#374151',
      answersColor: currentStyles.answersColor,
      questionsColor: currentStyles.questionsColor,
      backgroundColor: currentStyles.backgroundColor,
      formColor: currentStyles.formColor || '#F8F8FA',
      inputsBackground: currentStyles.inputsBackground,
      inputsBorderColor: currentStyles.inputsBorderColor,
    });
    setSelectedFont(currentStyles.fontFamily);
  }, [currentStyles]);

  const colorOptions = [
    { key: 'mainColor', label: 'Main Color' },
    { key: 'headingColor', label: 'Heading Color' },
    { key: 'paragraphColor', label: 'Paragraph Color' },
    { key: 'answersColor', label: 'Answers' },
    { key: 'questionsColor', label: 'Questions' },
    { key: 'formColor', label: 'Form Color' },
    { key: 'backgroundColor', label: 'Background Color' },
    { key: 'inputsBackground', label: 'Inputs' },
    { key: 'inputsBorderColor', label: 'Borders' }
  ];

  const fontWeights = [ 
      { label: "Light", value: "300" },
      { label: "Normal", value: "normal" },
      { label: "Medium", value: "500" },
      { label: "Semibold", value: "600" },
      { label: "Bold", value: "bold" }, 
  ];
  
  const filteredFontFamilies = fontsourceFonts.filter(font =>
    font.toLowerCase().includes(fontSearchTerm.toLowerCase())
  );

  const fontSizeElements = ["Description", "Label", "Option", "Answer"];
  const styleKeyMapping: { [key: string]: keyof FormStyles } = {
    Description: 'descriptionFontSize',
    Label: 'labelFontSize',
    Option: 'optionFontSize',
    Answer: 'answerFontSize',
  };


  const handleColorChangeInternal = (internalColorKey: keyof typeof colors, newColorHex: string) => {
    setColors(prev => ({
      ...prev,
      [internalColorKey]: newColorHex
    }));
    onStyleChange(internalColorKey as keyof FormStyles, newColorHex);
  };
  
  const handleResetStyles = () => {
    Object.keys(initialFormStyles).forEach(keyStr => {
        const key = keyStr as keyof FormStyles;
        onStyleChange(key, initialFormStyles[key as keyof typeof initialFormStyles] as string); 
    });
  };

  const ColorRow = ({ internalColorKey, label }: { internalColorKey: keyof typeof colors; label: string }) => {
    const currentColorHex = colors[internalColorKey as keyof typeof colors];
    
    return (
      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg mb-2">
        <Label htmlFor={internalColorKey} className="text-sm text-foreground">{label}</Label>
         <Popover 
            open={activePopoverKey === internalColorKey} 
            onOpenChange={(open) => {
                setActivePopoverKey(open ? internalColorKey : null);
            }}
          >
              <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      id={internalColorKey}
                      className="h-6 w-6 rounded-full border-2 p-0 focus-visible:ring-1 focus-visible:ring-ring"
                      style={{
                          backgroundColor: currentColorHex,
                          borderColor: ['#FFFFFF', '#F9FAFB', '#F3F4F6'].includes(currentColorHex?.toUpperCase() || '') ? '#E5E7EB' : currentColorHex
                      }}
                      aria-label={`Change ${label}`}
                  />
              </PopoverTrigger>
              <PopoverContent 
                  className="w-auto p-0 border-none shadow-xl bg-background"
                  align="end"
                  onOpenAutoFocus={(e) => e.preventDefault()} 
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    if (colorPickerRef.current && colorPickerRef.current.contains(e.target as Node)) {
                      e.preventDefault();
                    }
                  }}
              >
                <div ref={colorPickerRef}>
                    <Chrome
                        color={currentColorHex || '#000000'}
                        onChange={(newColor) => handleColorChangeInternal(internalColorKey, newColor.hex)}
                        style={{ boxShadow: 'none' }} 
                    />
                </div>
              </PopoverContent>
          </Popover>
      </div>
    );
  };


  return (
    <div className="space-y-6">
        {colorOptions.map(({ key, label }) => (
          <ColorRow key={key} internalColorKey={key as keyof typeof colors} label={label} />
        ))}
        
        <div className="flex items-center justify-end">
            <Button variant="ghost" size="sm" onClick={handleResetStyles} className="text-xs text-primary hover:text-primary/80 hover:bg-transparent">
                <RotateCcw className="mr-1.5 h-3 w-3" />
                Reset
            </Button>
        </div>

        <div className="h-px bg-border my-4"></div>


        <div>
            <Label htmlFor="fontFamily" className="text-sm font-medium text-foreground">Font family</Label>
            <Select
                value={selectedFont}
                onValueChange={(value) => {
                    setSelectedFont(value);
                    onStyleChange('fontFamily', value);
                }}
            >
                <SelectTrigger id="fontFamily" className="mt-1 h-10 text-sm bg-muted/20 border-muted/50 focus:ring-primary">
                    <SelectValue placeholder="Select font family" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search Fonts"
                            className="pl-8 h-9 text-sm bg-background focus-visible:ring-primary"
                            value={fontSearchTerm}
                            onChange={(e) => setFontSearchTerm(e.target.value)}
                        />
                    </div>
                  </div>
                    <ScrollArea className="h-[200px]">
                        {filteredFontFamilies.map(font => (
                        <SelectItem key={font} value={font} className="text-sm">
                            {font}
                        </SelectItem>
                        ))}
                        {filteredFontFamilies.length === 0 && (
                            <p className="p-2 text-sm text-muted-foreground text-center">No fonts found.</p>
                        )}
                    </ScrollArea>
                </SelectContent>
            </Select>
        </div>
        
        <div>
            <Label htmlFor="fontWeight" className="text-sm font-medium text-foreground">Font weight</Label>
             <Select
                value={currentStyles.fontWeight}
                onValueChange={(value) => {
                    onStyleChange('fontWeight', value);
                }}
            >
                <SelectTrigger id="fontWeight" className="mt-1 h-10 text-sm bg-muted/20 border-muted/50 focus:ring-primary">
                  <SelectValue placeholder="Select font weight" />
                </SelectTrigger>
                <SelectContent>
                  {fontWeights.map(weight => (
                    <SelectItem key={weight.value} value={weight.value} className="text-sm">
                      {weight.label}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
        </div>

        <div className="h-px bg-border my-4"></div>

        <Collapsible open={isFontSizeOpen} onOpenChange={setIsFontSizeOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center justify-between w-full p-0 hover:bg-transparent text-sm font-medium text-foreground">
              Font size
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isFontSizeOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3">
            {fontSizeElements.map(element => {
              const styleKey = styleKeyMapping[element];
              if (!styleKey) return null;

              const value = currentStyles[styleKey as keyof FormStyles] as number | undefined;

              return (
                <div key={element} className="flex items-center justify-between">
                  <Label htmlFor={`fontSize-${element}`} className="text-sm text-muted-foreground">{element}</Label>
                  <div className="relative w-24">
                     <Input 
                      id={`fontSize-${element}`} 
                      type="number" 
                      min="1"
                      max="100"
                      value={value || ''}
                      onChange={(e) => onStyleChange(styleKey, e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Auto" 
                      className="h-8 text-sm pr-7 bg-muted/20 border-muted/50 focus:ring-primary" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">px</span>
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
    </div>
  );
}

export default CustomizeTabPanel;
