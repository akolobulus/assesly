
"use client";

import React, { useState, useRef } from 'react';
import QRCode from "react-qr-code";
import * as htmlToImage from 'html-to-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, QrCode, CheckCircle, Download } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface PublishSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string | null;
  formName: string;
}

export function PublishSuccessModal({ isOpen, onClose, formId, formName }: PublishSuccessModalProps) {
  const { toast } = useToast();
  const formLink = formId ? `${window.location.origin}/forms/view/${formId}` : '';
  const [showQRCode, setShowQRCode] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    if (!formLink) return;
    navigator.clipboard.writeText(formLink).then(() => {
      toast({ title: "Link Copied!", description: "The form link has been copied to your clipboard." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy the link.", variant: "destructive" });
    });
  };
  
  const handleDownloadQR = async (format: 'png' | 'jpg') => {
    if (!qrCodeRef.current) return;
    try {
      let dataUrl;
      const options = { quality: 0.95, backgroundColor: 'white', pixelRatio: 2 };
      if (format === 'png') {
        dataUrl = await htmlToImage.toPng(qrCodeRef.current, options);
      } else {
        dataUrl = await htmlToImage.toJpeg(qrCodeRef.current, options);
      }
      const link = document.createElement('a');
      link.download = `${formName}-qrcode.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('QR code download failed:', error);
      toast({ title: 'Download Failed', description: 'Could not generate QR code for download.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
            // Reset state when closing so it doesn't stay open next time
            setTimeout(() => setShowQRCode(false), 200); 
        }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Share Your Form</DialogTitle>
        </DialogHeader>
        <div className="pt-2 pb-4 space-y-4">
            <Alert variant="success" className="p-3">
                <CheckCircle className="h-5 w-5" />
                <AlertTitle className="font-medium text-sm ml-2">Your Form has been published !</AlertTitle>
            </Alert>
            <p className="text-sm text-muted-foreground">
                Share your form link to start getting submissions.
            </p>
            <div className="flex items-center space-x-2">
                <Input id="form-link-modal" value={formLink} readOnly className="flex-grow bg-background border-input h-9"/>
                 <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" asChild>
                    <a href={formLink} target="_blank" rel="noopener noreferrer" aria-label="Open form in new tab">
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </Button>
                <Button onClick={handleCopyLink} className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90">
                    Copy
                </Button>
            </div>
            
            {!showQRCode ? (
                <Button 
                    variant="ghost" 
                    onClick={() => setShowQRCode(true)}
                    className="p-0 h-auto text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                    <QrCode className="mr-2 h-4 w-4" />
                    <span className="text-sm">Generate QR code</span>
                </Button>
            ) : (
                <div className="flex flex-col sm:flex-row items-center justify-start gap-6 pt-4">
                    <div ref={qrCodeRef} className="bg-white p-3 rounded-lg border border-border shadow-sm">
                      <QRCode value={formLink} size={128} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="font-medium text-foreground">Scan QR Code</h4>
                        <p className="text-sm text-muted-foreground">Open this form directly on your mobile device.</p>
                        <div className="flex gap-2 mt-2">
                           <Button variant="outline" size="sm" onClick={() => handleDownloadQR('png')}><Download className="mr-2 h-4 w-4" /> PNG</Button>
                           <Button variant="outline" size="sm" onClick={() => handleDownloadQR('jpg')}><Download className="mr-2 h-4 w-4" /> JPG</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
