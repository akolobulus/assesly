
"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPublicFormById as getPublicFormByIdClient } from '@/lib/services/formService'; // Renamed import
import type { FormDocument, PublicFormResult } from '@/lib/services/formService';
import { PublicFormRenderer } from '@/components/forms/view/PublicFormRenderer';
import { Loader2, WifiOff, ShieldAlert, XCircle, FileClock, MonitorX, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import type { WelcomePageConfig } from '@/components/dashboard/forms/builder/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type PageStatus = 'loading' | 'error' | 'not-found' | 'success' | 'closed' | 'not-yet-open' | 'closed-by-schedule' | 'limit-reached';

export default function PublicFormPage() {
  const params = useParams();
  const formId = typeof params.formId === 'string' ? params.formId : null;

  const [status, setStatus] = useState<PageStatus>('loading');
  const [formData, setFormData] = useState<FormDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (isOffline) {
      setStatus('error');
      return;
    }
    if (formId) {
      const fetchForm = async () => {
        try {
          setStatus('loading');
          // Use the client-side function for the page content
          const result: PublicFormResult = await getPublicFormByIdClient(formId, navigator.userAgent);
          
          if (result.status === 'available' && result.data) {
            setFormData(result.data);
            setStatus('success');
          } else if (result.status === 'closed' && result.data) {
            setFormData(result.data); // Set data for styling the closed page
            setStatus('closed');
          } else if (result.status === 'not-yet-open' && result.data) {
            setFormData(result.data);
            setStatus('not-yet-open');
          } else if (result.status === 'closed-by-schedule' && result.data) {
            setFormData(result.data);
            setStatus('closed-by-schedule');
          } else if (result.status === 'limit-reached' && result.data) {
            setFormData(result.data);
            setStatus('limit-reached');
          } else {
            setStatus('not-found');
          }
        } catch (err) {
          console.error("Failed to fetch public form:", err);
          setStatus('error');
        }
      };
      fetchForm();
    } else {
      setStatus('not-found');
    }
  }, [formId, isOffline]);

  const handleNextPage = () => {
    if (formData && currentPage < formData.formPages.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const totalPages = formData?.formPages?.length || 0;
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  if (status === 'loading') {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
        <h2 className="text-xl font-medium text-foreground">Loading Form...</h2>
      </div>
    );
  }

  if (status === 'error' || isOffline) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="mb-8">
            <Link href="/" aria-label="Go to Vetify Home">
                <Logo className="h-12 w-auto mx-auto text-primary" />
            </Link>
        </div>
        <WifiOff className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">Connection Error</h2>
        <p className="text-muted-foreground max-w-md">
          {isOffline ? "You are currently offline. Please check your internet connection and try again." : "Could not load the form. Please try again later."}
        </p>
      </div>
    );
  }

  if (status === 'closed' && formData) {
    const mainPageStyle: React.CSSProperties = {
      // Use form's font but override background to white for the specific design
      backgroundColor: '#FFFFFF',
      fontFamily: formData.formStyles.fontFamily,
    };
    
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center" style={mainPageStyle}>
          <div className="mb-8">
              <Link href="/" aria-label="Go to Vetify Home">
                  <Logo className="h-12 w-auto mx-auto" />
              </Link>
          </div>
          <XCircle className="h-20 w-20 text-destructive mb-6" />
          <h2 className="text-5xl font-extrabold text-black">
              Submissions Closed!
          </h2>
          <p className="mt-4 text-lg text-black">
              This form is no longer accepting responses.
          </p>
      </div>
    );
  }
  
  if (status === 'not-yet-open' && formData) {
    const mainPageStyle: React.CSSProperties = {
      backgroundColor: '#FFFFFF',
      fontFamily: formData.formStyles.fontFamily,
    };
    const openDateTime = formData.accessSettings?.openDate ? format(new Date(formData.accessSettings.openDate), 'PPP p') : 'the scheduled time';

    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center" style={mainPageStyle}>
          <div className="mb-8">
              <Link href="/" aria-label="Go to Vetify Home">
                  <Logo className="h-12 w-auto mx-auto" />
              </Link>
          </div>
          <FileClock className="h-20 w-20 text-destructive mb-6" />
          <h2 className="text-5xl font-extrabold text-black">
              Form Unavailable
          </h2>
          <p className="mt-4 text-lg text-black max-w-lg">
              This form isn't open for submissions at the moment. Please return at the scheduled time: <span className="font-semibold text-destructive">{openDateTime}</span>
          </p>
      </div>
    );
  }
  
  if (status === 'closed-by-schedule' && formData) {
    const mainPageStyle: React.CSSProperties = {
      // Use form's font but override background to white for the specific design
      backgroundColor: '#FFFFFF',
      fontFamily: formData.formStyles.fontFamily,
    };
    const closeDateTime = formData.accessSettings?.closeDate ? format(new Date(formData.accessSettings.closeDate), 'PPP p') : 'the scheduled time';

    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center" style={mainPageStyle}>
          <div className="mb-8">
              <Link href="/" aria-label="Go to Vetify Home">
                  <Logo className="h-12 w-auto mx-auto" />
              </Link>
          </div>
          <MonitorX className="h-20 w-20 text-destructive mb-6" />
          <h2 className="text-5xl font-extrabold text-black">
              Form Closed
          </h2>
          <p className="mt-4 text-lg text-black max-w-lg">
              Submissions are no longer being accepted. This form was closed at the specified time: <span className="font-semibold text-destructive">{closeDateTime}</span>
          </p>
      </div>
    );
  }
  
  if (status === 'limit-reached' && formData) {
    const mainPageStyle: React.CSSProperties = {
      // Use form's font but override background to white for the specific design
      backgroundColor: '#FFFFFF',
      fontFamily: formData.formStyles.fontFamily,
    };
    
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center" style={mainPageStyle}>
          <div className="mb-8">
              <Link href="/" aria-label="Go to Vetify Home">
                  <Logo className="h-12 w-auto mx-auto" />
              </Link>
          </div>
          <AlertOctagon className="h-20 w-20 text-destructive mb-6" />
          <h2 className="text-5xl font-extrabold text-black">
              Form Closed – Submission Limit Reached
          </h2>
          <p className="mt-4 text-lg text-black max-w-lg">
              This form is no longer accepting responses as the maximum number of submissions has been reached.
          </p>
      </div>
    );
  }

  if (status === 'not-found' || !formData) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="mb-8">
            <Link href="/" aria-label="Go to Vetify Home">
                <Logo className="h-12 w-auto mx-auto text-primary" />
            </Link>
        </div>
        <ShieldAlert className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">Form Not Available</h2>
        <p className="text-muted-foreground max-w-md mb-8">
            This form may have been moved, unpublished, or deleted. Please check the link or contact the form owner.
        </p>
        <Button asChild variant="outline">
            <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  if (!formId) return null; // Should not happen if status is success, but good for TS

  return (
    <PublicFormRenderer
      formId={formId}
      formName={formData.formName}
      fields={formData.formFields as any[]}
      formStyles={formData.formStyles}
      welcomePage={formData.welcomePage}
      endingPage={formData.endingPage}
      formPages={formData.formPages}
      currentPage={currentPage}
      onNextPage={handleNextPage}
      onPrevPage={handlePrevPage}
      totalPages={totalPages}
      progressPercentage={progressPercentage}
    />
  );
}
