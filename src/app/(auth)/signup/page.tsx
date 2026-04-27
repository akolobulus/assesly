import { SignUpForm } from '@/components/auth/SignUpForm';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function SignUpLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    // Card removed to make the form appear on a plain white background,
    // centered by AuthLayout.
    // Title and "Already have an account" link are now part of SignUpForm.
    <Suspense fallback={<SignUpLoader />}>
      <SignUpForm />
    </Suspense>
  );
}
