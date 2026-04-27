
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import * as htmlToImage from 'html-to-image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, RotateCcw, Folder as FolderIcon, FileText, AlertTriangle, Inbox } from 'lucide-react';
import { getTrashedFormsForCurrentUser, restoreForm, deleteFormPermanently } from '@/lib/services/formService';
import { getTrashedFoldersForCurrentUser, restoreFolder, deleteFolderPermanently } from '@/lib/services/folderService';
import type { FormDocument } from '@/lib/services/formService';
import type { Folder } from '@/lib/services/folderService';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSidebar } from '@/components/ui/sidebar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type TrashedItem = (FormDocument | Folder) & { itemType: 'form' | 'folder' };

function TrashedItemRow({ 
  item, 
  onRestore, 
  onDelete,
  isSelected,
  onSelectChange
}: { 
  item: TrashedItem; 
  onRestore: (item: TrashedItem) => void; 
  onDelete: (item: TrashedItem) => void;
  isSelected: boolean;
  onSelectChange: (checked: boolean) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  
  const isForm = item.itemType === 'form';
  const formItem = isForm ? (item as FormDocument) : null;

  useEffect(() => {
    if (!isForm || !formItem) return;

    const generateThumbnail = async () => {
      const LIST_THUMBNAIL_WIDTH = 56;
      const LIST_THUMBNAIL_HEIGHT = 35; 

      if (captureRef.current && (!formItem.thumbnailUrl || formItem.thumbnailUrl.startsWith("https://placehold.co"))) {
        setIsGeneratingThumbnail(true);
        try {
          if (captureRef.current) {
            captureRef.current.style.position = 'fixed';
            captureRef.current.style.left = '0px';
            captureRef.current.style.top = '0px';
            captureRef.current.style.opacity = '1';
            captureRef.current.style.transform = 'translateX(0%)';
            captureRef.current.style.zIndex = '9999';
            captureRef.current.style.pointerEvents = 'none';
          }
          
          const dataUrl = await htmlToImage.toPng(captureRef.current, {
            quality: 0.7,
            pixelRatio: 1,
            width: LIST_THUMBNAIL_WIDTH,
            height: LIST_THUMBNAIL_HEIGHT,
            backgroundColor: formItem.formStyles?.backgroundColor || '#ffffff',
          });
          
          setImageSrc(dataUrl);
        } catch (error) {
          console.error(`[TrashedItemRow] Failed to generate thumbnail for form: ${formItem.formName}`, error);
          setImageSrc('');
        } finally {
          setIsGeneratingThumbnail(false);
          if (captureRef.current) {
            captureRef.current.style.opacity = '0';
            captureRef.current.style.transform = 'translateX(-100%)';
            captureRef.current.style.zIndex = '-1';
            captureRef.current.style.pointerEvents = 'none';
            captureRef.current.style.position = 'fixed';
          }
        }
      } else if (formItem.thumbnailUrl && !formItem.thumbnailUrl.startsWith("https://placehold.co")) {
        setImageSrc(formItem.thumbnailUrl);
      }
    };
    
    const timer = setTimeout(generateThumbnail, 200 + Math.random() * 300);
    return () => clearTimeout(timer);
  }, [isForm, formItem]);
  
  const simplifiedPreviewStyles: React.CSSProperties = isForm && formItem ? {
    width: `56px`,
    height: `35px`,
    backgroundColor: formItem.formStyles?.backgroundColor || '#ffffff',
    color: formItem.formStyles?.questionsColor || '#000000',
    fontFamily: formItem.formStyles?.fontFamily || 'sans-serif',
    padding: '4px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e0e0e0',
    position: 'fixed', left: '0px', top: '0px', transform: 'translateX(-100%)', opacity: 0, zIndex: -1, pointerEvents: 'none',
  } : {};
  
  const getDaysLeft = (trashedAt: any) => {
    if (!trashedAt || typeof trashedAt.toDate !== 'function') return 30;
    const daysAgo = differenceInDays(new Date(), trashedAt.toDate());
    return Math.max(0, 30 - daysAgo);
  };
  
  const daysLeft = getDaysLeft(item.trashedAt);

  return (
    <TableRow data-state={isSelected ? "selected" : "unselected"}>
       <TableCell className="px-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectChange}
          aria-label={`Select item ${item.name}`}
        />
      </TableCell>
      <TableCell className="font-medium">
        {isForm && formItem && (
          <div ref={captureRef} style={simplifiedPreviewStyles}>
            <h3 style={{ fontSize: '6px', fontWeight: 'bold', color: formItem.formStyles?.mainColor, marginBottom: '2px', textAlign: 'center', wordBreak: 'break-word', lineHeight: '1.1' }}>
              {formItem.formName || 'Untitled Form'}
            </h3>
            {(formItem.formFields || []).slice(0, 1).map((field, index) => (
              <div key={index} style={{ fontSize: '5px', width: '80%', backgroundColor: formItem.formStyles?.inputsBackground || '#f0f0f0', padding: '2px', borderRadius: '2px', border: `1px solid ${formItem.formStyles?.inputsBorderColor || '#cccccc'}`, textAlign: 'left', wordBreak: 'break-word', lineHeight: '1.1' }}>
                {field.label || `Field ${index + 1}`}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          {isForm ? (
            <div className="w-14 h-9 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden border">
              {isGeneratingThumbnail && !imageSrc ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : imageSrc ? (
                  <Image
                      src={imageSrc}
                      alt={formItem?.formName || 'Form thumbnail'}
                      width={56}
                      height={35}
                      objectFit="cover"
                      data-ai-hint="form preview small"
                      unoptimized={imageSrc.startsWith('data:image/png')}
                      onError={() => {
                          console.warn(`[TrashedItemRow] Error loading image, hiding it for form: ${formItem?.formName}`);
                          setImageSrc('');
                      }}
                  />
              ) : (
                  <FileText className="h-6 w-6 text-muted-foreground/50" />
              )}
            </div>
          ) : (
            <div className="w-14 h-9 flex-shrink-0 flex items-center justify-center">
                <FolderIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <span>{item.name}</span>
        </div>
      </TableCell>
      <TableCell className="capitalize text-muted-foreground">{item.itemType}</TableCell>
      <TableCell className="text-muted-foreground">{item.trashedAt ? format(item.trashedAt.toDate(), 'PP') : 'N/A'}</TableCell>
      <TableCell className={daysLeft <= 3 ? "text-destructive" : "text-muted-foreground"}>
        {daysLeft > 0 ? `Deletes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}` : 'Deletion pending'}
      </TableCell>
      <TableCell className="text-right space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><RotateCcw className="mr-2 h-4 w-4"/>Restore</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Restore "{item.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will restore the item and make it active again.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRestore(item)}>Restore</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
         
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
            </AlertDialogTrigger>
             <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-6 w-6"/>Delete Permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to permanently delete "{item.name}"? This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(item)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </TableCell>
    </TableRow>
  );
}


export default function TrashPage() {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { refetchFolders } = useSidebar();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkRestoreModalOpen, setIsBulkRestoreModalOpen] = useState(false);
  
  const isAnyItemSelected = selectedItemIds.length > 0;
  const allItemsSelected = items.length > 0 && selectedItemIds.length === items.length;

  const fetchTrashedItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const [trashedForms, trashedFolders] = await Promise.all([
        getTrashedFormsForCurrentUser(),
        getTrashedFoldersForCurrentUser(),
      ]);

      const combinedItems: TrashedItem[] = [
        ...trashedForms.map(form => ({ ...form, itemType: 'form' as const, name: form.formName })),
        ...trashedFolders.map(folder => ({ ...folder, itemType: 'folder' as const })),
      ];

      combinedItems.sort((a, b) => {
        const timeA = (a.trashedAt as any)?.toMillis() || 0;
        const timeB = (b.trashedAt as any)?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setItems(combinedItems);
    } catch (error) {
      console.error("Failed to load trashed items:", error);
      toast({
        title: "Error",
        description: "Could not load items from the trash.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrashedItems();
  }, [fetchTrashedItems]);

  const handleRestore = async (item: TrashedItem) => {
    const isForm = item.itemType === 'form';
    const restoreFn = isForm ? restoreForm : restoreFolder;
    const result = await restoreFn(item.id);

    if (result.success) {
      toast({ title: "Item Restored", description: `"${item.name}" has been restored.` });
      setItems(prev => prev.filter(i => i.id !== item.id));
      if (refetchFolders) refetchFolders();
    } else {
      toast({ title: "Restore Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleDelete = async (item: TrashedItem) => {
    const isForm = item.itemType === 'form';
    const deleteFn = isForm ? deleteFormPermanently : deleteFolderPermanently;
    const result = await deleteFn(item.id);

    if (result.success) {
      toast({ title: "Item Deleted", description: `"${item.name}" has been permanently deleted.` });
      setItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      toast({ title: "Deletion Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedItemIds(items.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  };
  
  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds(prev => [...prev, itemId]);
    } else {
      setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkRestore = async () => {
    setIsProcessing(true);
    const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
    
    const results = await Promise.all(selectedItems.map(item => 
      item.itemType === 'form' ? restoreForm(item.id) : restoreFolder(item.id)
    ));
    
    const successfulRestores = results.filter(r => r.success).length;
    
    toast({
      title: `Restore Complete`,
      description: `${successfulRestores} of ${selectedItemIds.length} items were restored.`
    });

    if (successfulRestores > 0) {
      await fetchTrashedItems();
      setSelectedItemIds([]);
      if (refetchFolders) refetchFolders();
    }
    
    setIsProcessing(false);
    setIsBulkRestoreModalOpen(false);
  };
  
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
    
    const results = await Promise.all(selectedItems.map(item => 
      item.itemType === 'form' ? deleteFormPermanently(item.id) : deleteFolderPermanently(item.id)
    ));

    const successfulDeletes = results.filter(r => r.success).length;

    toast({
      title: 'Deletion Complete',
      description: `${successfulDeletes} of ${selectedItemIds.length} items were permanently deleted.`,
    });

    if (successfulDeletes > 0) {
      await fetchTrashedItems();
      setSelectedItemIds([]);
    }

    setIsProcessing(false);
    setIsBulkDeleteModalOpen(false);
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trash</CardTitle>
          <CardDescription>
            Items in the trash will be permanently deleted after 30 days.
            {isAnyItemSelected && (
              <div className="flex items-center gap-2 mt-4">
                 <Button variant="outline" size="sm" onClick={() => setIsBulkRestoreModalOpen(true)} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <RotateCcw className="mr-2 h-4 w-4" /> Restore ({selectedItemIds.length})
                 </Button>
                 <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteModalOpen(true)} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently ({selectedItemIds.length})
                 </Button>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                <Inbox className="h-16 w-16 mb-4 opacity-50" />
                <p className="font-medium">The trash is empty.</p>
                <p className="text-sm">Deleted items will appear here.</p>
            </div>
          ) : (
            <Table>
               <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] px-4">
                     <Checkbox
                        checked={allItemsSelected ? true : (isAnyItemSelected ? 'indeterminate' : false)}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all items"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Trashed</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TrashedItemRow 
                    key={item.id} 
                    item={item} 
                    onRestore={handleRestore} 
                    onDelete={handleDelete}
                    isSelected={selectedItemIds.includes(item.id)}
                    onSelectChange={(checked) => handleSelectItem(item.id, checked)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Bulk Restore Modal */}
      <AlertDialog open={isBulkRestoreModalOpen} onOpenChange={setIsBulkRestoreModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Selected Items?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {selectedItemIds.length} item(s)? They will be moved back to your active forms and folders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRestore} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Yes, Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Modal */}
      <AlertDialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Delete Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedItemIds.length} item(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

