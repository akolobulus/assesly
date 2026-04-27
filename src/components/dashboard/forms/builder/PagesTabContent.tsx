
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, Copy, PlusCircle, Layers, Trash2, HandMetal } from 'lucide-react';
import type { FormPage, FormFieldInstance } from './types';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PagesTabContentProps {
  pages: FormPage[];
  formFields: FormFieldInstance[];
  onAddPage: (indexToInsertAt?: number) => void;
  onDeletePage: (pageId: string) => void;
  onUpdatePageTitle: (pageId: string, newTitle: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onReorderPages: (draggedId: string, targetId: string) => void;
}

export function PagesTabContent({
  pages,
  formFields,
  onAddPage,
  onDeletePage,
  onUpdatePageTitle,
  onDuplicatePage,
  onReorderPages,
}: PagesTabContentProps) {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleTitleChange = (pageId: string, currentTitle: string) => {
    setEditingTitleId(pageId);
    setTempTitle(currentTitle);
    setTimeout(() => {
        inputRefs.current[pageId]?.focus();
        inputRefs.current[pageId]?.select();
    }, 0);
  };

  const handleTitleBlur = (pageId: string) => {
    if (tempTitle.trim() !== '') {
      onUpdatePageTitle(pageId, tempTitle);
    }
    setEditingTitleId(null);
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, pageId: string) => {
    if (event.key === 'Enter') {
      handleTitleBlur(pageId);
    } else if (event.key === 'Escape') {
      setEditingTitleId(null);
    }
  };
  
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, pageId: string) => {
    event.dataTransfer.setData('draggedPageId', pageId);
    setDraggedPageId(pageId);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); 
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetPageId: string) => {
    event.preventDefault();
    const sourcePageId = event.dataTransfer.getData('draggedPageId');
    if (sourcePageId && sourcePageId !== targetPageId) {
      onReorderPages(sourcePageId, targetPageId);
    }
    setDraggedPageId(null);
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
  };

  const AddPageButton = () => (
    <Button
      variant="outline"
      className="w-full h-10 border-dashed border-border hover:border-primary hover:text-primary flex items-center justify-center my-1.5"
      onClick={() => onAddPage()} 
    >
      <PlusCircle className="h-5 w-5 mr-2" /> Add New Page
    </Button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Pages</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add, delete and reorder pages on your form.
        </p>
      </div>
      <ScrollArea className="flex-1 p-3">
        {pages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
            <Layers className="h-12 w-12 mb-4 opacity-50" />
            <p className="mb-1 text-sm font-medium">This form has no pages.</p>
            <p className="text-xs">Click below to add a page.</p>
          </div>
        )}

        {pages.map((page, index) => {
            const fieldCount = formFields.filter(f => f.pageId === page.id).length;
            return (
              <div
                key={page.id}
                draggable
                onDragStart={(e) => handleDragStart(e, page.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, page.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "bg-card border border-input rounded-lg p-3 mb-3 flex items-center gap-3 transition-shadow shadow-sm cursor-grab",
                  draggedPageId === page.id && "opacity-60 shadow-xl ring-2 ring-primary",
                  draggedPageId && draggedPageId !== page.id && "hover:shadow-md"
                )}
              >
                <div className="h-9 w-9 flex items-center justify-center text-muted-foreground flex-shrink-0">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="flex-grow min-w-0">
                  <Input
                      ref={(el) => (inputRefs.current[page.id] = el)}
                      value={editingTitleId === page.id ? tempTitle : page.title}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onFocus={() => handleTitleChange(page.id, page.title)}
                      onBlur={() => handleTitleBlur(page.id)}
                      onKeyDown={(e) => handleTitleKeyDown(e, page.id)}
                      className="h-8 text-sm font-medium border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring p-1 rounded-sm truncate bg-transparent hover:border-input"
                      placeholder="Page Title"
                  />
                  <div className="mt-0.5 px-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <span>Page {index + 1} of {pages.length}</span>
                          <span className="text-muted-foreground/60">&bull;</span>
                          <span>{fieldCount} {fieldCount === 1 ? 'field' : 'fields'}</span>
                      </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Duplicate page"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicatePage(page.id);
                        }}
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        title="Delete page"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeletePage(page.id);
                        }}
                        disabled={pages.length <= 1}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            );
        })}
      </ScrollArea>
      <div className="p-3 border-t border-border">
        <AddPageButton />
      </div>
    </div>
  );
}
