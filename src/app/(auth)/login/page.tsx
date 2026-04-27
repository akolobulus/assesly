
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    // Card removed to make the form appear on a plain white background,
    // centered by AuthLayout.
    // Title and "Don't have an account" link are now part of LoginForm.
    <LoginForm />
  );
}
