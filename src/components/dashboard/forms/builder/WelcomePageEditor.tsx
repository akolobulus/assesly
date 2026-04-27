
"use client";

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { WelcomePageConfig, FormStyles } from './types';
import { ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface WelcomePageEditorProps {
    config: WelcomePageConfig;
    onChange: (newConfig: Partial<WelcomePageConfig>) => void;
    formStyles: FormStyles;
}

export const WelcomePageEditor = ({ config, onChange, formStyles }: WelcomePageEditorProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleImageUploadClick = () => {
        if (!config.imageUrl) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "File is too large",
                    description: "Please select an image smaller than 5MB.",
                    variant: "destructive"
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange({ imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-xl p-6 md:p-10 border-2 border-dashed border-primary/30 mb-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
                <div>
                    <Label htmlFor="enable-welcome-page" className="text-base font-medium text-foreground">
                        Welcome Page
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Show an introduction at the top of your form.
                    </p>
                </div>
                <Switch
                    id="enable-welcome-page"
                    checked={config.enabled}
                    onCheckedChange={(checked) => onChange({ enabled: checked })}
                    aria-label="Toggle Welcome Page"
                />
            </div>
            
            {config.enabled && (
                <div className="space-y-6 pt-4 animate-in fade-in-0">
                    <div 
                        className="relative aspect-video w-full border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
                        onClick={handleImageUploadClick}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        {config.imageUrl ? (
                        <>
                            <Image src={config.imageUrl} layout="fill" objectFit="cover" alt="Welcome page preview" className="rounded-md" data-ai-hint="welcome background" />
                            <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md opacity-80 hover:opacity-100 z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange({ imageUrl: null });
                            }}
                            >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove image</span>
                            </Button>
                        </>
                        ) : (
                        <>
                            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">Click to upload image</p>
                            <p className="text-xs text-muted-foreground/80">Max 5MB</p>
                        </>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Input 
                        value={config.title}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder="Welcome Page Title"
                        className="text-3xl font-bold h-auto p-2 border-0 shadow-none focus-visible:ring-0 bg-transparent text-center"
                        style={{ color: formStyles.headingColor || formStyles.questionsColor }}
                        maxLength={250}
                        />
                        <Textarea
                        value={config.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                        placeholder="Welcome page description..."
                        className="text-base border-0 shadow-none focus-visible:ring-0 bg-transparent text-center min-h-[80px] p-2"
                        style={{ color: formStyles.paragraphColor || formStyles.answersColor }}
                        maxLength={250}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
