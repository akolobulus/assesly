
import type { Metadata, ResolvingMetadata } from 'next';
import { Figtree } from 'next/font/google';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TopProgressBar } from '@/components/shared/TopProgressBar';
import { Suspense } from 'react';
import { getPublicFormById } from '@/lib/services/formService.server';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

type Props = {
  params: { formId: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { formId } = params;
  
  if (!formId) {
    return {
      title: 'View Form',
      description: 'You are viewing a form created with Assesly.',
    }
  }
  
  try {
    // This now correctly calls the server-side function
    const result = await getPublicFormById(formId);
    const form = result.data;

    const title = form?.formName || 'View Form';
    const description = form?.formDescription || 'You are viewing a form created with Assesly.';
    const ogImage = form?.metaImageUrl || form?.thumbnailUrl;

    const metadata: Metadata = {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        ...(ogImage && { images: [ogImage] }),
      },
    };

    if (form?.formStyles?.logoUrl) {
      metadata.icons = {
        icon: form.formStyles.logoUrl,
      };
    }

    return metadata;
    
  } catch (error) {
    console.error(`[Metadata Error] Failed to fetch metadata for form ${formId}:`, error);
    return {
      title: 'Form Not Found',
      description: 'The form you are looking for is not available.',
    }
  }
}


export default function PublicFormViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout acts as a root layout for the public form view,
  // intentionally omitting the ThemeProvider to ensure user-defined
  // styles are applied without being affected by global light/dark themes.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${figtree.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
