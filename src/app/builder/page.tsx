
import { Suspense } from 'react';
import { FormBuilderLayout } from '@/components/dashboard/forms/builder/FormBuilderLayout';
import { Loader2 } from 'lucide-react';

function BuilderLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function NewFormPage() {
  return (
    <div className="h-screen flex flex-col">
      <Suspense fallback={<BuilderLoader />}>
        <FormBuilderLayout />
      </Suspense>
    </div>
  );
}
