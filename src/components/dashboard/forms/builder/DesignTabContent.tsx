
"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, AlignLeft, AlignCenter, AlignRight, Circle as CircleIcon, MinusSquare, Square as SquareIcon } from 'lucide-react';
import type { FormStyles, TransitionType } from './types';
import { cn } from '@/lib/utils';
import { CustomizeTabPanel } from './CustomizeTabPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface DesignTabContentProps {
  onStyleChange: (styleName: keyof FormStyles, value: string | boolean | null | number | undefined) => void;
  currentStyles: FormStyles;
}

export function DesignTabContent({ onStyleChange, currentStyles }: DesignTabContentProps) {
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File is too large. Max 2MB."); // Replace with a better notification
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onStyleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <Tabs defaultValue="customize" className="w-full">
          <TabsList className="flex border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="customize"
              className="flex-1 px-4 py-2 -mb-px font-medium text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=inactive]:text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none rounded-none hover:bg-transparent data-[state=active]:bg-transparent"
            >
              Customize
            </TabsTrigger>
            <TabsTrigger
              value="layout"
              className="flex-1 px-4 py-2 -mb-px font-medium text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=inactive]:text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none rounded-none hover:bg-transparent data-[state=active]:bg-transparent"
            >
              Layout
            </TabsTrigger>
          </TabsList>
          <TabsContent value="customize" className="mt-4 space-y-6">
            <CustomizeTabPanel currentStyles={currentStyles} onStyleChange={onStyleChange} />
          </TabsContent>
          <TabsContent value="layout" className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="showBackButton" className="text-sm text-foreground">Show back button</Label>
              <Switch
                id="showBackButton"
                checked={currentStyles.showBackButton}
                onCheckedChange={(checked) => onStyleChange('showBackButton', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showFieldNumber" className="text-sm text-foreground">Show field number</Label>
              <Switch
                id="showFieldNumber"
                checked={currentStyles.showFieldNumber}
                onCheckedChange={(checked) => onStyleChange('showFieldNumber', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showButtonArrows" className="text-sm text-foreground">Show arrows on buttons</Label>
              <Switch
                id="showButtonArrows"
                checked={currentStyles.showButtonArrows}
                onCheckedChange={(checked) => onStyleChange('showButtonArrows', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="warnBeforeDropoff" className="text-sm text-foreground">Warn user before Dropoff</Label>
              <Switch
                id="warnBeforeDropoff"
                checked={!!currentStyles.warnBeforeDropoff}
                onCheckedChange={(checked) => onStyleChange('warnBeforeDropoff', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="transitionType" className="text-sm text-foreground">Transition type</Label>
              <Select
                value={currentStyles.transitionType || 'Fade In'}
                onValueChange={(value) => onStyleChange('transitionType', value as TransitionType)}
              >
                <SelectTrigger id="transitionType" className="w-[180px]">
                  <SelectValue placeholder="Select transition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Slide Up">Slide Up</SelectItem>
                  <SelectItem value="Slide Down">Slide Down</SelectItem>
                  <SelectItem value="Fade In">Fade In</SelectItem>
                  <SelectItem value="Bounce In">Bounce In</SelectItem>
                  <SelectItem value="blur">blur</SelectItem>
                  <SelectItem value="Scale In">Scale In</SelectItem>
                  <SelectItem value="Swipe">Swipe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentStyles.transitionType !== 'None' && (
              <div className="space-y-2">
                <Label htmlFor="transitionDuration" className="text-sm font-medium text-foreground">Duration</Label>
                <div className="flex items-center gap-4">
                    <Slider
                        id="transitionDuration"
                        min={0.1}
                        max={4}
                        step={0.1}
                        value={[currentStyles.transitionDuration ?? 0.5]}
                        onValueChange={(value) => onStyleChange('transitionDuration', value[0])}
                        className="flex-1"
                    />
                    <div className="relative w-20">
                        <Input
                            type="number"
                            value={(currentStyles.transitionDuration ?? 0.5).toFixed(1)}
                            onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (isNaN(val)) val = 0.1;
                                if (val > 4) val = 4;
                                if (val < 0.1) val = 0.1;
                                onStyleChange('transitionDuration', val);
                            }}
                            className="h-9 pr-7 text-center bg-muted/30 border-muted/50"
                            step="0.1"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">s</span>
                    </div>
                </div>
              </div>
            )}
            <Separator className="my-6" />

            {/* Input Borders */}
            <div>
              <Label className="text-sm font-medium text-foreground">Input Borders</Label>
              <RadioGroup
                  value={currentStyles.inputBorderType}
                  onValueChange={(value) => onStyleChange('inputBorderType', value as any)}
                  className="flex items-center space-x-2 mt-2 p-1 bg-muted/20 rounded-lg justify-around"
              >
                  {(['circle', 'rounded', 'square'] as const).map(borderOpt => (
                      <Label 
                          key={borderOpt} 
                          htmlFor={`input-border-${borderOpt}`} 
                          className={cn(
                              "cursor-pointer p-2 rounded-md flex items-center justify-center w-10 h-10 hover:bg-accent",
                              currentStyles.inputBorderType === borderOpt && "bg-primary/10 ring-1 ring-primary"
                          )}
                      >
                          <RadioGroupItem value={borderOpt} id={`input-border-${borderOpt}`} className="sr-only" />
                          {borderOpt === 'circle' && <CircleIcon className={`h-5 w-5 ${currentStyles.inputBorderType === 'circle' ? 'text-primary' : 'text-muted-foreground'}`} />}
                          {borderOpt === 'rounded' && <MinusSquare className={`h-5 w-5 ${currentStyles.inputBorderType === 'rounded' ? 'text-primary' : 'text-muted-foreground'}`} />}
                          {borderOpt === 'square' && <SquareIcon className={`h-5 w-5 ${currentStyles.inputBorderType === 'square' ? 'text-primary' : 'text-muted-foreground'}`} />}
                      </Label>
                  ))}
              </RadioGroup>
            </div>

            {/* Button Borders */}
            <div>
              <Label className="text-sm font-medium text-foreground">Button Borders</Label>
              <RadioGroup
                  value={currentStyles.buttonBorderType}
                  onValueChange={(value) => onStyleChange('buttonBorderType', value as any)}
                  className="flex items-center space-x-2 mt-2 p-1 bg-muted/20 rounded-lg justify-around"
              >
                  {(['circle', 'rounded', 'square'] as const).map(borderOpt => (
                      <Label 
                          key={borderOpt} 
                          htmlFor={`button-border-${borderOpt}`} 
                          className={cn(
                              "cursor-pointer p-2 rounded-md flex items-center justify-center w-10 h-10 hover:bg-accent",
                              currentStyles.buttonBorderType === borderOpt && "bg-primary/10 ring-1 ring-primary"
                          )}
                      >
                          <RadioGroupItem value={borderOpt} id={`button-border-${borderOpt}`} className="sr-only" />
                          {borderOpt === 'circle' && <CircleIcon className={`h-5 w-5 ${currentStyles.buttonBorderType === 'circle' ? 'text-primary' : 'text-muted-foreground'}`} />}
                          {borderOpt === 'rounded' && <MinusSquare className={`h-5 w-5 ${currentStyles.buttonBorderType === 'rounded' ? 'text-primary' : 'text-muted-foreground'}`} />}
                          {borderOpt === 'square' && <SquareIcon className={`h-5 w-5 ${currentStyles.buttonBorderType === 'square' ? 'text-primary' : 'text-muted-foreground'}`} />}
                      </Label>
                  ))}
              </RadioGroup>
            </div>

            <Separator className="my-6" />
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Logo</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="addLogo" className="text-sm text-foreground">
                  {currentStyles.logoUrl ? "Change Logo" : "Add Logo"}
                </Label>
                 <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <Button variant="ghost" size="icon" id="addLogo" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleLogoUploadClick}>
                  <UploadCloud className="h-5 w-5" />
                </Button>
              </div>
              {currentStyles.logoUrl && (
                 <div className="mt-4 space-y-3">
                    <div className="relative w-full p-4 border border-dashed rounded-md flex items-center justify-center">
                        <Image src={currentStyles.logoUrl} alt="Logo Preview" width={100} height={40} style={{ objectFit: 'contain' }} />
                    </div>
                     <Label className="text-sm font-medium text-foreground">Alignment</Label>
                     <RadioGroup
                      value={currentStyles.logoAlignment || 'center'}
                      onValueChange={(value) => onStyleChange('logoAlignment', value as 'left' | 'center' | 'right')}
                      className="mt-2 flex rounded-md border overflow-hidden"
                    >
                      {[
                        { value: 'left', icon: AlignLeft, label: 'Left' },
                        { value: 'center', icon: AlignCenter, label: 'Center' },
                        { value: 'right', icon: AlignRight, label: 'Right' },
                      ].map((option, index) => {
                        const isActive = (currentStyles.logoAlignment || 'center') === option.value;
                        return (
                          <React.Fragment key={option.value}>
                            {index > 0 && <div className="w-px bg-border" />}
                            <Label
                              htmlFor={`logo-align-${option.value}`}
                              className={cn(
                                'flex flex-1 w-full cursor-pointer items-center justify-center gap-2 p-2 text-sm transition-colors',
                                isActive
                                  ? 'bg-red-600 text-white'
                                  : 'bg-transparent text-muted-foreground hover:bg-muted/10'
                              )}
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={`logo-align-${option.value}`}
                                className="sr-only"
                              />
                              <option.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-muted-foreground')} />
                              <span>{option.label}</span>
                            </Label>
                          </React.Fragment>
                        );
                      })}
                    </RadioGroup>

                    <Button variant="link" className="p-0 h-auto text-destructive text-xs" onClick={() => onStyleChange('logoUrl', null)}>Remove Logo</Button>
                </div>
              )}
            </div>
            <Separator className="my-6" />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
