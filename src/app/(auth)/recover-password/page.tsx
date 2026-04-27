
import { RecoverPasswordForm } from '@/components/auth/RecoverPasswordForm';

export default function RecoverPasswordPage() {
  return (
    // Card removed to make the form appear on a plain white background,
    // centered by AuthLayout.
    // Title and "Remembered password?" link are now part of RecoverPasswordForm.
    <RecoverPasswordForm />
  );
}
